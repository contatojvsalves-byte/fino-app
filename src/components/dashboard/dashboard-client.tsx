// src/components/dashboard/dashboard-client.tsx
'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/finance'
import type { MonthSummary, CategoryExpense, Alert, Transaction, Debt } from '@/types'
import { PatrimonyChart } from '@/components/charts/patrimony-chart'

interface Props {
  summary:    MonthSummary
  patrimony:  number
  categories: CategoryExpense[]
  alerts:     Alert[]
  recentTx:   Transaction[]
  debts:      Debt[]
  evolution:  { month: string; value: number }[]
  profile:    { monthlyIncome: number; savingGoalPercent: number; currency: string } | null
  userPlan:   any
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function DashboardClient({ summary, patrimony, categories, alerts, recentTx, debts, evolution, profile }: Props) {
  const router = useRouter()
  const now    = new Date()
  const h      = now.getHours()
  const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const monthName = MONTH_NAMES[now.getMonth()]
  const savingGoal = profile?.savingGoalPercent ?? 20
  const renda      = profile?.monthlyIncome ?? 0
  const savingMeta = renda * savingGoal / 100

  function navigate(href: string) { router.push(href); router.refresh() }

  return (
    <div className="space-y-1 pb-2">

      {/* ── GREETING ── */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm" style={{ color: 'var(--txt1)' }}>{greeting} 👋</p>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>
            Que bom te ver por aqui!
          </h1>
        </div>
      </div>

      {/* ── HERO CARD ── */}
      <div className="hero-card p-6 mb-2">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--green)', opacity: 0.7, letterSpacing: '0.08em' }}>
          SALDO TOTAL
        </p>
        <div className="flex items-end gap-3 mb-1">
          <div className="text-4xl font-bold tracking-tight font-mono" style={{ color: patrimony >= 0 ? 'var(--txt0)' : 'var(--red)', lineHeight: 1 }}>
            {formatCurrency(patrimony)}
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${summary.savingRate >= 0 ? 'badge-green' : 'badge-red'}`}>
            {summary.savingRate >= 0 ? '+' : ''}{summary.savingRate}%
          </span>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--txt1)' }}>em relação ao mês passado</p>

        {/* Mini chart */}
        <div style={{ height: 70, marginBottom: 16 }}>
          <PatrimonyChart data={evolution} mini />
        </div>

        {/* Pills receitas/despesas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={13} style={{ color: 'var(--green)' }} />
              <span className="text-xs" style={{ color: 'var(--txt1)' }}>Receitas</span>
            </div>
            <div className="text-base font-bold font-mono" style={{ color: 'var(--green)' }}>{formatCurrency(summary.totalIncome)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--green)', opacity: 0.6 }}>+{summary.savingRate}%</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.15)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={13} style={{ color: 'var(--red)' }} />
              <span className="text-xs" style={{ color: 'var(--txt1)' }}>Despesas</span>
            </div>
            <div className="text-base font-bold font-mono" style={{ color: 'var(--red)' }}>{formatCurrency(summary.totalExpense)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--red)', opacity: 0.6 }}>-3,1%</div>
          </div>
        </div>
      </div>

      {/* ── ALERTAS ── */}
      {alerts.length > 0 && (
        <>
          <p className="section-label">Alertas</p>
          <div className="space-y-2">
            {alerts.slice(0, 2).map(a => (
              <div key={a.id} className="card p-3 flex gap-3 items-start"
                style={{ borderColor: a.type === 'danger' ? 'rgba(255,82,82,0.2)' : 'rgba(255,179,0,0.2)' }}>
                <div className="text-lg">{a.type === 'danger' ? '🔴' : '🟡'}</div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: a.type === 'danger' ? 'var(--red)' : 'var(--amber)' }}>{a.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--txt1)' }}>{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── RESUMO DO MÊS ── */}
      <p className="section-label">Resumo do mês — {monthName}</p>
      <div className="card p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium" style={{ color: 'var(--txt1)' }}>
            Você gastou {summary.totalExpense > 0 && renda > 0 ? Math.round(summary.totalExpense / renda * 100) : 0}% do seu limite mensal
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>
            {summary.totalExpense > 0 && renda > 0 ? Math.round(summary.totalExpense / renda * 100) : 0}%
          </span>
        </div>
        <div className="progress-wrap">
          <div className="progress-fill" style={{
            width: `${Math.min(renda > 0 ? summary.totalExpense / renda * 100 : 0, 100)}%`,
            background: summary.totalExpense > renda ? 'var(--red)' : 'var(--green)',
          }} />
        </div>

        {/* Categorias */}
        {categories.length > 0 && (
          <div className="mt-4 space-y-3">
            {categories.slice(0, 4).map(c => (
              <div key={c.categoryId}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--txt1)' }}>{c.icon} {c.categoryName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold" style={{ color: 'var(--txt0)' }}>{formatCurrency(c.total)}</span>
                    {c.limit && <span style={{ color: 'var(--txt2)' }}>{c.limitPercent}%</span>}
                  </div>
                </div>
                {c.limit && (
                  <div className="progress-wrap" style={{ height: 4 }}>
                    <div className="progress-fill" style={{
                      width: `${Math.min(c.limitPercent ?? 0, 100)}%`,
                      background: (c.limitPercent ?? 0) >= 100 ? 'var(--red)' : (c.limitPercent ?? 0) >= 80 ? 'var(--amber)' : c.color,
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DICA DA IA ── */}
      <p className="section-label">Dica da IA ✦</p>
      <button onClick={() => navigate('/ai')} className="card p-4 w-full text-left transition-all hover:scale-[1.01]"
        style={{ border: '1px solid rgba(124,77,255,0.2)', background: 'var(--purple-dim)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={15} style={{ color: 'var(--purple)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--purple)' }}>Fino IA</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--txt0)', lineHeight: 1.6 }}>
          {categories.length > 0
            ? `Seus gastos com ${categories[0]?.categoryName ?? 'alimentação'} representam ${categories[0]?.percentage ?? 0}% do total. Quer ver como otimizar?`
            : 'Adicione suas transações para receber insights personalizados sobre suas finanças.'
          }
        </p>
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: 'var(--purple)' }}>
          Ver sugestões <ChevronRight size={13} />
        </div>
      </button>

      {/* ── TRANSAÇÕES RECENTES ── */}
      <div className="flex items-center justify-between">
        <p className="section-label mb-0">Últimas transações</p>
        <button onClick={() => navigate('/transactions')} className="text-xs font-semibold"
          style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Ver todas →
        </button>
      </div>

      <div className="card divide-y divide-white/[0.07]">
        {recentTx.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm" style={{ color: 'var(--txt2)' }}>Nenhuma transação ainda.</p>
            <button onClick={() => navigate('/transactions')} className="text-sm font-semibold mt-2"
              style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Adicionar primeira →
            </button>
          </div>
        ) : recentTx.map((tx, i) => (
          <div key={tx.id} className="flex items-center gap-3 p-3.5"
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: `${tx.category.color}18` }}>
              {tx.category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--txt0)' }}>{tx.description}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--txt2)' }}>
                {tx.category.name} · {new Date(tx.date).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold font-mono" style={{ color: tx.type === 'INCOME' ? 'var(--green)' : 'var(--red)' }}>
                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
              </div>
              {tx.type === 'INCOME'
                ? <ArrowUpRight size={12} style={{ color: 'var(--green)', marginLeft: 'auto' }} />
                : <ArrowDownRight size={12} style={{ color: 'var(--red)', marginLeft: 'auto' }} />
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
