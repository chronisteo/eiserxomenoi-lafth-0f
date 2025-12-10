"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Visitor, Rank } from "@/lib/types"
import { RANK_ABBREVIATIONS } from "@/lib/types"
import { List, Pencil, Trash2, Undo2 } from "lucide-react"

interface VisitorTableProps {
  visitors: Visitor[]
  onEdit: (visitor: Visitor) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onScrollToForm?: () => void
}

export function VisitorTable({ visitors, onEdit, onDelete, onRestore, onScrollToForm }: VisitorTableProps) {
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const isScrolling = useRef(false)

  const handleTouchStart = (visitor: Visitor, e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e) {
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else {
      touchStartPos.current = { x: e.clientX, y: e.clientY }
    }
    isScrolling.current = false

    longPressTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        setShowActions(visitor.id)
        setSelectedVisitor(visitor)
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartPos.current) return

    let currentX: number, currentY: number
    if ("touches" in e) {
      currentX = e.touches[0].clientX
      currentY = e.touches[0].clientY
    } else {
      currentX = e.clientX
      currentY = e.clientY
    }

    const deltaX = Math.abs(currentX - touchStartPos.current.x)
    const deltaY = Math.abs(currentY - touchStartPos.current.y)

    if (deltaX > 10 || deltaY > 10) {
      isScrolling.current = true
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    touchStartPos.current = null
    isScrolling.current = false
  }

  const handleEdit = () => {
    if (selectedVisitor) {
      onEdit(selectedVisitor)
      setShowActions(null)
      if (onScrollToForm) {
        setTimeout(() => {
          onScrollToForm()
        }, 100)
      }
    }
  }

  const handleDelete = () => {
    if (selectedVisitor) {
      onDelete(selectedVisitor.id)
      setShowActions(null)
      setSelectedVisitor(null)
    }
  }

  const handleRestore = () => {
    if (selectedVisitor) {
      onRestore(selectedVisitor.id)
      setShowActions(null)
      setSelectedVisitor(null)
    }
  }

  const getRankAbbreviation = (rank: string): string => {
    return RANK_ABBREVIATIONS[rank as Rank] || rank.substring(0, 3).toUpperCase()
  }

  const activeVisitors = visitors.filter((v) => !v.isDeleted)
  const totalCount = visitors.length

  return (
    <>
      <Card className="border-2 border-border flex flex-col h-full max-h-[600px]">
        <CardHeader className="bg-muted/50 pb-3 sm:pb-4 px-3 sm:px-6 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <List className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Καταγραφές Εισερχομένων</span>
            <span className="sm:hidden">Εισερχόμενοι</span>
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">
              ({activeVisitors.length}/{totalCount})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {visitors.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-muted-foreground">
              <p className="text-base sm:text-lg">Δεν υπάρχουν καταγραφές</p>
              <p className="text-xs sm:text-sm mt-1">Προσθέστε τον πρώτο επισκέπτη</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto h-full">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-muted/30 border-b sticky top-0 z-10">
                  <tr>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold">Α/Α</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold">Βαθμός</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold">Επώνυμο</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold hidden sm:table-cell">Τηλέφωνο</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-center font-semibold">Τρ.</th>
                    <th className="py-2 sm:py-3 px-1 sm:px-2 text-center font-semibold">Ατ.</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-3 text-left font-semibold">Ώρα</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((visitor, index) => (
                    <tr
                      key={visitor.id}
                      className={`border-b last:border-b-0 transition-colors select-none ${
                        visitor.isDeleted
                          ? "opacity-40 bg-muted/20"
                          : showActions === visitor.id
                            ? "bg-primary/10"
                            : index % 2 === 0
                              ? "bg-background"
                              : "bg-muted/20"
                      }`}
                      onTouchStart={(e) => handleTouchStart(visitor, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={(e) => handleTouchStart(visitor, e)}
                      onMouseMove={handleTouchMove}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={handleTouchEnd}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-3 font-mono font-bold">{visitor.sequenceNumber}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3">
                        <span className="inline-block bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
                          {getRankAbbreviation(visitor.rank)}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 font-medium max-w-[80px] sm:max-w-none truncate">
                        {visitor.lastName}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 font-mono hidden sm:table-cell">{visitor.phone}</td>
                      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center">
                        <span className="inline-block bg-accent text-accent-foreground px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold text-xs sm:text-sm">
                          {visitor.tableNumber
                            ? `${visitor.tableLocation}-${visitor.tableNumber}`
                            : visitor.tableLocation}
                        </span>
                      </td>
                      <td className="py-2 sm:py-3 px-1 sm:px-2 text-center font-bold">{visitor.personCount}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-3 font-mono">{visitor.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showActions && selectedVisitor && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowActions(null)}
        >
          <div
            className="bg-card rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{selectedVisitor.lastName}</h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm">Α/Α: {selectedVisitor.sequenceNumber}</p>

            {selectedVisitor.isDeleted ? (
              <div className="flex gap-2 sm:gap-3">
                <Button variant="default" className="flex-1 h-12 sm:h-14 text-sm sm:text-base" onClick={handleRestore}>
                  <Undo2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Αναίρεση
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 sm:h-14 text-sm sm:text-base bg-transparent"
                  onClick={handleEdit}
                >
                  <Pencil className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Επεξεργασία
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-12 sm:h-14 text-sm sm:text-base"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Αποχώρηση
                </Button>
              </div>
            )}

            <Button variant="ghost" className="w-full mt-2 sm:mt-3 text-sm" onClick={() => setShowActions(null)}>
              Κλείσιμο
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
