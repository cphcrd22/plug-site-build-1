'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResultCard } from '@/components/ResultCard'
import { SearchBar, SearchBarHandle } from '@/components/SearchBar'
import { SmartSuggestions, SUGGESTION_NAMES } from '@/components/SmartSuggestions'

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
  const [showSuggestions, setShowSuggestions] = useState(true)
  const searchRef = useRef<SearchBarHandle>(null)
  const [titleIndex, setTitleIndex] = useState(0)
  const locations = SUGGESTION_NAMES

  useEffect(() => {
    const id = setInterval(() => {
      setTitleIndex((i) => (i + 1) % locations.length)
    }, 3000)
    return () => clearInterval(id)
  }, [locations.length])

  async function onSubmit(q: string, fromSuggestion?: boolean) {
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
      if (!fromSuggestion) setShowSuggestions(false)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setState('idle')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12 sm:py-16 md:min-h-screen md:py-0 md:justify-center">
      <h1 className="mb-8 flex flex-wrap items-baseline justify-center text-center text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">
        <span className="flex-none">What plug do I need for</span>
        <span className="ml-1 min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              type="button"
              key={locations[titleIndex]}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="block underline cursor-pointer"
              onClick={() => searchRef.current?.search(locations[titleIndex])}
            >
              {locations[titleIndex]}
            </motion.button>
          </AnimatePresence>
        </span>
        <span className="flex-none">?</span>
      </h1>

        <SearchBar ref={searchRef} onSubmit={onSubmit} />

        {showSuggestions ? (
          <SmartSuggestions
            onSelect={(query) => searchRef.current?.search(query)}
            onHide={() => setShowSuggestions(false)}
          />
        ) : (
          <button
            onClick={() => setShowSuggestions(true)}
            className="mt-6 text-xs text-neutral-500 underline hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Show smart suggestions
          </button>
        )}

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

        <footer className="mt-10 text-center text-xs text-neutral-500 dark:text-neutral-400">

        </footer>
      </div>
    )
  }
