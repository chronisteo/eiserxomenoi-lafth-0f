"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { el } from "date-fns/locale"

interface DateSelectorProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    onDateChange(prev)
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    onDateChange(next)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 sm:h-12 sm:w-12 bg-transparent shrink-0"
        onClick={goToPreviousDay}
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 sm:h-12 px-2 sm:px-4 min-w-0 sm:min-w-[200px] justify-start text-left font-normal bg-transparent"
          >
            <CalendarIcon className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="text-sm sm:text-base font-medium truncate">
              <span className="hidden sm:inline">{format(selectedDate, "EEEE, d MMMM yyyy", { locale: el })}</span>
              <span className="sm:hidden">{format(selectedDate, "d MMM yyyy", { locale: el })}</span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 sm:h-12 sm:w-12 bg-transparent shrink-0"
        onClick={goToNextDay}
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {!isToday && (
        <Button variant="secondary" className="h-10 sm:h-12 text-sm sm:text-base ml-1 sm:ml-2" onClick={goToToday}>
          Σήμερα
        </Button>
      )}
    </div>
  )
}
