"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilteredDashboardContent } from "@/components/admin/filtered-dashboard-content"
import { OperatorReceiptsView } from "@/components/operator/operator-receipts-view"

interface SupervisorCombinedViewProps {
  receipts: any[]
}

export function SupervisorCombinedView({ receipts }: SupervisorCombinedViewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle>Resumen Operacional</CardTitle>
          <CardDescription>Estadísticas consolidadas de consumo y operaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <FilteredDashboardContent receipts={receipts} />
        </CardContent>
      </Card>

      {/* Receipts Section */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle>Historial de Recibos</CardTitle>
          <CardDescription>Todos los recibos de combustible despachados</CardDescription>
        </CardHeader>
        <CardContent>
          <OperatorReceiptsView />
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Recibos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Litros Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                receipts.reduce((sum, r) => {
                  const liters = typeof r.liters_dispensed === "bigint" 
                    ? Number(r.liters_dispensed) 
                    : Number(r.liters_dispensed || 0)
                  return sum + liters
                }, 0)
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(receipts.map((r) => r.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aviones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(receipts.map((r) => r.aircraft_registration)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">En uso</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
