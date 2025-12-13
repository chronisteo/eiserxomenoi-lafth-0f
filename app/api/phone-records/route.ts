import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOWED_EMAIL = (process.env.SUPABASE_ALLOWED_EMAIL || process.env.ALLOWED_EMAIL || "").toLowerCase()

function createSupabaseClient(key: string) {
  if (!SUPABASE_URL || !key) {
    throw new Error("Supabase credentials not configured")
  }

  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, key, {
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

async function requireAuthorizedUser() {
  const supabaseAuth = createSupabaseClient(SUPABASE_ANON_KEY || "")
  const {
    data: { session },
    error,
  } = await supabaseAuth.auth.getSession()

  if (error || !session) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (!ALLOWED_EMAIL) {
    throw new Error("Allowed email not configured")
  }

  const userEmail = session.user.email?.toLowerCase()
  if (userEmail !== ALLOWED_EMAIL) {
    return { errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required")
  }

  return { supabaseAuth, supabaseService: createSupabaseClient(SUPABASE_SERVICE_ROLE_KEY) }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthorizedUser()
    if (authResult.errorResponse) return authResult.errorResponse

    const supabase = authResult.supabaseService
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ error: "Phone parameter required" }, { status: 400 })
    }

    // This ensures the latest owner of the phone number is returned
    const { data, error } = await supabase
      .from("visitors")
      .select("rank, surname, first_name, phone, created_at")
      .eq("phone", phone)
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
  const authResult = await requireAuthorizedUser()
  if (authResult.errorResponse) return authResult.errorResponse

  // This endpoint is a no-op since phone records are saved with visitors
  return NextResponse.json({ success: true })
}
