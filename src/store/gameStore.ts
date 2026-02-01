import { create } from 'zustand'
import {
  PlayerCard,
  GamePhase,
  GameMode,
  BlindType,
  ManagerCard,
  ComboType,
  ShopItem,
  ScoringResult,
  LeagueOpponent,
  BossEffect,
  TacticCard,
  ManagerProgress,
} from '@/types/game'
import { initProgress, recordRun, getNextUnlockGW } from '@/lib/progress'
import { fetchBootstrap, fetchManagerPicks, fetchSquadGWStats, fetchManagerHistory, getFinishedGameweeks, fetchLeagueStandings, fetchLeagueOpponentsForGW } from '@/lib/fpl/api'
import { FPLBootstrapResponse, FPLHistoryGW } from '@/lib/fpl/types'
import { transformToPlayerCards } from '@/lib/fpl/transforms'
import { generateJokers } from '@/lib/game/jokers'
import { shuffleDeck, dealHand, drawCards, getScoreTarget, advanceBlind, calculateReward, assignLeagueOpponents } from '@/lib/game/engine'
import { detectBestCombo, detectAllCombos } from '@/lib/game/combos'
import { calculateScore } from '@/lib/game/scoring'
import { applyTransferEffect, preRollTransfer } from '@/lib/game/transfers'
import { HAND_SIZE, MAX_PLAYS, MAX_DISCARDS, MAX_SELECTED, MAX_MANAGER_CARDS, BOSS_EFFECTS, COMBO_DEFINITIONS, TRANSFER_CARDS, TACTIC_PRICE, TRANSFER_PRICE, JOKER_SELL_PRICES } from '@/lib/game/constants'
import { saveRun, clearRun } from '@/lib/persistence'

const SHOP_JOKER_COUNT = 3
const JOKER_PRICE = 5

function generateRandomTactics(count: number): TacticCard[] {
  const combos = [...COMBO_DEFINITIONS].sort(() => Math.random() - 0.5).slice(0, count)
  return combos.map((c, i) => ({
    id: `tactic-${c.type}-${Date.now()}-${i}`,
    name: `${c.name} Training`,
    comboType: c.type,
    chipsBoost: 0,
    multBoost: 1,
  }))
}

interface GameState {
  // FPL data
  managerId: string | null
  managerName: string | null
  teamName: string | null
  squad: PlayerCard[]
  gameweek: number

  // GW selection
  availableGWs: FPLHistoryGW[]
  cachedBootstrap: FPLBootstrapResponse | null

  // League
  managerLeagues: { id: number; name: string }[]
  leagueId: string | null
  leagueName: string | null
  leagueOpponents: LeagueOpponent[]
  usesLeagueMode: boolean

  // League boss
  assignedBossOpponents: LeagueOpponent[]
  currentBossOpponent: LeagueOpponent | null
  currentBossEffect: BossEffect | null

  // Game mode & progress
  gameMode: GameMode
  managerProgress: ManagerProgress | null
  lastUnlockedGW: number | null  // set after a win unlocks a new GW

  // UI state
  phase: GamePhase
  isLoading: boolean
  error: string | null

  // Run state
  currentAnte: number
  currentBlind: BlindType
  scoreTarget: number
  currentScore: number
  runScore: number

  // Hand state
  deck: PlayerCard[]
  hand: PlayerCard[]
  discardPile: PlayerCard[]
  selectedIndices: number[]
  playsRemaining: number
  discardsRemaining: number

  // Jokers
  jokerPool: ManagerCard[]      // all available (from historical GWs)
  activeJokers: ManagerCard[]   // equipped (max 5), used in scoring
  comboLevels: Record<ComboType, number>

  // Shop
  shopJokers: ManagerCard[]     // jokers offered this shop visit
  coins: number

  // Compat
  shopItems: ShopItem[]
  managerCards: ManagerCard[]   // alias for activeJokers (used by UI)

  // Last scoring result (for animation)
  lastScoringResult: ScoringResult | null

