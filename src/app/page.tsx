'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { loadRun, hasSavedRun } from '@/lib/persistence'

export default function Home() {
  const [managerId, setManagerId] = useState('')
  const [savedRunAvailable, setSavedRunAvailable] = useState(false)
  const { loadManager, resumeRun, isLoading, error } = useGameStore()
  const router = useRouter()

  useEffect(() => {
    setSavedRunAvailable(hasSavedRun())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managerId.trim()) return

    await loadManager(managerId.trim())

    const state = useGameStore.getState()
    if (state.availableGWs.length > 0) {
      router.push('/game')
    }
  }

  const handleResume = () => {
    const saved = loadRun()
    if (saved) {
      resumeRun(saved)
      router.push('/game')
    }
  }

  const [showNewRun, setShowNewRun] = useState(false)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-2 tracking-tight">
          <span className="text-accent">FPL</span> Balatro
        </h1>
        <p className="text-foreground/60 text-lg">
          Your squad. Your cards. Your run.
        </p>
      </div>

      {savedRunAvailable && !showNewRun ? (
        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={handleResume}
            className="w-full py-3 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-all"
          >
            Resume Run
          </button>
          <button
            onClick={() => setShowNewRun(true)}
            className="w-full py-3 rounded-lg bg-foreground/10 text-foreground/70 font-semibold hover:bg-foreground/15 transition-all"
          >
            New Run
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="managerId"
              className="block text-sm text-foreground/50 mb-2"
            >
              FPL Manager ID
            </label>
            <input
              id="managerId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              placeholder="e.g. 123456"
              className="w-full px-4 py-3 rounded-lg bg-surface border border-foreground/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-mult text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !managerId.trim()}
            className="w-full py-3 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Loading squad...' : 'Start Run'}
          </button>

          <p className="text-foreground/30 text-xs text-center">
            Find your ID on the FPL website under &quot;My Team&quot; in the URL
          </p>

          {savedRunAvailable && (
            <button
              type="button"
              onClick={() => setShowNewRun(false)}
              className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
            >
              ← Back
            </button>
          )}
        </form>
      )}
    </main>
  )
}
