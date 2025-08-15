import { NextRequest, NextResponse } from 'next/server'
import merged from '@/data/merged.json'
import { norm } from '@/lib/norm'
import { LookupOk, LookupNoMatch } from '@/lib/types'

export const runtime = 'edge'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  // Cache positive + no_match for 12h at the edge/CDN layer
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=43200, stale-while-revalidate=86400')
  return res
}

type Entry = {
  code: string
  country: string
  plug_type: string[]
  voltage: string[]
  frequency: string[]
  cities?: string[]
  asciiname?: string[]
}

const data = merged as Entry[]
const lookup = new Map<string, Entry>()
for (const row of data) {
  const countryKey = norm(row.country)
  lookup.set(countryKey, row)
  lookup.set(norm(row.code), row)
  for (const city of row.cities ?? []) {
    const cityKey = norm(city)
    lookup.set(cityKey, row)
    lookup.set(`${cityKey} ${countryKey}`, row)
  }
  for (const city of row.asciiname ?? []) {
    const cityKey = norm(city)
    lookup.set(cityKey, row)
    lookup.set(`${cityKey} ${countryKey}`, row)
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const key = norm(q)
  if (!key) {
    const body: LookupNoMatch = { query: q, status: 'no_match' }
    return json(body)
  }

  const entry = lookup.get(key)
  if (!entry) {
    const body: LookupNoMatch = { query: q, status: 'no_match' }
    return json(body)
  }

  let city: string | undefined
  const countryKey = norm(entry.country)
  if (countryKey !== key && norm(entry.code) !== key) {
    const cityIdx = entry.cities?.findIndex(c => {
      const cKey = norm(c)
      return cKey === key || `${cKey} ${countryKey}` === key
    })
    if (cityIdx !== undefined && cityIdx >= 0 && entry.cities) {
      city = entry.cities[cityIdx]
    } else {
      const asciiIdx = entry.asciiname?.findIndex(c => {
        const cKey = norm(c)
        return cKey === key || `${cKey} ${countryKey}` === key
      })
      if (asciiIdx !== undefined && asciiIdx >= 0) {
        if (entry.cities && entry.cities[asciiIdx]) {
          city = entry.cities[asciiIdx]
        } else if (entry.asciiname) {
          city = entry.asciiname[asciiIdx]
        }
      }
    }
  }

  const spec = {
    plugTypes: entry.plug_type,
    voltage: entry.voltage.map(v => Number(v)),
    frequencyHz: Number(entry.frequency[0]),
  }

  const version = process.env.DATASET_VERSION || 'DATASET_SAMPLE_2025_08_10'
  const body: LookupOk = {
    query: q,
    resolved: { type: 'country', countryCode: entry.code, name: entry.country, city },
    spec,
    confidence: 1.0,
    version,
  }

  return json(body)
}
