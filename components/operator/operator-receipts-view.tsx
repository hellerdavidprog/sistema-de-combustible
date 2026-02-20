"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Search } from "lucide-react"
import Image from "next/image"
import { createBrowserClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"

interface Receipt {
  id: string
  date: string
  time: string
  aircraft_registration: string
  supplier: string
  initial_reading: number
  final_reading: number
  liters_dispensed: number
  origin: string
  destination: string
  notes: string | null
  receipt_image_url: string | null
  created_at: string
  receipt_number: string | null
  operation_type: string | null
}

export function OperatorReceiptsView() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [customSupplier, setCustomSupplier] = useState("")
  const [showCustomSupplier, setShowCustomSupplier] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [isTicketOpen, setIsTicketOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<string[]>([])

  const supabase = createBrowserClient()

  useEffect(() => {
    fetchReceipts()
  }, [])

  useEffect(() => {
    // Extract unique suppliers
    const uniqueSuppliers = [...new Set(receipts.map(r => r.supplier).filter(Boolean))] as string[]
    setSuppliers(uniqueSuppliers.sort())
  }, [receipts])

  async function fetchReceipts() {
    setLoading(true)
    const { data, error } = await supabase
      .from("fuel_receipts")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false })

    if (error) {
      console.error("Error fetching receipts:", error)
    } else {
      setReceipts(data || [])
    }
    setLoading(false)
  }

  function filterReceipts() {
    let filtered = [...receipts]

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((receipt) => receipt.date >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter((receipt) => receipt.date <= endDate)
    }

    // Filter by supplier
    const activeSupplier = showCustomSupplier ? customSupplier : supplierFilter
    if (activeSupplier) {
      filtered = filtered.filter((receipt) => 
        (receipt.supplier || "").toLowerCase().includes(activeSupplier.toLowerCase())
      )
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (receipt) =>
          (receipt.aircraft_registration || "").toLowerCase().includes(search) ||
          (receipt.origin || "").toLowerCase().includes(search) ||
          (receipt.destination || "").toLowerCase().includes(search) ||
          (receipt.supplier || "").toLowerCase().includes(search) ||
          (receipt.receipt_number || "").toLowerCase().includes(search),
      )
    }

    setFilteredReceipts(filtered)
  }

  function handleSearch() {
    filterReceipts()
  }

  function clearFilters() {
    setStartDate("")
    setEndDate("")
    setSupplierFilter("")
    setCustomSupplier("")
    setShowCustomSupplier(false)
    setSearchTerm("")
    setFilteredReceipts(receipts)
  }

  function handleSupplierChange(value: string) {
    if (value === "__other__") {
      setShowCustomSupplier(true)
      setSupplierFilter("")
    } else {
      setShowCustomSupplier(false)
      setCustomSupplier("")
      setSupplierFilter(value)
    }
  }

  function downloadReceipt(receipt: Receipt) {
    if (receipt.receipt_image_url) {
      window.open(receipt.receipt_image_url, "_blank")
    }
  }

  function viewTicket(receipt: Receipt) {
    setSelectedReceipt(receipt)
    setIsTicketOpen(true)
  }

  function exportToExcel() {
    // Prepare data for Excel
    const data = filteredReceipts.map((r) => ({
      "Número de Boleta": r.receipt_number || "",
      Fecha: r.date,
      Hora: r.time,
      Matrícula: r.aircraft_registration,
      "Tipo de Operación": r.operation_type || "",
      Proveedor: r.supplier || "",
      "Lectura Inicial": r.initial_reading,
      "Lectura Final": r.final_reading,
      "Litros Dispensados": r.liters_dispensed,
      Origen: r.origin,
      Destino: r.destination,
      Notas: r.notes || "",
    }))

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data)

    // Set column widths
    ws["!cols"] = [
      { wch: 18 }, // Número de Boleta
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 12 }, // Matrícula
      { wch: 18 }, // Tipo de Operación
      { wch: 15 }, // Proveedor
      { wch: 15 }, // Lectura Inicial
      { wch: 15 }, // Lectura Final
      { wch: 18 }, // Litros Dispensados
      { wch: 10 }, // Origen
      { wch: 10 }, // Destino
      { wch: 30 }, // Notas
    ]

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Recibos")

    // Generate file name with current date
    const fileName = `recibos_${new Date().toISOString().split("T")[0]}.xlsx`

    // Download file
    XLSX.writeFile(wb, fileName)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Recibos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Desde</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Hasta</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              {showCustomSupplier ? (
                <div className="flex gap-2">
                  <Input
                    id="customSupplier"
                    placeholder="Nombre del proveedor..."
                    value={customSupplier}
                    onChange={(e) => setCustomSupplier(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setShowCustomSupplier(false)
                      setCustomSupplier("")
                    }}
                    title="Volver a lista"
                  >
                    X
                  </Button>
                </div>
              ) : (
                <select
                  id="supplier"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={supplierFilter}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                >
                  <option value="">Todos los proveedores</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
                  <option value="__other__">Otro...</option>
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Matrícula, boleta, origen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="default" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Limpiar Filtros
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredReceipts.length} de {receipts.length} recibos
              </p>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Número de Boleta</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Matrícula</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo de Operación</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Litros</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Origen</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Destino</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                      No se encontraron recibos
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => viewTicket(receipt)}
                    >
                      <td className="px-4 py-3 text-sm">{receipt.receipt_number || "-"}</td>
                      <td className="px-4 py-3 text-sm">{receipt.date || "-"}</td>
                      <td className="px-4 py-3 text-sm">{receipt.time || "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium">{receipt.aircraft_registration || "-"}</td>
                      <td className="px-4 py-3 text-sm">{receipt.operation_type || "-"}</td>
                      <td className="px-4 py-3 text-sm">{receipt.supplier || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm">{receipt.liters_dispensed != null ? receipt.liters_dispensed.toLocaleString() : "-"}</td>
                      <td className="px-4 py-3 text-sm">{receipt.origin || "-"}</td>
                      <td className="px-4 py-3 text-sm">{receipt.destination || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {receipt.receipt_image_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadReceipt(receipt)
                            }}
                            title="Descargar imagen"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isTicketOpen} onOpenChange={setIsTicketOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Recibo de Combustible</DialogTitle>
            <DialogDescription>Detalles del recibo</DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="bg-white text-black p-6 font-mono text-sm space-y-4">
              {/* Header */}
              <div className="text-center border-b-2 border-dashed border-gray-400 pb-4">
                <div className="flex items-center justify-center mb-3">
                  <Image 
                    src="/logo-estelar.svg" 
                    alt="Estelar Fuel Control" 
                    width={140} 
                    height={35} 
                    className="h-9 w-auto"
                  />
                </div>
                {selectedReceipt.receipt_number && (
                  <p className="text-base font-bold">No. {selectedReceipt.receipt_number}</p>
                )}
              </div>

              {/* Receipt Details */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-semibold">{selectedReceipt.date || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-semibold">{selectedReceipt.time || "N/A"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Matrícula:</span>
                  <span className="font-bold text-base">{selectedReceipt.aircraft_registration || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proveedor:</span>
                  <span className="font-semibold">{selectedReceipt.supplier || "N/A"}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lectura Inicial:</span>
                  <span className="font-semibold">{selectedReceipt.initial_reading != null ? selectedReceipt.initial_reading.toLocaleString() : "N/A"} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lectura Final:</span>
                  <span className="font-semibold">{selectedReceipt.final_reading != null ? selectedReceipt.final_reading.toLocaleString() : "N/A"} L</span>
                </div>
                <div className="flex justify-between bg-gray-100 -mx-2 px-2 py-2">
                  <span className="font-bold">LITROS DISPENSADOS:</span>
                  <span className="font-bold text-lg">{selectedReceipt.liters_dispensed != null ? selectedReceipt.liters_dispensed.toLocaleString() : "N/A"} L</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-400 pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Origen:</span>
                  <span className="font-semibold">{selectedReceipt.origin || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Destino:</span>
                  <span className="font-semibold">{selectedReceipt.destination || "N/A"}</span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div className="border-t border-dashed border-gray-400 pt-3">
                  <p className="text-gray-600 text-xs">Notas:</p>
                  <p className="text-sm mt-1">{selectedReceipt.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-2 border-dashed border-gray-400 pt-4 text-center text-xs text-gray-500">
                <p>Gracias por su preferencia</p>
                <p className="mt-1">ID: {selectedReceipt.id.slice(0, 8)}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {selectedReceipt.receipt_image_url && (
                  <Button onClick={() => downloadReceipt(selectedReceipt)} className="flex-1" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Imagen
                  </Button>
                )}
                <Button onClick={() => setIsTicketOpen(false)} className="flex-1" variant="default">
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
