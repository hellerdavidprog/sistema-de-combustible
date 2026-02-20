"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] === INICIO LOGIN ===")
    console.log("[v0] Email:", email)

    try {
      // PASO 1: Autenticación en Supabase Auth
      console.log("[v0] PASO 1: Intentando autenticación en Supabase Auth...")
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("[v0] ❌ Error de autenticación:", signInError.message)
        setError("Usuario o contraseña incorrectos")
        setIsLoading(false)
        return
      }

      console.log("[v0] ✅ Autenticación exitosa. Usuario ID:", data.user?.id)

      // PASO 2: Obtener sesión actual
      console.log("[v0] PASO 2: Verificando sesión...")
      const { data: sessionData } = await supabase.auth.getSession()
      console.log("[v0] Sesión activa:", sessionData.session ? "Sí" : "No")

      if (data.user) {
        // PASO 3: Buscar perfil en public.users por email
        console.log("[v0] PASO 3: Buscando perfil en public.users por email:", email)
        let { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("role, is_active, username, email")
          .eq("email", email)
          .single()

        console.log("[v0] Resultado búsqueda por email:", {
          found: !!userProfile,
          error: profileError?.message,
          code: profileError?.code,
          details: profileError?.details,
        })

        // PASO 4: Si no se encontró por email, intentar por username
        if (profileError || !userProfile) {
          console.log("[v0] PASO 4: Email no encontró perfil, intentando por username...")
          const username = email.split("@")[0]
          console.log("[v0] Username extraído:", username)

          const { data: userByUsername, error: usernameError } = await supabase
            .from("users")
            .select("role, is_active, username, email")
            .eq("username", username)
            .single()

          console.log("[v0] Resultado búsqueda por username:", {
            found: !!userByUsername,
            error: usernameError?.message,
            code: usernameError?.code,
          })

          if (usernameError || !userByUsername) {
            console.error("[v0] ❌ Perfil no encontrado en ninguna búsqueda")
            console.error("[v0] Error por email:", profileError)
            console.error("[v0] Error por username:", usernameError)
            setError(`Perfil no encontrado. Error: ${profileError?.message || usernameError?.message}`)
            await supabase.auth.signOut()
            setIsLoading(false)
            return
          }

          userProfile = userByUsername
          console.log("[v0] ✅ Perfil encontrado por username")
        } else {
          console.log("[v0] ✅ Perfil encontrado por email")
        }

        // PASO 5: Validar datos del perfil
        console.log("[v0] PASO 5: Datos del perfil:", {
          email: userProfile.email,
          username: userProfile.username,
          role: userProfile.role,
          is_active: userProfile.is_active,
        })

        if (!userProfile.is_active) {
          console.error("[v0] ❌ Usuario inactivo")
          setError("Usuario desactivado. Contacta al administrador.")
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        // PASO 6: Determinar redirección según rol
        console.log("[v0] PASO 6: Determinando redirección para rol:", userProfile.role)

        let redirectPath = ""
        if (userProfile.role === "admin") {
          redirectPath = "/admin/dashboard"
        } else if (userProfile.role === "supervisor") {
          redirectPath = "/supervisor"
        } else if (userProfile.role === "operator") {
          redirectPath = "/operator"
        } else {
          console.error("[v0] ❌ Rol no reconocido:", userProfile.role)
          setError(`Rol no reconocido: ${userProfile.role}`)
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        console.log("[v0] ✅ Redirigiendo a:", redirectPath)
        console.log("[v0] === FIN LOGIN EXITOSO ===")
        
        router.push(redirectPath)
        router.refresh()
      }
    } catch (error: unknown) {
      console.error("[v0] ❌ ERROR CRÍTICO EN LOGIN:", error)
      console.error("[v0] Tipo de error:", typeof error)
      console.error("[v0] Error completo:", JSON.stringify(error, null, 2))
      setError(`Error crítico: ${error instanceof Error ? error.message : "Error desconocido"}`)
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-accent/20 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={handleClose}
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>

        <CardHeader className="space-y-4 pt-8">
          <div className="flex items-center justify-center">
            <Image 
              src="/logo-estelar.svg" 
              alt="Estelar Fuel Control" 
              width={180} 
              height={50} 
              className="h-12 w-auto"
            />
          </div>
          <CardDescription className="text-center">Ingresa tus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}</span>
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
