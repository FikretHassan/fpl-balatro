'use client'

import { PlayerCard as PlayerCardType, POSITION_COLORS } from '@/types/game'

interface PlayerCardProps {
  card: PlayerCardType
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md'
}

export default function PlayerCard({
  card,
  selected = false,
  onClick,
  disabled = false,
  size = 'md',
}: PlayerCardProps) {
  const borderColor = POSITION_COLORS[card.position]
  const isXs = size === 'xs'
  const isSmall = size === 'sm'

  const hasIndicators =
    card.goalsScored > 0 ||
    card.assists > 0 ||
    (card.cleanSheets > 0 && (card.position === 'GKP' || card.position === 'DEF')) ||
    card.bonus > 0

  const sizeClass = isXs ? 'w-[72px] h-[96px]' : isSmall ? 'w-[104px] h-[140px]' : 'w-32 h-48'

  // XS: ultra-compact for mobile hand
  if (isXs) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative flex flex-col rounded-md overflow-hidden transition-all duration-200
          ${sizeClass}
          ${selected ? '-translate-y-2 shadow-md shadow-accent/30' : 'hover:-translate-y-0.5'}
          ${disabled && !selected ? 'opacity-80' : ''}
          ${onClick && !disabled ? 'cursor-pointer' : 'cursor-default'}
        `}
        style={{
          border: `1.5px solid ${selected ? borderColor : 'rgba(255,255,255,0.08)'}`,
          background: selected
            ? `linear-gradient(135deg, ${borderColor}20, ${borderColor}08)`
            : 'linear-gradient(145deg, #131a24, #0f1520)',
        }}
      >
        {/* Top: position dot + points */}
        <div className="flex items-center justify-between px-1 pt-1">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: borderColor }}
          />
          <span className="text-sm font-bold leading-none">{card.eventPoints}</span>
        </div>

        {/* Name */}
        <div className="flex-1 flex items-center justify-center px-1">
          <p className="text-[10px] font-semibold text-center leading-tight truncate w-full">
            {card.webName}
          </p>
        </div>

        {/* Team */}
        <div className="text-[8px] text-foreground/35 text-center">{card.teamShortName}</div>

        {/* Compact indicators */}
        {hasIndicators ? (
          <div className="flex gap-px justify-center pb-1 px-0.5">
            {card.goalsScored > 0 && (
              <span className="text-[7px] text-accent px-0.5 leading-relaxed">{card.goalsScored}G</span>
            )}
            {card.assists > 0 && (
              <span className="text-[7px] text-chips px-0.5 leading-relaxed">{card.assists}A</span>
            )}
            {card.cleanSheets > 0 && (card.position === 'GKP' || card.position === 'DEF') && (
              <span className="text-[7px] text-gkp px-0.5 leading-relaxed">CS</span>
            )}
          </div>
        ) : (
          <div className="pb-1" />
        )}

        {card.isCaptain && (
          <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-accent flex items-center justify-center text-[7px] font-bold text-black">
            C
          </div>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col rounded-lg overflow-hidden transition-all duration-200
        ${sizeClass}
        ${selected ? '-translate-y-3 shadow-lg shadow-accent/30' : 'hover:-translate-y-1'}
        ${disabled && !selected ? 'opacity-80' : ''}
        ${onClick && !disabled ? 'cursor-pointer' : 'cursor-default'}
      `}
      style={{
        border: `2px solid ${selected ? borderColor : 'rgba(255,255,255,0.08)'}`,
        background: selected
          ? `linear-gradient(135deg, ${borderColor}20, ${borderColor}08)`
          : 'linear-gradient(145deg, #131a24, #0f1520)',
      }}
    >

      {/* Top row: position + points */}
      <div className="flex items-center justify-between px-1.5 pt-1.5">
        <span
          className="px-1 py-px rounded text-[10px] font-bold text-black leading-none"
          style={{ background: borderColor }}
        >
          {card.position}
        </span>
        <span className={`${isSmall ? 'text-base' : 'text-lg'} font-bold leading-none`}>
          {card.eventPoints}
        </span>
      </div>

      {/* Player name */}
      <div className="flex-1 flex items-center justify-center px-1.5">
        <p className={`${isSmall ? 'text-xs' : 'text-sm'} font-semibold text-center leading-tight`}>
          {card.webName}
        </p>
      </div>

      {/* Team */}
      <div className="text-[10px] text-foreground/40 text-center">
        {card.teamShortName}
      </div>

      {/* Stats row */}
      <div className="flex justify-between px-1.5 py-0.5 text-[10px] text-foreground/50">
        <span>£{(card.nowCost / 10).toFixed(1)}m</span>
        <span>{card.form}</span>
      </div>

      {/* Indicators */}
      {hasIndicators && (
        <div className="flex gap-0.5 justify-center pb-1.5 px-1">
          {card.goalsScored > 0 && (
            <span className="text-[9px] bg-accent/15 text-accent px-1 rounded leading-relaxed">
              {card.goalsScored}G
            </span>
          )}
          {card.assists > 0 && (
            <span className="text-[9px] bg-chips/15 text-chips px-1 rounded leading-relaxed">
              {card.assists}A
            </span>
          )}
          {card.cleanSheets > 0 && (card.position === 'GKP' || card.position === 'DEF') && (
            <span className="text-[9px] bg-gkp/20 text-gkp px-1 rounded leading-relaxed">
              CS
            </span>
          )}
          {card.bonus > 0 && (
            <span className="text-[9px] bg-mult/15 text-mult px-1 rounded leading-relaxed">
              +{card.bonus}
            </span>
          )}
        </div>
      )}
      {!hasIndicators && <div className="pb-1.5" />}

      {/* Captain badge */}
      {card.isCaptain && (
        <div
          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold"
        >
          C
        </div>
      )}
    </button>
  )
}
