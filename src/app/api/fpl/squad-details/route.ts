import { NextRequest, NextResponse } from 'next/server'

const FPL_BASE = 'https://fantasy.premierleague.com/api'

/**
 * Fetches element-summary for multiple players in parallel.
 * Query: ?ids=1,2,3&event=24
 * Returns per-GW stats for each player.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean)
  const event = Number(searchParams.get('event'))

  if (!ids || ids.length === 0 || !event) {
    return NextResponse.json({ error: 'Missing ids or event param' }, { status: 400 })
  }

  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`${FPL_BASE}/element-summary/${id}/`)
        if (!res.ok) return { id, gwStats: null }
        const data = await res.json()
        // Find the matching gameweek entry
        const gwEntry = data.history?.find(
          (h: { round: number }) => h.round === event
        )
        return { id, gwStats: gwEntry ?? null }
      })
    )

    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch player details' }, { status: 503 })
  }
}
