import './globals.css'
import Script from 'next/script'
import type { Metadata, Viewport } from 'next'
import { ThemeToggle } from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Plug Type Finder — Exact-Match MVP',
  description: 'Deterministic exact-match plug type lookup with sample data.',
  robots: { index: false, follow: false }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (() => {
              const stored = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (stored === 'dark' || (!stored && prefersDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-50">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
