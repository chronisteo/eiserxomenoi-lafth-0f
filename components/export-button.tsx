"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Visitor } from "@/lib/types"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { format } from "date-fns"
import { el } from "date-fns/locale"

interface ExportButtonProps {
  visitors: Visitor[]
  date: Date
}

export function ExportButton({ visitors, date }: ExportButtonProps) {
  const dateStr = format(date, "yyyy-MM-dd")
  const dateLabel = format(date, "d MMMM yyyy", { locale: el })

  const exportToCSV = () => {
    const headers = ["Α/Α", "Βαθμός", "Επώνυμο", "Τηλέφωνο", "Χώρος", "Τραπέζι", "Άτομα", "Ώρα", "Κατάσταση"]
    const rows = visitors.map((v) => [
      v.sequenceNumber,
      v.rank,
      v.lastName,
      v.phone,
      v.tableLocation,
      v.tableNumber ? `${v.tableLocation}-${v.tableNumber}` : v.tableLocation,
      v.personCount,
      v.time,
      v.isDeleted ? "Ακυρωμένη" : "Ενεργή",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ΛΑΦΘ_Επισκέπτες_${dateStr}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToTXT = () => {
    const activeVisitors = visitors.filter((v) => !v.isDeleted)
    const totalPeople = activeVisitors.reduce((sum, v) => sum + v.personCount, 0)

    let content = `ΛΑΦΘ - Βιβλίο Επισκεπτών\n`
    content += `Ημερομηνία: ${dateLabel}\n`
    content += `${"=".repeat(60)}\n\n`

    visitors.forEach((v) => {
      const status = v.isDeleted ? " [ΑΚΥΡΩΜΕΝΗ]" : ""
      const table = v.tableNumber ? `${v.tableLocation}-${v.tableNumber}` : v.tableLocation
      content += `${v.sequenceNumber}. ${v.rank} ${v.lastName}${status}\n`
      content += `   Τηλ: ${v.phone} | Τραπέζι: ${table} | Άτομα: ${v.personCount} | Ώρα: ${v.time}\n\n`
    })

    content += `${"=".repeat(60)}\n`
    content += `Σύνολο εγγραφών: ${visitors.length} (${activeVisitors.length} ενεργές)\n`
    content += `Σύνολο ατόμων: ${totalPeople}\n`

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ΛΑΦΘ_Επισκέπτες_${dateStr}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-9 sm:h-11 text-sm sm:text-base">
          <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Εξαγωγή</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Εξαγωγή CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToTXT} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" />
          Εξαγωγή TXT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
