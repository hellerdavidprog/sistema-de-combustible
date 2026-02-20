"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface FuelTypeDistributionProps {
  data: Array<{ aircraft_registration: string; liters_dispensed: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300"]

export function FuelTypeDistribution({ data }: FuelTypeDistributionProps) {
  // Aggregate data by aircraft
  const aggregatedData = data.reduce(
    (acc, item) => {
      const existing = acc.find((a) => a.aircraft_registration === item.aircraft_registration)
      if (existing) {
        existing.liters_dispensed += item.liters_dispensed
      } else {
        acc.push({ ...item })
      }
      return acc
    },
    [] as Array<{ aircraft_registration: string; liters_dispensed: number }>
  )

  // Sort by liters and take top 8
  const chartData = aggregatedData
    .sort((a, b) => b.liters_dispensed - a.liters_dispensed)
    .slice(0, 8)
    .map((item) => ({
      name: item.aircraft_registration,
      value: item.liters_dispensed,
    }))

  const totalLiters = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribucion por Aeronave</CardTitle>
        <CardDescription>Consumo de combustible por matricula</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} L`, "Litros"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Total: {totalLiters.toLocaleString()} litros
        </div>
      </CardContent>
    </Card>
  )
}
