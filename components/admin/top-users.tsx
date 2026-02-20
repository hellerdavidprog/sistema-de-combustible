"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface TopUsersProps {
  data: Array<{
    liters_dispensed: number
    users: {
      id: string
      first_name: string
      last_name: string
      username: string
    }
  }>
}

export function TopUsers({ data }: TopUsersProps) {
  // Aggregate by user
  const userStats = data.reduce((acc: any, receipt) => {
    const userId = receipt.users.id
    if (!acc[userId]) {
      acc[userId] = {
        first_name: receipt.users.first_name,
        last_name: receipt.users.last_name,
        username: receipt.users.username,
        receipt_count: 0,
        total_liters: 0,
      }
    }
    acc[userId].receipt_count += 1
    acc[userId].total_liters += Number.parseFloat(receipt.liters_dispensed.toString())
    return acc
  }, {})

  const sortedUsers = Object.values(userStats)
    .sort((a: any, b: any) => b.total_liters - a.total_liters)
    .slice(0, 5)
  // </CHANGE>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Usuarios</CardTitle>
        <CardDescription>Usuarios con mayor consumo de combustible</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedUsers.map((user: any, index) => {
            const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
            return (
              <div key={user.username} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.receipt_count} cargas registradas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number.parseFloat(user.total_liters).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground">Total despachado</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
