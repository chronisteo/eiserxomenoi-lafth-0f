import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

function getSupabaseClient(request: NextRequest) {
  const customUrl = request.headers.get("x-supabase-url")
  const customKey = request.headers.get("x-supabase-key")

  const url = customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = customKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase credentials not configured")
  }

  const cookieStore = cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Handle errors silently
        }
      },
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request)
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ error: "Phone parameter required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("visitors")
      .select("rank, surname, first_name, phone")
      .eq("phone", phone)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[v0] Supabase fetch error:", error)
      return NextResponse.json(null)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(null)
  }
}

export async function POST(request: NextRequest) {
  // This endpoint is a no-op since phone records are saved with visitors
  return NextResponse.json({ success: true })
}
