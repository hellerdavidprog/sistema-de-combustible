"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

interface FuelConsumptionChartProps {
  data: Array<{ date: string; liters_dispensed: number }>
}

export function FuelConsumptionChart({ data }: FuelConsumptionChartProps) {
  // Group by month manually
  const monthlyData = data.reduce((acc: any, receipt) => {
    const date = new Date(receipt.date)
    const monthKey = date.toLocaleDateString("es-ES", { month: "short", year: "numeric" })

    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, liters: 0 }
    }
    acc[monthKey].liters += Number.parseFloat(receipt.liters_dispensed.toString())

    return acc
  }, {})

  const chartData = Object.values(monthlyData)
    .slice(-6)
    .map((item: any) => ({
      month: item.month,
      liters: Number.parseFloat(item.liters.toFixed(1)),
    }))
  // </CHANGE>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consumo de Combustible</CardTitle>
        <CardDescription>Litros despachados por mes (últimos 6 meses)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            liters: {
              label: "Litros",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="liters" fill="var(--color-liters)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
