"use client"

import dynamic from "next/dynamic"

const FuelConsumptionChart = dynamic(
  () => import("@/components/admin/fuel-consumption-chart").then((mod) => mod.FuelConsumptionChart),
  { ssr: false },
)

const SpendingChart = dynamic(() => import("@/components/admin/spending-chart").then((mod) => mod.SpendingChart), {
  ssr: false,
})

const FuelTypeDistribution = dynamic(
  () => import("@/components/admin/fuel-type-distribution").then((mod) => mod.FuelTypeDistribution),
  { ssr: false },
)

const TopUsers = dynamic(() => import("@/components/admin/top-users").then((mod) => mod.TopUsers), {
  ssr: false,
})

interface AnalyticsChartsProps {
  consumptionData: Array<{ date: string; liters_dispensed: number }>
  spendingData: Array<{ date: string; unit_price: number; liters_dispensed: number }>
  aircraftData: Array<{ aircraft_registration: string; liters_dispensed: number }>
  topUsersData: Array<{
    liters_dispensed: number
    users: { id: string; first_name: string; last_name: string; username: string }
  }>
}

export function AnalyticsCharts({ consumptionData, spendingData, aircraftData, topUsersData }: AnalyticsChartsProps) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <FuelConsumptionChart data={consumptionData} />
        <SpendingChart data={spendingData} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FuelTypeDistribution data={aircraftData} />
        <TopUsers data={topUsersData} />
      </div>
    </>
  )
}
