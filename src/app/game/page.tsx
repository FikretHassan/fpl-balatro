'use client'

import { useEffect, useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import PlayerCard from '@/components/cards/PlayerCard'
import BlindInfo from '@/components/game/BlindInfo'
import ComboDisplay from '@/components/game/ComboDisplay'
import RunProgress from '@/components/game/RunProgress'
import ScoringOverlay from '@/components/game/ScoringOverlay'
import ComboReference from '@/components/game/ComboReference'
import JokerDisplay from '@/components/game/JokerDisplay'

export default function GamePage() {
  const router = useRouter()
  const store = useGameStore()
  const [showMenu, setShowMenu] = useState(false)

  const {
    squad, phase, managerName, teamName, gameweek,
    hand, deck, selectedIndices, currentAnte, currentBlind,
    scoreTarget, currentScore, playsRemaining, discardsRemaining,
    coins, runScore, lastScoringResult, comboLevels,
    availableGWs, activeJokers, shopJokers, isLoading,
    currentBossOpponent, currentBossEffect,
    leagueName, usesLeagueMode, shopItems,
  } = store

  const positionGroups = useMemo(() => {
    const starting = squad.slice(0, 11)
    const bench = squad.slice(11)
    return {
      gkp: starting.filter((c) => c.position === 'GKP'),
      def: starting.filter((c) => c.position === 'DEF'),
      mid: starting.filter((c) => c.position === 'MID'),
      fwd: starting.filter((c) => c.position === 'FWD'),
      bench,
    }
  }, [squad])

  const selectedCards = useMemo(
    () => selectedIndices.map((i) => hand[i]).filter(Boolean),
    [hand, selectedIndices]
  )

  const handleFinishScoring = useCallback(() => {
    store.finishScoring()
  }, [store])

  useEffect(() => {
    if (phase === 'loading' && availableGWs.length === 0) {
      router.push('/')
    }
  }, [phase, availableGWs, router])

  if (phase === 'loading' && availableGWs.length === 0) return null

  // ===================== GW SELECT =====================
  if (phase === 'gw_select') {
    const { managerLeagues } = store

    return (
      <main className="min-h-[100dvh] flex flex-col items-center px-3 py-6 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold mb-0.5">{teamName}</h2>
          <p className="text-foreground/50 text-xs">{managerName}</p>
        </div>

        {/* League selection */}
        {managerLeagues.length > 0 && (
          <div className="w-full mb-6">
            <p className="text-foreground/30 text-[10px] uppercase tracking-widest text-center mb-2">
              League Mode
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              <button
                onClick={() => store.setLeagueMode(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  !usesLeagueMode
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-foreground/10 bg-surface text-foreground/50 hover:border-foreground/20'
                }`}
              >
                Solo
              </button>
              {managerLeagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => store.setLeagueMode(true, String(league.id))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    usesLeagueMode && store.leagueId === String(league.id)
                      ? 'border-mult bg-mult/15 text-mult'
                      : 'border-foreground/10 bg-surface text-foreground/50 hover:border-foreground/20'
                  }`}
                >
                  {league.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-foreground/30 text-[10px] uppercase tracking-widest text-center mb-2">
          Choose a gameweek
        </p>

        {isLoading && (
          <p className="text-foreground/50 text-sm mb-4">Loading gameweek...</p>
        )}

        <div className="w-full grid grid-cols-4 gap-1.5">
          {availableGWs.map((gw) => (
            <button
              key={gw.event}
              onClick={() => store.selectGameweek(gw.event)}
              disabled={isLoading}
              className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border border-foreground/10 bg-surface hover:border-accent hover:bg-accent/10 disabled:opacity-40 transition-all"
            >
              <span className="text-xs font-bold text-foreground/80">GW{gw.event}</span>
              <span className="text-[10px] text-accent font-semibold">{gw.points}pts</span>
              <span className="text-[8px] text-foreground/30">Rank {gw.rank?.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => { store.resetGame(); router.push('/') }}
          className="mt-6 text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
        >
          Back
        </button>
      </main>
    )
  }

  // ===================== SQUAD PREVIEW =====================
  if (phase === 'squad_preview') {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center px-2 py-4 max-w-lg mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold mb-0.5">{teamName}</h2>
          <p className="text-foreground/50 text-xs">
            {managerName} &middot; GW{gameweek}
            {usesLeagueMode && leagueName && (
              <span className="text-mult"> &middot; {leagueName}</span>
            )}
          </p>
        </div>

        {([
          { label: 'GKP', cards: positionGroups.gkp },
          { label: 'DEF', cards: positionGroups.def },
          { label: 'MID', cards: positionGroups.mid },
          { label: 'FWD', cards: positionGroups.fwd },
        ] as const).map(({ label, cards }) => (
          <div key={label} className="mb-2">
            <p className="text-[9px] uppercase tracking-widest text-foreground/25 text-center mb-1">
              {label}
            </p>
            <div className="flex gap-1 justify-center">
              {cards.map((card) => (
                <PlayerCard key={card.cardId} card={card} size="xs" />
              ))}
            </div>
          </div>
        ))}

        <div className="mb-4 mt-1">
          <p className="text-[9px] uppercase tracking-widest text-foreground/25 text-center mb-1">
            Bench
          </p>
          <div className="flex gap-1 justify-center">
            {positionGroups.bench.map((card) => (
              <PlayerCard key={card.cardId} card={card} size="xs" />
            ))}
          </div>
        </div>

        <button
          onClick={() => store.startRun()}
          className="px-8 py-3 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-all"
        >
          Begin Run
        </button>
      </main>
    )
  }

  // ===================== PLAYING / SCORING =====================
  if (phase === 'playing' || phase === 'scoring') {
    return (
      <main className="h-[100dvh] flex flex-col max-w-lg mx-auto relative">
        {/* Top bar */}
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center justify-between mb-1">
            <RunProgress currentAnte={currentAnte} currentBlind={currentBlind} />
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gkp font-semibold">${coins}</span>
              {/* Burger menu */}
              <button
                onClick={() => setShowMenu(true)}
                className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <span className="block w-4 h-[2px] bg-foreground/50 rounded-full" />
                <span className="block w-4 h-[2px] bg-foreground/50 rounded-full" />
                <span className="block w-4 h-[2px] bg-foreground/50 rounded-full" />
              </button>
            </div>
          </div>
          <BlindInfo
            ante={currentAnte}
            blind={currentBlind}
            scoreTarget={scoreTarget}
            currentScore={currentScore}
            bossOpponent={currentBossOpponent}
            bossEffect={currentBossEffect}
          />
        </div>

        {/* Active jokers strip */}
        {activeJokers.length > 0 && (
          <div className="flex gap-1.5 justify-center px-3 py-1">
            {activeJokers.map((j) => {
              const isScoring = phase === 'scoring' && lastScoringResult
              const effectColor = j.effectType === 'add_chips' ? 'border-chips/40 bg-chips/10 text-chips'
                : j.effectType === 'add_mult' ? 'border-mult/40 bg-mult/10 text-mult'
                : 'border-[var(--rarity-legendary)]/40 bg-[var(--rarity-legendary)]/10 text-[var(--rarity-legendary)]'
              return (
                <div
                  key={j.id}
                  className={`px-2 py-1 rounded-md border text-[10px] font-semibold ${effectColor} ${isScoring ? 'joker-active' : ''}`}
                  style={isScoring ? { animationDelay: `${Math.random() * 0.3}s` } : undefined}
                >
                  {j.name}
                </div>
              )
            })}
          </div>
        )}

        {/* Combo preview or scoring overlay */}
        <div className="min-h-[50px] flex items-center justify-center px-3">
          {phase === 'scoring' && lastScoringResult ? (
            <ScoringOverlay result={lastScoringResult} onComplete={handleFinishScoring} />
          ) : (
            <ComboDisplay selectedCards={selectedCards} />
          )}
        </div>

        {/* Spacer pushes hand toward bottom */}
        <div className="flex-1" />

        {/* Hand — anchored near bottom, thumb-reachable */}
        <div className="px-2 py-2">
          <div className="flex flex-wrap gap-1 justify-center">
            {hand.map((card, index) => (
              <PlayerCard
                key={card.cardId}
                card={card}
                size="xs"
                selected={selectedIndices.includes(index)}
                onClick={phase === 'playing' ? () => store.selectCard(index) : undefined}
                disabled={phase === 'scoring'}
              />
            ))}
          </div>
        </div>

        {/* Stats row — plays/discards/deck */}
        <div className="flex items-center justify-center gap-6 px-3 py-1 text-xs text-foreground/40">
          <div className="flex items-center gap-1.5">
            <span>Deck</span>
            <span className="text-foreground/60 font-semibold tabular-nums">{deck.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Plays</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i < playsRemaining ? 'bg-accent' : 'bg-foreground/10'}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>Discards</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i < discardsRemaining ? 'bg-mult' : 'bg-foreground/10'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons — bottom */}
        <div className="flex items-center justify-center gap-3 px-3 py-3 border-t border-foreground/5 bg-background">
          <button
            onClick={() => store.playHand()}
            disabled={phase !== 'playing' || selectedIndices.length === 0 || playsRemaining <= 0}
            className="flex-1 py-2.5 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Play Hand
          </button>

          <button
            onClick={() => store.discardCards()}
            disabled={phase !== 'playing' || selectedIndices.length === 0 || discardsRemaining <= 0}
            className="flex-1 py-2.5 rounded-lg bg-foreground/10 text-foreground/70 font-semibold hover:bg-foreground/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Discard
          </button>
        </div>

        {/* Slide-out menu drawer */}
        {showMenu && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowMenu(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="relative w-72 h-full bg-surface border-l border-foreground/10 overflow-y-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
                <span className="text-sm font-semibold text-foreground/70">Run Info</span>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-foreground/40 hover:text-foreground/60 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Active Jokers — prominent section */}
              <div className="px-4 py-3 border-b border-foreground/5">
                <p className="text-[10px] uppercase tracking-widest text-foreground/30 mb-2">
                  Active Jokers ({activeJokers.length}/5)
                </p>
                {activeJokers.length === 0 ? (
                  <p className="text-xs text-foreground/25">None equipped</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeJokers.map((j) => (
                      <div key={j.id} className="rounded-lg border border-foreground/10 bg-surface-2 p-3">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-foreground/80">{j.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                            j.effectType === 'add_chips' ? 'text-chips bg-chips/15'
                            : j.effectType === 'add_mult' ? 'text-mult bg-mult/15'
                            : 'text-gkp bg-gkp/15'
                          }`}>
                            {j.effectType === 'add_chips' ? `+${j.effectValue} chips`
                            : j.effectType === 'add_mult' ? `+${j.effectValue} mult`
                            : `×${j.effectValue} mult`}
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground/40 leading-snug">{j.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Combo Reference */}
              <div className="px-4 py-3 flex-1 overflow-y-auto">
                <ComboReference selectedCards={selectedCards} comboLevels={comboLevels} />
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  // ===================== BLIND COMPLETE =====================
  if (phase === 'blind_complete') {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-accent mb-2">Blind Beaten!</h2>
        <p className="text-foreground/50 mb-1">
          Score: {currentScore.toLocaleString()} / {scoreTarget.toLocaleString()}
        </p>
        <p className="text-foreground/30 text-sm mb-8">
          Ante {currentAnte} &middot; {currentBlind === 'small' ? 'Small' : currentBlind === 'big' ? 'Big' : 'Boss'} Blind
        </p>
        <button
          onClick={() => store.nextBlind()}
          className="px-8 py-3 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-all"
        >
          Next Blind
        </button>
      </main>
    )
  }

  // ===================== SHOP =====================
  if (phase === 'shop') {
    const MAX_SLOTS = 5
    const slotsRemaining = MAX_SLOTS - activeJokers.length

    const itemTypeColors: Record<string, string> = {
      manager: 'border-chips/30',
      tactic: 'border-accent/30',
      transfer: 'border-mult/30',
    }
    const itemTypeLabels: Record<string, string> = {
      manager: 'Joker',
      tactic: 'Tactic',
      transfer: 'Transfer',
    }

    return (
      <main className="min-h-screen flex flex-col items-center px-4 py-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-1">Shop</h2>
        <p className="text-foreground/50 text-sm mb-6">
          Ante {currentAnte} &middot; <span className="text-gkp font-semibold">${coins}</span>
          <span className="text-foreground/30 ml-3">
            Joker slots: {activeJokers.length}/{MAX_SLOTS}
          </span>
        </p>

        <div className="w-full mb-8">
          {shopItems.length === 0 ? (
            <p className="text-foreground/30 text-sm">Nothing available</p>
          ) : (
            <div className="flex flex-col gap-3">
              {shopItems.map((item, index) => {
                const canAfford = coins >= item.price
                const isJokerFull = item.type === 'manager' && slotsRemaining <= 0
                const canBuy = canAfford && !isJokerFull

                const name = item.type === 'manager' ? item.card.name
                  : item.type === 'tactic' ? item.card.name
                  : item.card.name

                const desc = item.type === 'manager' ? item.card.description
                  : item.type === 'tactic' ? `+${item.card.multBoost} mult to ${item.card.comboType.replace(/_/g, ' ').toLowerCase()}`
                  : item.card.description

                const badge = item.type === 'manager' ? item.card.rarity : itemTypeLabels[item.type]

                return (
                  <div
                    key={`${item.type}-${index}`}
                    className={`rounded-lg border bg-surface p-4 flex items-start gap-3 ${itemTypeColors[item.type] ?? 'border-foreground/10'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground/80">{name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-foreground/5 text-foreground/40 font-semibold uppercase">
                          {badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground/40 leading-snug mt-0.5">
                        {desc}
                      </p>
                      <span className="text-xs text-gkp font-semibold">${item.price}</span>
                    </div>
                    <button
                      onClick={() => store.buyShopItem(index)}
                      disabled={!canBuy}
                      className="shrink-0 px-4 py-1.5 rounded bg-accent text-black text-xs font-semibold hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      {!canAfford ? 'No $' : isJokerFull ? 'Full' : 'Buy'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {activeJokers.length > 0 && (
          <div className="w-full mb-8">
            <p className="text-[10px] uppercase tracking-widest text-foreground/25 mb-3">
              Equipped Jokers
            </p>
            <JokerDisplay jokers={activeJokers} />
          </div>
        )}

        <button
          onClick={() => store.skipShop()}
          className="px-8 py-3 rounded-lg bg-foreground/10 text-foreground/70 font-semibold hover:bg-foreground/15 transition-all"
        >
          Next Blind →
        </button>
      </main>
    )
  }

  // ===================== RUN WON =====================
  if (phase === 'run_won') {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-accent mb-4">Run Complete!</h2>
        <p className="text-foreground/50 text-lg mb-1">
          Total Score: {(runScore + currentScore).toLocaleString()}
        </p>
        <p className="text-foreground/30 mb-8">
          Coins: ${coins}
        </p>
        <button
          onClick={() => { store.resetGame(); router.push('/') }}
          className="px-8 py-3 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-all"
        >
          New Run
        </button>
      </main>
    )
  }

  // ===================== RUN LOST =====================
  if (phase === 'run_lost') {
    return (
      <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-mult mb-4">Run Failed</h2>
        <p className="text-foreground/50 text-lg mb-1">
          Score: {currentScore.toLocaleString()} / {scoreTarget.toLocaleString()}
        </p>
        <p className="text-foreground/30 mb-1">
          Ante {currentAnte} &middot; {currentBlind === 'small' ? 'Small' : currentBlind === 'big' ? 'Big' : 'Boss'} Blind
        </p>
        <p className="text-foreground/30 mb-8">
          Run Score: {runScore.toLocaleString()}
        </p>
        <button
          onClick={() => { store.resetGame(); router.push('/') }}
          className="px-8 py-3 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-all"
        >
          Try Again
        </button>
      </main>
    )
  }

  return null
}
