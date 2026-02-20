import { DashboardHeader } from "@/components/admin/dashboard-header"
import { SupervisorCombinedView } from "@/components/supervisor/supervisor-combined-view"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SupervisorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with role (by email)
  const { data: profile } = await supabase.from("users").select("*").eq("email", user.email).single()

  if (!profile || !profile.is_active) {
    redirect("/unauthorized")
  }

  // Allow supervisors and admins to access
  if (profile.role !== "supervisor" && profile.role !== "admin") {
    redirect("/operator")
  }

  // Fetch all receipts for dashboard analytics
  const { data: receipts } = await supabase
    .from("fuel_receipts")
    .select(
      `
      *,
      users (
        username,
        first_name,
        last_name
      )
    `,
    )
    .order("date", { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={profile.username || "Supervisor"} role={profile.role} />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Control de Operaciones</h1>
            <p className="text-muted-foreground mt-1">Dashboard analítico e historial de recibos</p>
          </div>

          <SupervisorCombinedView receipts={receipts || []} />
        </div>
      </main>
    </div>
  )
}
