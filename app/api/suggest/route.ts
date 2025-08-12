import { NextRequest, NextResponse } from 'next/server'
import merged from '@/data/merged.json'
import { norm } from '@/lib/norm'

export const runtime = 'edge'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  // Cache suggestions for 6h
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400')
  return res
}

type Entry = {
  country: string
  cities?: string[]
  asciiname?: string[]
}
const data = merged as Entry[]
const entriesMap = new Map<string, string>()
for (const row of data) {
  entriesMap.set(norm(row.country), row.country)
  for (const city of row.cities ?? []) {
    const key = norm(city)
    if (!entriesMap.has(key)) entriesMap.set(key, city)
  }
  for (const city of row.asciiname ?? []) {
    const key = norm(city)
    if (!entriesMap.has(key)) entriesMap.set(key, city)
  }
}
const entries = Array.from(entriesMap, ([key, name]) => ({ key, name }))

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const key = norm(q)
  if (!key) return json({ suggestions: [] })

  // prefix-only, exact tokens, no fuzzy
  const suggestions = entries
    .filter(e => e.key.startsWith(key))
    .slice(0, 10)
    .map(e => e.name)
  return json({ suggestions })
}
