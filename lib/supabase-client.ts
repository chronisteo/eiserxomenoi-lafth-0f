import { createBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function initSupabase(url: string, anonKey: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("supabase_url", url)
    localStorage.setItem("supabase_anon_key", anonKey)
  }

  supabaseInstance = createBrowserClient(url, anonKey)
  return supabaseInstance
}

export function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (typeof window !== "undefined") {
    const url = localStorage.getItem("supabase_url")
    const anonKey = localStorage.getItem("supabase_anon_key")

    if (url && anonKey) {
      supabaseInstance = createBrowserClient(url, anonKey)
      return supabaseInstance
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    supabaseInstance = createBrowserClient(envUrl, envKey)
    return supabaseInstance
  }

  throw new Error("Supabase δεν έχει διαμορφωθεί. Παρακαλώ ρυθμίστε τα διαπιστευτήρια.")
}

// Export for backward compatibility
export const supabase = getSupabase()
