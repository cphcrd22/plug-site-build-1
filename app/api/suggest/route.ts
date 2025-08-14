import { NextRequest, NextResponse } from 'next/server'
import merged from '@/data/merged.json'
import { norm } from '@/lib/norm'
import { damerauLevenshtein } from '@/lib/distance'

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

type Suggestion = {
  name: string
  country?: string
}

const data = merged as Entry[]
const entriesMap = new Map<string, Suggestion>()
for (const row of data) {
  entriesMap.set(norm(row.country), { name: row.country })
  for (const city of row.cities ?? []) {
    const key = norm(city)
    if (!entriesMap.has(key)) entriesMap.set(key, { name: city, country: row.country })
  }
  for (const city of row.asciiname ?? []) {
    const key = norm(city)
    if (!entriesMap.has(key)) entriesMap.set(key, { name: city, country: row.country })
  }
}
const entries = Array.from(entriesMap, ([key, s]) => ({ key, ...s }))

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const key = norm(q)
  if (!key) return json({ suggestions: [] })

  const prefixMatches = entries
    .filter(e => e.key.startsWith(key))
    .map(e => ({ ...e, distance: 0 }))

  const fuzzyMatches = key.length >= 3
    ? entries
        .filter(e => !e.key.startsWith(key))
        .map(e => ({ ...e, distance: damerauLevenshtein(key, e.key) }))
        .filter(e => e.distance <= 2)
        .sort((a, b) => a.distance - b.distance)
    : []

  const all = [...prefixMatches, ...fuzzyMatches]
    .slice(0, 10)
    .map(({ name, country }) => ({ name, country }))

  return json({ suggestions: all })
}