  // Actions
  setGameMode: (mode: GameMode) => void
  recordRunResult: (won: boolean) => void
  loadManager: (managerId: string) => Promise<void>
  setLeagueMode: (enabled: boolean, leagueId?: string) => void
  loadLeague: (gameweek: number) => Promise<void>
  selectGameweek: (gw: number) => Promise<void>
  setPhase: (phase: GamePhase) => void
  startRun: () => void
  selectCard: (index: number) => void
  playHand: () => void
  discardCards: () => void
  finishScoring: () => void
  nextBlind: () => void
  buyJoker: (jokerId: string) => void
  sellJoker: (jokerId: string) => void
  buyShopItem: (itemIndex: number) => void
  skipShop: () => void
  resumeRun: (saved: Record<string, unknown>) => void
  resetGame: () => void
}

const initialComboLevels: Record<ComboType, number> = {
  [ComboType.BENCH_WARMER]: 1,
  [ComboType.PARTNERSHIP]: 1,
  [ComboType.GOAL_THREAT]: 1,
  [ComboType.ASSIST_KINGS]: 1,
  [ComboType.CLEAN_SHEET_WALL]: 1,
  [ComboType.CLUB_TRIO]: 1,
  [ComboType.MIDFIELD_ENGINE]: 1,
  [ComboType.STRIKE_FORCE]: 1,
  [ComboType.FORMATION]: 1,
  [ComboType.DREAM_TEAM]: 1,
  [ComboType.HAT_TRICK_HERO]: 1,
  [ComboType.FULL_SQUAD]: 1,
  [ComboType.POINT_PAIR]: 1,
  [ComboType.TWO_PAIR]: 1,
  [ComboType.POINT_THREE_OF_A_KIND]: 1,
  [ComboType.FULL_HOUSE]: 1,
  [ComboType.POINT_FOUR_OF_A_KIND]: 1,
  [ComboType.POINT_FIVE_OF_A_KIND]: 1,
}

