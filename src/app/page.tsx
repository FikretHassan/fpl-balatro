'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { loadRun, hasSavedRun } from '@/lib/persistence'

interface RecentManager {
  id: string
  name: string
  team: string
}

const RECENT_KEY = 'fpl-balatro-recent-managers'
const MAX_RECENT = 5

function loadRecent(): RecentManager[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(managers: RecentManager[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(managers.slice(0, MAX_RECENT)))
}

function addRecent(manager: RecentManager) {
  const existing = loadRecent().filter((m) => m.id !== manager.id)
  saveRecent([manager, ...existing])
}

function removeRecent(id: string) {
  saveRecent(loadRecent().filter((m) => m.id !== id))
}

export default function Home() {
  const [managerId, setManagerId] = useState('')
  const [savedRunAvailable, setSavedRunAvailable] = useState(false)
  const [recentManagers, setRecentManagers] = useState<RecentManager[]>([])
  const { loadManager, resumeRun, isLoading, error } = useGameStore()
  const router = useRouter()

  useEffect(() => {
    setSavedRunAvailable(hasSavedRun())
    setRecentManagers(loadRecent())
  }, [])

  const startWithId = async (id: string) => {
    await loadManager(id.trim())

    const state = useGameStore.getState()
    if (state.availableGWs.length > 0) {
      // Save to recent
      addRecent({
        id: id.trim(),
        name: state.managerName || 'Unknown',
        team: state.teamName || 'Unknown',
      })
      setRecentManagers(loadRecent())
      router.push('/game')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managerId.trim()) return
    await startWithId(managerId)
  }

  const handleRemoveRecent = (id: string) => {
    removeRecent(id)
    setRecentManagers(loadRecent())
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
        <div className="w-full max-w-sm flex flex-col gap-4">
          {/* Recent managers */}
          {recentManagers.length > 0 && (
            <div>
              <p className="text-xs text-foreground/40 mb-2">Recent Managers</p>
              <div className="flex flex-col gap-1.5">
                {recentManagers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => startWithId(m.id)}
                      disabled={isLoading}
                      className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-surface border border-foreground/10 hover:border-accent/40 transition-all text-left disabled:opacity-40"
                    >
                      <span className="text-sm font-semibold text-foreground">{m.team}</span>
                      <span className="text-xs text-foreground/40">{m.name}</span>
                      <span className="text-[10px] text-foreground/20 ml-auto">#{m.id}</span>
                    </button>
                    <button
                      onClick={() => handleRemoveRecent(m.id)}
                      className="p-1.5 rounded text-foreground/20 hover:text-mult hover:bg-mult/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-foreground/10" />
                <span className="text-[10px] text-foreground/20">or enter ID</span>
                <div className="flex-1 h-px bg-foreground/10" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        </div>
      )}
    </main>
  )
}
