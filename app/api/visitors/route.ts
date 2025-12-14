import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOWED_EMAIL = (
	process.env.SUPABASE_ALLOWED_EMAIL ||
	process.env.ALLOWED_EMAIL ||
	''
).toLowerCase()

async function createSupabaseClient(key: string) {
	if (!SUPABASE_URL || !key) {
		throw new Error('Supabase credentials not configured')
	}

	const cookieStore = await cookies()
	return createServerClient(SUPABASE_URL, key, {
		cookies: {
			getAll() {
				return cookieStore.getAll()
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) =>
						cookieStore.set(name, value, options)
					)
				} catch {
					// Handle errors silently
				}
			},
		},
	})
}

async function requireAuthorizedUser() {
	const supabaseAuth = await createSupabaseClient(SUPABASE_ANON_KEY || '')
	const {
		data: { session },
		error,
	} = await supabaseAuth.auth.getSession()

	if (error || !session) {
		return {
			errorResponse: NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			),
		}
	}

	if (!ALLOWED_EMAIL) {
		throw new Error('Allowed email not configured')
	}

	const userEmail = session.user.email?.toLowerCase()
	if (userEmail !== ALLOWED_EMAIL) {
		return {
			errorResponse: NextResponse.json(
				{ error: 'Forbidden' },
				{ status: 403 }
			),
		}
	}

	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
	}

	return {
		supabaseAuth,
		supabaseService: createSupabaseClient(SUPABASE_SERVICE_ROLE_KEY),
	}
}

export async function POST(request: NextRequest) {
	try {
		const authResult = await requireAuthorizedUser()
		if (authResult.errorResponse) return authResult.errorResponse

		const supabase = await authResult.supabaseService
		const body = await request.json()
		const { data, error } = await supabase
			.from('visitors')
			.insert([body])
			.select()

		if (error) {
			console.error('[v0] Supabase insert error:', error)
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json(data)
	} catch (error) {
		console.error('[v0] API error:', error)
		return NextResponse.json(
			{ error: 'Failed to save visitor' },
			{ status: 500 }
		)
	}
}

export async function GET(request: NextRequest) {
	try {
		const authResult = await requireAuthorizedUser()
		if (authResult.errorResponse) return authResult.errorResponse

		const supabase = await authResult.supabaseService
		const { searchParams } = new URL(request.url)
		const date = searchParams.get('date')

		if (!date) {
			return NextResponse.json(
				{ error: 'Date parameter required' },
				{ status: 400 }
			)
		}

		const { data, error } = await supabase
			.from('visitors')
			.select('*')
			.eq('date', date)
			.order('entry_number', { ascending: true })

		if (error) {
			console.error('[v0] Supabase fetch error:', error)
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json(data)
	} catch (error) {
		console.error('[v0] API error:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch visitors' },
			{ status: 500 }
		)
	}
}

export async function PUT(request: NextRequest) {
	try {
		const authResult = await requireAuthorizedUser()
		if (authResult.errorResponse) return authResult.errorResponse

		const supabase = await authResult.supabaseService
		const body = await request.json()
		const { id, ...updateData } = body

		const { data, error } = await supabase
			.from('visitors')
			.update(updateData)
			.eq('id', id)
			.select()

		if (error) {
			console.error('[v0] Supabase update error:', error)
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json(data)
	} catch (error) {
		console.error('[v0] API error:', error)
		return NextResponse.json(
			{ error: 'Failed to update visitor' },
			{ status: 500 }
		)
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const authResult = await requireAuthorizedUser()
		if (authResult.errorResponse) return authResult.errorResponse

		const supabase = await authResult.supabaseService
		const body = await request.json()
		const { id } = body

		const { data, error } = await supabase
			.from('visitors')
			.update({ is_deleted: true })
			.eq('id', id)
			.select()

		if (error) {
			console.error('[v0] Supabase delete error:', error)
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json(data)
	} catch (error) {
		console.error('[v0] API error:', error)
		return NextResponse.json(
			{ error: 'Failed to delete visitor' },
			{ status: 500 }
		)
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const authResult = await requireAuthorizedUser()
		if (authResult.errorResponse) return authResult.errorResponse

		const supabase = await authResult.supabaseService
		const body = await request.json()
		const { id, is_deleted } = body

		const { data, error } = await supabase
			.from('visitors')
			.update({ is_deleted })
			.eq('id', id)
			.select()

		if (error) {
			console.error('[v0] Supabase restore error:', error)
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json(data)
	} catch (error) {
		console.error('[v0] API error:', error)
		return NextResponse.json(
			{ error: 'Failed to restore visitor' },
			{ status: 500 }
		)
	}
}
