'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResultCard } from '@/components/ResultCard'
import { SearchBar, SearchBarHandle } from '@/components/SearchBar'
import { SmartSuggestions } from '@/components/SmartSuggestions'

type LookupOk = {
  query: string
  resolved: { type: 'country'; countryCode: string; name?: string; flag?: string; city?: string }
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
  const [results, setResults] = useState<LookupOk[]>([])
  const searchRef = useRef<SearchBarHandle>(null)

  async function onSubmit(q: string) {
    if (!q.trim()) return
    setError(null)
    setState('loading')

    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data: LookupOk | LookupNoMatch = await res.json()

      if ('status' in data) {
        setError('No exact match found.')
        setState('idle')
        return
      }

      setResults((prev) => [data, ...prev])
      setState('done')
      setTimeout(() => setState('idle'), 800)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setState('idle')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 sm:py-16 md:min-h-screen md:py-0 md:justify-center">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
        What plug type do I need?
      </h1>

        <SearchBar ref={searchRef} onSubmit={onSubmit} />

        <SmartSuggestions onSelect={(country) => searchRef.current?.search(country)} />

      <div className="mt-8 w-full space-y-4" aria-live="polite">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <AnimatePresence>
          {results.map((result) => (
            <motion.div
              key={result.version + result.resolved.countryCode + result.query}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ResultCard data={result} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

        {results.length > 0 && (
          <button
            onClick={() => {
              setResults([])
              setError(null)
            }}
            className="mt-4 text-xs text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Clear results
          </button>
        )}

        <a
          href="https://infinacore.com/products/p3-pro"
          target="_blank"
          rel="noreferrer"
          className="mt-12 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          Get the P3 Pro — works in every country
        </a>

        <footer className="mt-10 text-center text-xs text-neutral-500 dark:text-neutral-400">

        </footer>
      </div>
    )
  }
