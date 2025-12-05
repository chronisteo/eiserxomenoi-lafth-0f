import type { Visitor, PhoneRecord } from "./types"

const DB_NAME = "lafth_visitors_db"
const DB_VERSION = 1
const VISITORS_STORE = "visitors"
const PHONE_RECORDS_STORE = "phone_records"

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Visitors store με index στο date
      if (!db.objectStoreNames.contains(VISITORS_STORE)) {
        const visitorsStore = db.createObjectStore(VISITORS_STORE, { keyPath: "id" })
        visitorsStore.createIndex("date", "date", { unique: false })
        visitorsStore.createIndex("phone", "phone", { unique: false })
      }

      // Phone records store
      if (!db.objectStoreNames.contains(PHONE_RECORDS_STORE)) {
        const phoneStore = db.createObjectStore(PHONE_RECORDS_STORE, { keyPath: "phone" })
        phoneStore.createIndex("surname", "surname", { unique: false })
      }
    }
  })
}

function getSupabaseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  if (typeof window !== "undefined") {
    const url = localStorage.getItem("supabase_url")
    const key = localStorage.getItem("supabase_anon_key")
    if (url) headers["x-supabase-url"] = url
    if (key) headers["x-supabase-key"] = key
  }
  return headers
}

// Visitors
export async function getAllVisitors(): Promise<Record<string, Visitor[]>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VISITORS_STORE, "readonly")
    const store = transaction.objectStore(VISITORS_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      const visitors = request.result as Visitor[]
      const grouped: Record<string, Visitor[]> = {}
      visitors.forEach((v) => {
        if (!grouped[v.date]) grouped[v.date] = []
        grouped[v.date].push(v)
      })
      resolve(grouped)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function getVisitorsByDate(dateKey: string): Promise<Visitor[]> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch(`/api/visitors?date=${dateKey}`, {
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
    })
    if (response.ok) {
      const data = await response.json()
      const visitors = (data || []).map((v: any) => ({
        id: v.id,
        sequenceNumber: v.entry_number,
        date: v.date,
        phone: v.phone,
        lastName: v.surname,
        rank: v.rank,
        tableLocation: v.location,
        tableNumber: v.table_number,
        personCount: v.person_count,
        time: v.arrival_time,
        isDeleted: v.is_deleted || false,
      }))

      // Save to local IndexedDB for offline support
      const db = await openDB()
      for (const visitor of visitors) {
        await new Promise<void>((resolve) => {
          const transaction = db.transaction(VISITORS_STORE, "readwrite")
          const store = transaction.objectStore(VISITORS_STORE)
          store.put(visitor)
          transaction.oncomplete = () => resolve()
        })
      }

      return visitors.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    }
  } catch (error) {
    console.error("[v0] Error fetching from Supabase:", error)
  }

  // Fallback to IndexedDB if API fails
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VISITORS_STORE, "readonly")
    const store = transaction.objectStore(VISITORS_STORE)
    const index = store.index("date")
    const request = index.getAll(dateKey)

    request.onsuccess = () => {
      const visitors = (request.result as Visitor[]).sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      resolve(visitors)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function saveVisitor(visitor: Visitor): Promise<void> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch("/api/visitors", {
      method: "POST",
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: visitor.id,
        entry_number: visitor.sequenceNumber,
        date: visitor.date,
        phone: visitor.phone,
        surname: visitor.lastName,
        rank: visitor.rank,
        location: visitor.tableLocation,
        table_number: visitor.tableNumber,
        person_count: visitor.personCount,
        arrival_time: visitor.time,
        is_deleted: visitor.isDeleted || false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Supabase save error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`Failed to save to Supabase: ${response.statusText}`)
    }
    console.log("[v0] Visitor saved to Supabase")
  } catch (error) {
    console.error("[v0] Error saving to Supabase:", error)
  }

  // Always save to local IndexedDB
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VISITORS_STORE, "readwrite")
    const store = transaction.objectStore(VISITORS_STORE)
    const request = store.put(visitor)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function updateVisitor(visitor: Visitor): Promise<void> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch("/api/visitors", {
      method: "PUT",
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: visitor.id,
        entry_number: visitor.sequenceNumber,
        date: visitor.date,
        phone: visitor.phone,
        surname: visitor.lastName,
        rank: visitor.rank,
        location: visitor.tableLocation,
        table_number: visitor.tableNumber,
        person_count: visitor.personCount,
        arrival_time: visitor.time,
        is_deleted: visitor.isDeleted || false,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update in Supabase")
    }
    console.log("[v0] Visitor updated in Supabase")
  } catch (error) {
    console.error("[v0] Error updating in Supabase:", error)
  }

  // Always update local IndexedDB
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VISITORS_STORE, "readwrite")
    const store = transaction.objectStore(VISITORS_STORE)
    const request = store.put(visitor)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteVisitor(id: string, dateKey: string): Promise<void> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch("/api/visitors", {
      method: "DELETE",
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete in Supabase")
    }
    console.log("[v0] Visitor deleted in Supabase")
  } catch (error) {
    console.error("[v0] Error deleting in Supabase:", error)
  }

  // Always delete locally
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VISITORS_STORE, "readwrite")
    const store = transaction.objectStore(VISITORS_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const visitor = getRequest.result as Visitor
      if (visitor) {
        visitor.isDeleted = true
        const putRequest = store.put(visitor)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

export async function restoreVisitor(id: string, dateKey: string): Promise<void> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch("/api/visitors", {
      method: "PATCH",
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, is_deleted: false }),
    })

    if (!response.ok) {
      throw new Error("Failed to restore in Supabase")
    }
    console.log("[v0] Visitor restored in Supabase")
  } catch (error) {
    console.error("[v0] Error restoring in Supabase:", error)
  }

  // Always restore locally
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VISITORS_STORE, "readwrite")
    const store = transaction.objectStore(VISITORS_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const visitor = getRequest.result as Visitor
      if (visitor) {
        visitor.isDeleted = false
        const putRequest = store.put(visitor)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

export async function getNextSequenceNumber(dateKey: string): Promise<number> {
  const visitors = await getVisitorsByDate(dateKey)
  if (visitors.length === 0) return 1
  return Math.max(...visitors.map((v) => v.sequenceNumber)) + 1
}

// Phone Records
export async function getPhoneRecords(): Promise<PhoneRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHONE_RECORDS_STORE, "readonly")
    const store = transaction.objectStore(PHONE_RECORDS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result as PhoneRecord[])
    request.onerror = () => reject(request.error)
  })
}

