import { DashboardHeader } from "@/components/admin/dashboard-header"
import { FilteredDashboardContent } from "@/components/admin/filtered-dashboard-content"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { fuelReceipts } from "@/lib/db/schema"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { desc } from "drizzle-orm"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect("/sign-in")
  }

  // Fetch fuel receipts for display
  const receipts = await db
    .select()
    .from(fuelReceipts)
    .orderBy(desc(fuelReceipts.createdAt))

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={session.user.name || "Admin"} role="admin" />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Resumen de actividad y estadísticas</p>
          </div>

          <FilteredDashboardContent receipts={receipts || []} />
        </div>
      </main>
    </div>
  )
}
