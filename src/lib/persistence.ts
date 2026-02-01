const STORAGE_KEY = 'fpl-balatro-run'

// Fields to persist (excludes functions, bootstrap cache, loading state)
const PERSIST_FIELDS = [
  'managerId', 'managerName', 'teamName', 'squad', 'gameweek',
  'availableGWs', 'leagueId', 'leagueName', 'leagueOpponents', 'usesLeagueMode',
  'assignedBossOpponents', 'currentBossOpponent', 'currentBossEffect',
  'phase', 'currentAnte', 'currentBlind', 'scoreTarget', 'currentScore', 'runScore',
  'deck', 'hand', 'discardPile', 'selectedIndices', 'playsRemaining', 'discardsRemaining',
  'jokerPool', 'activeJokers', 'managerCards', 'comboLevels',
  'shopJokers', 'coins', 'shopItems', 'lastScoringResult',
] as const

export function saveRun(state: Record<string, unknown>): void {
  try {
    const toSave: Record<string, unknown> = {}
    for (const key of PERSIST_FIELDS) {
      if (key in state) toSave[key] = state[key]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // Silent fail — localStorage may be full or unavailable
  }
}

export function loadRun(): Record<string, unknown> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearRun(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silent fail
  }
}

export function hasSavedRun(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}
