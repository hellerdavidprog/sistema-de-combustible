import { DashboardHeader } from "@/components/admin/dashboard-header"
import { ReceiptsTable } from "@/components/admin/receipts-table"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ReceiptsPage() {
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

  if (profile.role !== "admin") {
    redirect("/operator")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={profile.username || "Admin"} role={profile.role} />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Todos los Recibos</h1>
            <p className="text-muted-foreground mt-1">Historial completo de cargas de combustible</p>
          </div>

          <ReceiptsTable />
        </div>
      </main>
    </div>
  )
}
