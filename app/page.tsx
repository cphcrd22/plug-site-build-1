'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResultCard } from '@/components/ResultCard'
import { SearchBar } from '@/components/SearchBar'

type LookupOk = {
  query: string
  resolved: { type: 'country'; countryCode: string; name?: string; flag?: string }
  spec: {
    plugTypes: string[]
    voltage: [number, number] | [number, number, number] | number[]
    frequencyHz: number
    notes?: string
    lastVerified?: string
    sources?: string[]
  }
  confidence: number
  version: string
}

type LookupNoMatch = { query: string; status: 'no_match' } | { query: string; status: 'no_data_for_country'; countryCode: string }

export default function Page() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<LookupOk | null>(null)

  async function onSubmit(q: string) {
    if (!q.trim()) return
    setError(null)
    setResult(null)
    setState('loading')

    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data: LookupOk | LookupNoMatch = await res.json()

      if ('status' in data) {
        setError('No exact match found.')
        setState('idle')
        return
      }

      setResult(data)
      setState('done')
      setTimeout(() => setState('idle'), 800)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setState('idle')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 sm:py-16">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
        What plug type do I need?
      </h1>

      <SearchBar onSubmit={onSubmit} />

      <p className="mt-3 text-sm text-neutral-600">
        Type a <em>country</em> or common alias (e.g., <span className="italic">UK</span>, <span className="italic">Holland</span>).
      </p>

      <div className="mt-8 w-full" aria-live="polite">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              key={result.version + result.resolved.countryCode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ResultCard data={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-10 text-center text-xs text-neutral-500">
        Demo uses SAMPLE data. Exact-match only. No fuzzy yet.
      </footer>
    </div>
  )
}