export async function savePhoneRecord(record: PhoneRecord): Promise<void> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch("/api/phone-records", {
      method: "POST",
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: record.phone,
        last_name: record.lastName,
        rank: record.rank,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to save phone record to Supabase")
    }
    console.log("[v0] Phone record saved to Supabase")
  } catch (error) {
    console.error("[v0] Error saving phone record to Supabase:", error)
  }

  // Always save locally
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHONE_RECORDS_STORE, "readwrite")
    const store = transaction.objectStore(PHONE_RECORDS_STORE)
    const request = store.put(record)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function findPhoneRecord(phone: string): Promise<PhoneRecord | null> {
  try {
    const supabaseHeaders = getSupabaseHeaders()
    const response = await fetch(`/api/phone-records?phone=${phone}`, {
      headers: {
        ...supabaseHeaders,
        "Content-Type": "application/json",
      },
    })
    if (response.ok) {
      const data = await response.json()
      if (data) {
        const record: PhoneRecord = {
          phone: data.phone,
          lastName: data.last_name,
          rank: data.rank,
        }
        return record
      }
    }
  } catch (error) {
    console.error("[v0] Error searching phone record in Supabase:", error)
  }

  // Fallback to IndexedDB
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PHONE_RECORDS_STORE, "readonly")
    const store = transaction.objectStore(PHONE_RECORDS_STORE)
    const request = store.get(phone)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

// Μετανάστευση από localStorage σε IndexedDB (για υπάρχοντα δεδομένα)
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return

  const VISITORS_KEY = "lafth_visitors"
  const PHONE_RECORDS_KEY = "lafth_phone_records"
  const MIGRATION_KEY = "lafth_migrated_to_indexeddb"

  // Έλεγχος αν έχει ήδη γίνει migration
  if (localStorage.getItem(MIGRATION_KEY)) return

  try {
    // Migration visitors
    const visitorsData = localStorage.getItem(VISITORS_KEY)
    if (visitorsData) {
      const allVisitors: Record<string, Visitor[]> = JSON.parse(visitorsData)
      for (const dateKey in allVisitors) {
        for (const visitor of allVisitors[dateKey]) {
          await saveVisitor(visitor)
        }
      }
    }

    // Migration phone records
    const phoneData = localStorage.getItem(PHONE_RECORDS_KEY)
    if (phoneData) {
      const records: PhoneRecord[] = JSON.parse(phoneData)
      for (const record of records) {
        await savePhoneRecord(record)
      }
    }

    // Σημείωση ότι έγινε migration
    localStorage.setItem(MIGRATION_KEY, "true")
  } catch (error) {
    console.error("Migration error:", error)
  }
}
