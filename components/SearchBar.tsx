'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Spinner, XMark } from './icons'

type Suggestion = {
  name: string
  country?: string
}

export function SearchBar({ onSubmit }: { onSubmit: (q: string) => void }) {
  const [q, setQ] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [disableSuggest, setDisableSuggest] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ITEM_H = 44
  const markerY = highlight >= 0 ? highlight * ITEM_H : -9999

  useEffect(() => {
    let t: number | undefined
    if (!q.trim() || disableSuggest) {
      setSuggestions([])
      setOpen(false)
      setHighlight(-1)
      return
    }
    // small debounce
    t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
        const j = await r.json()
        setSuggestions(j.suggestions ?? [])
        setOpen((j.suggestions ?? []).length > 0)
        setHighlight((j.suggestions ?? []).length ? 0 : -1)
      } catch {
        setSuggestions([])
        setOpen(false)
      }
    }, 120)
    return () => clearTimeout(t)
  }, [q, disableSuggest])

  function handleSubmit(value: string) {
    if (!value.trim()) return
    inputRef.current?.blur()
    setState('loading')
    onSubmit(value)
    // state will be flipped to done by parent via props? We keep local animation:
    setTimeout(() => setState('done'), 600)
    setTimeout(() => setState('idle'), 1200)
    setOpen(false)
    setDisableSuggest(true)
    setSuggestions([])
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) setOpen(true)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(h => Math.min((suggestions.length ? suggestions.length - 1 : -1), h + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(h => Math.max(0, h - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && highlight >= 0 && suggestions[highlight]) {
        selectSuggestion(suggestions[highlight])
      } else {
        handleSubmit(q)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlight(-1)
    }
  }

  function selectSuggestion(s: Suggestion) {
    setDisableSuggest(true)
    const value = s.country ? `${s.name}, ${s.country}` : s.name
    setQ(value)
    setOpen(false)
    setSuggestions([])
    handleSubmit(value)
  }

  return (
    <div className="relative w-full">
      <label htmlFor="where" className="sr-only">Destination</label>
      <div className="flex w-full items-center rounded-full border border-neutral-200 bg-white pl-5 pr-2 shadow-sm transition-shadow duration-150 dark:border-neutral-700 dark:bg-neutral-800">
        <input
          id="where"
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setDisableSuggest(false)
            setQ(e.target.value)
          }}
          onKeyDown={onKeyDown}
          placeholder="I’m going to…"
          autoComplete="off"
          className="h-14 w-full rounded-full bg-transparent text-base outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="suggest-list"
          aria-activedescendant={highlight >= 0 ? `suggest-${highlight}` : undefined}
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            title="Clear"
            onClick={() => {
              setQ('')
              setSuggestions([])
              setOpen(false)
              setHighlight(-1)
              setDisableSuggest(false)
              inputRef.current?.focus()
            }}
            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            <XMark />
          </button>
        )}
        <button
          aria-label="Search"
          onClick={() => handleSubmit(q)}
          className="ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-transform duration-100 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-600 active:scale-95"
          disabled={state === 'loading'}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {state === 'loading' && (
              <motion.span key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                <Spinner />
              </motion.span>
            )}
            {state === 'done' && (
              <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1.05 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                <Check />
              </motion.span>
            )}
            {state === 'idle' && (
              <motion.span key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <ArrowRight />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            id="suggest-list"
            role="listbox"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.12 }}
            className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg relative dark:border-neutral-700 dark:bg-neutral-800"
            style={{ height: Math.min(8, suggestions.length) * ITEM_H }}
          >
            {highlight >= 0 && (
              <motion.div
                layout
                aria-hidden
                initial={false}
                animate={{ y: markerY }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="pointer-events-none absolute left-0 top-0 h-11 w-full rounded-md bg-neutral-100 dark:bg-neutral-700"
              />
            )}
            <div className="absolute inset-0 overflow-auto">
              {suggestions.map((s, i) => (
                <motion.li
                  key={s.name}
                  id={`suggest-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  className="relative z-[1] flex h-11 cursor-pointer items-center gap-3 px-4 text-sm"
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                >
                  <span className="truncate">
                    {s.name}
                    {s.country && <span className="text-neutral-500 dark:text-neutral-400">, {s.country}</span>}
                  </span>
                </motion.li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
