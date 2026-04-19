import { NextResponse } from 'next/server'
import { AMEEX_CITIES } from '@/lib/ameex/cities'

export async function GET() {
  const list = Object.entries(AMEEX_CITIES).map(([name, id]) => ({ id, name }))
  return NextResponse.json({ cities: list })
}
