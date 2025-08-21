'use client'

import { motion } from 'framer-motion'
import { flagEmoji } from '@/lib/flags'

const ORIGIN = {
  name: 'United States',
  plugTypes: ['Type A', 'Type B'],
}

const SUGGESTIONS = [
  {
    code: 'GB',
    name: 'United Kingdom',
    plugTypes: ['Type G'],
    voltage: '230V',
    frequency: '50Hz',
  },
  {
    code: 'JP',
    name: 'Japan',
    plugTypes: ['Type A', 'Type B'],
    voltage: '100V',
    frequency: '50/60Hz',
  },
  {
    code: 'MX',
    name: 'Mexico',
    plugTypes: ['Type A', 'Type B'],
    voltage: '127V',
    frequency: '60Hz',
  },
]

type Props = {
  onSelect: (country: string) => void
}

export function SmartSuggestions({ onSelect }: Props) {
  const origin = ORIGIN
  return (
    <div className="mt-6 w-full">
      <div className="mb-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span>Smart suggestions (from {origin.name})</span>
        <span>Swipe →</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SUGGESTIONS.map((s, i) => {
          const needsAdapter = !s.plugTypes.some(pt => origin.plugTypes.includes(pt))
          const p3Ready = s.code !== 'SZ' && s.code !== 'LS'
          return (
            <motion.button
              key={s.code}
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
              <div className="text-xs text-neutral-500 dark:text-neutral-400">{s.voltage} • {s.frequency}</div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-neutral-400 dark:text-neutral-500">Tap to autofill</span>
                <span className={`rounded-full px-2 py-0.5 ${p3Ready ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300'}`}>{p3Ready ? 'P3 Pro ready' : 'Check compatibility'}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
