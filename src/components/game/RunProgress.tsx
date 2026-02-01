'use client'

import { BlindType } from '@/types/game'
import { TOTAL_ANTES } from '@/lib/game/constants'

interface RunProgressProps {
  currentAnte: number
  currentBlind: BlindType
}

const BLIND_ORDER: BlindType[] = ['small', 'big', 'boss']

export default function RunProgress({ currentAnte, currentBlind }: RunProgressProps) {
  const currentBlindIndex = BLIND_ORDER.indexOf(currentBlind)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: TOTAL_ANTES }, (_, anteIdx) => {
        const ante = anteIdx + 1
        return (
          <div key={ante} className="flex items-center gap-px">
            {BLIND_ORDER.map((blind, blindIdx) => {
              const isComplete =
                ante < currentAnte ||
                (ante === currentAnte && blindIdx < currentBlindIndex)
              const isCurrent =
                ante === currentAnte && blind === currentBlind

              return (
                <div
                  key={blind}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isCurrent
                      ? 'bg-accent scale-125'
                      : isComplete
                        ? 'bg-accent/40'
                        : 'bg-foreground/10'
                  }`}
                />
              )
            })}
            {ante < TOTAL_ANTES && <div className="w-1" />}
          </div>
        )
      })}
    </div>
  )
}
