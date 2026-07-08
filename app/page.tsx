import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="container flex h-20 items-center justify-between">
            <div className="flex items-center gap-8">
              <Image
                src="/logo-estelar.svg"
                alt="Estelar Fuel Control"
                width={160}
                height={45}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                asChild
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="/sign-in">Iniciar Sesión</Link>
              </Button>
            </div>
          </div>
        </header>

        <main>
          <section className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-12">
            <div className="max-w-5xl mx-auto text-center space-y-8 text-white px-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight select-none">Gestión de Combustible Estelar</h1>

              <div className="flex items-center justify-center gap-4 pt-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-14 px-8 text-lg shadow-lg shadow-blue-500/30"
                >
                  <Link href="/telegram">Telegram App</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent h-14 px-8 text-lg"
                >
                  <Link href="/sign-in">Iniciar Sesión</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md mt-20">
          <div className="container py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col items-center md:items-start gap-4">
                <Image
                  src="/logo-estelar.svg"
                  alt="Estelar Fuel Control"
                  width={160}
                  height={54}
                  className="h-10 w-auto brightness-0 invert opacity-80"
                />
                <p className="text-sm text-white/60 text-center md:text-left">
                  Sistema de Gestión de Combustible para Aviación
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-3 text-sm text-white/60">
                <p>© 2025 Estelar Latinoamérica. Todos los derechos reservados.</p>
                <div className="flex gap-4">
                  <Link href="#" className="hover:text-white transition">
                    Privacidad
                  </Link>
                  <Link href="#" className="hover:text-white transition">
                    Términos
                  </Link>
                  <Link href="/sign-in" className="hover:text-white transition">
                    Soporte
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // User is authenticated, redirect to appropriate dashboard
  redirect("/admin/dashboard")
}
