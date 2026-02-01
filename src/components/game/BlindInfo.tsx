'use client'

import { BlindType, LeagueOpponent, BossEffect } from '@/types/game'
import { TOTAL_ANTES } from '@/lib/game/constants'
import { useEffect, useRef, useState } from 'react'

interface BlindInfoProps {
  ante: number
  blind: BlindType
  scoreTarget: number
  currentScore: number
  bossOpponent?: LeagueOpponent | null
  bossEffect?: BossEffect | null
}

const BLIND_LABELS: Record<BlindType, string> = {
  small: 'Small Blind',
  big: 'Big Blind',
  boss: 'Boss Blind',
}

const BLIND_COLORS: Record<BlindType, string> = {
  small: 'text-chips',
  big: 'text-gkp',
  boss: 'text-mult',
}

function useAnimatedScore(target: number, duration = 600) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const from = prevRef.current
    const to = target
    prevRef.current = to

    if (from === to) return

    const start = performance.now()
    let raf: number

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return display
}

export default function BlindInfo({ ante, blind, scoreTarget, currentScore, bossOpponent, bossEffect }: BlindInfoProps) {
  const displayScore = useAnimatedScore(currentScore)
  const progress = Math.min((displayScore / scoreTarget) * 100, 100)

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-foreground/40 text-sm">
          Ante {ante}/{TOTAL_ANTES}
        </span>
        <span className={`text-sm font-semibold ${BLIND_COLORS[blind]}`}>
          {BLIND_LABELS[blind]}
        </span>
      </div>

      {/* Boss opponent info */}
      {blind === 'boss' && bossOpponent && (
        <div className="mb-1.5">
          <span className="text-xs font-semibold text-mult">{bossOpponent.teamName}</span>
          <span className="text-foreground/30 text-[10px] ml-2">
            {bossOpponent.managerName} &middot; {bossOpponent.gwScore}pts
          </span>
        </div>
      )}

      {/* Boss effect */}
      {blind === 'boss' && bossEffect && (
        <div className="mb-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded bg-mult/15 text-mult font-semibold">
            {bossEffect.name}: {bossEffect.description}
          </span>
        </div>
      )}

      {/* Score / Target */}
      <div className="mb-2">
        <span className="text-3xl font-bold tabular-nums">{displayScore.toLocaleString()}</span>
        <span className="text-foreground/30 text-lg"> / {scoreTarget.toLocaleString()}</span>
      </div>

      {/* Progress bar */}
      <div className="w-64 mx-auto h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: progress >= 100
              ? 'var(--accent)'
              : 'linear-gradient(90deg, var(--chips), var(--accent))',
          }}
        />
      </div>
    </div>
  )
}
