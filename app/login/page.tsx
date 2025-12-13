"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const paramError = searchParams.get("error")
    if (paramError === "unauthorized") {
      setError("Δεν έχετε δικαίωμα πρόσβασης με αυτόν τον λογαριασμό.")
    }
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabase()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      router.replace("/")
    } catch (err) {
      console.error("[auth] Sign in error", err)
      setError("Αποτυχία σύνδεσης. Παρακαλώ δοκιμάστε ξανά.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border rounded-lg shadow-lg p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Σύνδεση</h1>
          <p className="text-sm text-muted-foreground">Εισάγετε τα διαπιστευτήριά σας για πρόσβαση.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="authorized@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Κωδικός</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Σύνδεση..." : "Σύνδεση"}
          </Button>
        </form>
      </div>
    </div>
  )
}
