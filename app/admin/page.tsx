import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with role (by email since users table is independent of auth.users)
  const { data: profile } = await supabase.from("users").select("*").eq("email", user.email).single()

  if (!profile || !profile.is_active) {
    redirect("/unauthorized")
  }

  if (profile.role === "operator") {
    redirect("/operator")
  }

  // Admin goes to dashboard
  redirect("/admin/dashboard")
}
