// src/components/layout/app-layout.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/components/ui/theme-provider'
import {
  LayoutDashboard, ArrowLeftRight, BarChart3,
  Sparkles, Settings, LogOut, Gem, Sun, Moon,
  CreditCard, Bell, TrendingUp,
} from 'lucide-react'
import type { Session } from 'next-auth'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Início',        icon: LayoutDashboard },
  { href: '/transactions', label: 'Lançamentos',   icon: ArrowLeftRight  },
  { href: '/investments',  label: 'Investimentos', icon: TrendingUp      },
  { href: '/debts',        label: 'Dívidas',       icon: CreditCard      },
  { href: '/charts',       label: 'Evolução',      icon: BarChart3       },
  { href: '/ai',           label: 'IA',            icon: Sparkles        },
]

export function AppLayout({ children, session }: { children: React.ReactNode; session: Session }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, toggle } = useTheme()

  function navigate(href: string) {
    router.push(href)
    router.refresh()
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ background: 'var(--green)', color: '#0A0A0A' }}>
              ƒ
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>
              fino
            </span>
            <span className="badge-green ml-auto text-[10px]">BETA</span>
          </div>
        </div>

        {/* Usuário */}
        <div className="px-4 py-3 mx-4 mb-4 rounded-xl" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'var(--txt0)' }}>{session.user?.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--txt2)' }}>Plano Gratuito</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {[...NAV_ITEMS, { href: '/settings', label: 'Ajustes', icon: Settings }].map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <button key={item.href} onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                style={{
                  background: active ? 'var(--green-dim)' : 'transparent',
                  color:      active ? 'var(--green)' : 'var(--txt1)',
                }}>
                <item.icon size={17} />
                {item.label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />}
              </button>
            )
          })}
        </nav>

        {/* Upgrade */}
        <div className="p-4">
          <button onClick={() => navigate('/upgrade')}
            className="w-full p-3 rounded-xl text-left transition-all"
            style={{ background: 'var(--purple-dim)', border: '1px solid rgba(124,77,255,0.2)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Gem size={14} style={{ color: 'var(--purple)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--purple)' }}>Upgrade Premium</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--txt2)' }}>IA ilimitada + relatórios avançados</p>
          </button>

          <div className="flex items-center justify-between mt-3 px-1">
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: 'var(--txt2)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={14} /> Sair
            </button>
            <button onClick={toggle} className="theme-toggle" style={{
              background: theme === 'light' ? 'var(--green)' : 'var(--border2)',
              width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
              position: 'relative', transition: 'background 0.3s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: theme === 'light' ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.3s',
              }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
              style={{ background: 'var(--green)', color: '#0A0A0A' }}>ƒ</div>
            <span className="text-base font-bold" style={{ color: 'var(--txt0)' }}>fino</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt1)' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt1)', position: 'relative' }}>
              <Bell size={18} />
            </button>
            <button onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer' }}>
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </button>
          </div>
        </header>

        {/* Scroll content */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 animate-fade-up">
            {children}
          </div>
        </div>
      </main>

      {/* ── BOTTOM NAV MOBILE ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-around px-2 pt-2 pb-3">
          {[
            { href: '/dashboard',    label: 'Início',     icon: LayoutDashboard },
            { href: '/transactions', label: 'Lançar',     icon: ArrowLeftRight  },
            { href: '/investments',  label: 'Carteira',   icon: TrendingUp      },
            { href: '/charts',       label: 'Evolução',   icon: BarChart3       },
            { href: '/ai',           label: 'IA',         icon: Sparkles        },
          ].map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <button key={item.href} onClick={() => navigate(item.href)} className="nav-item"
                style={{ color: active ? 'var(--green)' : 'var(--txt2)' }}>
                <div className="nav-item-icon"
                  style={{ background: active ? 'var(--green-dim)' : 'transparent' }}>
                  <item.icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
