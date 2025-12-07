"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface SetupModalProps {
  onSetup: (url: string, anonKey: string) => void
}

export function SetupModal({ onSetup }: SetupModalProps) {
  const [projectId, setProjectId] = useState<string>("")
  const [anonKey, setAnonKey] = useState<string>("")
  const [error, setError] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!projectId || !anonKey) {
      setError("Παρακαλώ συμπληρώστε και τα δύο πεδία")
      return
    }

    const url = `https://${projectId}.supabase.co`

    onSetup(url, anonKey)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-2">Ρύθμιση Σύνδεσης</h2>
          <p className="text-sm text-muted-foreground">Εισάγετε το API Token και το Project ID από τη Supabase</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Project ID</label>
            <Input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="π.χ. zomxsxxlbomfrcyafcln"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Βρείτε το στο Settings → API (στο URL πριν από .supabase.co)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Token (Anon Key)</label>
            <Textarea
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGc..."
              className="text-sm font-mono"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">Βρείτε το στο Settings → API (public anon key)</p>
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">{error}</div>}

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Βήματα:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Πηγαίνετε στο supabase.com</li>
              <li>Ανοίξτε το project σας</li>
              <li>Πηγαίνετε στο Settings → API</li>
              <li>Αντιγράψτε το Project ID (από το URL ή αντιγραφή)</li>
              <li>Αντιγράψτε το Anon Public Key</li>
            </ol>
          </div>

          <Button type="submit" className="w-full">
            Σύνδεση
          </Button>
        </form>
      </div>
    </div>
  )
}
