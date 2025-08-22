'use client'

import { motion } from 'framer-motion'
import { Bolt, Wave } from './icons'
import { flagEmoji } from '@/lib/flags'

export function ResultCard({ data }: { data: {
  query: string
  resolved: { type: 'country'; countryCode: string; name?: string; flag?: string; city?: string }
  spec: { plugTypes: string[]; voltage: number[]; frequencyHz: number; notes?: string; lastVerified?: string; sources?: string[] }
  confidence: number
  version: string
}}) {
  const { resolved, spec } = data
  const verified = spec.lastVerified ? new Date(spec.lastVerified).toLocaleDateString() : '—'
  const location = resolved.city || resolved.name || resolved.countryCode
  const country = resolved.name || resolved.countryCode
  const showP3Pro = resolved.countryCode !== 'SZ' && resolved.countryCode !== 'LS'

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="text-2xl">{flagEmoji(resolved.countryCode)}</span>
        <span>
          {resolved.city ? `${resolved.city}, ` : ''}
          {resolved.name ?? resolved.countryCode}
        </span>
      </div>
        <div className="text-xs text-neutral-500 sm:text-right dark:text-neutral-400">
          <div>Source: International Electrotechnical Commission</div>
          <div>Last updated September 2025</div>
        </div>
      </div>


      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Type(s)</span>
          <div className="flex flex-wrap gap-2">
            {spec.plugTypes.map((t) => (
              <motion.span
                key={t}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-neutral-200 bg-white px-3 text-sm font-semibold shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
              >
                {t}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Bolt />
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Voltage</div>
            <div className="text-base font-semibold">
              {spec.voltage.length === 2
                ? `${spec.voltage[0]}–${spec.voltage[1]} V`
                : spec.voltage.join(', ') + ' V'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wave />
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Frequency</div>
            <div className="text-base font-semibold">{spec.frequencyHz} Hz</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
            <span>More details</span>
            <span aria-hidden className="ml-2 transition-transform group-open:rotate-90">▶</span>
          </summary>
          <div className="pt-2 text-sm text-neutral-700 dark:text-neutral-300">
            <p className="mb-2"><strong>Safety tip:</strong> <em>Adapters change shape; converters change voltage.</em> US devices (120V) in 230V regions need a converter, not just an adapter.</p>
            {spec.notes && <p className="mb-2">{spec.notes}</p>}
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Confidence: {(data.confidence * 100).toFixed(0)}%</p>
          </div>
        </details>
      </div>

      {showP3Pro && (
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="text-center sm:text-left">
              {`Want a charger for ${location}? `}
              <strong>P3 Pro</strong>
              {` works in ${country} — and anywhere else.`}
            </span>
            <a
              className="group relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1.5 font-medium text-white hover:bg-emerald-600"
              href="https://infinacore.com/products/p3-pro"
              target="_blank"
              rel="noreferrer"
            >
              <span className="relative z-10">Learn more ↗</span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.35),transparent)] opacity-0 transition duration-700 group-hover:translate-x-full group-hover:opacity-100"
                style={{ animation: 'shimmer 1.2s linear infinite' }}
              />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
