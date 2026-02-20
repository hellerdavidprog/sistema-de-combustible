"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, X, Download } from "lucide-react"

interface DashboardFiltersProps {
  onFilterChange: (filters: FilterValues) => void
  aircraftList: string[]
  supplierList: string[]
  originList: string[]
  destinationList: string[]
  onDownload: () => void
}

export interface FilterValues {
  aircraft?: string
  supplier?: string
  origin?: string
  destination?: string
  dateFrom?: string
  dateTo?: string
}

export function DashboardFilters({
  onFilterChange,
  aircraftList,
  supplierList,
  originList,
  destinationList,
  onDownload,
}: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({})
  const [showCustomOrigin, setShowCustomOrigin] = useState(false)
  const [showCustomDestination, setShowCustomDestination] = useState(false)
  const [showCustomSupplier, setShowCustomSupplier] = useState(false)
  const [customOrigin, setCustomOrigin] = useState("")
  const [customDestination, setCustomDestination] = useState("")
  const [customSupplier, setCustomSupplier] = useState("")

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSupplierChange = (value: string) => {
    if (value === "__other__") {
      setShowCustomSupplier(true)
      handleFilterChange("supplier", "")
    } else if (value === "all") {
      setShowCustomSupplier(false)
      setCustomSupplier("")
      handleFilterChange("supplier", "")
    } else {
      setShowCustomSupplier(false)
      setCustomSupplier("")
      handleFilterChange("supplier", value)
    }
  }

  const handleCustomSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomSupplier(value)
    handleFilterChange("supplier", value)
  }

  const handleOriginChange = (value: string) => {
    if (value === "__other__") {
      setShowCustomOrigin(true)
      handleFilterChange("origin", "")
    } else if (value === "all") {
      setShowCustomOrigin(false)
      setCustomOrigin("")
      handleFilterChange("origin", "")
    } else {
      setShowCustomOrigin(false)
      setCustomOrigin("")
      handleFilterChange("origin", value)
    }
  }

  const handleDestinationChange = (value: string) => {
    if (value === "__other__") {
      setShowCustomDestination(true)
      handleFilterChange("destination", "")
    } else if (value === "all") {
      setShowCustomDestination(false)
      setCustomDestination("")
      handleFilterChange("destination", "")
    } else {
      setShowCustomDestination(false)
      setCustomDestination("")
      handleFilterChange("destination", value)
    }
  }

  const handleCustomOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomOrigin(value)
    handleFilterChange("origin", value)
  }

  const handleCustomDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomDestination(value)
    handleFilterChange("destination", value)
  }

  const clearFilters = () => {
    setFilters({})
    setShowCustomOrigin(false)
    setShowCustomDestination(false)
    setShowCustomSupplier(false)
    setCustomOrigin("")
    setCustomDestination("")
    setCustomSupplier("")
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some((value) => value)

  return (
    <Card className="border-l-2 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Filtros de Búsqueda
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={onDownload}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Aircraft Filter */}
          <div className="space-y-2">
            <Label htmlFor="aircraft" className="text-sm font-medium">
              Matrícula
            </Label>
            <Select value={filters.aircraft || "all"} onValueChange={(value) => handleFilterChange("aircraft", value)}>
              <SelectTrigger id="aircraft" className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las aeronaves</SelectItem>
                {aircraftList.length > 0 ? (
                  aircraftList.map((aircraft) => (
                    <SelectItem key={aircraft} value={aircraft}>
                      {aircraft}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="empty" disabled>
                    Sin datos
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier Filter - With Dropdown + Other */}
          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Proveedor
            </Label>
            {showCustomSupplier ? (
              <div className="flex gap-1">
                <Input
                  id="supplierCustom"
                  placeholder="Escriba proveedor..."
                  value={customSupplier}
                  onChange={handleCustomSupplierChange}
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomSupplier(false)
                    setCustomSupplier("")
                    handleFilterChange("supplier", "")
                  }}
                  className="h-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Select value={filters.supplier || "all"} onValueChange={handleSupplierChange}>
                <SelectTrigger id="supplier" className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  <SelectItem value="PDVSA">PDVSA</SelectItem>
                  <SelectItem value="COMERCHAMP">COMERCHAMP</SelectItem>
                  <SelectItem value="__other__">Otros...</SelectItem>
                  {supplierList.length > 0 && supplierList.filter(s => s && s !== "PDVSA" && s !== "COMERCHAMP").map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Origin Filter - With Dropdown + Other */}
          <div className="space-y-2">
            <Label htmlFor="origin" className="text-sm font-medium">
              Origen
            </Label>
            {showCustomOrigin ? (
              <div className="flex gap-1">
                <Input
                  id="originCustom"
                  placeholder="Escriba origen..."
                  value={customOrigin}
                  onChange={handleCustomOriginChange}
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setShowCustomOrigin(false)
                    setCustomOrigin("")
                    handleFilterChange("origin", "")
                  }}
                  className="h-9 w-9"
                  title="Volver"
                >
                  X
                </Button>
              </div>
            ) : (
              <Select value={filters.origin || "all"} onValueChange={handleOriginChange}>
                <SelectTrigger id="origin" className="h-9">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los orígenes</SelectItem>
                  {originList.length > 0 ? (
                    originList.map((origin) => (
                      <SelectItem key={origin} value={origin}>
                        {origin}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Sin datos
                    </SelectItem>
                  )}
                  <SelectItem value="__other__">Otro...</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Destination Filter - With Dropdown + Other */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm font-medium">
              Destino
            </Label>
            {showCustomDestination ? (
              <div className="flex gap-1">
                <Input
                  id="destinationCustom"
                  placeholder="Escriba destino..."
                  value={customDestination}
                  onChange={handleCustomDestinationChange}
                  className="h-9 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setShowCustomDestination(false)
                    setCustomDestination("")
                    handleFilterChange("destination", "")
                  }}
                  className="h-9 w-9"
                  title="Volver"
                >
                  X
                </Button>
              </div>
            ) : (
              <Select value={filters.destination || "all"} onValueChange={handleDestinationChange}>
                <SelectTrigger id="destination" className="h-9">
                  <SelectValue placeholder="Seleccione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los destinos</SelectItem>
                  {destinationList.length > 0 ? (
                    destinationList.map((destination) => (
                      <SelectItem key={destination} value={destination}>
                        {destination}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Sin datos
                    </SelectItem>
                  )}
                  <SelectItem value="__other__">Otro...</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="text-sm font-medium">
              Desde
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="h-9"
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateTo" className="text-sm font-medium">
              Hasta
            </Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
