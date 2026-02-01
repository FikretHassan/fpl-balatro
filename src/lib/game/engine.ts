import { PlayerCard, BlindType, LeagueOpponent } from '@/types/game'
import { HAND_SIZE, SCORE_TARGETS, TOTAL_ANTES, LEAGUE_BOSS_SCALING } from './constants'

/** Fisher-Yates shuffle (returns new array) */
export function shuffleDeck(cards: PlayerCard[]): PlayerCard[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Deal cards from deck into hand */
export function dealHand(
  deck: PlayerCard[],
  handSize: number = HAND_SIZE
): { hand: PlayerCard[]; remaining: PlayerCard[] } {
  const toDeal = Math.min(handSize, deck.length)
  return {
    hand: deck.slice(0, toDeal),
    remaining: deck.slice(toDeal),
  }
}

/** Draw replacement cards after discard */
export function drawCards(
  deck: PlayerCard[],
  count: number
): { drawn: PlayerCard[]; remaining: PlayerCard[] } {
  const toDraw = Math.min(count, deck.length)
  return {
    drawn: deck.slice(0, toDraw),
    remaining: deck.slice(toDraw),
  }
}

/** Get score target for an ante + blind, with optional league opponent for boss */
export function getScoreTarget(ante: number, blind: BlindType, leagueOpponent?: LeagueOpponent | null): number {
  if (blind === 'boss' && leagueOpponent) {
    return calculateLeagueBossTarget(leagueOpponent, ante)
  }
  return SCORE_TARGETS[ante]?.[blind] ?? 999999
}

/** Calculate league boss blind target from opponent GW score */
export function calculateLeagueBossTarget(opponent: LeagueOpponent, ante: number): number {
  const scaling = LEAGUE_BOSS_SCALING[ante] ?? 250
  return Math.round(opponent.gwScore * scaling)
}

/** Assign league opponents to antes (sorted weakest to strongest) */
export function assignLeagueOpponents(opponents: LeagueOpponent[], totalAntes: number = TOTAL_ANTES): LeagueOpponent[] {
  const sorted = [...opponents].sort((a, b) => a.gwScore - b.gwScore)
  if (sorted.length === 0) return []
  if (sorted.length >= totalAntes) {
    const step = sorted.length / totalAntes
    return Array.from({ length: totalAntes }, (_, i) => sorted[Math.floor(i * step)])
  }
  return Array.from({ length: totalAntes }, (_, i) => sorted[i % sorted.length])
}

/** Advance to next blind. Returns null if run is complete. */
export function advanceBlind(
  ante: number,
  blind: BlindType
): { ante: number; blind: BlindType } | null {
  if (blind === 'small') return { ante, blind: 'big' }
  if (blind === 'big') return { ante, blind: 'boss' }
  // After boss, go to next ante
  if (ante >= TOTAL_ANTES) return null // run complete
  return { ante: ante + 1, blind: 'small' }
}

/** Check if score meets target */
export function checkWinCondition(score: number, target: number): boolean {
  return score >= target
}

/** Calculate coins earned from beating a blind */
export function calculateReward(
  blindType: BlindType,
  playsRemaining: number,
  currentCoins: number
): number {
  const baseReward = blindType === 'boss' ? 5 : blindType === 'big' ? 4 : 3
  const playBonus = playsRemaining // 1 coin per unused play
  const interest = Math.min(Math.floor(currentCoins / 5), 5)
  return baseReward + playBonus + interest
}
