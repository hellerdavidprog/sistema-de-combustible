"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, Camera, CheckCircle2 } from "lucide-react"

interface TelegramWebApp {
  initDataUnsafe: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
  }
  close: () => void
  sendData: (data: string) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function ReceiptForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null) // Store actual File object instead of preview
  const [hasMeter, setHasMeter] = useState<string>("yes")
  const [operationType, setOperationType] = useState<string>("regular")
  const [errors, setErrors] = useState({
    readings: "",
    route: "",
    charterOrigin: "",
    charterDestination: "",
  })

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].slice(0, 5),
    receiptNumber: "",
    aircraftRegistration: "",
    supplier: "",
    customSupplier: "",
    initialReading: "",
    finalReading: "",
    litersDispensed: "",
    origin: "",
    destination: "",
    notes: "",
  })
  const [showCustomSupplier, setShowCustomSupplier] = useState(false)

  useEffect(() => {
    if (hasMeter === "no") {
      setFormData((prev) => ({ ...prev, initialReading: "", finalReading: "" }))
      setErrors((prev) => ({ ...prev, readings: "" }))
      return
    }

    const initial = Number.parseFloat(formData.initialReading)
    const final = Number.parseFloat(formData.finalReading)

    if (!isNaN(initial) && !isNaN(final)) {
      if (initial >= final) {
        setErrors((prev) => ({ ...prev, readings: "La lectura inicial debe ser menor que la lectura final" }))
        setFormData((prev) => ({ ...prev, litersDispensed: "" }))
      } else {
        setErrors((prev) => ({ ...prev, readings: "" }))
        const liters = final - initial
        setFormData((prev) => ({ ...prev, litersDispensed: liters.toString() }))
      }
    }
  }, [formData.initialReading, formData.finalReading, hasMeter])

  useEffect(() => {
    if (formData.origin && formData.destination && formData.origin === formData.destination) {
      setErrors((prev) => ({ ...prev, route: "El origen y el destino deben ser diferentes" }))
    } else {
      setErrors((prev) => ({ ...prev, route: "" }))
    }
  }, [formData.origin, formData.destination])

  const validateCharterCode = (value: string, field: "charterOrigin" | "charterDestination") => {
    const regex = /^[A-Za-z]{0,3}$/
    if (!regex.test(value)) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Solo se permiten letras, máximo 3 caracteres",
      }))
      return false
    }
    setErrors((prev) => ({ ...prev, [field]: "" }))
    return true
  }

  const handleInputChange = (field: string, value: string) => {
    if (operationType === "charter" && (field === "origin" || field === "destination")) {
      const validationField = field === "origin" ? "charterOrigin" : "charterDestination"
      const upperValue = value.toUpperCase()
      if (validateCharterCode(upperValue, validationField)) {
        setFormData((prev) => ({ ...prev, [field]: upperValue }))
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  useEffect(() => {
    setFormData((prev) => ({ ...prev, origin: "", destination: "" }))
    setErrors((prev) => ({ ...prev, route: "", charterOrigin: "", charterDestination: "" }))
  }, [operationType])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (errors.readings || errors.route || errors.charterOrigin || errors.charterDestination) {
      alert("Por favor corrige los errores en el formulario antes de enviar.")
      return
    }

    setIsSubmitting(true)

    try {
      const telegramUser = window.Telegram?.WebApp.initDataUnsafe.user

      const formDataToSend = new FormData()

      // Add all form fields
      formDataToSend.append("date", formData.date)
      formDataToSend.append("time", formData.time)
      formDataToSend.append("receiptNumber", formData.receiptNumber)
      formDataToSend.append("aircraftRegistration", formData.aircraftRegistration)
      // Use custom supplier if "Otro" is selected
      const supplierValue = formData.supplier === "Otro" ? formData.customSupplier : formData.supplier
      formDataToSend.append("supplier", supplierValue)
      formDataToSend.append("hasMeter", hasMeter)
      formDataToSend.append("operationType", operationType.charAt(0).toUpperCase() + operationType.slice(1))

      if (hasMeter === "yes") {
        formDataToSend.append("initialReading", formData.initialReading)
        formDataToSend.append("finalReading", formData.finalReading)
      }

      formDataToSend.append("litersDispensed", formData.litersDispensed)
      formDataToSend.append("origin", formData.origin)
      formDataToSend.append("destination", formData.destination)
      formDataToSend.append("notes", formData.notes)

      if (telegramUser?.id) {
        formDataToSend.append("telegramId", telegramUser.id.toString())
      }

      // Add image file if present
      if (imageFile) {
        formDataToSend.append("receiptImage", imageFile)
      }

      const response = await fetch("/api/receipts", {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.sendData(JSON.stringify({ success: true }))
            window.Telegram.WebApp.close()
          }
          setIsSuccess(false)
          setHasMeter("yes")
          setOperationType("regular")
          setShowCustomSupplier(false)
          setImageFile(null)
          setImagePreview(null)
          setFormData({
            date: new Date().toISOString().split("T")[0],
            time: new Date().toTimeString().split(" ")[0].slice(0, 5),
            receiptNumber: "",
            aircraftRegistration: "",
            supplier: "",
            customSupplier: "",
            initialReading: "",
            finalReading: "",
            litersDispensed: "",
            origin: "",
            destination: "",
            notes: "",
          })
        }, 2000)
      } else {
        console.error("Error response:", result)
        const errorMessage = result.details || result.error || "Error desconocido"
        const errorHint = result.hint ? `\n\nSugerencia: ${result.hint}` : ""
        alert(`Error al enviar el recibo: ${errorMessage}${errorHint}`)
      }
    } catch (error) {
      console.error("Error al enviar el recibo:", error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al enviar el recibo: ${errorMsg}\n\nPor favor verifica tu conexión e intenta nuevamente.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="container max-w-2xl mx-auto p-4 pb-8 min-h-screen flex items-center justify-center">
        <Card className="border-accent/20 w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Recibo Enviado!</h2>
            <p className="text-muted-foreground mb-4">Tu registro de combustible ha sido enviado exitosamente.</p>
            <p className="text-sm text-muted-foreground">Esta ventana se cerrará automáticamente...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-8">
      <Card className="border-accent/20">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Plane className="h-6 w-6" />
            <CardTitle className="text-2xl">Registro de Combustible</CardTitle>
          </div>
          <CardDescription>Completa los datos del recibo de combustible del avión</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Número de Boleta *</Label>
              <Input
                id="receiptNumber"
                type="text"
                placeholder="Ej: 12345678"
                value={formData.receiptNumber}
                onChange={(e) => handleInputChange("receiptNumber", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraftRegistration">Matrícula del Avión *</Label>
              <Select
                value={formData.aircraftRegistration}
                onValueChange={(value) => handleInputChange("aircraftRegistration", value)}
                required
              >
                <SelectTrigger id="aircraftRegistration">
                  <SelectValue placeholder="Selecciona la matrícula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YV666T">YV666T</SelectItem>
                  <SelectItem value="YV657T">YV657T</SelectItem>
                  <SelectItem value="YV2792">YV2792</SelectItem>
                  <SelectItem value="YV630T">YV630T</SelectItem>
                  <SelectItem value="YV642T">YV642T</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Tipo de Operación *</Label>
              <RadioGroup value={operationType} onValueChange={setOperationType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="regular" id="operation-regular" />
                  <Label htmlFor="operation-regular" className="font-normal cursor-pointer">
                    Regular
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="charter" id="operation-charter" />
                  <Label htmlFor="operation-charter" className="font-normal cursor-pointer">
                    Charter
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Proveedor (Opcional)</Label>
              <RadioGroup 
                value={formData.supplier} 
                onValueChange={(value) => {
                  handleInputChange("supplier", value)
                  setShowCustomSupplier(value === "Otro")
                  if (value !== "Otro") {
                    handleInputChange("customSupplier", "")
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PDVSA" id="pdvsa" />
                  <Label htmlFor="pdvsa" className="font-normal cursor-pointer">
                    PDVSA
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Commerchamp" id="commerchamp" />
                  <Label htmlFor="commerchamp" className="font-normal cursor-pointer">
                    Commerchamp
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Otro" id="otro" />
                  <Label htmlFor="otro" className="font-normal cursor-pointer">
                    Otro
                  </Label>
                </div>
              </RadioGroup>
              {showCustomSupplier && (
                <Input
                  id="customSupplier"
                  type="text"
                  placeholder="Nombre del proveedor..."
                  value={formData.customSupplier}
                  onChange={(e) => handleInputChange("customSupplier", e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-3">
              <Label>¿Hay Contador? *</Label>
              <RadioGroup value={hasMeter} onValueChange={setHasMeter}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="meter-yes" />
                  <Label htmlFor="meter-yes" className="font-normal cursor-pointer">
                    Sí
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="meter-no" />
                  <Label htmlFor="meter-no" className="font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialReading">Lectura Inicial {hasMeter === "yes" ? "*" : ""}</Label>
                <Input
                  id="initialReading"
                  type="number"
                  placeholder="12345678"
                  value={formData.initialReading}
                  onChange={(e) => handleInputChange("initialReading", e.target.value)}
                  required={hasMeter === "yes"}
                  disabled={hasMeter === "no"}
                  className={hasMeter === "no" ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalReading">Lectura Final {hasMeter === "yes" ? "*" : ""}</Label>
                <Input
                  id="finalReading"
                  type="number"
                  placeholder="12345679"
                  value={formData.finalReading}
                  onChange={(e) => handleInputChange("finalReading", e.target.value)}
                  required={hasMeter === "yes"}
                  disabled={hasMeter === "no"}
                  className={hasMeter === "no" ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
            </div>

            {errors.readings && (
              <div className="text-sm text-red-500 -mt-4 bg-red-50 dark:bg-red-950/20 p-2 rounded-md border border-red-200 dark:border-red-900">
                {errors.readings}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="litersDispensed">Litros Despachados *</Label>
              <Input
                id="litersDispensed"
                type="number"
                step="0.01"
                placeholder={hasMeter === "yes" ? "Auto-calculado" : "Ingresa los litros"}
                value={formData.litersDispensed}
                onChange={(e) => hasMeter === "no" && handleInputChange("litersDispensed", e.target.value)}
                readOnly={hasMeter === "yes"}
                required
                className={hasMeter === "yes" ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                {hasMeter === "yes"
                  ? "Este campo se calcula automáticamente"
                  : "Ingresa manualmente los litros despachados"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origen *</Label>
                {operationType === "regular" ? (
                  <Select
                    value={formData.origin}
                    onValueChange={(value) => handleInputChange("origin", value)}
                    required
                  >
                    <SelectTrigger id="origin">
                      <SelectValue placeholder="Selecciona origen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CCS">CCS</SelectItem>
                      <SelectItem value="BNS">BNS</SelectItem>
                      <SelectItem value="MAD">MAD</SelectItem>
                      <SelectItem value="MAR">MAR</SelectItem>
                      <SelectItem value="STB">STB</SelectItem>
                      <SelectItem value="STD">STD</SelectItem>
                      <SelectItem value="SVZ">SVZ</SelectItem>
                      <SelectItem value="PMV">PMV</SelectItem>
                      <SelectItem value="PTY">PTY</SelectItem>
                      <SelectItem value="PZO">PZO</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      id="origin"
                      type="text"
                      placeholder="Ej: MIA"
                      value={formData.origin}
                      onChange={(e) => handleInputChange("origin", e.target.value)}
                      maxLength={3}
                      required
                      className="uppercase"
                    />
                    {errors.charterOrigin && <p className="text-xs text-red-500">{errors.charterOrigin}</p>}
                    <p className="text-xs text-muted-foreground">Máximo 3 letras</p>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destino *</Label>
                {operationType === "regular" ? (
                  <Select
                    value={formData.destination}
                    onValueChange={(value) => handleInputChange("destination", value)}
                    required
                  >
                    <SelectTrigger id="destination">
                      <SelectValue placeholder="Selecciona destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CCS">CCS</SelectItem>
                      <SelectItem value="BNS">BNS</SelectItem>
                      <SelectItem value="MAD">MAD</SelectItem>
                      <SelectItem value="MAR">MAR</SelectItem>
                      <SelectItem value="STB">STB</SelectItem>
                      <SelectItem value="STD">STD</SelectItem>
                      <SelectItem value="SVZ">SVZ</SelectItem>
                      <SelectItem value="PMV">PMV</SelectItem>
                      <SelectItem value="PTY">PTY</SelectItem>
                      <SelectItem value="PZO">PZO</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      id="destination"
                      type="text"
                      placeholder="Ej: BOG"
                      value={formData.destination}
                      onChange={(e) => handleInputChange("destination", e.target.value)}
                      maxLength={3}
                      required
                      className="uppercase"
                    />
                    {errors.charterDestination && <p className="text-xs text-red-500">{errors.charterDestination}</p>}
                    <p className="text-xs text-muted-foreground">Máximo 3 letras</p>
                  </>
                )}
              </div>
            </div>

            {errors.route && (
              <div className="text-sm text-red-500 -mt-4 bg-red-50 dark:bg-red-950/20 p-2 rounded-md border border-red-200 dark:border-red-900">
                {errors.route}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones adicionales..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptImage" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Foto del Recibo (Opcional)
              </Label>
              <Input
                id="receiptImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Receipt preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                isSubmitting ||
                !!errors.readings ||
                !!errors.route ||
                !!errors.charterOrigin ||
                !!errors.charterDestination
              }
            >
              {isSubmitting ? "Enviando..." : "Registrar Recibo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
