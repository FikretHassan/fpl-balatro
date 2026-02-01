import { PlayerCard, ComboResult, ComboType, ManagerCard, JokerCondition, ScoringStep, ScoringResult, BossEffect } from '@/types/game'
import { TACTIC_MULT_PER_LEVEL } from './constants'

function checkCondition(condition: JokerCondition, playedCards: PlayerCard[]): boolean {
  switch (condition) {
    case 'always':
      return true
    case 'has_scorer':
      return playedCards.some((c) => c.goalsScored > 0)
    case 'has_fwd':
      return playedCards.some((c) => c.position === 'FWD')
    case 'has_def_or_gkp':
      return playedCards.some((c) => c.position === 'DEF' || c.position === 'GKP')
    case 'has_mid':
      return playedCards.some((c) => c.position === 'MID')
    default:
      return false
  }
}

/** Check if a card's chips are disabled by the boss effect */
function isCardDisabledByBoss(card: PlayerCard, bossEffect: BossEffect | null): boolean {
  if (!bossEffect) return false
  if (bossEffect.effectKey === 'disable_fwd' && card.position === 'FWD') return true
  if (bossEffect.effectKey === 'disable_def_gkp' && (card.position === 'DEF' || card.position === 'GKP')) return true
  return false
}

/**
 * Calculates score for a played hand.
 *
 * 1. Chips = sum of played cards' GW points (no base chips from combo)
 * 2. Mult = combo base mult + level bonus
 * 3. Manager cards apply conditional effects
 * 4. Boss effects may disable positions or halve mult
 * 5. Final score = chips × mult
 */
export function calculateScore(
  playedCards: PlayerCard[],
  combo: ComboResult,
  managerCards: ManagerCard[],
  comboLevels: Record<ComboType, number>,
  bossEffect?: BossEffect | null,
  allCombos?: ComboResult[]
): ScoringResult {
  const steps: ScoringStep[] = []
  const combos = allCombos && allCombos.length > 0 ? allCombos : [combo]

  let chips = 0
  let mult = 0

  // Step 1: Announce all combos and stack their mult
  for (const c of combos) {
    const level = comboLevels[c.type] ?? 1
    const levelBonusMult = (level - 1) * TACTIC_MULT_PER_LEVEL
    const comboMult = c.baseMult + levelBonusMult
    mult += comboMult

    steps.push({
      type: 'combo_announce',
      label: level > 1
        ? `${c.name} (Lv${level}) — +${comboMult} mult`
        : `${c.name} — +${comboMult} mult`,
      chipsValue: chips,
      multValue: mult,
      delay: 800,
    })
  }

  // Step 2: Each played card adds GW points as chips (unless disabled by boss)
  for (let i = 0; i < playedCards.length; i++) {
    const card = playedCards[i]
    const disabled = isCardDisabledByBoss(card, bossEffect ?? null)
    const pointsToAdd = disabled ? 0 : Math.max(card.eventPoints, 0)
    chips += pointsToAdd
    steps.push({
      type: 'card_score',
      label: disabled
        ? `${card.webName} (blocked!)`
        : pointsToAdd > 0
          ? `${card.webName} +${pointsToAdd}pts`
          : `${card.webName} (0pts)`,
      cardIndex: i,
      chipsValue: chips,
      multValue: mult,
      delay: 400,
    })
  }

  // Step 3: Manager card effects — only fire if condition is met
  for (const mc of managerCards) {
    if (!checkCondition(mc.condition, playedCards)) continue

    if (mc.effectType === 'add_chips') {
      chips += mc.effectValue
      steps.push({
        type: 'manager_effect',
        label: `${mc.name}: +${mc.effectValue} chips`,
        chipsValue: chips,
        multValue: mult,
        delay: 400,
      })
    } else if (mc.effectType === 'add_mult') {
      mult += mc.effectValue
      steps.push({
        type: 'manager_effect',
        label: `${mc.name}: +${mc.effectValue} mult`,
        chipsValue: chips,
        multValue: mult,
        delay: 400,
      })
    } else if (mc.effectType === 'mult_mult') {
      mult = Math.round(mult * mc.effectValue)
      steps.push({
        type: 'manager_effect',
        label: `${mc.name}: ×${mc.effectValue} mult`,
        chipsValue: chips,
        multValue: mult,
        delay: 400,
      })
    }
  }

  // Step 4: Boss effect — halve mult
  if (bossEffect?.effectKey === 'halve_mult') {
    mult = Math.max(1, Math.floor(mult / 2))
    steps.push({
      type: 'manager_effect',
      label: `Boss: mult halved → ×${mult}`,
      chipsValue: chips,
      multValue: mult,
      delay: 400,
    })
  }

  // Final calculation
  const finalScore = chips * mult

  steps.push({
    type: 'final_calc',
    label: `${chips} × ${mult} = ${finalScore.toLocaleString()}`,
    chipsValue: chips,
    multValue: mult,
    delay: 600,
  })

  return {
    combo,
    steps,
    totalChips: chips,
    totalMult: mult,
    finalScore,
  }
}
