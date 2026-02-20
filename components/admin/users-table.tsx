"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Key } from "lucide-react"

interface User {
  id: string
  username: string
  email: string | null
  first_name: string
  last_name: string | null
  telegram_id: string | null
  role: string
  is_active: boolean
  created_at: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
    telegramId: "",
    role: "operator" as "admin" | "operator" | "supervisor",
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName || null,
          telegramId: newUser.telegramId || null,
          role: newUser.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      // Reset form
      setNewUser({ email: "", password: "", username: "", firstName: "", lastName: "", telegramId: "", role: "operator" })
      setIsCreateOpen(false)
      alert("Usuario creado exitosamente")
      fetchUsers()
    } catch (error: any) {
      console.error("Error creating user:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      fetchUsers()
    } catch (error: any) {
      console.error("Error updating role:", error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      fetchUsers()
    } catch (error: any) {
      console.error("Error toggling user status:", error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) return
    
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
    
    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedUser.id, 
          email: selectedUser.email,
          newPassword 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cambiar contraseña")
      }

      alert("Contraseña actualizada exitosamente")
      setIsPasswordOpen(false)
      setNewPassword("")
      setConfirmPassword("")
      setSelectedUser(null)
    } catch (error: any) {
      console.error("Error changing password:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      fetchUsers()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      alert(`Error: ${error.message}`)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "default"
    if (role === "supervisor") return "outline"
    return "secondary"
  }

  const getFullName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.first_name || user.username
  }

  if (isLoading && users.length === 0) {
    return <div>Cargando usuarios...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>Ingresa los datos del nuevo usuario del sistema</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    placeholder="usuario@estelar.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  placeholder="ej: jperez"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telegramId">Telegram ID (opcional)</Label>
                <Input
                  id="telegramId"
                  value={newUser.telegramId}
                  onChange={(e) => setNewUser({ ...newUser, telegramId: e.target.value })}
                  placeholder="ID de Telegram para notificaciones"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Usuario"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getFullName(user)}</p>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {user.role === "admin" ? "Administrador" : user.role === "supervisor" ? "Supervisor" : "Operador"}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="destructive" className="text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                  {user.telegram_id && (
                    <p className="text-xs text-muted-foreground">Telegram: {user.telegram_id}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Registrado: {new Date(user.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleUpdateRole(user.id, value)}
                    disabled={!user.is_active}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={user.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(user.id, user.is_active)}
                  >
                    {user.is_active ? "Desactivar" : "Activar"}
                  </Button>

                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => {
                      setSelectedUser(user)
                      setIsPasswordOpen(true)
                    }}
                    title="Cambiar contraseña"
                    disabled={!user.email}
                  >
                    <Key className="h-4 w-4" />
                  </Button>

                  <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay usuarios registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para cambiar contraseña */}
      <Dialog open={isPasswordOpen} onOpenChange={(open) => {
        setIsPasswordOpen(open)
        if (!open) {
          setNewPassword("")
          setConfirmPassword("")
          setSelectedUser(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Cambiar contraseña para: {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Repetir contraseña"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
