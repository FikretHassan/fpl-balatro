import { ComboType, ComboDefinition, BlindType, BossEffect, TransferCard } from '@/types/game'

export const HAND_SIZE = 8
export const MAX_PLAYS = 4
export const MAX_DISCARDS = 3
export const MAX_SELECTED = 5
export const MAX_MANAGER_CARDS = 5
export const TOTAL_ANTES = 8

// Coins
export const BLIND_WIN_REWARD: Record<BlindType, number> = {
  small: 3,
  big: 4,
  boss: 5,
}
export const LEFTOVER_PLAY_BONUS = 1 // per unused play
export const INTEREST_PER_5 = 1
export const MAX_INTEREST = 5
export const REROLL_BASE_COST = 5

// Score targets — rebalanced for chips = player points only (no base chips)
// Typical: 2 cards ~10-20pts total × 2 mult = 20-40 per hand, 4 plays = ~80-160 per blind
// Higher combos with good players: 30pts × 4 mult = 120, 4 plays = ~480
export const SCORE_TARGETS: Record<number, Record<BlindType, number>> = {
  1: { small: 100, big: 200, boss: 350 },
  2: { small: 250, big: 450, boss: 800 },
  3: { small: 500, big: 900, boss: 1600 },
  4: { small: 1000, big: 1800, boss: 3200 },
  5: { small: 2000, big: 3600, boss: 6400 },
  6: { small: 4000, big: 7200, boss: 13000 },
  7: { small: 8000, big: 14000, boss: 26000 },
  8: { small: 16000, big: 28000, boss: 50000 },
}

// Combo definitions — ordered by priority (highest first for detection)
// No base chips — chips come purely from player GW points
export const COMBO_DEFINITIONS: ComboDefinition[] = [
  // Diamond tier
  {
    type: ComboType.POINT_FIVE_OF_A_KIND,
    name: 'Point Five of a Kind',
    description: '5 cards with identical GW points',
    baseMult: 10,
    tier: 'diamond',
  },
  {
    type: ComboType.FULL_SQUAD,
    name: 'Full Squad',
    description: '5 players from the same club',
    baseMult: 8,
    tier: 'diamond',
  },
  {
    type: ComboType.POINT_FOUR_OF_A_KIND,
    name: 'Point Four of a Kind',
    description: '4 cards with identical GW points',
    baseMult: 7,
    tier: 'diamond',
  },
  {
    type: ComboType.HAT_TRICK_HERO,
    name: 'Hat-Trick Hero',
    description: 'A player with 3+ goals',
    baseMult: 6,
    tier: 'diamond',
  },
  // Gold tier
  {
    type: ComboType.FULL_HOUSE,
    name: 'Full House',
    description: 'A point pair + point three of a kind',
    baseMult: 5,
    tier: 'gold',
  },
  {
    type: ComboType.DREAM_TEAM,
    name: 'Dream Team',
    description: '2+ players in the GW Dream Team',
    baseMult: 5,
    tier: 'gold',
  },
  {
    type: ComboType.POINT_THREE_OF_A_KIND,
    name: 'Point Three of a Kind',
    description: '3 cards with identical GW points',
    baseMult: 4,
    tier: 'gold',
  },
  {
    type: ComboType.FORMATION,
    name: 'Formation',
    description: 'GK + DEF + MID + FWD in one hand',
    baseMult: 4,
    tier: 'gold',
  },
  {
    type: ComboType.STRIKE_FORCE,
    name: 'Strike Force',
    description: '2+ forwards who scored',
    baseMult: 4,
    tier: 'gold',
  },
  // Silver tier
  {
    type: ComboType.TWO_PAIR,
    name: 'Two Pair',
    description: '2 different pairs of matching GW points',
    baseMult: 3,
    tier: 'silver',
  },
  {
    type: ComboType.CLEAN_SHEET_WALL,
    name: 'Clean Sheet Wall',
    description: '3+ DEF/GK with clean sheets',
    baseMult: 3,
    tier: 'silver',
  },
  {
    type: ComboType.CLUB_TRIO,
    name: 'Club Trio',
    description: '3 players from the same club',
    baseMult: 3,
    tier: 'silver',
  },
  {
    type: ComboType.MIDFIELD_ENGINE,
    name: 'Midfield Engine',
    description: '3+ midfielders',
    baseMult: 3,
    tier: 'silver',
  },
  // Bronze tier
  {
    type: ComboType.POINT_PAIR,
    name: 'Point Pair',
    description: '2 cards with identical GW points',
    baseMult: 2,
    tier: 'bronze',
  },
  {
    type: ComboType.ASSIST_KINGS,
    name: 'Assist Kings',
    description: '2+ players with assists',
    baseMult: 2,
    tier: 'bronze',
  },
  {
    type: ComboType.GOAL_THREAT,
    name: 'Goal Threat',
    description: '2+ players who scored',
    baseMult: 2,
    tier: 'bronze',
  },
  {
    type: ComboType.PARTNERSHIP,
    name: 'Partnership',
    description: '2 players from the same club',
    baseMult: 2,
    tier: 'bronze',
  },
  {
    type: ComboType.BENCH_WARMER,
    name: 'Bench Warmer',
    description: 'Any single card',
    baseMult: 1,
    tier: 'bronze',
  },
]

// Lookup helper
export const COMBO_BY_TYPE: Record<ComboType, ComboDefinition> = Object.fromEntries(
  COMBO_DEFINITIONS.map((c) => [c.type, c])
) as Record<ComboType, ComboDefinition>

// Tactic card boost per level (mult only now)
export const TACTIC_MULT_PER_LEVEL = 1

// League boss blind scaling: boss_target = opponent_gw_score × scaling_factor
export const LEAGUE_BOSS_SCALING: Record<number, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 25,
  5: 40,
  6: 80,
  7: 150,
  8: 250,
}

// Boss blind effects
export const BOSS_EFFECTS: BossEffect[] = [
  {
    id: 'no_forwards',
    name: 'Attack Ban',
    description: 'Forwards score 0 chips',
    effectKey: 'disable_fwd',
  },
  {
    id: 'no_defenders',
    name: 'Defense Breakdown',
    description: 'Defenders & GKPs score 0 chips',
    effectKey: 'disable_def_gkp',
  },
  {
    id: 'limited_play',
    name: 'Tight Formation',
    description: 'Maximum 3 cards per play',
    effectKey: 'max_cards_3',
  },
  {
    id: 'halve_mult',
    name: 'Tactical Nullification',
    description: 'All multipliers halved',
    effectKey: 'halve_mult',
  },
]

// Transfer cards (tarot equivalents)
export const TRANSFER_CARDS: TransferCard[] = [
  {
    id: 'swap_pos',
    name: 'Position Swap',
    description: "Change a random player's position",
    effectKey: 'swap_positions',
  },
  {
    id: 'form_inject',
    name: 'Form Injection',
    description: '+5 points to a random card',
    effectKey: 'boost_points',
  },
  {
    id: 'super_sub',
    name: 'Super Sub',
    description: '+3 points to weakest card',
    effectKey: 'super_sub',
  },
]

// Shop prices
export const TACTIC_PRICE = 8
export const TRANSFER_PRICE = 6
