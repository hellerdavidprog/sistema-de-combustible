"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

interface AuthWrapperProps {
  children: React.ReactNode
  requiredRole?: "admin" | "operator" | "supervisor"
}

export function AuthWrapper({ children, requiredRole }: AuthWrapperProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          console.log("[v0] No hay sesión activa, redirigiendo a login")
          router.push("/login")
          return
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("[v0] Error obteniendo usuario:", userError)
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        // Get user profile by email
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("email", user.email)
          .single()

        if (profileError || !userProfile) {
          console.error("[v0] Error obteniendo perfil:", profileError)
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        if (!userProfile.is_active) {
          console.log("[v0] Usuario inactivo")
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        // Check role authorization
        if (requiredRole && userProfile.role !== requiredRole && userProfile.role !== "admin") {
          console.log("[v0] Usuario no autorizado para este rol")
          router.push("/unauthorized")
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error("[v0] Error en checkAuth:", error)
        router.push("/login")
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Setup auth state change listener to refresh when tokens are updated
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, requiredRole, supabase])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
