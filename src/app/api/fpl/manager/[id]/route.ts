import { NextRequest, NextResponse } from 'next/server'

const FPL_BASE = 'https://fantasy.premierleague.com/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const event = searchParams.get('event')

  try {
    // Fetch manager info and picks in parallel
    const [infoRes, picksRes] = await Promise.all([
      fetch(`${FPL_BASE}/entry/${id}/`),
      event ? fetch(`${FPL_BASE}/entry/${id}/event/${event}/picks/`) : null,
    ])

    if (!infoRes.ok) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      )
    }

    const info = await infoRes.json()
    const picks = picksRes?.ok ? await picksRes.json() : null

    return NextResponse.json({ info, picks })
  } catch {
    return NextResponse.json(
      { error: 'FPL API unavailable' },
      { status: 503 }
    )
  }
}
