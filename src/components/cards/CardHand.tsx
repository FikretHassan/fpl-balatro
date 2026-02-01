'use client'

import { PlayerCard as PlayerCardType } from '@/types/game'
import PlayerCard from './PlayerCard'

interface CardHandProps {
  cards: PlayerCardType[]
  selectedIndices: number[]
  onSelect: (index: number) => void
  maxSelected?: number
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function CardHand({
  cards,
  selectedIndices,
  onSelect,
  maxSelected = 5,
  disabled = false,
  size = 'md',
}: CardHandProps) {
  const handleSelect = (index: number) => {
    if (disabled) return
    if (!selectedIndices.includes(index) && selectedIndices.length >= maxSelected) return
    onSelect(index)
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {cards.map((card, index) => (
        <PlayerCard
          key={card.id}
          card={card}
          selected={selectedIndices.includes(index)}
          onClick={() => handleSelect(index)}
          disabled={disabled}
          size={size}
        />
      ))}
    </div>
  )
}
