import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Service client para bypass RLS
const getServiceClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient()

    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, email, first_name, last_name, telegram_id, role, is_active, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    
    const body = await request.json()
    const { email, password, username, firstName, lastName, role, telegramId } = body

    if (!email || !password || !username || !firstName || !role) {
      return NextResponse.json({ error: "Campos requeridos: email, password, username, nombre y rol" }, { status: 400 })
    }

    // Verificar si el username ya existe
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single()

    if (existingUsername) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 400 })
    }

    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingEmail) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        first_name: firstName,
        last_name: lastName,
        role,
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2. Crear perfil en public.users
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username,
        email,
        first_name: firstName,
        last_name: lastName || null,
        telegram_id: telegramId || null,
        role,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating user profile:", insertError)
      // Intentar eliminar el usuario de auth si falla la creación del perfil
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: newUser })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const body = await request.json()
    const { id, username, firstName, lastName, role, telegramId, isActive, newPassword, email } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Si se está cambiando la contraseña
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
      }

      // Buscar el usuario en auth.users por email
      if (!email) {
        return NextResponse.json({ error: "Se requiere el email para cambiar la contraseña" }, { status: 400 })
      }

      // Listar usuarios de auth para encontrar el que coincide con el email
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error("Error listing auth users:", listError)
        return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 })
      }

      const authUser = authUsers.users.find(u => u.email === email)
      
      if (!authUser) {
        return NextResponse.json({ error: "Usuario no encontrado en el sistema de autenticación" }, { status: 404 })
      }

      // Actualizar contraseña usando admin API
      const { error: passwordError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: newPassword,
      })

      if (passwordError) {
        console.error("Error updating password:", passwordError)
        return NextResponse.json({ error: passwordError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Contraseña actualizada exitosamente" })
    }

    // Actualización normal de datos del perfil
    const updateData: any = {}
    if (username !== undefined) updateData.username = username
    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (role !== undefined) updateData.role = role
    if (telegramId !== undefined) updateData.telegram_id = telegramId
    if (isActive !== undefined) updateData.is_active = isActive
    updateData.updated_at = new Date().toISOString()

    const { data: user, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}
