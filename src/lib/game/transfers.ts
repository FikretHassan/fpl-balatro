import { PlayerCard, TransferCard, Position } from '@/types/game'

const POSITIONS: Position[] = ['GKP', 'DEF', 'MID', 'FWD']

/**
 * Pre-roll a transfer card's effect so the player can see
 * exactly what will happen before buying.
 */
export function preRollTransfer(
  baseCard: TransferCard,
  deck: PlayerCard[]
): TransferCard {
  if (deck.length === 0) return { ...baseCard }

  switch (baseCard.effectKey) {
    case 'swap_positions': {
      const card = deck[Math.floor(Math.random() * deck.length)]
      const otherPositions = POSITIONS.filter((p) => p !== card.position)
      const newPos = otherPositions[Math.floor(Math.random() * otherPositions.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `${card.position} → ${newPos}`,
        description: `${card.webName}: ${card.position} → ${newPos}`,
      }
    }
    case 'boost_points': {
      const card = deck[Math.floor(Math.random() * deck.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `+5pts`,
        description: `${card.webName} +5pts (${card.eventPoints} → ${card.eventPoints + 5})`,
      }
    }
    case 'super_sub': {
      const sorted = [...deck].sort((a, b) => a.eventPoints - b.eventPoints)
      const weakest = sorted[0]
      return {
        ...baseCard,
        previewCardId: weakest.cardId,
        previewCardName: weakest.webName,
        previewDetail: `+3pts`,
        description: `${weakest.webName} +3pts (${weakest.eventPoints} → ${weakest.eventPoints + 3})`,
      }
    }
    default:
      return { ...baseCard }
  }
}

/** Apply a transfer card effect to the deck, using pre-rolled target if available */
export function applyTransferEffect(
  cards: PlayerCard[],
  transfer: TransferCard
): PlayerCard[] {
  const result = [...cards]

  switch (transfer.effectKey) {
    case 'swap_positions': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0 && transfer.previewDetail) {
          const newPos = transfer.previewDetail.split(' → ')[1] as Position
          result[idx] = { ...result[idx], position: newPos }
        }
        return result
      }
      // Fallback: random
      if (result.length < 2) return result
      const i = Math.floor(Math.random() * result.length)
      const newPos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)]
      result[i] = { ...result[i], position: newPos }
      return result
    }
    case 'boost_points': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], eventPoints: result[idx].eventPoints + 5 }
        }
        return result
      }
      // Fallback: random
      if (result.length === 0) return result
      const idx = Math.floor(Math.random() * result.length)
      result[idx] = { ...result[idx], eventPoints: result[idx].eventPoints + 5 }
      return result
    }
    case 'super_sub': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], eventPoints: result[idx].eventPoints + 3 }
        }
        return result
      }
      // Fallback: random
      const sorted = [...result].sort((a, b) => a.eventPoints - b.eventPoints)
      if (sorted.length === 0) return result
      const weakest = sorted[0]
      const fallbackIdx = result.findIndex((c) => c.cardId === weakest.cardId)
      if (fallbackIdx >= 0) {
        result[fallbackIdx] = { ...result[fallbackIdx], eventPoints: result[fallbackIdx].eventPoints + 3 }
      }
      return result
    }
    default:
      return result
  }
}
