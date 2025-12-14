import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOWED_EMAIL = (
	process.env.SUPABASE_ALLOWED_EMAIL ||
	process.env.ALLOWED_EMAIL ||
	''
).toLowerCase()

async function createCookieClient(supabaseKey: string) {
	if (!SUPABASE_URL || !supabaseKey) {
		throw new Error('Supabase credentials not configured')
	}

	const cookieStore = await cookies()

	return createServerClient(SUPABASE_URL, supabaseKey, {
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
					// Ignore errors when setting cookies in a server component
				}
			},
		},
	})
}

export default async function ProtectedLayout({
	children,
}: {
	children: ReactNode
}) {
	const supabaseAuthClient = await createCookieClient(SUPABASE_ANON_KEY || '')
	const {
		data: { session },
	} = await supabaseAuthClient.auth.getSession()

	if (!session) {
		redirect('/login')
	}

	const userEmail = session.user.email?.toLowerCase()
	if (!ALLOWED_EMAIL) {
		throw new Error(
			'Allowed email is not configured. Set SUPABASE_ALLOWED_EMAIL or ALLOWED_EMAIL.'
		)
	}

	if (userEmail !== ALLOWED_EMAIL) {
		try {
			await supabaseAuthClient.auth.signOut()
		} catch {
			// Ignore sign out failures
		}
		redirect('/login?error=unauthorized')
	}

	// Ensure service role key exists for API usage
	if (!SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error(
			'SUPABASE_SERVICE_ROLE_KEY is required for data operations'
		)
	}

	return <>{children}</>
}
