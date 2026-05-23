// src/app/upgrade/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Check, Zap, Crown, Sparkles } from 'lucide-react'

const FREE_FEATURES = [
  '50 transações por mês',
  '5 mensagens de IA por mês',
  'Dashboard financeiro completo',
  'Controle de dívidas',
  'Gráficos básicos',
]
const PREMIUM_FEATURES = [
  'Transações ilimitadas',
  'IA ilimitada e avançada',
  'Relatórios detalhados em PDF',
  'Alertas inteligentes',
  'Categorias personalizadas',
  'Exportação de dados CSV',
  'Open Finance (em breve)',
  'Suporte prioritário',
]

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <AppLayout session={session}>
      <div className="max-w-md mx-auto pb-8">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ background: 'var(--purple-dim)', border: '1px solid rgba(124,77,255,0.2)' }}>
            <Crown size={28} style={{ color: 'var(--purple)' }} />
          </div>
          <h1 className="page-title text-2xl mb-2">Escolha seu plano</h1>
          <p className="page-sub">Comece de graça. Faça upgrade quando precisar.</p>
        </div>

        {/* FREE */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>Gratuito</div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--txt0)' }}>
                R$ 0<span className="text-sm font-normal" style={{ color: 'var(--txt2)' }}>/mês</span>
              </div>
            </div>
            <span className="badge-amber">Plano atual</span>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--txt1)' }}>
                <Check size={14} style={{ color: 'var(--txt2)', flexShrink: 0 }} />{f}
              </li>
            ))}
          </ul>
        </div>

        {/* PREMIUM */}
        <div className="card p-5 relative overflow-hidden"
          style={{ border: '1px solid rgba(124,77,255,0.3)', background: 'linear-gradient(135deg, rgba(124,77,255,0.05) 0%, var(--bg-card) 100%)' }}>
          <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)' }}>
            <span className="badge-purple px-3 py-1" style={{ fontSize: 10, fontWeight: 700 }}>✦ RECOMENDADO</span>
          </div>
          <div className="flex items-start justify-between mb-4 mt-2">
            <div>
              <div className="flex items-center gap-2">
                <Zap size={16} style={{ color: 'var(--purple)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--txt0)' }}>Premium</span>
              </div>
              <div className="text-2xl font-bold mt-1" style={{ color: 'var(--txt0)' }}>
                R$ 19,90<span className="text-sm font-normal" style={{ color: 'var(--txt2)' }}>/mês</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--txt2)' }}>ou R$ 179/ano — economize 25%</div>
            </div>
          </div>
          <ul className="space-y-2.5 mb-5">
            {PREMIUM_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--txt0)' }}>
                <Check size={14} style={{ color: 'var(--purple)', flexShrink: 0 }} />{f}
              </li>
            ))}
          </ul>
          <button className="btn-purple flex items-center justify-center gap-2">
            <Sparkles size={15} /> Assinar Premium — R$ 19,90/mês
          </button>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--txt2)' }}>Cancele quando quiser. Sem multa.</p>

          {/* Glow */}
          <div style={{
            position: 'absolute', bottom: -40, right: -40,
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,77,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Features highlight */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { icon: '🤖', title: 'IA Avançada',    desc: 'Sem limites de mensagens' },
            { icon: '🔒', title: '100% Seguro',    desc: 'Dados criptografados' },
            { icon: '📊', title: 'Insights reais', desc: 'Análises personalizadas' },
            { icon: '🎨', title: 'Design Premium', desc: 'Experiência exclusiva' },
          ].map(f => (
            <div key={f.title} className="card p-3">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-xs font-semibold" style={{ color: 'var(--txt0)' }}>{f.title}</div>
              <div className="text-xs" style={{ color: 'var(--txt2)' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--txt2)' }}>
          Pagamento seguro via Stripe e Mercado Pago. Protegido pela LGPD.
        </p>
      </div>
    </AppLayout>
  )
}
