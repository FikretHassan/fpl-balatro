import { ManagerCard, ManagerCardRarity, JokerCondition } from '@/types/game'
import { FPLBootstrapResponse } from '@/lib/fpl/types'
import { fetchManagerPicks, fetchSquadGWStats } from '@/lib/fpl/api'

interface JokerSource {
  playerId: number
  webName: string
  teamShortName: string
  gameweek: number
  points: number
  goals: number
  assists: number
  cleanSheets: number
  bonus: number
  wasCaptain: boolean
}

function determineRarity(source: JokerSource): ManagerCardRarity {
  if (source.points >= 15 || source.goals >= 3) return 'legendary'
  if (source.points >= 10 || source.wasCaptain) return 'rare'
  if (source.points >= 7) return 'uncommon'
  return 'common'
}

function determineEffect(source: JokerSource): {
  effectType: ManagerCard['effectType']
  effectValue: number
  condition: JokerCondition
  description: string
  name: string
} {
  // Legendary — massive hauls
  if (source.goals >= 3) {
    return {
      effectType: 'mult_mult', effectValue: 2.0, condition: 'has_scorer',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Hat-trick legend! ×2.0 mult when a scorer is played`,
    }
  }
  if (source.points >= 15) {
    return {
      effectType: 'mult_mult', effectValue: 1.75, condition: 'has_scorer',
      name: `${source.webName} GW${source.gameweek}`,
      description: `${source.points}pt haul! ×1.75 mult when a scorer is played`,
    }
  }

  // Captain picks
  if (source.wasCaptain && source.points >= 10) {
    return {
      effectType: 'mult_mult', effectValue: 1.5, condition: 'has_fwd',
      name: `Cpt ${source.webName} GW${source.gameweek}`,
      description: `Captaincy masterclass! ×1.5 mult when FWD played`,
    }
  }
  if (source.wasCaptain) {
    return {
      effectType: 'add_mult', effectValue: 3, condition: 'always',
      name: `Cpt ${source.webName} GW${source.gameweek}`,
      description: `Captain pick: +3 mult`,
    }
  }

  // Goal scorers
  if (source.goals >= 2) {
    return {
      effectType: 'add_mult', effectValue: 4, condition: 'has_fwd',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Brace! +4 mult when FWD played`,
    }
  }
  if (source.goals >= 1) {
    return {
      effectType: 'add_mult', effectValue: 3, condition: 'has_scorer',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Goal scorer: +3 mult when a scorer is played`,
    }
  }

  // Assists
  if (source.assists >= 2) {
    return {
      effectType: 'add_mult', effectValue: 3, condition: 'has_mid',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Assist king: +3 mult when MID played`,
    }
  }
  if (source.assists >= 1) {
    return {
      effectType: 'add_chips', effectValue: 20, condition: 'has_mid',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Playmaker: +20 chips when MID played`,
    }
  }

  // Clean sheets
  if (source.cleanSheets > 0) {
    return {
      effectType: 'add_chips', effectValue: 25, condition: 'has_def_or_gkp',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Clean sheet: +25 chips when DEF/GKP played`,
    }
  }

  // Bonus magnets
  if (source.bonus >= 3) {
    return {
      effectType: 'add_chips', effectValue: 15, condition: 'always',
      name: `${source.webName} GW${source.gameweek}`,
      description: `Max bonus! +15 chips`,
    }
  }

  // Fallback — solid performer
  return {
    effectType: 'add_chips', effectValue: Math.min(source.points, 10), condition: 'always',
    name: `${source.webName} GW${source.gameweek}`,
    description: `Reliable: +${Math.min(source.points, 10)} chips`,
  }
}

export async function generateJokers(
  managerId: string,
  gwEvents: number[],
  bootstrap: FPLBootstrapResponse
): Promise<ManagerCard[]> {
  const elementMap = new Map(bootstrap.elements.map((e) => [e.id, e]))
  const teamMap = new Map(bootstrap.teams.map((t) => [t.id, t]))
  const jokers: ManagerCard[] = []

  // Fetch picks + stats for each GW in parallel (batched)
  const batchSize = 3
  for (let i = 0; i < gwEvents.length; i += batchSize) {
    const batch = gwEvents.slice(i, i + batchSize)

    const results = await Promise.all(
      batch.map(async (gw) => {
        try {
          const { picks } = await fetchManagerPicks(managerId, gw)
          if (!picks) return []

          const playerIds = picks.picks.map((p) => p.element)
          const gwStats = await fetchSquadGWStats(playerIds, gw)
          const statsMap = new Map(gwStats.map((s) => [s.id, s.gwStats]))

          // Build sources for starting XI only
          const sources: JokerSource[] = picks.picks
            .filter((p) => p.position <= 11)
            .map((p) => {
              const el = elementMap.get(p.element)
              const team = el ? teamMap.get(el.team) : undefined
              const stats = statsMap.get(p.element)
              return {
                playerId: p.element,
                webName: el?.web_name ?? 'Unknown',
                teamShortName: team?.short_name ?? '???',
                gameweek: gw,
                points: stats?.total_points ?? 0,
                goals: stats?.goals_scored ?? 0,
                assists: stats?.assists ?? 0,
                cleanSheets: stats?.clean_sheets ?? 0,
                bonus: stats?.bonus ?? 0,
                wasCaptain: p.is_captain,
              }
            })

          // Top 2 by points
          sources.sort((a, b) => b.points - a.points)
          return sources.slice(0, 2)
        } catch {
          return []
        }
      })
    )

    for (const gwSources of results) {
      for (const source of gwSources) {
        const { effectType, effectValue, condition, name, description } = determineEffect(source)
        jokers.push({
          id: `joker-${source.playerId}-gw${source.gameweek}`,
          name,
          description,
          rarity: determineRarity(source),
          effectType,
          effectValue,
          condition,
        })
      }
    }
  }

  return jokers
}
