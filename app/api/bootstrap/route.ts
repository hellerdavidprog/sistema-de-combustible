import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Este endpoint temporal permite crear los usuarios iniciales
// IMPORTANTE: Eliminar este archivo después de crear los usuarios

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()

    // Código secreto simple para proteger el endpoint
    if (secret !== "init-estelar-2025") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Crear usuario admin
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@estelar.com",
      password: "12345",
      email_confirm: true,
      user_metadata: {
        role: "admin",
        username: "admin",
        first_name: "Administrador",
        last_name: "Sistema",
      },
    })

    if (adminError) {
      console.error("Error creating admin:", adminError)
    }

    // Crear usuario operador
    const { data: operatorData, error: operatorError } = await supabaseAdmin.auth.admin.createUser({
      email: "operador@estelar.com",
      password: "12345",
      email_confirm: true,
      user_metadata: {
        role: "operator",
        username: "operador",
        first_name: "Operador",
        last_name: "Sistema",
      },
    })

    if (operatorError) {
      console.error("Error creating operator:", operatorError)
    }

    return NextResponse.json({
      success: true,
      admin: adminData?.user?.email,
      operator: operatorData?.user?.email,
      errors: {
        admin: adminError?.message,
        operator: operatorError?.message,
      },
    })
  } catch (error: any) {
    console.error("Bootstrap error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
