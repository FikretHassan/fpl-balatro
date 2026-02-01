// Raw FPL API response types

export interface FPLBootstrapResponse {
  elements: FPLElement[]
  teams: FPLTeam[]
  events: FPLEvent[]
  element_types: FPLElementType[]
}

export interface FPLElement {
  id: number
  code: number
  web_name: string
  first_name: string
  second_name: string
  team: number
  element_type: number // 1=GK, 2=DEF, 3=MID, 4=FWD
  photo: string

  // Performance
  total_points: number
  event_points: number
  points_per_game: string
  goals_scored: number
  assists: number
  clean_sheets: number
  bonus: number
  bps: number
  minutes: number
  starts: number

  // Cards / penalties
  yellow_cards: number
  red_cards: number
  penalties_saved: number
  penalties_missed: number
  own_goals: number
  goals_conceded: number
  saves: number

  // Form / value
  form: string
  value_form: string
  value_season: string
  now_cost: number
  cost_change_start: number
  selected_by_percent: string

  // ICT
  influence: string
  creativity: string
  threat: string
  ict_index: string

  // Expected
  expected_goals: string
  expected_assists: string
  expected_goal_involvements: string
  expected_goals_conceded: string

  // Dream team
  in_dreamteam: boolean
  dreamteam_count: number

  // Set pieces
  corners_and_indirect_freekicks_order: number | null
  direct_freekicks_order: number | null
  penalties_order: number | null

  // Status
  status: string // a, i, s, u, d
  chance_of_playing_this_round: number | null
  chance_of_playing_next_round: number | null
}

export interface FPLTeam {
  id: number
  code: number
  name: string
  short_name: string
  strength: number
  strength_overall_home: number
  strength_overall_away: number
  strength_attack_home: number
  strength_attack_away: number
  strength_defence_home: number
  strength_defence_away: number
  position: number
  played: number
  win: number
  draw: number
  loss: number
  points: number
}

export interface FPLEvent {
  id: number
  name: string
  deadline_time: string
  finished: boolean
  data_checked: boolean
  is_current: boolean
  is_next: boolean
  is_previous: boolean
  average_entry_score: number
  highest_score: number
  most_selected: number | null
  most_captained: number | null
  most_vice_captained: number | null
  most_transferred_in: number | null
  top_element: number | null
}

export interface FPLElementType {
  id: number
  plural_name: string
  plural_name_short: string
  singular_name: string
  singular_name_short: string
  squad_select: number
  squad_min_play: number
  squad_max_play: number
  element_count: number
}

export interface FPLManagerPicksResponse {
  active_chip: string | null
  automatic_subs: unknown[]
  entry_history: {
    event: number
    points: number
    total_points: number
    rank: number
    overall_rank: number
    bank: number
    value: number
    event_transfers: number
    event_transfers_cost: number
    points_on_bench: number
  }
  picks: FPLPick[]
}

export interface FPLPick {
  element: number
  position: number // 1-15, 1-11 are starting, 12-15 are bench
  multiplier: number // 0=bench, 1=normal, 2=captain, 3=triple captain
  is_captain: boolean
  is_vice_captain: boolean
}

export interface FPLManagerInfo {
  id: number
  player_first_name: string
  player_last_name: string
  name: string // team name
  current_event: number
  leagues?: {
    classic?: FPLManagerLeague[]
    h2h?: FPLManagerLeague[]
  }
}

export interface FPLManagerLeague {
  id: number
  name: string
  entry_rank: number
  entry_last_rank: number
}

export interface FPLHistoryResponse {
  current: FPLHistoryGW[]
  past: unknown[]
  chips: { name: string; time: string; event: number }[]
}

export interface FPLHistoryGW {
  event: number
  points: number
  total_points: number
  rank: number
  overall_rank: number
  bank: number
  value: number
  event_transfers: number
  event_transfers_cost: number
  points_on_bench: number
}

// League types

export interface FPLLeagueStandingsResponse {
  standings: {
    results: FPLLeagueEntry[]
    has_next: boolean
  }
  league: {
    id: number
    name: string
  }
}

export interface FPLLeagueEntry {
  id: number
  entry: number       // the manager's FPL entry ID
  entry_name: string
  player_name: string
  rank: number
  total: number
  event_total: number
}
