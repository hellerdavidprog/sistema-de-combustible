"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check auth on client side
    const checkAuth = async () => {
      try {
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error checking auth:", error)
        router.push("/sign-in")
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Cargando analytics...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username="Admin" role="admin" />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">Análisis detallado de consumo y gastos</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Analytics en construcción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Los gráficos de análisis se mostrarán aquí cuando se implementen con Drizzle.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
