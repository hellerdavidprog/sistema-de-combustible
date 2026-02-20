import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    const supabase = await createClient()

    // Get user by username from public.users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Get auth user's email from auth.users using service role
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userData.id)

    if (authError || !authUser.user?.email) {
      return NextResponse.json({ error: "Error al obtener email" }, { status: 500 })
    }

    return NextResponse.json({ email: authUser.user.email })
  } catch (error) {
    console.error("[v0] Error getting email for username:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
