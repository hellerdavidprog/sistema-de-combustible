"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface SpendingChartProps {
  data: Array<{ date: string; unit_price: number; liters_dispensed: number }>
}

export function SpendingChart({ data }: SpendingChartProps) {
  // Group by month
  const monthlyData = data.reduce((acc: Record<string, number>, row) => {
    const date = new Date(row.date)
    const monthKey = date.toLocaleDateString("es-ES", { month: "short", year: "numeric" })
    const total = row.unit_price * row.liters_dispensed
    acc[monthKey] = (acc[monthKey] || 0) + total
    return acc
  }, {})

  const chartData = Object.entries(monthlyData)
    .slice(-6)
    .map(([month, spent]) => ({
      month,
      spent: Number(spent.toFixed(2)),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos Mensuales</CardTitle>
        <CardDescription>Total gastado por mes (últimos 6 meses)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            spent: {
              label: "Gastado",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="spent" stroke="var(--color-spent)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
