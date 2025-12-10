"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { VisitorForm } from "@/components/visitor-form"
import { VisitorTable } from "@/components/visitor-table"
import { DateSelector } from "@/components/date-selector"
import { ExportButton } from "@/components/export-button"
import { StatsPanel } from "@/components/stats-panel"
import { SetupModal } from "@/components/setup-modal"
import type { Visitor, PhoneRecord } from "@/lib/types"
import {
  getVisitorsByDate,
  saveVisitor,
  updateVisitor,
  deleteVisitor,
  restoreVisitor,
  getPhoneRecords,
  savePhoneRecord,
  getNextSequenceNumber,
  migrateFromLocalStorage,
  findPhoneRecord,
} from "@/lib/db"
import { initSupabase, getSupabase } from "@/lib/supabase-client"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [phoneRecords, setPhoneRecords] = useState<PhoneRecord[]>([])
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    const dateKey = getLocalDateString(selectedDate)
    const [visitorsData, phoneData] = await Promise.all([getVisitorsByDate(dateKey), getPhoneRecords()])
    setVisitors(visitorsData)
    setPhoneRecords(phoneData)
    setIsLoading(false)
  }, [selectedDate])

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = getSupabase()
        await migrateFromLocalStorage()
        await loadData()
      } catch (error) {
        console.log("[v0] Supabase not configured, showing setup modal")
        setShowSetup(true)
      }
    }
    init()
  }, [loadData])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleAddVisitor = async (visitor: Omit<Visitor, "id" | "sequenceNumber" | "date">) => {
    const dateKey = getLocalDateString(selectedDate)
    const sequenceNumber = await getNextSequenceNumber(dateKey)

    const newVisitor: Visitor = {
      ...visitor,
      id: crypto.randomUUID(),
      sequenceNumber,
      date: dateKey,
    }

    await saveVisitor(newVisitor)

    if (visitor.phone && visitor.phone !== "Δεν υπάρχει") {
      const phoneRecord: PhoneRecord = {
        phone: visitor.phone,
        lastName: visitor.lastName,
        rank: visitor.rank,
      }
      await savePhoneRecord(phoneRecord)
    }

    await loadData()
  }

  const handleUpdateVisitor = async (visitor: Visitor) => {
    await updateVisitor(visitor)
    setEditingVisitor(null)
    await loadData()
  }

  const handleDeleteVisitor = async (id: string) => {
    await deleteVisitor(id, getLocalDateString(selectedDate))
    await loadData()
  }

  const handleRestoreVisitor = async (id: string) => {
    await restoreVisitor(id, getLocalDateString(selectedDate))
    await loadData()
  }

  const handlePhoneLookup = async (phone: string): Promise<PhoneRecord | undefined> => {
    const record = await findPhoneRecord(phone)
    return record || undefined
  }

  const handleSetupSubmit = (url: string, anonKey: string) => {
    try {
      initSupabase(url, anonKey)
      setShowSetup(false)
      window.location.reload()
    } catch (error) {
      console.error("[v0] Setup error:", error)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "instant", block: "start" })
    }
  }

  if (showSetup) {
    return <SetupModal onSetup={handleSetupSubmit} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Φόρτωση δεδομένων...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-3 px-3 sm:py-4 sm:px-6 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">ΛΑΦΘ - Βιβλίο Επισκεπτών</h1>
            <p className="text-primary-foreground/80 text-xs sm:text-sm">Λέσχη Αξιωματικών Φρουράς Θεσσαλονίκης</p>
          </div>
          <ExportButton visitors={visitors} date={selectedDate} />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <StatsPanel visitors={visitors} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Φόρμα */}
          <div className="md:col-span-1" ref={formRef}>
            <VisitorForm
              onSubmit={editingVisitor ? handleUpdateVisitor : handleAddVisitor}
              onPhoneLookup={handlePhoneLookup}
              editingVisitor={editingVisitor}
              onCancelEdit={() => setEditingVisitor(null)}
            />
          </div>

          {/* Πίνακας */}
          <div className="md:col-span-1 xl:col-span-2">
            <VisitorTable
              visitors={visitors}
              onEdit={setEditingVisitor}
              onDelete={handleDeleteVisitor}
              onRestore={handleRestoreVisitor}
              onScrollToForm={scrollToForm}
            />
          </div>
        </div>
      </main>

      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg"
          size="icon"
        >
          <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}
    </div>
  )
}
