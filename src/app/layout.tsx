// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ui/theme-provider'

export const metadata: Metadata = {
  title:       'Fino — Finanças Inteligentes',
  description: 'Controle financeiro pessoal com IA para brasileiros',
  manifest:    '/manifest.json',
}

export const viewport: Viewport = {
  themeColor:   '#0A0A0A',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
