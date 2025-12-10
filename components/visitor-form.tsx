"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  RANKS,
  RANK_ABBREVIATIONS,
  TABLE_LOCATIONS,
  DEFAULT_TABLE_CONFIG,
  type Visitor,
  type PhoneRecord,
  type Rank,
  type TableLocation,
  type TableConfig,
} from "@/lib/types"
import { UserPlus, Search, X, PhoneOff } from "lucide-react"

interface VisitorFormProps {
  onSubmit: (visitor: any) => void
  onPhoneLookup: (phone: string) => Promise<PhoneRecord | undefined>
  editingVisitor: Visitor | null
  onCancelEdit: () => void
}

export function VisitorForm({ onSubmit, onPhoneLookup, editingVisitor, onCancelEdit }: VisitorFormProps) {
  const [phone, setPhone] = useState("")
  const [lastName, setLastName] = useState("")
  const [rank, setRank] = useState<Rank>("Μέλος")
  const [tableLocation, setTableLocation] = useState<TableLocation>("Ε")
  const [tableNumber, setTableNumber] = useState<number>(1)
  const [personCount, setPersonCount] = useState(2)
  const [foundRecord, setFoundRecord] = useState<PhoneRecord | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [tempTableNumber, setTempTableNumber] = useState<string>("")
  const phoneLongPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [noPhone, setNoPhone] = useState(false)

  const [tableConfig, setTableConfig] = useState<TableConfig>(DEFAULT_TABLE_CONFIG)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [configLocation, setConfigLocation] = useState<"Μ" | "Ε" | "Β">("Μ")
  const [tempMin, setTempMin] = useState<string>("")
  const [tempMax, setTempMax] = useState<string>("")
  const locationLongPressTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const savedConfig = localStorage.getItem("tableConfig")
    if (savedConfig) {
      setTableConfig(JSON.parse(savedConfig))
    }
  }, [])

  const currentLocationConfig = TABLE_LOCATIONS.find((loc) => loc.value === tableLocation)
  const needsTableNumber = currentLocationConfig?.hasTableNumber ?? false

  const getTableNumbers = (location: "Μ" | "Ε" | "Β") => {
    const config = tableConfig[location]
    const numbers: number[] = []
    for (let i = config.min; i <= config.max; i++) {
      numbers.push(i)
    }
    return numbers
  }

  useEffect(() => {
    if (editingVisitor) {
      setPhone(editingVisitor.phone)
      setLastName(editingVisitor.lastName)
      setRank(editingVisitor.rank)
      setTableLocation(editingVisitor.tableLocation)
      setTableNumber(editingVisitor.tableNumber ?? 1)
      setPersonCount(editingVisitor.personCount)
      setNoPhone(editingVisitor.phone === "Δεν υπάρχει")
    }
  }, [editingVisitor])

  const handlePhoneChange = async (value: string) => {
    if (noPhone) return
    setPhone(value)
    if (value.length >= 10) {
      setIsSearching(true)
      const record = await onPhoneLookup(value)
      setIsSearching(false)
      if (record) {
        setFoundRecord(record)
        setLastName(record.lastName)
        setRank(record.rank)
      } else {
        setFoundRecord(null)
      }
    } else {
      setFoundRecord(null)
    }
  }

  const handlePhoneTouchStart = () => {
    phoneLongPressTimer.current = setTimeout(() => {
      setNoPhone(true)
      setPhone("Δεν υπάρχει")
      setFoundRecord(null)
    }, 500)
  }

  const handlePhoneTouchEnd = () => {
    if (phoneLongPressTimer.current) {
      clearTimeout(phoneLongPressTimer.current)
    }
  }

  const clearNoPhone = () => {
    setNoPhone(false)
    setPhone("")
  }

  const handleLocationTouchStart = (loc: TableLocation) => {
    if (loc === "Π") return // Δεν έχει ρυθμίσεις το Πακέτο
    locationLongPressTimer.current = setTimeout(() => {
      setConfigLocation(loc as "Μ" | "Ε" | "Β")
      setTempMin(tableConfig[loc as "Μ" | "Ε" | "Β"].min.toString())
      setTempMax(tableConfig[loc as "Μ" | "Ε" | "Β"].max.toString())
      setShowConfigDialog(true)
    }, 600)
  }

  const handleLocationTouchEnd = () => {
    if (locationLongPressTimer.current) {
      clearTimeout(locationLongPressTimer.current)
    }
  }

  const handleLocationClick = (loc: TableLocation) => {
    setTableLocation(loc)
    if (loc !== "Π") {
      const config = tableConfig[loc as "Μ" | "Ε" | "Β"]
      if (tableNumber < config.min || tableNumber > config.max) {
        setTableNumber(config.min)
      }
    }
  }

  const handleConfigSave = () => {
    const min = Number.parseInt(tempMin, 10)
    const max = Number.parseInt(tempMax, 10)
    if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
      const newConfig = {
        ...tableConfig,
        [configLocation]: { min, max },
      }
      setTableConfig(newConfig)
      localStorage.setItem("tableConfig", JSON.stringify(newConfig))
      if (tableLocation === configLocation) {
        if (tableNumber < min) setTableNumber(min)
        if (tableNumber > max) setTableNumber(max)
      }
    }
    setShowConfigDialog(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!lastName.trim() || (!phone.trim() && !noPhone)) return

    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    if (editingVisitor) {
      onSubmit({
        ...editingVisitor,
        phone: noPhone ? "Δεν υπάρχει" : phone,
        lastName,
        rank,
        tableLocation,
        tableNumber: needsTableNumber ? tableNumber : undefined,
        personCount,
      })
    } else {
      onSubmit({
        phone: noPhone ? "Δεν υπάρχει" : phone,
        lastName,
        rank,
        tableLocation,
        tableNumber: needsTableNumber ? tableNumber : undefined,
        personCount,
        time,
      })
    }

    resetForm()
  }

  const resetForm = () => {
    setPhone("")
    setLastName("")
    setRank("Μέλος")
    setTableLocation("Ε")
    setTableNumber(tableConfig["Ε"].min)
    setPersonCount(2)
    setFoundRecord(null)
    setNoPhone(false)
  }

  const handleCancel = () => {
    resetForm()
    onCancelEdit()
  }

  const handleTableNumberClick = () => {
    if (needsTableNumber) {
      setTempTableNumber(tableNumber.toString())
      setShowTableDialog(true)
    }
  }

  const handleTableNumberConfirm = () => {
    const num = Number.parseInt(tempTableNumber, 10)
    const config = tableConfig[tableLocation as "Μ" | "Ε" | "Β"]
    if (!isNaN(num) && num >= config.min && num <= config.max) {
      setTableNumber(num)
    }
    setShowTableDialog(false)
  }

  const quickTableNumbers =
    needsTableNumber && tableLocation !== "Π" ? getTableNumbers(tableLocation as "Μ" | "Ε" | "Β") : []

  return (
    <>
      <Card className="border-2 border-border lg:landscape:h-full lg:landscape:flex lg:landscape:flex-col">
        <CardHeader className="bg-muted/50 pb-2 sm:pb-4 lg:landscape:pb-2 px-3 sm:px-6 lg:landscape:px-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg lg:landscape:text-sm">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 lg:landscape:h-4 lg:landscape:w-4" />
            {editingVisitor ? "Επεξεργασία Εγγραφής" : "Νέα Εγγραφή"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-6 lg:landscape:pt-2 px-3 sm:px-6 lg:landscape:px-3 lg:landscape:flex-1 lg:landscape:overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5 lg:landscape:space-y-2">
            {/* Phone with lookup indicator */}
            <div className="space-y-1 sm:space-y-2 lg:landscape:space-y-1">
              <Label htmlFor="phone" className="text-xs sm:text-sm lg:landscape:text-xs font-medium">
                Τηλέφωνο
              </Label>
              <div className="relative">
                {noPhone ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-center bg-muted text-muted-foreground h-9 sm:h-12 lg:landscape:h-9 rounded-md border text-sm">
                      <PhoneOff className="h-4 w-4 mr-2" />
                      <span>Δεν υπάρχει</span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={clearNoPhone}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="69xxxxxxxx"
                      className="text-sm sm:text-lg lg:landscape:text-sm h-9 sm:h-12 lg:landscape:h-9 pr-10"
                      inputMode="numeric"
                      onTouchStart={handlePhoneTouchStart}
                      onTouchEnd={handlePhoneTouchEnd}
                      onMouseDown={handlePhoneTouchStart}
                      onMouseUp={handlePhoneTouchEnd}
                      onMouseLeave={handlePhoneTouchEnd}
                    />
                    {isSearching ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : foundRecord ? (
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                    ) : null}
                  </>
                )}
              </div>
              {foundRecord && (
                <p className="text-xs text-green-600">
                  Βρέθηκε: {foundRecord.lastName} ({foundRecord.rank})
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1 sm:space-y-2 lg:landscape:space-y-1">
              <Label htmlFor="lastName" className="text-xs sm:text-sm lg:landscape:text-xs font-medium">
                Επώνυμο
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Επώνυμο"
                className="text-sm sm:text-lg lg:landscape:text-sm h-9 sm:h-12 lg:landscape:h-9"
              />
            </div>

            {/* Rank */}
            <div className="space-y-1 sm:space-y-2 lg:landscape:space-y-1">
              <Label className="text-xs sm:text-sm lg:landscape:text-xs font-medium">Βαθμός / Ιδιότητα</Label>
              <Select value={rank} onValueChange={(v) => setRank(v as Rank)}>
                <SelectTrigger className="h-9 sm:h-12 lg:landscape:h-9 text-xs sm:text-base lg:landscape:text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {RANKS.map((group) => (
                    <SelectGroup key={group.category}>
                      <SelectLabel className="text-xs text-muted-foreground font-bold bg-muted/50 py-2">
                        {group.category}
                      </SelectLabel>
                      {group.ranks.map((r) => (
                        <SelectItem key={r} value={r} className="text-sm sm:text-base py-2 sm:py-3">
                          {r} ({RANK_ABBREVIATIONS[r]})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-1 sm:space-y-2 lg:landscape:space-y-1">
              <Label className="text-xs sm:text-sm lg:landscape:text-xs font-medium">Χώρος</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 lg:landscape:gap-1">
                {TABLE_LOCATIONS.map((loc) => (
                  <Button
                    key={loc.value}
                    type="button"
                    variant={tableLocation === loc.value ? "default" : "outline"}
                    className="h-10 sm:h-14 lg:landscape:h-9 text-sm sm:text-lg lg:landscape:text-xs font-bold flex flex-col gap-0"
                    onClick={() => handleLocationClick(loc.value)}
                    onTouchStart={() => handleLocationTouchStart(loc.value)}
                    onTouchEnd={handleLocationTouchEnd}
                    onMouseDown={() => handleLocationTouchStart(loc.value)}
                    onMouseUp={handleLocationTouchEnd}
                    onMouseLeave={handleLocationTouchEnd}
                  >
                    <span>{loc.value}</span>
                    <span className="text-[8px] sm:text-[10px] lg:landscape:text-[7px] font-normal opacity-70">
                      {loc.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Table Number */}
            {needsTableNumber && (
              <div className="space-y-1 sm:space-y-2 lg:landscape:space-y-1">
                <Label className="text-xs sm:text-sm lg:landscape:text-xs font-medium">
                  Τραπέζι ({tableConfig[tableLocation as "Μ" | "Ε" | "Β"].min}-
                  {tableConfig[tableLocation as "Μ" | "Ε" | "Β"].max})
                </Label>
                <div className="flex items-center gap-2 sm:gap-3 lg:landscape:gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-10 sm:h-14 lg:landscape:h-8 w-10 sm:w-14 lg:landscape:w-8 text-lg sm:text-2xl lg:landscape:text-base bg-transparent"
                    onClick={() => {
                      const config = tableConfig[tableLocation as "Μ" | "Ε" | "Β"]
                      setTableNumber(Math.max(config.min, tableNumber - 1))
                    }}
                  >
                    -
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center justify-center h-10 sm:h-14 lg:landscape:h-8 px-3 sm:px-6 lg:landscape:px-2 min-w-[70px] sm:min-w-[100px] lg:landscape:min-w-[60px]"
                    onClick={handleTableNumberClick}
                  >
                    <span className="text-lg sm:text-2xl lg:landscape:text-sm font-bold">
                      {tableLocation}-{tableNumber}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-10 sm:h-14 lg:landscape:h-8 w-10 sm:w-14 lg:landscape:w-8 text-lg sm:text-2xl lg:landscape:text-base bg-transparent"
                    onClick={() => {
                      const config = tableConfig[tableLocation as "Μ" | "Ε" | "Β"]
                      setTableNumber(Math.min(config.max, tableNumber + 1))
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {/* Person Count */}
            <div className="space-y-1 sm:space-y-2 lg:landscape:space-y-1">
              <Label className="text-xs sm:text-sm lg:landscape:text-xs font-medium">Αριθμός Ατόμων</Label>
              <div className="flex items-center gap-2 sm:gap-3 lg:landscape:gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-10 sm:h-14 lg:landscape:h-8 w-10 sm:w-14 lg:landscape:w-8 text-lg sm:text-2xl lg:landscape:text-base bg-transparent"
                  onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                >
                  -
                </Button>
                <span className="text-xl sm:text-3xl lg:landscape:text-lg font-bold w-12 sm:w-16 lg:landscape:w-10 text-center">
                  {personCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-10 sm:h-14 lg:landscape:h-8 w-10 sm:w-14 lg:landscape:w-8 text-lg sm:text-2xl lg:landscape:text-base bg-transparent"
                  onClick={() => setPersonCount(personCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-2 sm:gap-3 lg:landscape:gap-1 pt-2 sm:pt-4 lg:landscape:pt-1">
              {editingVisitor && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 sm:h-14 lg:landscape:h-9 text-xs sm:text-lg lg:landscape:text-xs bg-transparent"
                  onClick={handleCancel}
                >
                  <X className="mr-1 sm:mr-2 h-4 w-4 lg:landscape:h-3 lg:landscape:w-3" />
                  Ακύρωση
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 h-10 sm:h-14 lg:landscape:h-9 text-xs sm:text-lg lg:landscape:text-xs font-semibold"
              >
                <UserPlus className="mr-1 sm:mr-2 h-4 w-4 lg:landscape:h-3 lg:landscape:w-3" />
                {editingVisitor ? "Ενημέρωση" : "Καταχώρηση"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Dialog επιλογής τραπεζιού */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Επιλογή Τραπεζιού ({tableLocation})</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              value={tempTableNumber}
              onChange={(e) => setTempTableNumber(e.target.value)}
              placeholder="Αριθμός τραπεζιού"
              className="text-xl h-14 text-center mb-4"
              inputMode="numeric"
              autoFocus
            />
            <p className="text-sm text-muted-foreground mb-3">Ή επιλέξτε γρήγορα:</p>
            <div className="grid grid-cols-5 gap-2 max-h-[250px] overflow-y-auto">
              {quickTableNumbers.map((num) => (
                <Button
                  key={num}
                  type="button"
                  variant={tableNumber === num ? "default" : "outline"}
                  className="h-12 text-lg font-bold"
                  onClick={() => {
                    setTableNumber(num)
                    setShowTableDialog(false)
                  }}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableDialog(false)}>
              Ακύρωση
            </Button>
            <Button onClick={handleTableNumberConfirm}>Επιβεβαίωση</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ρυθμίσεις {configLocation === "Μ" ? "Μπαρ" : configLocation === "Ε" ? "Εστιατόριο" : "Βεράντα"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Ελάχιστος αριθμός τραπεζιού</Label>
              <Input
                type="number"
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
                className="text-lg h-12 text-center"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label>Μέγιστος αριθμός τραπεζιού</Label>
              <Input
                type="number"
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
                className="text-lg h-12 text-center"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Ακύρωση
            </Button>
            <Button onClick={handleConfigSave}>Αποθήκευση</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
