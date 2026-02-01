import { NextResponse } from 'next/server'

const FPL_BASE = 'https://fantasy.premierleague.com/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const res = await fetch(`${FPL_BASE}/element-summary/${id}/`)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'FPL API unavailable' },
      { status: 503 }
    )
  }
}
