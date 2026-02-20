import { DashboardHeader } from "@/components/admin/dashboard-header"
import { OperatorReceiptsView } from "@/components/operator/operator-receipts-view"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function OperatorPage() {
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

  // Only operators and supervisors can access this page
  if (profile.role !== "operator" && profile.role !== "supervisor") {
    redirect("/unauthorized")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={profile.username || "Operador"} role={profile.role} />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Historial de Recibos</h1>
            <p className="text-muted-foreground mt-1">Consulta y descarga los recibos de combustible</p>
          </div>

          <OperatorReceiptsView />
        </div>
      </main>
    </div>
  )
}
