'use client'

interface DeckInfoProps {
  deckCount: number
  handCount: number
  totalCards: number
  playsRemaining: number
  discardsRemaining: number
}

export default function DeckInfo({
  deckCount,
  handCount,
  totalCards,
  playsRemaining,
  discardsRemaining,
}: DeckInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Deck visual */}
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-22">
          {/* Stacked card backs */}
          {Array.from({ length: Math.min(deckCount, 4) }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-md border border-foreground/10"
              style={{
                width: '56px',
                height: '78px',
                background: 'linear-gradient(145deg, var(--surface), var(--background))',
                top: `${i * 2}px`,
                left: `${i * 1}px`,
              }}
            />
          ))}
          {deckCount > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ top: `${Math.min(deckCount, 4) * 2 - 2}px`, left: `${Math.min(deckCount, 4) * 1 - 1}px` }}
            >
              <span className="text-lg font-bold text-foreground/50 bg-surface/80 rounded px-2">
                {deckCount}
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-foreground/30 mt-2">
          Deck
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-foreground/30">In Hand</span>
          <span className="text-foreground/60 tabular-nums">{handCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-foreground/30">Total</span>
          <span className="text-foreground/60 tabular-nums">{totalCards}</span>
        </div>

        <div className="border-t border-foreground/5 pt-2 mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-foreground/30">Plays</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    i < playsRemaining ? 'bg-accent' : 'bg-foreground/10'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-foreground/30">Discards</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    i < discardsRemaining ? 'bg-mult' : 'bg-foreground/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
