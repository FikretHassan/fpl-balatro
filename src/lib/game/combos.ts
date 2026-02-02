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

// Helper: group cards by eventPoints value
function groupByPoints(cards: PlayerCard[]): Map<number, PlayerCard[]> {
  const groups = new Map<number, PlayerCard[]>()
  for (const c of cards) {
    const arr = groups.get(c.eventPoints) ?? []
    arr.push(c)
    groups.set(c.eventPoints, arr)
  }
  return groups
}

function detectPointFiveOfAKind(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 5) return null
  for (const group of groupByPoints(cards).values()) {
    if (group.length >= 5) return group.slice(0, 5)
  }
  return null
}

function detectPointFourOfAKind(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 4) return null
  for (const group of groupByPoints(cards).values()) {
    if (group.length >= 4) return group.slice(0, 4)
  }
  return null
}

function detectFullHouse(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 5) return null
  const groups = groupByPoints(cards)
  let threeGroup: PlayerCard[] | null = null
  let pairGroup: PlayerCard[] | null = null
  for (const group of groups.values()) {
    if (!threeGroup && group.length >= 3) {
      threeGroup = group.slice(0, 3)
    } else if (!pairGroup && group.length >= 2) {
      pairGroup = group.slice(0, 2)
    }
  }
  if (threeGroup && pairGroup) return [...threeGroup, ...pairGroup]
  return null
}

function detectPointThreeOfAKind(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 3) return null
  for (const group of groupByPoints(cards).values()) {
    if (group.length >= 3) return group.slice(0, 3)
  }
  return null
}

function detectTwoPair(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 4) return null
  const pairs: PlayerCard[][] = []
  for (const group of groupByPoints(cards).values()) {
    if (group.length >= 2) pairs.push(group.slice(0, 2))
    if (pairs.length >= 2) return [...pairs[0], ...pairs[1]]
  }
  return null
}

function detectPointPair(cards: PlayerCard[]): PlayerCard[] | null {
  if (cards.length < 2) return null
  for (const group of groupByPoints(cards).values()) {
    if (group.length >= 2) return group.slice(0, 2)
  }
  return null
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
  [ComboType.POINT_FIVE_OF_A_KIND]: detectPointFiveOfAKind,
  [ComboType.FULL_SQUAD]: detectFullSquad,
  [ComboType.POINT_FOUR_OF_A_KIND]: detectPointFourOfAKind,
  [ComboType.HAT_TRICK_HERO]: detectHatTrickHero,
  [ComboType.FULL_HOUSE]: detectFullHouse,
  [ComboType.DREAM_TEAM]: detectDreamTeam,
  [ComboType.POINT_THREE_OF_A_KIND]: detectPointThreeOfAKind,
  [ComboType.FORMATION]: detectFormation,
  [ComboType.STRIKE_FORCE]: detectStrikeForce,
  [ComboType.TWO_PAIR]: detectTwoPair,
  [ComboType.CLEAN_SHEET_WALL]: detectCleanSheetWall,
  [ComboType.CLUB_TRIO]: detectClubTrio,
  [ComboType.MIDFIELD_ENGINE]: detectMidfieldEngine,
  [ComboType.POINT_PAIR]: detectPointPair,
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

// Point-based combos that overlap — only the best one should fire
const POINT_COMBOS = new Set<ComboType>([
  ComboType.POINT_PAIR,
  ComboType.TWO_PAIR,
  ComboType.POINT_THREE_OF_A_KIND,
  ComboType.FULL_HOUSE,
  ComboType.POINT_FOUR_OF_A_KIND,
  ComboType.POINT_FIVE_OF_A_KIND,
])

/**
 * Detects ALL matching combos from played cards.
 * Returns them in priority order (highest tier first).
 * Point-based combos (pair, three of a kind, etc.) don't stack —
 * only the best one fires. FPL-specific combos stack freely.
 * BENCH_WARMER is excluded if any higher combo matches.
 */
export function detectAllCombos(cards: PlayerCard[]): ComboResult[] {
  const results: ComboResult[] = []
  let hasPointCombo = false

  for (const def of COMBO_DEFINITIONS) {
    const detector = DETECTORS[def.type]
    const matched = detector(cards)
    if (matched) {
      // Only allow the first (best) point-based combo
      if (POINT_COMBOS.has(def.type)) {
        if (hasPointCombo) continue
        hasPointCombo = true
      }

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
