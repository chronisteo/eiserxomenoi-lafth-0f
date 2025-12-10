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
    { label: "Εστιατόριο", value: locationCounts["Ε"] || 0, icon: UtensilsCrossed, color: "bg-emerald-500 text-white" },
    { label: "Βεράντα", value: locationCounts["Β"] || 0, icon: Sun, color: "bg-sky-500 text-white" },
    { label: "Πακέτο", value: locationCounts["Π"] || 0, icon: Package, color: "bg-orange-500 text-white" },
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {stats.map((stat) => (
        <Card key={stat.label} className={`${stat.color} px-4 py-2 flex items-center gap-2`}>
          <stat.icon className="h-4 w-4" />
          <span className="font-semibold">{stat.value}</span>
          <span className="text-sm opacity-90">{stat.label}</span>
        </Card>
      ))}
    </div>
  )
}
