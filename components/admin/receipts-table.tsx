"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plane, Eye, Pencil, Trash2, Download } from "lucide-react"
import Image from "next/image"

interface Receipt {
  id: string
  date: string
  time: string
  receipt_number: string | null
  aircraft_registration: string
  supplier: string
  initial_reading: number | null
  final_reading: number | null
  liters_dispensed: number
  origin: string
  destination: string
  operation_type: string | null
  notes: string | null
  receipt_image_url: string | null
  username?: string
  first_name?: string
  last_name?: string
}

export function ReceiptsTable() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Receipt>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchReceipts()
  }, [])

  const fetchReceipts = async () => {
    try {
      const response = await fetch("/api/receipts")
      const data = await response.json()
      setReceipts(data.receipts || [])
    } catch (error) {
      console.error("Error fetching receipts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsViewModalOpen(true)
  }

  const handleEdit = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setEditForm(receipt)
    setIsEditModalOpen(true)
  }

  const handleDelete = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedReceipt) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/receipts?id=${selectedReceipt.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setReceipts(receipts.filter((r) => r.id !== selectedReceipt.id))
        setIsDeleteModalOpen(false)
        setSelectedReceipt(null)
      } else {
        alert("Error al eliminar el recibo")
      }
    } catch (error) {
      console.error("Error deleting receipt:", error)
      alert("Error al eliminar el recibo")
    } finally {
      setIsSaving(false)
    }
  }

  const saveEdit = async () => {
    if (!selectedReceipt) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/receipts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedReceipt.id, ...editForm }),
      })
      if (response.ok) {
        const { receipt: updatedReceipt } = await response.json()
        setReceipts(receipts.map((r) => (r.id === selectedReceipt.id ? { ...r, ...updatedReceipt } : r)))
        setIsEditModalOpen(false)
        setSelectedReceipt(null)
      } else {
        alert("Error al actualizar el recibo")
      }
    } catch (error) {
      console.error("Error updating receipt:", error)
      alert("Error al actualizar el recibo")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredReceipts = receipts.filter((receipt) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (receipt.aircraft_registration || "").toLowerCase().includes(search) ||
      (receipt.origin || "").toLowerCase().includes(search) ||
      (receipt.destination || "").toLowerCase().includes(search) ||
      (receipt.receipt_number || "").toLowerCase().includes(search) ||
      (receipt.supplier || "").toLowerCase().includes(search)
    )
  })

  if (isLoading) {
    return <div>Cargando recibos...</div>
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de Recibos</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar recibos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Plane className="h-4 w-4 text-primary" />
                    <p className="font-medium">{receipt.aircraft_registration}</p>
                    {receipt.receipt_number && (
                      <Badge variant="outline" className="text-xs">
                        #{receipt.receipt_number}
                      </Badge>
                    )}
                    {receipt.supplier && (
                      <Badge variant="secondary" className="text-xs">
                        {receipt.supplier}
                      </Badge>
                    )}
                    {receipt.operation_type && (
                      <Badge variant={receipt.operation_type === "Charter" ? "default" : "secondary"} className="text-xs">
                        {receipt.operation_type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {receipt.origin || "N/A"} - {receipt.destination || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {receipt.date ? new Date(receipt.date).toLocaleDateString("es-ES") : "N/A"} {receipt.time || ""}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right space-y-1">
                    <p className="font-bold text-lg">
                      {Number.parseFloat(receipt.liters_dispensed?.toString() || "0").toFixed(1)}L
                    </p>
                    {receipt.initial_reading && receipt.final_reading && (
                      <p className="text-sm text-muted-foreground">
                        {receipt.initial_reading.toLocaleString()} - {receipt.final_reading.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleView(receipt)} title="Ver detalle">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(receipt)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(receipt)}
                      title="Eliminar"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredReceipts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No se encontraron recibos</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Modal - Ticket Style */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalle de Boleta</span>
            </DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="bg-card border-2 border-dashed border-border rounded-lg p-6 font-mono text-sm">
              <div className="text-center border-b border-dashed border-border pb-4 mb-4">
                <div className="flex items-center justify-center">
                  <Image 
                    src="/logo-estelar.svg" 
                    alt="Estelar Fuel Control" 
                    width={140} 
                    height={35} 
                    className="h-9 w-auto"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Boleta:</span>
                  <span className="font-bold">{selectedReceipt.receipt_number || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{selectedReceipt.date ? new Date(selectedReceipt.date).toLocaleDateString("es-ES") : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hora:</span>
                  <span>{selectedReceipt.time || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{selectedReceipt.operation_type || "Regular"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border my-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matricula:</span>
                  <span className="font-bold">{selectedReceipt.aircraft_registration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor:</span>
                  <span>{selectedReceipt.supplier || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ruta:</span>
                  <span>
                    {selectedReceipt.origin || "N/A"} - {selectedReceipt.destination || "N/A"}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-border my-4 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lectura Inicial:</span>
                  <span>{selectedReceipt.initial_reading?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lectura Final:</span>
                  <span>{selectedReceipt.final_reading?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-dashed border-border pt-2 mt-2">
                  <span>LITROS:</span>
                  <span>{Number.parseFloat(selectedReceipt.liters_dispensed?.toString() || "0").toFixed(1)} L</span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="border-t border-dashed border-border my-4 pt-4">
                  <p className="text-muted-foreground text-xs">Notas:</p>
                  <p className="text-sm">{selectedReceipt.notes}</p>
                </div>
              )}

              {selectedReceipt.receipt_image_url && (
                <div className="border-t border-dashed border-border my-4 pt-4">
                  <a
                    href={selectedReceipt.receipt_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    Ver imagen del recibo
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsViewModalOpen(false)
                if (selectedReceipt) handleEdit(selectedReceipt)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Recibo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Boleta</Label>
                <Input
                  value={editForm.receipt_number || ""}
                  onChange={(e) => setEditForm({ ...editForm, receipt_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Operacion</Label>
                <Select
                  value={editForm.operation_type || "Regular"}
                  onValueChange={(value) => setEditForm({ ...editForm, operation_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Charter">Charter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={editForm.date || ""}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={editForm.time || ""}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricula</Label>
                <Input
                  value={editForm.aircraft_registration || ""}
                  onChange={(e) => setEditForm({ ...editForm, aircraft_registration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  value={editForm.supplier || ""}
                  onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen</Label>
                <Input
                  value={editForm.origin || ""}
                  onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  value={editForm.destination || ""}
                  onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Lectura Inicial</Label>
                <Input
                  type="number"
                  value={editForm.initial_reading || ""}
                  onChange={(e) => setEditForm({ ...editForm, initial_reading: Number(e.target.value) || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lectura Final</Label>
                <Input
                  type="number"
                  value={editForm.final_reading || ""}
                  onChange={(e) => setEditForm({ ...editForm, final_reading: Number(e.target.value) || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Litros</Label>
                <Input
                  type="number"
                  value={editForm.liters_dispensed || ""}
                  onChange={(e) => setEditForm({ ...editForm, liters_dispensed: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminacion</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            ¿Esta seguro que desea eliminar este recibo? Esta accion no se puede deshacer.
          </p>
          {selectedReceipt && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p>
                <strong>Boleta:</strong> #{selectedReceipt.receipt_number || "N/A"}
              </p>
              <p>
                <strong>Matricula:</strong> {selectedReceipt.aircraft_registration}
              </p>
              <p>
                <strong>Litros:</strong> {selectedReceipt.liters_dispensed}L
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
