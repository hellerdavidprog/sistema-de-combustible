import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getServiceClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Missing Supabase environment variables")
      return NextResponse.json(
        {
          error: "Configuration error",
          details: "Database connection not configured properly",
        },
        { status: 500 },
      )
    }

    const supabase = getServiceClient()
    const formData = await request.formData()

    // Extract fields from FormData
    const data = {
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      receiptNumber: formData.get("receiptNumber") as string,
      aircraftRegistration: formData.get("aircraftRegistration") as string,
      supplier: formData.get("supplier") as string,
      hasMeter: formData.get("hasMeter") as string,
      initialReading: formData.get("initialReading") as string,
      finalReading: formData.get("finalReading") as string,
      litersDispensed: formData.get("litersDispensed") as string,
      origin: formData.get("origin") as string,
      destination: formData.get("destination") as string,
      operationType: formData.get("operationType") as string,
      notes: formData.get("notes") as string,
      telegramId: formData.get("telegramId") as string,
    }

    const receiptImageFile = formData.get("receiptImage") as File | null

    console.log("[v0] Received receipt data:", {
      ...data,
      receiptImage: receiptImageFile ? `file: ${receiptImageFile.name}, size: ${receiptImageFile.size}` : "no image",
    })

    if (!data.date || !data.time || !data.aircraftRegistration || !data.litersDispensed) {
      const missing = []
      if (!data.date) missing.push("date")
      if (!data.time) missing.push("time")
      if (!data.aircraftRegistration) missing.push("aircraftRegistration")
      if (!data.litersDispensed) missing.push("litersDispensed")
      throw new Error(`Missing required fields: ${missing.join(", ")}`)
    }

    let imageUrl = null
    if (receiptImageFile && receiptImageFile.size > 0) {
      try {
        // Generate unique filename
        const fileExt = receiptImageFile.name.split('.').pop() || 'jpg'
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        console.log("[v0] Uploading image to Supabase Storage:", filename)

        // Convert File to ArrayBuffer for Supabase Storage
        const arrayBuffer = await receiptImageFile.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filename, buffer, {
            contentType: receiptImageFile.type,
            upsert: false
          })

        if (uploadError) {
          console.error("[v0] Storage upload error:", uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filename)

        imageUrl = publicUrlData.publicUrl
        console.log("[v0] Image uploaded successfully:", imageUrl)
      } catch (uploadError) {
        console.error("[v0] Error uploading image:", uploadError)
        // Don't fail the entire request if image upload fails
        console.log("[v0] Continuing without image...")
      }
    }

    const insertData = {
      user_id: null,
      telegram_id: data.telegramId || null,
      date: data.date,
      time: data.time,
      receipt_number: data.receiptNumber || null,
      aircraft_registration: data.aircraftRegistration,
      supplier: data.supplier || null,
      initial_reading: data.hasMeter === "yes" && data.initialReading ? Number.parseInt(data.initialReading) : null,
      final_reading: data.hasMeter === "yes" && data.finalReading ? Number.parseInt(data.finalReading) : null,
      liters_dispensed: Number.parseFloat(data.litersDispensed),
      origin: data.origin || null,
      destination: data.destination || null,
      operation_type: data.operationType || "Regular",
      notes: data.notes || null,
      receipt_image_url: imageUrl,
    }

    console.log("[v0] Inserting receipt with data:", insertData)

    const { data: receipt, error: receiptError } = await supabase
      .from("fuel_receipts")
      .insert(insertData)
      .select()
      .single()

    if (receiptError) {
      console.error("[v0] Database error details:", {
        message: receiptError.message,
        details: receiptError.details,
        hint: receiptError.hint,
        code: receiptError.code,
      })
      return NextResponse.json(
        {
          error: "Failed to save receipt",
          details: receiptError.message,
          hint: receiptError.hint || "Check database connection and table structure",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Receipt created successfully:", receipt.id)

    await supabase.from("audit_log").insert({
      user_id: null,
      action: "create",
      entity_type: "fuel_receipt",
      entity_id: receipt.id,
      details: { source: "public_form", telegram_id: data.telegramId },
    })

    return NextResponse.json({ success: true, id: receipt.id })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Failed to create receipt",
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient() // Using service client to bypass RLS
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("fuel_receipts")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data: receipts, error } = await query

    if (error) {
      console.error("[v0] Error fetching receipts:", error)
      throw error
    }

    return NextResponse.json({ receipts: receipts || [] })
  } catch (error) {
    console.error("[v0] Error fetching receipts:", error)
    return NextResponse.json({ error: "Failed to fetch receipts" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Receipt ID is required" }, { status: 400 })
    }

    const { data: receipt, error } = await supabase
      .from("fuel_receipts")
      .update({
        date: updateData.date,
        time: updateData.time,
        receipt_number: updateData.receipt_number,
        aircraft_registration: updateData.aircraft_registration,
        supplier: updateData.supplier,
        initial_reading: updateData.initial_reading,
        final_reading: updateData.final_reading,
        liters_dispensed: updateData.liters_dispensed,
        origin: updateData.origin,
        destination: updateData.destination,
        operation_type: updateData.operation_type,
        notes: updateData.notes,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating receipt:", error)
      return NextResponse.json({ error: "Failed to update receipt", details: error.message }, { status: 500 })
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: null,
      action: "update",
      entity_type: "fuel_receipt",
      entity_id: id,
      details: { updated_fields: Object.keys(updateData) },
    })

    return NextResponse.json({ success: true, receipt })
  } catch (error) {
    console.error("[v0] Error updating receipt:", error)
    return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Receipt ID is required" }, { status: 400 })
    }

    // First get the receipt to log what was deleted
    const { data: receipt } = await supabase.from("fuel_receipts").select("*").eq("id", id).single()

    const { error } = await supabase.from("fuel_receipts").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting receipt:", error)
      return NextResponse.json({ error: "Failed to delete receipt", details: error.message }, { status: 500 })
    }

    // Log the action
    await supabase.from("audit_log").insert({
      user_id: null,
      action: "delete",
      entity_type: "fuel_receipt",
      entity_id: id,
      details: { deleted_receipt: receipt },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting receipt:", error)
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 })
  }
}
