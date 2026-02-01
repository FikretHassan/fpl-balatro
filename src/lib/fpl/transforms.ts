import { PlayerCard, POSITION_MAP } from '@/types/game'
import { FPLElement, FPLPick, FPLTeam } from './types'
import { GWPlayerStats } from './api'

export function transformToPlayerCards(
  picks: FPLPick[],
  elements: FPLElement[],
  teams: FPLTeam[],
  gameweek: number,
  gwStats?: GWPlayerStats[]
): PlayerCard[] {
  const elementMap = new Map(elements.map((e) => [e.id, e]))
  const teamMap = new Map(teams.map((t) => [t.id, t]))
  const gwMap = new Map(gwStats?.map((s) => [s.id, s.gwStats]) ?? [])

  return picks.map((pick) => {
    const el = elementMap.get(pick.element)
    if (!el) throw new Error(`Player ${pick.element} not found`)

    const team = teamMap.get(el.team)
    if (!team) throw new Error(`Team ${el.team} not found`)

    const gw = gwMap.get(el.id)

    return {
      id: el.id,
      cardId: `${el.id}-gw${gameweek}`,
      gameweek,
      webName: el.web_name,
      firstName: el.first_name,
      secondName: el.second_name,
      position: POSITION_MAP[el.element_type] ?? 'MID',
      team: team.name,
      teamShortName: team.short_name,
      teamId: el.team,

      // Per-GW stats from element-summary, fallback to 0
      eventPoints: gw?.total_points ?? el.event_points,
      goalsScored: gw?.goals_scored ?? 0,
      assists: gw?.assists ?? 0,
      cleanSheets: gw?.clean_sheets ?? 0,
      bonus: gw?.bonus ?? 0,
      minutesPlayed: gw?.minutes ?? 0,

      totalPoints: el.total_points,
      form: parseFloat(el.form) || 0,
      ictIndex: parseFloat(el.ict_index) || 0,
      influence: parseFloat(el.influence) || 0,
      creativity: parseFloat(el.creativity) || 0,
      threat: parseFloat(el.threat) || 0,

      nowCost: el.now_cost,
      selectedByPercent: parseFloat(el.selected_by_percent) || 0,
      inDreamteam: el.in_dreamteam,

      isPenaltyTaker: el.penalties_order != null && el.penalties_order <= 1,
      isCornerTaker:
        el.corners_and_indirect_freekicks_order != null &&
        el.corners_and_indirect_freekicks_order <= 1,
      isFreekickTaker:
        el.direct_freekicks_order != null &&
        el.direct_freekicks_order <= 1,

      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain,
    }
  })
}
