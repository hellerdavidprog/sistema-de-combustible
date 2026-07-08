"use client"

import { Button } from "@/components/ui/button"
import { Users, Receipt, BarChart3, LogOut, LayoutDashboard } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import Image from "next/image"

interface DashboardHeaderProps {
  username?: string
  role?: string
}

export function DashboardHeader({ username = "Admin", role = "admin" }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/receipts", label: "Recibos", icon: Receipt },
    { href: "/admin/users", label: "Usuarios", icon: Users },
  ]

  const supervisorNavItems = [
    { href: "/supervisor", label: "Control de Operaciones", icon: BarChart3 },
    { href: "/admin/receipts", label: "Recibos", icon: Receipt },
  ]

  const operatorNavItems = [{ href: "/operator", label: "Recibos", icon: Receipt }]

  let navItems = operatorNavItems
  let homeHref = "/operator"

  if (role === "admin") {
    navItems = adminNavItems
    homeHref = "/admin/dashboard"
  } else if (role === "supervisor") {
    navItems = supervisorNavItems
    homeHref = "/supervisor"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={homeHref} className="flex items-center gap-2">
            <Image
              src="/logo-estelar.svg"
              alt="Estelar Fuel Management"
              width={140}
              height={35}
              className="h-8 w-auto text-primary"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className={isActive ? "bg-secondary" : ""}
                >
                  <Link href={item.href}>
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="text-sm">
            <p className="font-medium">{username}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
