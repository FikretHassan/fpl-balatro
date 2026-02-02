import { PlayerCard, TransferCard, TempEffect, Position } from '@/types/game'

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
    case 'add_goal': {
      const card = deck[Math.floor(Math.random() * deck.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `+1 goal`,
        description: `${card.webName} +1 goal (${card.goalsScored} → ${card.goalsScored + 1})`,
      }
    }
    case 'add_assist': {
      const card = deck[Math.floor(Math.random() * deck.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `+1 assist`,
        description: `${card.webName} +1 assist (${card.assists} → ${card.assists + 1})`,
      }
    }
    case 'add_clean_sheet': {
      const eligible = deck.filter((c) => c.position === 'DEF' || c.position === 'GKP')
      if (eligible.length === 0) {
        const card = deck[Math.floor(Math.random() * deck.length)]
        return { ...baseCard, previewCardId: card.cardId, previewCardName: card.webName, previewDetail: 'no DEF/GKP', description: 'No eligible DEF/GKP' }
      }
      const card = eligible[Math.floor(Math.random() * eligible.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `+1 CS`,
        description: `${card.webName} gains clean sheet`,
      }
    }
    case 'add_dreamteam': {
      const nonDream = deck.filter((c) => !c.inDreamteam)
      const card = nonDream.length > 0 ? nonDream[Math.floor(Math.random() * nonDream.length)] : deck[Math.floor(Math.random() * deck.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: card.inDreamteam ? 'already in' : '→ Dreamteam',
        description: card.inDreamteam ? `${card.webName} already in Dreamteam` : `${card.webName} → Dreamteam`,
      }
    }
    case 'double_points': {
      const card = deck[Math.floor(Math.random() * deck.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `×2 pts`,
        description: `${card.webName} ×2 (${card.eventPoints} → ${card.eventPoints * 2})`,
      }
    }
    case 'match_team': {
      if (deck.length < 2) return { ...baseCard }
      const card = deck[Math.floor(Math.random() * deck.length)]
      const others = deck.filter((c) => c.cardId !== card.cardId)
      const donor = others[Math.floor(Math.random() * others.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `→ team ${donor.teamId}`,
        description: `${card.webName} joins ${donor.webName}'s team`,
      }
    }
    case 'duplicate_card': {
      const card = deck[Math.floor(Math.random() * deck.length)]
      return {
        ...baseCard,
        previewCardId: card.cardId,
        previewCardName: card.webName,
        previewDetail: `copy`,
        description: `Duplicate ${card.webName}`,
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
    case 'add_goal': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], goalsScored: result[idx].goalsScored + 1 }
        }
        return result
      }
      const idx = Math.floor(Math.random() * result.length)
      result[idx] = { ...result[idx], goalsScored: result[idx].goalsScored + 1 }
      return result
    }
    case 'add_assist': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], assists: result[idx].assists + 1 }
        }
        return result
      }
      const idx = Math.floor(Math.random() * result.length)
      result[idx] = { ...result[idx], assists: result[idx].assists + 1 }
      return result
    }
    case 'add_clean_sheet': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], cleanSheets: result[idx].cleanSheets + 1 }
        }
        return result
      }
      const eligible = result.filter((c) => c.position === 'DEF' || c.position === 'GKP')
      if (eligible.length > 0) {
        const pick = eligible[Math.floor(Math.random() * eligible.length)]
        const idx = result.findIndex((c) => c.cardId === pick.cardId)
        if (idx >= 0) result[idx] = { ...result[idx], cleanSheets: result[idx].cleanSheets + 1 }
      }
      return result
    }
    case 'add_dreamteam': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], inDreamteam: true }
        }
        return result
      }
      const nonDream = result.filter((c) => !c.inDreamteam)
      if (nonDream.length > 0) {
        const pick = nonDream[Math.floor(Math.random() * nonDream.length)]
        const idx = result.findIndex((c) => c.cardId === pick.cardId)
        if (idx >= 0) result[idx] = { ...result[idx], inDreamteam: true }
      }
      return result
    }
    case 'double_points': {
      if (transfer.previewCardId) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        if (idx >= 0) {
          result[idx] = { ...result[idx], eventPoints: result[idx].eventPoints * 2 }
        }
        return result
      }
      const idx = Math.floor(Math.random() * result.length)
      result[idx] = { ...result[idx], eventPoints: result[idx].eventPoints * 2 }
      return result
    }
    case 'match_team': {
      if (transfer.previewCardId && transfer.previewDetail) {
        const idx = result.findIndex((c) => c.cardId === transfer.previewCardId)
        const teamId = parseInt(transfer.previewDetail.replace('→ team ', ''), 10)
        if (idx >= 0 && !isNaN(teamId)) {
          result[idx] = { ...result[idx], teamId }
        }
        return result
      }
      return result
    }
    case 'duplicate_card': {
      if (transfer.previewCardId) {
        const source = result.find((c) => c.cardId === transfer.previewCardId)
        if (source) {
          result.push({ ...source, cardId: `${source.cardId}-dup-${Date.now()}` })
        }
        return result
      }
      if (result.length > 0) {
        const source = result[Math.floor(Math.random() * result.length)]
        result.push({ ...source, cardId: `${source.cardId}-dup-${Date.now()}` })
      }
      return result
    }
    default:
      return result
  }
}

/** Revert an expired temporary effect from the deck */
export function revertTempEffect(cards: PlayerCard[], effect: TempEffect): PlayerCard[] {
  const result = [...cards]

  switch (effect.effectKey) {
    case 'double_points': {
      const idx = result.findIndex((c) => c.cardId === effect.cardId)
      if (idx >= 0) {
        result[idx] = { ...result[idx], eventPoints: effect.originalValue as number }
      }
      return result
    }
    case 'match_team': {
      const idx = result.findIndex((c) => c.cardId === effect.cardId)
      if (idx >= 0) {
        result[idx] = { ...result[idx], teamId: effect.originalValue as number }
      }
      return result
    }
    case 'duplicate_card': {
      // Remove the duplicated card (its cardId starts with the original + "-dup-")
      return result.filter((c) => !c.cardId.startsWith(`${effect.cardId}-dup-`))
    }
    default:
      return result
  }
}
