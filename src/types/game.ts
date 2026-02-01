// ============================================
// Player Card (derived from FPL data)
// ============================================

export interface PlayerCard {
  id: number
  cardId: string // unique key: `${id}-gw${gameweek}`
  webName: string
  firstName: string
  secondName: string
  position: Position
  team: string
  teamShortName: string
  teamId: number

  // GW identity
  gameweek: number

  // GW performance
  eventPoints: number
  goalsScored: number
  assists: number
  cleanSheets: number
  bonus: number
  minutesPlayed: number

  // Season / form
  totalPoints: number
  form: number
  ictIndex: number
  influence: number
  creativity: number
  threat: number

  // Ownership / cost
  nowCost: number // in tenths e.g. 130 = £13.0m
  selectedByPercent: number
  inDreamteam: boolean

  // Set pieces
  isPenaltyTaker: boolean
  isCornerTaker: boolean
  isFreekickTaker: boolean

  // Status
  isCaptain: boolean
  isViceCaptain: boolean
}

export type Position = 'GKP' | 'DEF' | 'MID' | 'FWD'

export const POSITION_MAP: Record<number, Position> = {
  1: 'GKP',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
}

export const POSITION_COLORS: Record<Position, string> = {
  GKP: '#ebba1a',
  DEF: '#00ff87',
  MID: '#05f0ff',
  FWD: '#e8005a',
}

// ============================================
// Combos (replacing poker hands)
// ============================================

export enum ComboType {
  BENCH_WARMER = 'BENCH_WARMER',
  PARTNERSHIP = 'PARTNERSHIP',
  GOAL_THREAT = 'GOAL_THREAT',
  ASSIST_KINGS = 'ASSIST_KINGS',
  CLEAN_SHEET_WALL = 'CLEAN_SHEET_WALL',
  CLUB_TRIO = 'CLUB_TRIO',
  MIDFIELD_ENGINE = 'MIDFIELD_ENGINE',
  STRIKE_FORCE = 'STRIKE_FORCE',
  FORMATION = 'FORMATION',
  DREAM_TEAM = 'DREAM_TEAM',
  HAT_TRICK_HERO = 'HAT_TRICK_HERO',
  FULL_SQUAD = 'FULL_SQUAD',
  POINT_PAIR = 'POINT_PAIR',
  TWO_PAIR = 'TWO_PAIR',
  POINT_THREE_OF_A_KIND = 'POINT_THREE_OF_A_KIND',
  FULL_HOUSE = 'FULL_HOUSE',
  POINT_FOUR_OF_A_KIND = 'POINT_FOUR_OF_A_KIND',
  POINT_FIVE_OF_A_KIND = 'POINT_FIVE_OF_A_KIND',
}

export interface ComboDefinition {
  type: ComboType
  name: string
  description: string
  baseMult: number
  tier: ComboTier
}

export type ComboTier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface ComboResult {
  type: ComboType
  name: string
  baseMult: number
  tier: ComboTier
  matchedCards: PlayerCard[]
}

// ============================================
// Scoring
// ============================================

export interface ScoringStep {
  type: 'combo_announce' | 'base_score' | 'card_score' | 'manager_effect' | 'final_calc'
  label: string
  cardIndex?: number
  chipsValue: number
  multValue: number
  delay: number
}

export interface ScoringResult {
  combo: ComboResult
  steps: ScoringStep[]
  totalChips: number
  totalMult: number
  finalScore: number
}

// ============================================
// Manager Cards (Jokers)
// ============================================

export type ManagerCardRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type JokerCondition =
  | 'always'                // fires every hand
  | 'has_scorer'            // at least one played card has goals > 0
  | 'has_fwd'               // at least one FWD in played cards
  | 'has_def_or_gkp'        // at least one DEF or GKP in played cards
  | 'has_mid'               // at least one MID in played cards

export interface ManagerCard {
  id: string
  name: string
  description: string
  rarity: ManagerCardRarity
  effectType: 'add_chips' | 'add_mult' | 'mult_mult'
  effectValue: number       // chips to add, mult to add, or mult factor (e.g. 1.5)
  condition: JokerCondition
}

// ============================================
// Tactic Cards (Planet cards — level up combos)
// ============================================

export interface TacticCard {
  id: string
  name: string
  comboType: ComboType
  chipsBoost: number
  multBoost: number
}

// ============================================
// Transfer Cards (Tarot cards — modify deck)
// ============================================

export interface TransferCard {
  id: string
  name: string
  description: string
  effectKey: string
  // Pre-rolled preview (set when shop generates)
  previewCardId?: string    // which card is affected
  previewCardName?: string  // display name
  previewDetail?: string    // e.g. "→ MID" or "+5pts"
}

// ============================================
// League
// ============================================

export interface LeagueOpponent {
  managerId: number
  managerName: string
  teamName: string
  gwScore: number
  rank: number
}

// ============================================
// Boss Blinds
// ============================================

export interface BossEffect {
  id: string
  name: string
  description: string
  effectKey: string
}

// ============================================
// Shop
// ============================================

export type ShopItem =
  | { type: 'manager'; card: ManagerCard; price: number }
  | { type: 'tactic'; card: TacticCard; price: number }
  | { type: 'transfer'; card: TransferCard; price: number }

// ============================================
// Blind / Ante
// ============================================

export type BlindType = 'small' | 'big' | 'boss'

// ============================================
// Game State
// ============================================

export type GamePhase =
  | 'loading'
  | 'gw_select'
  | 'squad_preview'
  | 'playing'
  | 'scoring'
  | 'blind_complete'
  | 'shop'
  | 'boss_intro'
  | 'run_won'
  | 'run_lost'
