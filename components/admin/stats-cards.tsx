import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Fuel, TrendingUp, Plane, Users } from "lucide-react"
import { db } from "@/lib/db"
import { fuelReceipts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface StatsCardsProps {
  userId?: string
}

export async function StatsCards({ userId }: StatsCardsProps) {
  let query = db.select().from(fuelReceipts)

  if (userId) {
    query = query.where(eq(fuelReceipts.userId, userId))
  }

  const receipts = await query

  const totalLiters = receipts?.reduce((sum, r) => sum + Number(r.liters_dispensed || 0), 0) || 0
  const count = receipts?.length || 0

  // Count unique users
  const uniqueUsers = userId ? 1 : new Set(receipts?.map((r) => r.userId)).size

  const cards = [
    {
      title: "Total Recibos",
      value: count?.toLocaleString() || "0",
      icon: Fuel,
      description: "Registros totales",
    },
    {
      title: "Litros Totales",
      value: `${totalLiters.toFixed(1)}L`,
      icon: TrendingUp,
      description: "Combustible despachado",
    },
    {
      title: "Aviones Activos",
      value: "5",
      icon: Plane,
      description: "Flota registrada",
    },
    ...(userId
      ? []
      : [
          {
            title: "Usuarios Activos",
            value: uniqueUsers.toString(),
            icon: Users,
            description: "Con registros",
          },
        ]),
  ]
  // </CHANGE>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
