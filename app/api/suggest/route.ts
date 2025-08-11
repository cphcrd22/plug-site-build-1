import { NextRequest, NextResponse } from 'next/server'
import aliases from '@/data/aliases.json'
import { norm } from '@/lib/norm'

export const runtime = 'edge'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  // Cache suggestions for 6h
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400')
  return res
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const key = norm(q)
  if (!key) return json({ suggestions: [] })

  const allKeys = Object.keys(aliases as Record<string, string>)
  // prefix-only, exact tokens, no fuzzy
  const suggestions = allKeys.filter(k => k.startsWith(key)).slice(0, 10)
  return json({ suggestions })
}
