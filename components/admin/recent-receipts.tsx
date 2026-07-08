import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { fuelReceipts } from "@/lib/db/schema"
import { Plane } from "lucide-react"
import { eq, desc } from "drizzle-orm"

interface RecentReceiptsProps {
  userId?: string
}

export async function RecentReceipts({ userId }: RecentReceiptsProps) {
  let query = db
    .select()
    .from(fuelReceipts)
    .orderBy(desc(fuelReceipts.createdAt))
    .limit(10)

  if (userId) {
    query = query.where(eq(fuelReceipts.userId, userId))
  }

  const { data: receipts } = await query

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recibos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receipts?.map((receipt) => (
            <div
              key={receipt.id}
              className="flex items-center justify-between border-b border-border pb-4 last:border-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Plane className="h-4 w-4 text-primary" />
                  <p className="font-medium">{receipt.aircraft_registration}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {receipt.users.first_name} {receipt.users.last_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {receipt.origin} → {receipt.destination} • {new Date(receipt.date).toLocaleDateString("es-ES")}{" "}
                  {receipt.time}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="font-bold">{Number.parseFloat(receipt.liters_dispensed).toFixed(1)}L</p>
                {receipt.supplier && (
                  <Badge variant="secondary" className="text-xs">
                    {receipt.supplier}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
