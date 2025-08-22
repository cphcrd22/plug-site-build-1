'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { flagEmoji } from '@/lib/flags'
import { ArrowLeft, ArrowRight } from './icons'

const ORIGIN = {
  name: 'United States',
  plugTypes: ['Type A', 'Type B'],
}

const SUGGESTIONS = [
  {
    code: 'GB',
    name: 'United Kingdom',
    plugTypes: ['Type G'],
  },
  {
    code: 'JP',
    name: 'Japan',
    plugTypes: ['Type A', 'Type B'],
  },
  {
    code: 'MX',
    name: 'Mexico',
    plugTypes: ['Type A', 'Type B'],
  },
  {
    code: 'TH',
    name: 'Bangkok',
    plugTypes: ['Type A', 'Type B', 'Type C', 'Type O'],
  },
  {
    code: 'TR',
    name: 'Istanbul',
    plugTypes: ['Type C', 'Type F'],
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    plugTypes: ['Type G', 'Type D', 'Type M'],
  },
  {
    code: 'SA',
    name: 'Mecca',
    plugTypes: ['Type G'],
  },
  {
    code: 'TR',
    name: 'Antalya',
    plugTypes: ['Type C', 'Type F'],
  },
  {
    code: 'AE',
    name: 'Dubai',
    plugTypes: ['Type G'],
  },
  {
    code: 'MO',
    name: 'Macau',
    plugTypes: ['Type D', 'Type F', 'Type G', 'Type M'],
  },
  {
    code: 'FR',
    name: 'Paris',
    plugTypes: ['Type C', 'Type E'],
  },
  {
    code: 'MY',
    name: 'Kuala Lumpur',
    plugTypes: ['Type C', 'Type G', 'Type M'],
  },
]

type Props = {
  onSelect: (country: string) => void
}

export function SmartSuggestions({ onSelect }: Props) {
  const origin = ORIGIN
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    update()
    el.addEventListener('scroll', update)
    return () => el.removeEventListener('scroll', update)
  }, [])

  return (
    <div className="mt-6 w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>Smart suggestions (from {origin.name})</span>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SUGGESTIONS.map((s, i) => {
            const needsAdapter = !s.plugTypes.some(pt => origin.plugTypes.includes(pt))
            const p3Ready = s.code !== 'SZ' && s.code !== 'LS'
            return (
              <motion.button
                key={s.code + i}
                onClick={() => onSelect(s.name)}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex w-64 shrink-0 flex-col rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none active:scale-95 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{flagEmoji(s.code)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${needsAdapter ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>{needsAdapter ? 'Needs adapter' : 'No adapter needed'}</span>
                </div>
                <div className="mt-2 text-lg font-semibold">{s.name}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">From {origin.name} → {needsAdapter ? 'Needs adapter' : 'No adapter needed'}</div>
                <div className="mt-2 mb-2 flex flex-wrap gap-1">
                  {s.plugTypes.map(pt => (
                    <span key={pt} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100">{pt}</span>
                  ))}
                </div>
                <div className="mt-3 flex justify-end text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${p3Ready ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300'}`}>{p3Ready ? 'P3 Pro ready' : 'Check compatibility'}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
        <button
          type="button"
          className={`absolute left-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200/70 bg-white/70 p-2 shadow-sm backdrop-blur-md hover:shadow-md dark:border-neutral-700/70 dark:bg-neutral-800/70 md:flex ${canScrollLeft ? '' : 'invisible'}`}
          onClick={() => scrollRef.current?.scrollBy({ left: -(scrollRef.current?.clientWidth ?? 0), behavior: 'smooth' })}
          aria-label="Scroll suggestions left"
        >
          <ArrowLeft />
        </button>
        <button
          type="button"
          className={`absolute right-0 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200/70 bg-white/70 p-2 shadow-sm backdrop-blur-md hover:shadow-md dark:border-neutral-700/70 dark:bg-neutral-800/70 md:flex ${canScrollRight ? '' : 'invisible'}`}
          onClick={() => scrollRef.current?.scrollBy({ left: scrollRef.current?.clientWidth ?? 0, behavior: 'smooth' })}
          aria-label="Scroll suggestions right"
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  )
}
