import { NextResponse } from 'next/server'

const FPL_BASE = 'https://fantasy.premierleague.com/api'

export async function GET() {
  try {
    const res = await fetch(`${FPL_BASE}/bootstrap-static/`, {
      next: { revalidate: 3600 }, // cache 1 hour
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch FPL data' },
        { status: res.status }
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
