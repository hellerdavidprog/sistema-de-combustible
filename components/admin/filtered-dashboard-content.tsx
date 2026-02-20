"use client"

import { useState, useMemo } from "react"
import { DashboardFilters, type FilterValues } from "./dashboard-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Fuel, Plane, Users, Globe, Calendar, Zap } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface Receipt {
  id: string
  date: string
  time: string
  aircraft_registration: string
  supplier: string
  origin: string
  destination: string
  liters_dispensed: number | string | bigint
  operation_type?: string | null
  receipt_number?: string | null
  user_id: string
  users: {
    username: string
    first_name: string
    last_name: string
  } | null
}

interface FilteredDashboardContentProps {
  receipts: Receipt[]
}

const COLORS = ["#0891b2", "#06b6d4", "#0284c7", "#3b82f6", "#8b5cf6"]

export function FilteredDashboardContent({ receipts }: FilteredDashboardContentProps) {
  const [filters, setFilters] = useState<FilterValues>({})

  const aircraftList = useMemo(
    () => [...new Set(receipts.map((r) => r.aircraft_registration))].filter(Boolean).sort(),
    [receipts],
  )
  const supplierList = useMemo(() => [...new Set(receipts.map((r) => r.supplier))].filter(Boolean).sort(), [receipts])
  const originList = useMemo(() => [...new Set(receipts.map((r) => r.origin))].filter(Boolean).sort(), [receipts])
  const destinationList = useMemo(
    () => [...new Set(receipts.map((r) => r.destination))].filter(Boolean).sort(),
    [receipts],
  )

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      if (filters.aircraft && receipt.aircraft_registration !== filters.aircraft) return false
      if (filters.supplier && receipt.supplier !== filters.supplier) return false
      if (filters.origin && !(receipt.origin || "").toLowerCase().includes(filters.origin.toLowerCase())) return false
      if (filters.destination && !(receipt.destination || "").toLowerCase().includes(filters.destination.toLowerCase())) return false
      if (filters.dateFrom && receipt.date < filters.dateFrom) return false
      if (filters.dateTo && receipt.date > filters.dateTo) return false
      return true
    })
  }, [receipts, filters])

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const totalReceipts = filteredReceipts.length
    const totalLiters = filteredReceipts.reduce((sum, r) => {
      const liters = typeof r.liters_dispensed === "bigint" 
        ? Number(r.liters_dispensed) 
        : Number(r.liters_dispensed || 0)
      return sum + liters
    }, 0)
    const uniqueAircraft = new Set(filteredReceipts.map((r) => r.aircraft_registration)).size
    const uniqueUsers = new Set(filteredReceipts.map((r) => r.user_id)).size
    const uniqueSuppliers = new Set(filteredReceipts.map((r) => r.supplier).filter(Boolean)).size
    const uniqueRoutes = new Set(filteredReceipts.map((r) => `${r.origin}-${r.destination}`)).size
    const avgLitersPerReceipt = totalReceipts > 0 ? totalLiters / totalReceipts : 0
    const maxLitersSingleReceipt = filteredReceipts.length > 0 
      ? Math.max(...filteredReceipts.map(r => typeof r.liters_dispensed === "bigint" 
        ? Number(r.liters_dispensed) 
        : Number(r.liters_dispensed || 0)))
      : 0

    return { 
      totalReceipts, 
      totalLiters, 
      uniqueAircraft, 
      uniqueUsers,
      uniqueSuppliers,
      uniqueRoutes,
      avgLitersPerReceipt,
      maxLitersSingleReceipt
    }
  }, [filteredReceipts])

  // Chart data
  const aircraftConsumption = useMemo(() => {
    const data: Record<string, number> = {}
    filteredReceipts.forEach((receipt) => {
      const liters = typeof receipt.liters_dispensed === "bigint" 
        ? Number(receipt.liters_dispensed) 
        : Number(receipt.liters_dispensed || 0)
      data[receipt.aircraft_registration] = (data[receipt.aircraft_registration] || 0) + liters
    })
    return Object.entries(data)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [filteredReceipts])

  const supplierConsumption = useMemo(() => {
    const data: Record<string, number> = {}
    filteredReceipts.forEach((receipt) => {
      const supplier = receipt.supplier || "Sin Proveedor"
      const liters = typeof receipt.liters_dispensed === "bigint" 
        ? Number(receipt.liters_dispensed) 
        : Number(receipt.liters_dispensed || 0)
      data[supplier] = (data[supplier] || 0) + liters
    })
    return Object.entries(data)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
  }, [filteredReceipts])

  // Top routes
  const topRoutes = useMemo(() => {
    const data: Record<string, number> = {}
    filteredReceipts.forEach((receipt) => {
      const route = `${receipt.origin || "?"} → ${receipt.destination || "?"}`
      const liters = typeof receipt.liters_dispensed === "bigint" 
        ? Number(receipt.liters_dispensed) 
        : Number(receipt.liters_dispensed || 0)
      data[route] = (data[route] || 0) + liters
    })
    return Object.entries(data)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredReceipts])

  const monthlyConsumption = useMemo(() => {
    const data: Record<string, number> = {}
    filteredReceipts.forEach((receipt) => {
      let date: Date
      // Handle different date formats (ISO string or Date object)
      if (typeof receipt.date === "string") {
        date = new Date(receipt.date + "T00:00:00Z")
      } else {
        date = new Date(receipt.date)
      }
      const month = `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`
      const liters = typeof receipt.liters_dispensed === "bigint" 
        ? Number(receipt.liters_dispensed) 
        : Number(receipt.liters_dispensed || 0)
      data[month] = (data[month] || 0) + liters
    })
    return Object.entries(data)
      .sort(([a], [b]) => {
        const [aMonth, aYear] = a.split("/")
        const [bMonth, bYear] = b.split("/")
        return new Date(Number(bYear), Number(bMonth) - 1).getTime() - new Date(Number(aYear), Number(aMonth) - 1).getTime()
      })
      .map(([month, value]) => ({ month: `${month}`, value: Math.round(value * 10) / 10 }))
  }, [filteredReceipts])

  // Excel export function
  const handleDownloadExcel = () => {
    if (filteredReceipts.length === 0) {
      alert("No hay datos para descargar")
      return
    }

    // Create Excel workbook using native implementation
    const headers = ["Nº Boleta", "Matrícula", "Fecha", "Hora", "Proveedor", "Origen", "Destino", "Litros", "Operación", "Usuario"]
    const rows = filteredReceipts.map((receipt) => [
      receipt.receipt_number || "-",
      receipt.aircraft_registration,
      receipt.date,
      receipt.time,
      receipt.supplier,
      receipt.origin,
      receipt.destination,
      typeof receipt.liters_dispensed === "bigint" 
        ? Number(receipt.liters_dispensed).toFixed(2)
        : Number(receipt.liters_dispensed || 0).toFixed(2),
      receipt.operation_type || "",
      receipt.users ? `${receipt.users.first_name} ${receipt.users.last_name}` : "Desconocido",
    ])

    // Create HTML table for Excel
    let htmlContent = `
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th>${h}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `

    // Create blob and download
    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_combustible_${new Date().toISOString().split("T")[0]}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <DashboardFilters
        onFilterChange={setFilters}
        aircraftList={aircraftList}
        supplierList={supplierList}
        originList={originList}
        destinationList={destinationList}
        onDownload={handleDownloadExcel}
      />

      {/* Stats Cards Row - 8 KPIs */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Recibos</CardTitle>
              <Fuel className="h-5 w-5 text-cyan-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalReceipts}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros filtrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Litros Totales</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats.totalLiters).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Litros despachados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aviones Activos</CardTitle>
              <Plane className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueAircraft}</div>
            <p className="text-xs text-muted-foreground mt-1">En filtro actual</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
              <Users className="h-5 w-5 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Con registros</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prom. Litros/Recibo</CardTitle>
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgLitersPerReceipt.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Promedio por registro</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proveedores Únicos</CardTitle>
              <Globe className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">Activos en período</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Máximo Despacho</CardTitle>
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(stats.maxLitersSingleReceipt).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Litros en un recibo</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rutas Diferentes</CardTitle>
              <Calendar className="h-5 w-5 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueRoutes}</div>
            <p className="text-xs text-muted-foreground mt-1">Origen-Destino únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - 3 Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Distribution by Aircraft */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Avión</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Top 5 por consumo</p>
          </CardHeader>
          <CardContent>
            {aircraftConsumption.length > 0 ? (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={aircraftConsumption}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => `${Number(value).toFixed(0)}L`}
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                    <Bar dataKey="value" fill="#0891b2" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>

        {/* Distribution by Supplier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consumo por Proveedor</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Total litros por supplier</p>
          </CardHeader>
          <CardContent>
            {supplierConsumption.length > 0 ? (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChartComponent>
                    <Pie
                      data={supplierConsumption.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {supplierConsumption.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${Number(value).toFixed(0)}L`}
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                  </PieChartComponent>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rutas Principales</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Top 6 origen-destino</p>
          </CardHeader>
          <CardContent>
            {topRoutes.length > 0 ? (
              <div className="space-y-2">
                {topRoutes.map((route, idx) => (
                  <div key={route.name} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-xs flex-1 truncate">{route.name}</span>
                    <span className="text-xs font-semibold text-right whitespace-nowrap">
                      {route.value.toLocaleString()}L
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Consumption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consumo Mensual</CardTitle>
          <p className="text-xs text-muted-foreground mt-2">Litros despachados por mes</p>
        </CardHeader>
        <CardContent>
          {monthlyConsumption.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={monthlyConsumption} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" vertical={true} />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(150,150,150,0.8)"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    style={{ fontSize: "12px", fontWeight: "500" }}
                    interval={0}
                    label={{ value: "Mes / Año", position: "insideBottomRight", offset: -10 }}
                  />
                  <YAxis 
                    stroke="rgba(150,150,150,0.8)"
                    style={{ fontSize: "12px" }}
                    label={{ value: "Litros Despachados", angle: -90, position: "insideLeft" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString("es-ES", {maximumFractionDigits: 1})}L`, "Total"]}
                    labelFormatter={(label) => `Mes: ${label}`}
                    contentStyle={{ 
                      backgroundColor: "rgba(0,0,0,0.9)", 
                      border: "1px solid rgba(255,255,255,0.3)",
                      borderRadius: "6px",
                      padding: "8px 12px"
                    }}
                    cursor={{ fill: "rgba(8, 145, 178, 0.1)" }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#0891b2" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                    name="Consumo (Litros)"
                    label={{
                      position: "top",
                      formatter: (value) => `${(Number(value) / 1000).toFixed(1)}K`,
                      style: { fontSize: "12px", fontWeight: "600", fill: "#0891b2" }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-lg">{Math.round(monthlyConsumption.reduce((sum, m) => sum + m.value, 0)).toLocaleString()}L</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Promedio</p>
                  <p className="font-bold text-lg">{Math.round(monthlyConsumption.reduce((sum, m) => sum + m.value, 0) / monthlyConsumption.length).toLocaleString()}L</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-muted-foreground">Máximo</p>
                  <p className="font-bold text-lg">{Math.round(Math.max(...monthlyConsumption.map(m => m.value))).toLocaleString()}L</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sin datos disponibles</div>
          )}
        </CardContent>
      </Card>

      {/* Recent Receipts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recibos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No se encontraron recibos con los filtros aplicados</div>
          ) : (
            <div className="space-y-3">
              {filteredReceipts.slice(0, 15).map((receipt) => (
                <div key={receipt.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-sm">{receipt.aircraft_registration}</span>
                      {receipt.operation_type && (
                        <Badge variant="outline" className="text-xs">
                          {receipt.operation_type}
                        </Badge>
                      )}
                      {receipt.supplier && (
                        <Badge variant="secondary" className="text-xs">
                          {receipt.supplier}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {receipt.users ? `${receipt.users.first_name} ${receipt.users.last_name}` : "Usuario desconocido"} • {receipt.origin} → {receipt.destination}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(receipt.date).toLocaleDateString("es-ES")} {receipt.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-cyan-500">
                      {typeof receipt.liters_dispensed === "bigint" 
                        ? Number(receipt.liters_dispensed).toFixed(1)
                        : Number(receipt.liters_dispensed || 0).toFixed(1)}L
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
