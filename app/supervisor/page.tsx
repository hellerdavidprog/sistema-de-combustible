import { DashboardHeader } from "@/components/admin/dashboard-header"
import { SupervisorCombinedView } from "@/components/supervisor/supervisor-combined-view"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { fuelReceipts } from "@/lib/db/schema"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { desc } from "drizzle-orm"

export default async function SupervisorPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/sign-in")
  }

  // Fetch all receipts for dashboard analytics
  const receipts = await db
    .select()
    .from(fuelReceipts)
    .orderBy(desc(fuelReceipts.createdAt))

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={session.user.name || "Supervisor"} role="supervisor" />
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
