'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from './icons'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [theme])

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('theme')
      if (!stored) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mql.addEventListener('change', listener)
    return () => mql.removeEventListener('change', listener)
  }, [])

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-full p-2 text-neutral-600 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  )
}
