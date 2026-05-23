// src/components/settings/settings-client.tsx
'use client'

import { useState } from 'react'
import { Loader2, Save, Gem, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/finance'

interface Props {
  profile:      any | null
  userPlan:     any | null
  user:         { name?: string | null; email?: string | null; image?: string | null }
  categories:   any[]
  budgetLimits: any[]
  currentMonth: string
}

export function SettingsClient({ profile, userPlan, user, categories, budgetLimits: initialLimits, currentMonth }: Props) {
  const [income,     setIncome]     = useState(profile?.monthlyIncome ?? 0)
  const [savingGoal, setSavingGoal] = useState(profile?.savingGoalPercent ?? 20)
  const [limits,     setLimits]     = useState<Record<string, number>>(
    Object.fromEntries(initialLimits.map(l => [l.categoryId, l.amount]))
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  async function handleSaveProfile() {
    setSaving(true)
    await fetch('/api/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ monthlyIncome: income, savingGoalPercent: savingGoal }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSaveLimits() {
    setSaving(true)
    await fetch('/api/budgets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ limits, month: currentMonth }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const plan = userPlan?.plan ?? 'FREE'
  const aiUsed = userPlan?.aiMessagesUsed ?? 0
  const aiLimit = userPlan?.aiMessagesLimit ?? 5

  return (
    <div className="space-y-1 pb-8">
      <div className="page-header mb-4">
        <h1 className="page-title">Ajustes</h1>
        <p className="page-sub">Configure seu perfil financeiro</p>
      </div>

      {/* ── PERFIL ── */}
      <div className="flex items-center gap-3 card p-4 mb-2">
        {user.image ? (
          <img src={user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-fino-bg4 flex items-center justify-center text-xl font-bold text-fino-txt1">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-fino-txt0">{user.name}</div>
          <div className="text-xs text-fino-txt2">{user.email}</div>
          <span className={`badge-${plan === 'PREMIUM' ? 'green' : 'amber'} mt-1`}>
            {plan === 'PREMIUM' ? '⭐ Premium' : '🆓 Plano Gratuito'}
          </span>
        </div>
      </div>

      {/* ── PLANO ── */}
      {plan === 'FREE' && (
        <>
          <p className="section-label">Uso do plano</p>
          <div className="card p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-fino-txt1">IA: {aiUsed}/{aiLimit} mensagens</span>
              <span className="text-fino-txt2">{userPlan?.transactionLimit ?? 50} transações/mês</span>
            </div>
            <div className="progress-wrap mb-3">
              <div className="progress-fill bg-fino-green" style={{ width: `${Math.min((aiUsed/aiLimit)*100, 100)}%` }} />
            </div>
            <Link href="/upgrade">
              <div className="flex items-center gap-2 p-3 rounded-md bg-fino-green/5 border border-fino-green/20 hover:bg-fino-green/10 transition-colors cursor-pointer">
                <Gem size={16} className="text-fino-green" />
                <div>
                  <div className="text-sm font-semibold text-fino-txt0">Upgrade para Premium</div>
                  <div className="text-xs text-fino-txt2">IA ilimitada · transações ilimitadas · relatórios avançados</div>
                </div>
                <span className="ml-auto text-fino-green text-sm">→</span>
              </div>
            </Link>
          </div>
        </>
      )}

      {/* ── RENDA E META ── */}
      <p className="section-label">Perfil financeiro</p>
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Renda mensal líquida (R$)</label>
          <input type="number" value={income} onChange={e => setIncome(+e.target.value)}
            className="input" placeholder="0" min={0} />
        </div>
        <div>
          <label className="label">Meta de poupança (%)</label>
          <input type="range" min={0} max={60} value={savingGoal}
            onChange={e => setSavingGoal(+e.target.value)}
            className="w-full accent-fino-green" />
          <div className="flex justify-between text-xs text-fino-txt2 mt-1">
            <span>0%</span>
            <span className="text-fino-green font-semibold">{savingGoal}% · {formatCurrency(income * savingGoal / 100)}/mês</span>
            <span>60%</span>
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? '✓ Salvo!' : <><Save size={15}/> Salvar perfil</>}
        </button>
      </div>

      {/* ── LIMITES POR CATEGORIA ── */}
      <p className="section-label">Limites por categoria (R$/mês)</p>
      <div className="card p-5 space-y-3">
        {categories.map(cat => (
          <div key={cat.id}>
            <label className="label">{cat.icon} {cat.name}</label>
            <input
              type="number"
              value={limits[cat.id] ?? ''}
              onChange={e => setLimits(prev => ({ ...prev, [cat.id]: +e.target.value }))}
              placeholder="Sem limite"
              className="input"
              min={0}
            />
          </div>
        ))}
        <button onClick={handleSaveLimits} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? '✓ Salvo!' : <><Save size={15}/> Salvar limites</>}
        </button>
      </div>

      {/* ── CONTA ── */}
      <p className="section-label">Conta</p>
      <div className="card p-4 space-y-2">
        <a href="/api/export" download
          className="btn-ghost flex items-center justify-center gap-2"
          style={{ textDecoration:'none', display:'flex' }}>
          📥 Exportar meus dados (CSV)
        </a>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-ghost flex items-center justify-center gap-2"
          style={{ color:'var(--red)', borderColor:'rgba(255,82,82,0.2)' }}
        >
          <LogOut size={15} /> Sair da conta
        </button>
        <p className="text-xs text-center" style={{ color:'var(--txt2)' }}>
          Para excluir sua conta,{' '}
          <a href="mailto:suporte@fino.app" style={{ color:'var(--green)' }}>entre em contato</a>.
          <br />Seus dados são protegidos conforme a LGPD.
        </p>
      </div>
    </div>
  )
}
