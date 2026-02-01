'use client'

import { ScoringResult } from '@/types/game'
import { useEffect, useState } from 'react'

interface ScoringOverlayProps {
  result: ScoringResult
  onComplete: () => void
}

export default function ScoringOverlay({ result, onComplete }: ScoringOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const currentStep = result.steps[stepIndex]
  const isFinished = stepIndex >= result.steps.length

  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(onComplete, 1200)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setStepIndex((i) => i + 1)
    }, currentStep?.delay ?? 300)

    return () => clearTimeout(timer)
  }, [stepIndex, isFinished, currentStep, onComplete])

  const displayChips = currentStep?.chipsValue ?? result.totalChips
  const displayMult = currentStep?.multValue ?? result.totalMult

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Combo name */}
      <p className="text-xl font-bold text-accent">
        {result.combo.name}
      </p>

      {/* Chips x Mult display */}
      <div className="flex items-center gap-3">
        <div className="bg-chips/15 border border-chips/20 rounded-lg px-4 py-2 min-w-[80px] text-center">
          <p className="text-[10px] text-chips/70 mb-0.5">Chips</p>
          <p className="text-2xl font-bold text-chips tabular-nums">
            {displayChips}
          </p>
        </div>
        <span className="text-xl text-foreground/30 font-bold">×</span>
        <div className="bg-mult/15 border border-mult/20 rounded-lg px-4 py-2 min-w-[80px] text-center">
          <p className="text-[10px] text-mult/70 mb-0.5">Mult</p>
          <p className="text-2xl font-bold text-mult tabular-nums">
            {displayMult}
          </p>
        </div>
      </div>

      {/* Step label — color-coded by type */}
      {currentStep && !isFinished && (
        <p className={`text-xs ${
          currentStep.type === 'combo_announce' ? 'text-accent font-semibold' :
          currentStep.type === 'card_score' ? 'text-chips/70' :
          currentStep.type === 'manager_effect' ? 'text-gkp/70' :
          'text-foreground/40'
        }`}>
          {currentStep.label}
        </p>
      )}

      {/* Final score */}
      {isFinished && (
        <p className="text-3xl font-bold text-accent">
          +{result.finalScore.toLocaleString()}
        </p>
      )}
    </div>
  )
}
