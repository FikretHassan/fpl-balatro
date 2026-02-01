import { ManagerProgress, RunRecord } from '@/types/game'

const STORAGE_KEY = 'fpl-balatro-progress'

function loadAll(): Record<string, ManagerProgress> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveAll(all: Record<string, ManagerProgress>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Silent fail
  }
}

export function loadProgress(managerId: string): ManagerProgress | null {
  return loadAll()[managerId] ?? null
}

export function saveProgress(progress: ManagerProgress): void {
  const all = loadAll()
  all[progress.managerId] = progress
  saveAll(all)
}

export function initProgress(
  managerId: string,
  managerName: string,
  teamName: string,
  highestGW: number
): ManagerProgress {
  const existing = loadProgress(managerId)
  if (existing) {
    // Update name/team in case they changed, preserve progress
    existing.managerName = managerName
    existing.teamName = teamName
    // Ensure at least the highest GW is unlocked
    if (!existing.unlockedGWs.includes(highestGW)) {
      existing.unlockedGWs.push(highestGW)
    }
    saveProgress(existing)
    return existing
  }

  const fresh: ManagerProgress = {
    managerId,
    managerName,
    teamName,
    unlockedGWs: [highestGW],
    runHistory: [],
  }
  saveProgress(fresh)
  return fresh
}

export function recordRun(
  managerId: string,
  record: RunRecord,
  nextUnlockGW: number | null
): ManagerProgress {
  const all = loadAll()
  const progress = all[managerId]
  if (!progress) throw new Error('No progress found for manager')

  progress.runHistory.push(record)

  if (record.won && nextUnlockGW !== null && !progress.unlockedGWs.includes(nextUnlockGW)) {
    progress.unlockedGWs.push(nextUnlockGW)
  }

  saveAll(all)
  return progress
}

/** Get the next GW to unlock (sorted by points desc). Returns null if all unlocked. */
export function getNextUnlockGW(
  unlockedGWs: number[],
  gwsSortedByPoints: { event: number }[]
): number | null {
  for (const gw of gwsSortedByPoints) {
    if (!unlockedGWs.includes(gw.event)) return gw.event
  }
  return null
}
