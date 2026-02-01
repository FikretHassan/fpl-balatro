import { PlayerCard, ComboType, ComboResult } from '@/types/game'
import { COMBO_DEFINITIONS } from './constants'

type ComboDetector = (cards: PlayerCard[]) => PlayerCard[] | null

// Returns matched cards if combo detected, null otherwise

function detectHatTrickHero(cards: PlayerCard[]): PlayerCard[] | null {
  const hero = cards.find((c) => c.goalsScored >= 3)
  return hero ? [hero] : null
}

function detectFullSquad(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 5) return null
  const teamCounts = new Map<number, PlayerCard[]>()
  for (const c of cards) {
    const arr = teamCounts.get(c.teamId) ?? []
    arr.push(c)
    teamCounts.set(c.teamId, arr)
  }
  for (const group of teamCounts.values()) {
    if (group.length >= 5) return group.slice(0, 5)
  }
  return null
}

function detectDreamTeam(cards: PlayerCard[]): PlayerCard[] | null {
  const dreamers = cards.filter((c) => c.inDreamteam)
  return dreamers.length >= 2 ? dreamers : null
}

function detectFormation(cards: PlayerCard[]): PlayerCard[] | null {
  const hasGK = cards.some((c) => c.position === 'GKP')
  const hasDEF = cards.some((c) => c.position === 'DEF')
  const hasMID = cards.some((c) => c.position === 'MID')
  const hasFWD = cards.some((c) => c.position === 'FWD')
  if (hasGK && hasDEF && hasMID && hasFWD) {
    return cards // all cards count
  }
  return null
}

function detectStrikeForce(cards: PlayerCard[]): PlayerCard[] | null {
  const scoringFwds = cards.filter(
    (c) => c.position === 'FWD' && c.goalsScored > 0
  )
  return scoringFwds.length >= 2 ? scoringFwds : null
}

function detectCleanSheetWall(cards: PlayerCard[]): PlayerCard[] | null {
  const csDefenders = cards.filter(
    (c) =>
      (c.position === 'DEF' || c.position === 'GKP') && c.cleanSheets > 0
  )
  return csDefenders.length >= 3 ? csDefenders : null
}

function detectClubTrio(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 3) return null
  const teamCounts = new Map<number, PlayerCard[]>()
  for (const c of cards) {
    const arr = teamCounts.get(c.teamId) ?? []
    arr.push(c)
    teamCounts.set(c.teamId, arr)
  }
  for (const group of teamCounts.values()) {
    if (group.length >= 3) return group
  }
  return null
}

function detectMidfieldEngine(cards: PlayerCard[]): PlayerCard[] | null {
  const mids = cards.filter((c) => c.position === 'MID')
  return mids.length >= 3 ? mids : null
}

function detectAssistKings(cards: PlayerCard[]): PlayerCard[] | null {
  const assisters = cards.filter((c) => c.assists > 0)
  return assisters.length >= 2 ? assisters : null
}

function detectGoalThreat(cards: PlayerCard[]): PlayerCard[] | null {
  const scorers = cards.filter((c) => c.goalsScored > 0)
  return scorers.length >= 2 ? scorers : null
}

function detectPartnership(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 2) return null
  const teamCounts = new Map<number, PlayerCard[]>()
  for (const c of cards) {
    const arr = teamCounts.get(c.teamId) ?? []
    arr.push(c)
    teamCounts.set(c.teamId, arr)
  }
  for (const group of teamCounts.values()) {
    if (group.length >= 2) return group
  }
  return null
}

// Map combo types to detectors — order matches COMBO_DEFINITIONS priority
const DETECTORS: Record<ComboType, ComboDetector> = {
  [ComboType.HAT_TRICK_HERO]: detectHatTrickHero,
  [ComboType.FULL_SQUAD]: detectFullSquad,
  [ComboType.DREAM_TEAM]: detectDreamTeam,
  [ComboType.FORMATION]: detectFormation,
  [ComboType.STRIKE_FORCE]: detectStrikeForce,
  [ComboType.CLEAN_SHEET_WALL]: detectCleanSheetWall,
  [ComboType.CLUB_TRIO]: detectClubTrio,
  [ComboType.MIDFIELD_ENGINE]: detectMidfieldEngine,
  [ComboType.ASSIST_KINGS]: detectAssistKings,
  [ComboType.GOAL_THREAT]: detectGoalThreat,
  [ComboType.PARTNERSHIP]: detectPartnership,
  [ComboType.BENCH_WARMER]: (cards) => (cards.length >= 1 ? [cards[0]] : null),
}

/**
 * Detects the best (highest-tier) combo from 1-5 played cards.
 * Checks combos in priority order, returns first match.
 */
export function detectBestCombo(cards: PlayerCard[]): ComboResult {
  for (const def of COMBO_DEFINITIONS) {
    const detector = DETECTORS[def.type]
    const matched = detector(cards)
    if (matched) {
      return {
        type: def.type,
        name: def.name,
        baseMult: def.baseMult,
        tier: def.tier,
        matchedCards: matched,
      }
    }
  }

  // Should never reach here since BENCH_WARMER always matches
  const fallback = COMBO_DEFINITIONS[COMBO_DEFINITIONS.length - 1]
  return {
    type: fallback.type,
    name: fallback.name,
    baseMult: fallback.baseMult,
    tier: fallback.tier,
    matchedCards: cards.slice(0, 1),
  }
}

/**
 * Detects ALL matching combos from played cards.
 * Returns them in priority order (highest tier first).
 * BENCH_WARMER is excluded if any higher combo matches.
 */
export function detectAllCombos(cards: PlayerCard[]): ComboResult[] {
  const results: ComboResult[] = []

  for (const def of COMBO_DEFINITIONS) {
    const detector = DETECTORS[def.type]
    const matched = detector(cards)
    if (matched) {
      results.push({
        type: def.type,
        name: def.name,
        baseMult: def.baseMult,
        tier: def.tier,
        matchedCards: matched,
      })
    }
  }

  // If we have combos beyond BENCH_WARMER, drop it
  if (results.length > 1) {
    return results.filter((r) => r.type !== ComboType.BENCH_WARMER)
  }

  return results
}
