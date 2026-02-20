"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { useRouter } from "next/navigation"

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [data, setData] = useState({
    consumptionData: [],
    spendingData: [],
    aircraftData: [],
    topUsersData: [],
  })

  useEffect(() => {
    async function init() {
      const supabase = createBrowserClient()

      // Check auth
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Get profile (by email since users table is independent of auth.users)
      const { data: profileData } = await supabase.from("users").select("*").eq("email", user.email).single()

      if (!profileData || !profileData.is_active || profileData.role !== "admin") {
        router.push("/operator")
        return
      }

      setProfile(profileData)

      // Fetch analytics data
      const { data: consumptionReceipts } = await supabase
        .from("fuel_receipts")
        .select("date, liters_dispensed")
        .gte("date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("date", { ascending: true })

      const { data: spendingReceipts } = await supabase
        .from("fuel_receipts")
        .select("date, liters_dispensed")
        .gte("date", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("date", { ascending: true })

      const { data: aircraftReceipts } = await supabase
        .from("fuel_receipts")
        .select("aircraft_registration, liters_dispensed")
        .order("aircraft_registration")

      const { data: topUsersData } = await supabase
        .from("fuel_receipts")
        .select(
          `
        liters_dispensed,
        users!inner (
          id,
          first_name,
          last_name,
          username
        )
      `,
        )
        .order("created_at", { ascending: false })

      setData({
        consumptionData: consumptionReceipts || [],
        spendingData: spendingReceipts || [],
        aircraftData: aircraftReceipts || [],
        topUsersData: topUsersData || [],
      })
      setLoading(false)
    }

    init()
  }, [router])

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Cargando analytics...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader username={profile.username || "Admin"} role={profile.role} />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-1">Análisis detallado de consumo y gastos</p>
          </div>

          <AnalyticsCharts
            consumptionData={data.consumptionData}
            spendingData={data.spendingData}
            aircraftData={data.aircraftData}
            topUsersData={data.topUsersData}
          />
        </div>
      </main>
    </div>
  )
}
