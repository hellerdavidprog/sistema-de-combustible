import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: currentUser } = await supabase.from("users").select("*").eq("id", authUser.id).single()

    if (!currentUser || currentUser.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await request.json()
    // </CHANGE>

    if (data.role) {
      const { error } = await supabase.from("users").update({ role: data.role }).eq("id", id)

      if (error) throw error

      await supabase.from("audit_log").insert({
        user_id: currentUser.id,
        action: "update",
        entity_type: "user",
        entity_id: id,
        details: { field: "role", new_value: data.role },
      })
    }

    if (data.is_active !== undefined) {
      const { error } = await supabase.from("users").update({ is_active: data.is_active }).eq("id", id)

      if (error) throw error

      await supabase.from("audit_log").insert({
        user_id: currentUser.id,
        action: "update",
        entity_type: "user",
        entity_id: id,
        details: { field: "is_active", new_value: data.is_active },
      })
    }
    // </CHANGE>

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
