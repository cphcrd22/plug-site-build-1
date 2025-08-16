'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from './icons'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('theme') as 'light' | 'dark' | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const stored = window.localStorage.getItem('theme')
    if (stored) return
    const listener = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('theme', nextTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="fixed right-4 top-4 rounded-full border border-neutral-200 bg-white p-2 text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:ring-neutral-400"
    >
      {mounted ? (theme === 'dark' ? <Sun /> : <Moon />) : null}
    </button>
  )
}
