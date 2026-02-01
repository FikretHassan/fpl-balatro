'use client'

import { PlayerCard } from '@/types/game'
import { detectAllCombos } from '@/lib/game/combos'
import { ComboTier } from '@/types/game'

interface ComboDisplayProps {
  selectedCards: PlayerCard[]
}

const TIER_COLORS: Record<ComboTier, string> = {
  bronze: 'text-[var(--tier-bronze)]',
  silver: 'text-[var(--tier-silver)]',
  gold: 'text-[var(--tier-gold)]',
  diamond: 'text-[var(--tier-diamond)]',
}

export default function ComboDisplay({ selectedCards }: ComboDisplayProps) {
  if (selectedCards.length === 0) {
    return (
      <div className="min-h-12 flex items-center justify-center">
        <p className="text-foreground/20 text-sm">Select cards to play</p>
      </div>
    )
  }

  const combos = detectAllCombos(selectedCards)
  const totalMult = combos.reduce((sum, c) => sum + c.baseMult, 0)

  return (
    <div className="min-h-12 flex flex-col items-center justify-center gap-0.5">
      {combos.map((combo, i) => (
        <p key={i} className={`text-sm font-bold ${TIER_COLORS[combo.tier]}`}>
          {combo.name} <span className="text-mult text-xs">+{combo.baseMult}</span>
        </p>
      ))}
      <p className="text-xs text-foreground/40">
        Total: <span className="text-mult font-semibold">×{totalMult}</span> mult
      </p>
    </div>
  )
}
