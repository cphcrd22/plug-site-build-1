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
const entries: { key: string; name: string; country?: string }[] = []
const dedup = new Set<string>()
for (const row of data) {
  entries.push({ key: norm(row.country), name: row.country })

  for (const city of row.cities ?? []) {
    const cityKey = norm(city)
    const unique = `${cityKey}|${norm(row.country)}`
    if (!dedup.has(unique)) {
      dedup.add(unique)
      entries.push({ key: cityKey, name: city, country: row.country })
    }
  }

  for (const city of row.asciiname ?? []) {
    const cityKey = norm(city)
    const unique = `${cityKey}|${norm(row.country)}`
    if (!dedup.has(unique)) {
      dedup.add(unique)
      entries.push({ key: cityKey, name: city, country: row.country })
    }
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const key = norm(q)
  if (!key) return json({ suggestions: [] })

  const prefixMatches = entries
    .filter(e => e.key.startsWith(key) || e.key.split(' ').some(w => w.startsWith(key)))
    .sort((a, b) => {
      const aCountry = a.country ? 1 : 0
      const bCountry = b.country ? 1 : 0
      if (aCountry !== bCountry) return aCountry - bCountry
      return a.key.startsWith(key) === b.key.startsWith(key)
        ? a.key.localeCompare(b.key)
        : a.key.startsWith(key) ? -1 : 1
    })
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
