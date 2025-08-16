import './globals.css'
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();`
          }}
        />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  )
}
