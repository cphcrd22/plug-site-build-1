import { NextRequest, NextResponse } from 'next/server'
import aliases from '@/data/aliases.json'
import plugs from '@/data/plug-types.json'
import { norm } from '@/lib/norm'
import { LookupOk, LookupNoMatch } from '@/lib/types'

export const runtime = 'edge'

function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init)
  // Cache positive + no_match for 12h at the edge/CDN layer
  res.headers.set('Cache-Control', 'public, max-age=0, s-maxage=43200, stale-while-revalidate=86400')
  return res
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const key = norm(q)
  if (!key) {
    const body: LookupNoMatch = { query: q, status: 'no_match' }
    return json(body)
  }

  const cc = (aliases as Record<string, string>)[key]
  if (!cc) {
    const body: LookupNoMatch = { query: q, status: 'no_match' }
    return json(body)
  }

  const spec = (plugs as Record<string, any>)[cc]
  if (!spec) {
    // If alias exists without plug data, treat as no data (kept simple for sample)
    const body = { query: q, status: 'no_data_for_country', countryCode: cc }
    return json(body)
  }

  const version = process.env.DATASET_VERSION || 'DATASET_SAMPLE_2025_08_10'
  const body: LookupOk = {
    query: q,
    resolved: { type: 'country', countryCode: cc },
    spec,
    confidence: 1.0,
    version,
  }

  return json(body)
}
