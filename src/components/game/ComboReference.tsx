'use client'

import { useState } from 'react'
import { ComboType, ComboTier, ComboDefinition } from '@/types/game'
import { COMBO_DEFINITIONS } from '@/lib/game/constants'
import { PlayerCard } from '@/types/game'
import { detectBestCombo } from '@/lib/game/combos'

interface ComboReferenceProps {
  selectedCards: PlayerCard[]
  comboLevels: Record<ComboType, number>
}

const TIER_COLORS: Record<ComboTier, string> = {
  bronze: 'border-[var(--tier-bronze)]/30 bg-[var(--tier-bronze)]/10',
  silver: 'border-[var(--tier-silver)]/30 bg-[var(--tier-silver)]/10',
  gold: 'border-[var(--tier-gold)]/30 bg-[var(--tier-gold)]/10',
  diamond: 'border-[var(--tier-diamond)]/30 bg-[var(--tier-diamond)]/10',
}

const TIER_TEXT: Record<ComboTier, string> = {
  bronze: 'text-[var(--tier-bronze)]',
  silver: 'text-[var(--tier-silver)]',
  gold: 'text-[var(--tier-gold)]',
  diamond: 'text-[var(--tier-diamond)]',
}

const TIER_LABEL: Record<ComboTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
}

export default function ComboReference({ selectedCards, comboLevels }: ComboReferenceProps) {
  const activeCombo = selectedCards.length > 0 ? detectBestCombo(selectedCards) : null
  const [expanded, setExpanded] = useState<ComboDefinition | null>(null)

  return (
    <>
      <div className="flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin">
        <h3 className="text-[10px] uppercase tracking-widest text-foreground/30 mb-1">
          Combos
        </h3>
        {COMBO_DEFINITIONS.map((combo) => {
          const level = comboLevels[combo.type] ?? 1
          const isActive = activeCombo?.type === combo.type
          const levelMult = combo.baseMult + (level - 1) * 1

          return (
            <button
              key={combo.type}
              onClick={() => setExpanded(combo)}
              className={`
                rounded px-2 py-1.5 border transition-all text-left cursor-pointer
                hover:bg-foreground/[0.04]
                ${isActive
                  ? `${TIER_COLORS[combo.tier]} ring-1 ring-accent/50 scale-[1.02]`
                  : 'border-foreground/5 bg-foreground/[0.02]'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isActive ? TIER_TEXT[combo.tier] : 'text-foreground/60'}`}>
                  {combo.name}
                  {level > 1 && (
                    <span className="text-[9px] text-accent ml-1">Lv{level}</span>
                  )}
                </span>
                <span className="text-[10px] text-mult/70 tabular-nums">
                  ×{levelMult}
                </span>
              </div>
              <p className="text-[9px] text-foreground/25 leading-tight mt-0.5">
                {combo.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* Combo detail modal */}
      {expanded && (() => {
        const level = comboLevels[expanded.type] ?? 1
        const levelMult = expanded.baseMult + (level - 1) * 1

        return (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setExpanded(null)}
          >
            <div
              className="bg-surface border border-foreground/10 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${TIER_TEXT[expanded.tier]}`}>
                  {expanded.name}
                </h3>
                <span className={`text-xs px-2 py-1 rounded ${TIER_COLORS[expanded.tier]} ${TIER_TEXT[expanded.tier]} font-semibold`}>
                  {TIER_LABEL[expanded.tier]}
                </span>
              </div>

              <div className={`rounded-lg border ${TIER_COLORS[expanded.tier]} p-4 mb-4`}>
                <p className="text-sm text-foreground/60 leading-relaxed mb-3">
                  {expanded.description}
                </p>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[10px] text-mult/70 mb-0.5">Mult</p>
                    <p className="text-lg font-bold text-mult">×{levelMult}</p>
                  </div>
                  <div className="text-center ml-auto">
                    <p className="text-[10px] text-foreground/30 mb-0.5">Chips</p>
                    <p className="text-sm text-foreground/50">From player points</p>
                  </div>
                </div>

                {level > 1 && (
                  <p className="text-xs text-accent mt-2">Level {level}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-foreground/25">
                  Base: ×{expanded.baseMult} &middot; +1 mult per level
                </p>
                <button
                  onClick={() => setExpanded(null)}
                  className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