function pickRandomJokers(pool: ManagerCard[], count: number, exclude: Set<string>): ManagerCard[] {
  const available = pool.filter((j) => !exclude.has(j.id))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const useGameStore = create<GameState>((set, get) => ({
  // FPL data
  managerId: null,
  managerName: null,
  teamName: null,
  squad: [],
  gameweek: 0,

  // GW selection
  availableGWs: [],
  cachedBootstrap: null,

  // League
  managerLeagues: [],
  leagueId: null,
  leagueName: null,
  leagueOpponents: [],
  usesLeagueMode: false,
  assignedBossOpponents: [],
  currentBossOpponent: null,
  currentBossEffect: null,

  // Game mode & progress
  gameMode: 'roguelike' as GameMode,
  managerProgress: null,
  lastUnlockedGW: null,

  // UI
  phase: 'loading',
  isLoading: false,
  error: null,

  // Run
  currentAnte: 1,
  currentBlind: 'small',
  scoreTarget: 0,
  currentScore: 0,
  runScore: 0,

  // Hand
  deck: [],
  hand: [],
  discardPile: [],
  selectedIndices: [],
  playsRemaining: MAX_PLAYS,
  discardsRemaining: MAX_DISCARDS,

  // Jokers
  jokerPool: [],
  activeJokers: [],
  managerCards: [],  // alias
  comboLevels: { ...initialComboLevels },

  // Shop
  shopJokers: [],
  coins: 0,
  shopItems: [],

  // Scoring
  lastScoringResult: null,

  // Actions

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode })
  },

  recordRunResult: (won: boolean) => {
    const { managerId, gameweek, currentAnte, currentBlind, runScore, currentScore, managerProgress, gameMode, availableGWs } = get()
    if (!managerId || !managerProgress) return

    const record = {
      gameweek,
      won,
      anteReached: currentAnte,
      blindReached: currentBlind,
      finalScore: runScore + (won ? currentScore : 0),
      timestamp: Date.now(),
    }

    // Sort GWs by points desc for unlock ordering
    const gwsSorted = [...availableGWs].sort((a, b) => b.points - a.points)
    const nextGW = won && gameMode === 'roguelike'
      ? getNextUnlockGW(managerProgress.unlockedGWs, gwsSorted)
      : null

    const updated = recordRun(managerId, record, nextGW)
    set({
      managerProgress: updated,
      lastUnlockedGW: nextGW,
    })
  },

  loadManager: async (managerId: string) => {
    set({ isLoading: true, error: null })
    try {
      const [bootstrap, history] = await Promise.all([
        fetchBootstrap(),
        fetchManagerHistory(managerId),
      ])

      const finishedIds = new Set(getFinishedGameweeks(bootstrap))
      const availableGWs = history.current
        .filter((gw) => finishedIds.has(gw.event))
        .reverse()

      if (availableGWs.length === 0) {
        set({ isLoading: false, error: 'No finished gameweeks found' })
        return
      }

      const { info } = await fetchManagerPicks(managerId, availableGWs[0].event)

      // Extract classic leagues and filter to small leagues (≤50 members)
      const allClassic = (info.leagues?.classic ?? [])
        .map((l: { id: number; name: string }) => ({ id: l.id, name: l.name }))

      // Check each league's size in parallel — keep only those with ≤50 members
      const leagueChecks = await Promise.all(
        allClassic.map(async (league) => {
          try {
            const standings = await fetchLeagueStandings(String(league.id))
            const count = standings.standings.results.length
            const hasMore = standings.standings.has_next
            return { league, memberCount: hasMore ? count + 1 : count }
          } catch {
            return { league, memberCount: 999 }
          }
        })
      )
      const classicLeagues = leagueChecks
        .filter((c) => c.memberCount <= 50)
        .map((c) => c.league)

      const mgrName = `${info.player_first_name} ${info.player_last_name}`
      const highestGW = [...availableGWs].sort((a, b) => b.points - a.points)[0]
      const progress = initProgress(managerId, mgrName, info.name, highestGW.event)

      set({
        managerId,
        managerName: mgrName,
        teamName: info.name,
        managerLeagues: classicLeagues,
        availableGWs,
        cachedBootstrap: bootstrap,
        managerProgress: progress,
        lastUnlockedGW: null,
        isLoading: false,
        phase: 'gw_select',
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load manager',
      })
    }
  },

  setLeagueMode: (enabled: boolean, leagueId?: string) => {
    set({
      usesLeagueMode: enabled,
      leagueId: enabled && leagueId ? leagueId : null,
      leagueName: null,
      leagueOpponents: [],
    })
  },

  loadLeague: async (gameweek: number) => {
    const { leagueId, managerId, cachedBootstrap } = get()
    if (!leagueId || !managerId || !cachedBootstrap) return

    try {
      const standings = await fetchLeagueStandings(leagueId)
      const opponents = await fetchLeagueOpponentsForGW(
        leagueId,
        managerId,
        gameweek,
        cachedBootstrap
      )

      set({
        leagueName: standings.league.name,
        leagueOpponents: opponents,
      })
    } catch (err) {
      console.error('Failed to load league:', err)
      set({ usesLeagueMode: false, leagueId: null })
    }
  },

  selectGameweek: async (gw: number) => {
    const { managerId, cachedBootstrap, availableGWs } = get()
    if (!managerId || !cachedBootstrap) return

    set({ isLoading: true, error: null })
    try {
      const { picks } = await fetchManagerPicks(managerId, gw)
      if (!picks) {
        set({ isLoading: false, error: 'No picks found for this gameweek' })
        return
      }

      const playerIds = picks.picks.map((p) => p.element)
      const gwStats = await fetchSquadGWStats(playerIds, gw)

      const squad = transformToPlayerCards(
        picks.picks,
        cachedBootstrap.elements,
        cachedBootstrap.teams,
        gw,
        gwStats
      )

      // Generate joker pool from other GWs
      const otherGWs = availableGWs
        .filter((g) => g.event !== gw)
        .slice(0, 10)

      const jokerPool = await generateJokers(
        managerId,
        otherGWs.map((g) => g.event),
        cachedBootstrap
      )

      set({
        squad,
        gameweek: gw,
        jokerPool,
        activeJokers: [],
        managerCards: [],
        isLoading: false,
        phase: 'squad_preview',
      })

      // Load league opponents if in league mode
      if (get().usesLeagueMode) {
        await get().loadLeague(gw)
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load gameweek',
      })
    }
  },

  setPhase: (phase) => set({ phase }),

  startRun: () => {
    const { squad, usesLeagueMode, leagueOpponents } = get()
    const shuffled = shuffleDeck(squad)
    const { hand, remaining } = dealHand(shuffled, HAND_SIZE)
    const ante = 1
    const blind: BlindType = 'small'

    const assigned = usesLeagueMode ? assignLeagueOpponents(leagueOpponents) : []

    set({
      phase: 'playing',
      currentAnte: ante,
      currentBlind: blind,
      scoreTarget: getScoreTarget(ante, blind),
      currentScore: 0,
      runScore: 0,
      deck: remaining,
      hand,
      discardPile: [],
      selectedIndices: [],
      playsRemaining: MAX_PLAYS,
      discardsRemaining: MAX_DISCARDS,
      coins: 0,
      activeJokers: [],
      managerCards: [],
      comboLevels: { ...initialComboLevels },
      lastScoringResult: null,
      assignedBossOpponents: assigned,
      currentBossOpponent: null,
      currentBossEffect: null,
    })
  },

  selectCard: (index: number) => {
    const { selectedIndices, phase, currentBossEffect } = get()
    if (phase !== 'playing') return

    const maxCards = currentBossEffect?.effectKey === 'max_cards_3' ? 3 : MAX_SELECTED

    if (selectedIndices.includes(index)) {
      set({ selectedIndices: selectedIndices.filter((i) => i !== index) })
    } else if (selectedIndices.length < maxCards) {
      set({ selectedIndices: [...selectedIndices, index] })
    }
  },

  playHand: () => {
    const { hand, discardPile, selectedIndices, playsRemaining, activeJokers, comboLevels, currentScore, phase, currentBossEffect } = get()
    if (phase !== 'playing') return
    if (selectedIndices.length === 0 || playsRemaining <= 0) return

    const playedCards = selectedIndices
      .sort((a, b) => a - b)
      .map((i) => hand[i])

    const combo = detectBestCombo(playedCards)
    const allCombos = detectAllCombos(playedCards)
    const result = calculateScore(playedCards, combo, activeJokers, comboLevels, currentBossEffect, allCombos)

    const remainingHand = hand.filter((_, i) => !selectedIndices.includes(i))

    set({
      phase: 'scoring',
      lastScoringResult: result,
      hand: remainingHand,
      discardPile: [...discardPile, ...playedCards],
      selectedIndices: [],
      playsRemaining: playsRemaining - 1,
    })
  },

  finishScoring: () => {
    const { currentScore, scoreTarget, playsRemaining, hand, deck, discardPile, lastScoringResult } = get()

    const pendingScore = lastScoringResult ? lastScoringResult.finalScore : 0
    const newScore = currentScore + pendingScore
    set({ currentScore: newScore })

    if (newScore >= scoreTarget) {
      // Delay so the count-up animation can play before transitioning
      setTimeout(() => set({ phase: 'blind_complete' }), 800)
      return
    }

    if (playsRemaining <= 0) {
      setTimeout(() => set({ phase: 'run_lost' }), 800)
      return
    }

    if (hand.length < HAND_SIZE) {
      let currentDeck = [...deck]
      let currentHand = [...hand]
      let currentDiscard = [...discardPile]

      const needed = HAND_SIZE - currentHand.length
      if (currentDeck.length >= needed) {
        const { drawn, remaining } = drawCards(currentDeck, needed)
        currentHand = [...currentHand, ...drawn]
        currentDeck = remaining
      } else if (currentDeck.length > 0) {
        currentHand = [...currentHand, ...currentDeck]
        currentDeck = []
      }

      // If still short, reshuffle discard pile into deck
      if (currentHand.length < HAND_SIZE && currentDeck.length === 0 && currentDiscard.length > 0) {
        currentDeck = shuffleDeck(currentDiscard)
        currentDiscard = []
        const stillNeeded = HAND_SIZE - currentHand.length
        const { drawn, remaining } = drawCards(currentDeck, stillNeeded)
        currentHand = [...currentHand, ...drawn]
        currentDeck = remaining
      }

      set({ hand: currentHand, deck: currentDeck, discardPile: currentDiscard, phase: 'playing' })
    } else {
      set({ phase: 'playing' })
    }
  },

  discardCards: () => {
    const { hand, deck, discardPile, selectedIndices, discardsRemaining, phase } = get()
    if (phase !== 'playing') return
    if (selectedIndices.length === 0 || discardsRemaining <= 0) return

    const discardedCards = selectedIndices.map((i) => hand[i])
    const remainingHand = hand.filter((_, i) => !selectedIndices.includes(i))
    let currentDiscard = [...discardPile, ...discardedCards]

    let currentDeck = [...deck]
    let newHand = [...remainingHand]

    // Draw replacements from deck
    const needed = selectedIndices.length
    if (currentDeck.length >= needed) {
      const { drawn, remaining } = drawCards(currentDeck, needed)
      newHand = [...newHand, ...drawn]
      currentDeck = remaining
    } else if (currentDeck.length > 0) {
      newHand = [...newHand, ...currentDeck]
      currentDeck = []
    }

    // If deck empty and hand still short, reshuffle discard pile into deck
    if (newHand.length < HAND_SIZE && currentDeck.length === 0 && currentDiscard.length > 0) {
      currentDeck = shuffleDeck(currentDiscard)
      currentDiscard = []
      const stillNeeded = HAND_SIZE - newHand.length
      const { drawn, remaining } = drawCards(currentDeck, stillNeeded)
      newHand = [...newHand, ...drawn]
      currentDeck = remaining
    }

    set({
      hand: newHand,
      deck: currentDeck,
      discardPile: currentDiscard,
      selectedIndices: [],
      discardsRemaining: discardsRemaining - 1,
    })
  },

  nextBlind: () => {
    const { currentAnte, currentBlind, playsRemaining, coins, runScore, currentScore, jokerPool, activeJokers } = get()

    const reward = calculateReward(currentBlind, playsRemaining, coins)
    const newCoins = coins + reward
    const newRunScore = runScore + currentScore

    const next = advanceBlind(currentAnte, currentBlind)

    if (!next) {
      set({ phase: 'run_won', coins: newCoins, runScore: newRunScore })
      return
    }

    // Generate shop offerings — jokers + 1 tactic + 1 transfer
    const ownedIds = new Set(activeJokers.map((j) => j.id))
    const shopJokers = pickRandomJokers(jokerPool, SHOP_JOKER_COUNT, ownedIds)
    const tactics = generateRandomTactics(1)
    const { squad } = get()
    const transferPool = [...TRANSFER_CARDS].sort(() => Math.random() - 0.5)
    const transfer = preRollTransfer(transferPool[0], squad)

    const shopItems: ShopItem[] = [
      ...shopJokers.map((j) => ({ type: 'manager' as const, card: j, price: JOKER_PRICE })),
      ...tactics.map((t) => ({ type: 'tactic' as const, card: t, price: TACTIC_PRICE })),
      { type: 'transfer' as const, card: transfer, price: TRANSFER_PRICE },
    ]

    set({
      currentScore: 0,
      runScore: newRunScore,
      coins: newCoins,
      shopJokers,
      shopItems,
      phase: 'shop',
      lastScoringResult: null,
    })
  },

  buyJoker: (jokerId: string) => {
    const { shopJokers, activeJokers, coins } = get()
    if (coins < JOKER_PRICE) return
    if (activeJokers.length >= MAX_MANAGER_CARDS) return

    const joker = shopJokers.find((j) => j.id === jokerId)
    if (!joker) return

    const newActive = [...activeJokers, joker]
    set({
      activeJokers: newActive,
      managerCards: newActive,
      shopJokers: shopJokers.filter((j) => j.id !== jokerId),
      coins: coins - JOKER_PRICE,
    })
  },

  sellJoker: (jokerId: string) => {
    const { activeJokers, coins } = get()
    const joker = activeJokers.find((j) => j.id === jokerId)
    if (!joker) return

    const sellPrice = JOKER_SELL_PRICES[joker.rarity] ?? 2
    const newActive = activeJokers.filter((j) => j.id !== jokerId)
    set({
      activeJokers: newActive,
      managerCards: newActive,
      coins: coins + sellPrice,
    })
  },

  buyShopItem: (itemIndex: number) => {
    const { shopItems, activeJokers, coins, comboLevels, deck, squad } = get()
    const item = shopItems[itemIndex]
    if (!item || coins < item.price) return

    if (item.type === 'manager') {
      if (activeJokers.length >= MAX_MANAGER_CARDS) return
      const newActive = [...activeJokers, item.card]
      set({
        activeJokers: newActive,
        managerCards: newActive,
        shopItems: shopItems.filter((_, i) => i !== itemIndex),
        coins: coins - item.price,
      })
    } else if (item.type === 'tactic') {
      const tactic = item.card as TacticCard
      const newLevels = {
        ...comboLevels,
        [tactic.comboType]: (comboLevels[tactic.comboType] ?? 1) + tactic.multBoost,
      }
      set({
        comboLevels: newLevels,
        shopItems: shopItems.filter((_, i) => i !== itemIndex),
        coins: coins - item.price,
      })
    } else if (item.type === 'transfer') {
      const newDeck = applyTransferEffect(deck, item.card)
      const newSquad = applyTransferEffect(squad, item.card)
      set({
        deck: newDeck,
        squad: newSquad,
        shopItems: shopItems.filter((_, i) => i !== itemIndex),
        coins: coins - item.price,
      })
    }
  },

  skipShop: () => {
    const { currentAnte, currentBlind, squad, assignedBossOpponents } = get()

    const next = advanceBlind(currentAnte, currentBlind)
    if (!next) return

    const shuffled = shuffleDeck(squad)
    const { hand, remaining } = dealHand(shuffled, HAND_SIZE)

    // Determine boss opponent and effect for boss blinds
    const bossOpponent = next.blind === 'boss' && assignedBossOpponents.length > 0
      ? assignedBossOpponents[next.ante - 1] ?? null
      : null
    const bossEffect = next.blind === 'boss'
      ? BOSS_EFFECTS[Math.floor(Math.random() * BOSS_EFFECTS.length)]
      : null

    set({
      currentAnte: next.ante,
      currentBlind: next.blind,
      scoreTarget: getScoreTarget(next.ante, next.blind, bossOpponent),
      currentBossOpponent: bossOpponent,
      currentBossEffect: bossEffect,
      deck: remaining,
      hand,
      discardPile: [],
      selectedIndices: [],
      playsRemaining: MAX_PLAYS,
      discardsRemaining: MAX_DISCARDS,
      phase: 'playing',
    })
  },

  resumeRun: (saved: Record<string, unknown>) => {
    set(saved as Partial<GameState>)
  },

  resetGame: () => {
    clearRun()
    set({
      managerId: null,
      managerName: null,
      teamName: null,
      squad: [],
      gameweek: 0,
      availableGWs: [],
      cachedBootstrap: null,
      managerLeagues: [],
      leagueId: null,
      leagueName: null,
      leagueOpponents: [],
      usesLeagueMode: false,
      assignedBossOpponents: [],
      currentBossOpponent: null,
      currentBossEffect: null,
      phase: 'loading',
      isLoading: false,
      error: null,
      currentAnte: 1,
      currentBlind: 'small',
      scoreTarget: 0,
      currentScore: 0,
      runScore: 0,
      deck: [],
      hand: [],
      discardPile: [],
      selectedIndices: [],
      playsRemaining: MAX_PLAYS,
      discardsRemaining: MAX_DISCARDS,
      jokerPool: [],
      activeJokers: [],
      managerCards: [],
      comboLevels: { ...initialComboLevels },
      coins: 0,
      shopJokers: [],
      shopItems: [],
      lastScoringResult: null,
      managerProgress: null,
      lastUnlockedGW: null,
    })
  },
}))

// Auto-save on state changes during active game phases
const SAVEABLE_PHASES = new Set(['playing', 'scoring', 'blind_complete', 'shop', 'squad_preview'])
let saveTimeout: ReturnType<typeof setTimeout> | null = null

useGameStore.subscribe((state) => {
  if (SAVEABLE_PHASES.has(state.phase)) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveRun(state as unknown as Record<string, unknown>)
    }, 500)
  } else if (state.phase === 'run_won' || state.phase === 'run_lost') {
    clearRun()
  }
})
