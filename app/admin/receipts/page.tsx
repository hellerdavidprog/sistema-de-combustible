import { DashboardHeader } from "@/components/admin/dashboard-header"
import { ReceiptsTable } from "@/components/admin/receipts-table"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export default async function ReceiptsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={session.user.name || "Admin"} role="admin" />
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
