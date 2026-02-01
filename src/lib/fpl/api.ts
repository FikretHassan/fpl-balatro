import {
  FPLBootstrapResponse,
  FPLHistoryResponse,
  FPLLeagueStandingsResponse,
  FPLManagerInfo,
  FPLManagerPicksResponse,
} from './types'
import { LeagueOpponent } from '@/types/game'

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status >= 500 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}

export async function fetchBootstrap(): Promise<FPLBootstrapResponse> {
  const res = await fetchWithRetry('/api/fpl/bootstrap')
  return res.json()
}

export async function fetchManagerPicks(
  managerId: string,
  event: number
): Promise<{ info: FPLManagerInfo; picks: FPLManagerPicksResponse }> {
  const res = await fetchWithRetry(`/api/fpl/manager/${managerId}?event=${event}`)
  return res.json()
}

export interface GWPlayerStats {
  id: number
  gwStats: {
    goals_scored: number
    assists: number
    clean_sheets: number
    bonus: number
    minutes: number
    total_points: number
  } | null
}

export async function fetchSquadGWStats(
  playerIds: number[],
  event: number
): Promise<GWPlayerStats[]> {
  const res = await fetchWithRetry(`/api/fpl/squad-details?ids=${playerIds.join(',')}&event=${event}`)
  return res.json()
}

export async function fetchManagerHistory(
  managerId: string
): Promise<FPLHistoryResponse> {
  const res = await fetchWithRetry(`/api/fpl/history/${managerId}`)
  return res.json()
}

export async function fetchLeagueStandings(
  leagueId: string
): Promise<FPLLeagueStandingsResponse> {
  const res = await fetchWithRetry(`/api/fpl/league/${leagueId}`)
  return res.json()
}

export async function fetchLeagueOpponentsForGW(
  leagueId: string,
  playerManagerId: string,
  event: number,
  bootstrap: FPLBootstrapResponse
): Promise<LeagueOpponent[]> {
  const standings = await fetchLeagueStandings(leagueId)

  const opponents: LeagueOpponent[] = []
  const entries = standings.standings.results.filter(
    (e) => String(e.entry) !== playerManagerId
  )

  // Fetch each opponent's GW score from their history
  const batchSize = 5
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (entry) => {
        try {
          const history = await fetchManagerHistory(String(entry.entry))
          const gwData = history.current.find((g) => g.event === event)
          return {
            managerId: entry.entry,
            managerName: entry.player_name,
            teamName: entry.entry_name,
            gwScore: gwData?.points ?? 0,
            rank: entry.rank,
          }
        } catch {
          return {
            managerId: entry.entry,
            managerName: entry.player_name,
            teamName: entry.entry_name,
            gwScore: entry.event_total,
            rank: entry.rank,
          }
        }
      })
    )
    opponents.push(...results)
  }

  return opponents
}

export function getFinishedGameweeks(
  bootstrap: FPLBootstrapResponse
): number[] {
  return bootstrap.events
    .filter((e) => e.finished && e.data_checked)
    .map((e) => e.id)
}

export function getCurrentGameweek(
  bootstrap: FPLBootstrapResponse
): number {
  // Use the most recently finished GW so players have actual points
  const finished = bootstrap.events.filter((e) => e.finished && e.data_checked)
  if (finished.length > 0) return finished[finished.length - 1].id

  // Fallback: current or previous
  const current = bootstrap.events.find((e) => e.is_current)
  if (current) return current.id

  const previous = bootstrap.events.find((e) => e.is_previous)
  if (previous) return previous.id

  return 1
}
