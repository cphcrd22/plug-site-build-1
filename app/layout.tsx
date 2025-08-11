import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plug Type Finder — Exact-Match MVP',
  description: 'Deterministic exact-match plug type lookup with sample data.',
  robots: { index: false, follow: false }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  )
}
