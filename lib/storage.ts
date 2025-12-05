import type { Visitor, PhoneRecord } from "./types"

const VISITORS_KEY = "lafth_visitors"
const PHONE_RECORDS_KEY = "lafth_phone_records"

// Visitors
export function getAllVisitors(): Record<string, Visitor[]> {
  if (typeof window === "undefined") return {}
  const data = localStorage.getItem(VISITORS_KEY)
  return data ? JSON.parse(data) : {}
}

export function getVisitorsByDate(dateKey: string): Visitor[] {
  const all = getAllVisitors()
  return (all[dateKey] || []).sort((a, b) => a.sequenceNumber - b.sequenceNumber)
}

export function saveVisitor(visitor: Visitor): void {
  const all = getAllVisitors()
  if (!all[visitor.date]) {
    all[visitor.date] = []
  }
  all[visitor.date].push(visitor)
  localStorage.setItem(VISITORS_KEY, JSON.stringify(all))
}

export function updateVisitor(visitor: Visitor): void {
  const all = getAllVisitors()
  if (all[visitor.date]) {
    const index = all[visitor.date].findIndex((v) => v.id === visitor.id)
    if (index !== -1) {
      all[visitor.date][index] = visitor
      localStorage.setItem(VISITORS_KEY, JSON.stringify(all))
    }
  }
}

export function deleteVisitor(id: string, dateKey: string): void {
  const all = getAllVisitors()
  if (all[dateKey]) {
    const index = all[dateKey].findIndex((v) => v.id === id)
    if (index !== -1) {
      all[dateKey][index].isDeleted = true
      localStorage.setItem(VISITORS_KEY, JSON.stringify(all))
    }
  }
}

export function getNextSequenceNumber(dateKey: string): number {
  const visitors = getVisitorsByDate(dateKey)
  if (visitors.length === 0) return 1
  return Math.max(...visitors.map((v) => v.sequenceNumber)) + 1
}

// Phone Records
export function getPhoneRecords(): PhoneRecord[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(PHONE_RECORDS_KEY)
  return data ? JSON.parse(data) : []
}

export function savePhoneRecord(record: PhoneRecord): void {
  const records = getPhoneRecords()
  const existingIndex = records.findIndex((r) => r.phone === record.phone)
  if (existingIndex !== -1) {
    records[existingIndex] = record
  } else {
    records.push(record)
  }
  localStorage.setItem(PHONE_RECORDS_KEY, JSON.stringify(records))
}
