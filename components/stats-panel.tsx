import { Card } from "@/components/ui/card"
import type { Visitor } from "@/lib/types"
import { Users, UtensilsCrossed, Wine, Sun, Package } from "lucide-react"

interface StatsPanelProps {
  visitors: Visitor[]
}

export function StatsPanel({ visitors }: StatsPanelProps) {
  const activeVisitors = visitors.filter((v) => !v.isDeleted)
  const totalPeople = activeVisitors.reduce((sum, v) => sum + v.personCount, 0)

  const locationCounts = activeVisitors.reduce(
    (acc, v) => {
      acc[v.tableLocation] = (acc[v.tableLocation] || 0) + v.personCount
      return acc
    },
    {} as Record<string, number>,
  )

  const stats = [
    { label: "Σύνολο", value: totalPeople, icon: Users, color: "bg-primary text-primary-foreground" },
    { label: "Μπαρ", value: locationCounts["Μ"] || 0, icon: Wine, color: "bg-amber-500 text-white" },
    { label: "Εστ.", value: locationCounts["Ε"] || 0, icon: UtensilsCrossed, color: "bg-emerald-500 text-white" },
    { label: "Βερ.", value: locationCounts["Β"] || 0, icon: Sun, color: "bg-sky-500 text-white" },
    { label: "Πακ.", value: locationCounts["Π"] || 0, icon: Package, color: "bg-orange-500 text-white" },
  ]

  return (
    <div className="grid grid-cols-5 sm:flex gap-1 sm:gap-2 lg:landscape:gap-1 flex-wrap">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`${stat.color} px-1.5 sm:px-4 lg:landscape:px-2 py-1 sm:py-2 lg:landscape:py-1 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 lg:landscape:gap-1`}
        >
          <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 lg:landscape:h-3 lg:landscape:w-3" />
          <span className="font-semibold text-xs sm:text-base lg:landscape:text-xs">{stat.value}</span>
          <span className="text-[9px] sm:text-sm lg:landscape:text-[9px] opacity-90 hidden sm:inline">
            {stat.label}
          </span>
        </Card>
      ))}
    </div>
  )
}
