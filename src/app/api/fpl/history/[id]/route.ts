import { NextRequest, NextResponse } from 'next/server'

const FPL_BASE = 'https://fantasy.premierleague.com/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const res = await fetch(`${FPL_BASE}/entry/${id}/history/`)
    if (!res.ok) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'FPL API unavailable' }, { status: 503 })
  }
}
