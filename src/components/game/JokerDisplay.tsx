'use client'

import { useState } from 'react'
import { ManagerCard, ManagerCardRarity } from '@/types/game'
import { JOKER_SELL_PRICES } from '@/lib/game/constants'

interface JokerDisplayProps {
  jokers: ManagerCard[]
  onSell?: (jokerId: string) => void
}

const RARITY_STYLES: Record<ManagerCardRarity, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: 'border-foreground/20', bg: 'bg-foreground/5', text: 'text-foreground/60', glow: '' },
  uncommon: { border: 'border-chips/30', bg: 'bg-chips/10', text: 'text-chips', glow: 'shadow-chips/10' },
  rare: { border: 'border-[var(--rarity-rare)]/30', bg: 'bg-[var(--rarity-rare)]/10', text: 'text-[var(--rarity-rare)]', glow: 'shadow-[var(--rarity-rare)]/15' },
  legendary: { border: 'border-[var(--rarity-legendary)]/40', bg: 'bg-[var(--rarity-legendary)]/15', text: 'text-[var(--rarity-legendary)]', glow: 'shadow-[var(--rarity-legendary)]/20' },
}

const RARITY_LABEL: Record<ManagerCardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
}

const EFFECT_BADGE: Record<ManagerCard['effectType'], { label: string; color: string }> = {
  add_chips: { label: '+Chips', color: 'text-chips bg-chips/15' },
  add_mult: { label: '+Mult', color: 'text-mult bg-mult/15' },
  mult_mult: { label: 'xMult', color: 'text-[var(--rarity-legendary)] bg-[var(--rarity-legendary)]/15' },
}

export default function JokerDisplay({ jokers, onSell }: JokerDisplayProps) {
  const [selected, setSelected] = useState<ManagerCard | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {jokers.map((joker) => {
          const style = RARITY_STYLES[joker.rarity]
          const effect = EFFECT_BADGE[joker.effectType]
          return (
            <div
              key={joker.id}
              onClick={() => setSelected(joker)}
              className={`
                rounded-lg border ${style.border} ${style.bg} px-3 py-2.5 w-40
                hover:scale-105 hover:shadow-lg ${style.glow} transition-all cursor-pointer text-left
              `}
            >
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <span className={`text-xs font-bold ${style.text} leading-tight`}>
                  {joker.name}
                </span>
              </div>
              <p className="text-[10px] text-foreground/40 leading-snug line-clamp-2">
                {joker.description}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-foreground/20 capitalize">
                  {joker.rarity}
                </span>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${effect.color}`}>
                  {effect.label}
                </span>
              </div>
              {onSell && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSell(joker.id) }}
                  className="mt-2 w-full text-[10px] font-semibold py-1 rounded bg-mult/15 text-mult hover:bg-mult/25 transition-colors"
                >
                  Sell ${JOKER_SELL_PRICES[joker.rarity] ?? 2}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface border border-foreground/10 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const style = RARITY_STYLES[selected.rarity]
              const effect = EFFECT_BADGE[selected.effectType]
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${style.text}`}>
                      {selected.name}
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${effect.color}`}>
                      {effect.label}
                    </span>
                  </div>

                  <div className={`rounded-lg border ${style.border} ${style.bg} p-4 mb-4`}>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                      {selected.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${style.text} font-semibold capitalize`}>
                      {RARITY_LABEL[selected.rarity]}
                    </span>
                    <div className="flex items-center gap-3">
                      {onSell && (
                        <button
                          onClick={() => { onSell(selected.id); setSelected(null) }}
                          className="text-xs font-semibold px-3 py-1 rounded bg-mult/15 text-mult hover:bg-mult/25 transition-colors"
                        >
                          Sell ${JOKER_SELL_PRICES[selected.rarity] ?? 2}
                        </button>
                      )}
                      <button
                        onClick={() => setSelected(null)}
                        className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
