// src/components/onboarding/onboarding-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/finance'

interface Category { id:string; name:string; icon:string; color:string; type:string }

interface Props {
  userName:   string
  categories: Category[]
}

const STEPS = ['Boas-vindas', 'Renda e meta', 'Limites', 'Primeira transação', 'Pronto!']

export function OnboardingClient({ userName, categories }: Props) {
  const router  = useRouter()
  const [step,  setStep]  = useState(0)
  const [loading, setLoading] = useState(false)

  // Step 1 — perfil
  const [income,     setIncome]     = useState('')
  const [savingGoal, setSavingGoal] = useState(20)

  // Step 2 — limites
  const [limits, setLimits] = useState<Record<string, number>>({})

  // Step 3 — primeira transação
  const [txType,   setTxType]   = useState<'INCOME'|'EXPENSE'>('INCOME')
  const [txAmount, setTxAmount] = useState('')
  const [txDesc,   setTxDesc]   = useState('')
  const [txCatId,  setTxCatId]  = useState('')
  const [skipTx,   setSkipTx]   = useState(false)

  const expenseCats = categories.filter(c => c.type === 'EXPENSE')
  const incomeCats  = categories.filter(c => c.type === 'INCOME')
  const filteredCats = txType === 'INCOME' ? incomeCats : expenseCats

  async function saveProfile() {
    if (!income || +income <= 0) { alert('Informe sua renda mensal.'); return }
    setLoading(true)
    try {
      await fetch('/api/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ monthlyIncome: +income, savingGoalPercent: savingGoal }),
      })
      setStep(2)
    } catch { alert('Erro ao salvar. Tente novamente.') }
    finally { setLoading(false) }
  }

  async function saveLimits() {
    setLoading(true)
    try {
      const month = new Date().getFullYear() + '-' + String(new Date().getMonth()+1).padStart(2,'0')
      const hasLimits = Object.values(limits).some(v => v > 0)
      if (hasLimits) {
        await fetch('/api/budgets', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ limits, month }),
        })
      }
      setStep(3)
    } catch { alert('Erro ao salvar limites.') }
    finally { setLoading(false) }
  }

  async function saveFirstTx() {
    if (skipTx) { setStep(4); return }
    if (!txAmount || !txDesc || !txCatId) { alert('Preencha todos os campos.'); return }
    setLoading(true)
    try {
      await fetch('/api/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:        txType,
          amount:      +txAmount,
          description: txDesc,
          categoryId:  txCatId,
          date:        new Date().toISOString().slice(0,10),
          isRecurring: false,
        }),
      })
      setStep(4)
    } catch { alert('Erro ao salvar transação.') }
    finally { setLoading(false) }
  }

  function goToDashboard() {
    router.push('/dashboard')
    router.refresh()
  }

  const progress = Math.round((step / (STEPS.length - 1)) * 100)

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background:'var(--bg-base)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-xl font-bold mb-3"
            style={{ background:'var(--green)', color:'#0A0A0A' }}>ƒ</div>
          <div className="text-sm font-medium" style={{ color:'var(--txt2)' }}>
            Passo {step + 1} de {STEPS.length}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="progress-wrap mb-6" style={{ height:4 }}>
          <div className="progress-fill" style={{ width:`${progress}%`, background:'var(--green)', transition:'width 0.4s' }} />
        </div>

        {/* ── STEP 0: Boas-vindas ── */}
        {step === 0 && (
          <div className="animate-fade-up text-center">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color:'var(--txt0)' }}>
              Olá, {userName.split(' ')[0]}!
            </h1>
            <p className="text-sm mb-2" style={{ color:'var(--txt1)', lineHeight:1.7 }}>
              Bem-vindo ao <strong style={{ color:'var(--green)' }}>Fino</strong> — seu assistente financeiro inteligente.
            </p>
            <p className="text-sm mb-8" style={{ color:'var(--txt2)', lineHeight:1.7 }}>
              Vamos configurar seu perfil em menos de 2 minutos para começar a cuidar do seu dinheiro de verdade.
            </p>
            <div className="space-y-2 text-left mb-8">
              {[
                { emoji:'📊', text:'Controle de receitas e gastos' },
                { emoji:'💎', text:'Acompanhamento de investimentos' },
                { emoji:'💳', text:'Gestão de dívidas e parcelamentos' },
                { emoji:'✦',  text:'IA financeira personalizada' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-sm" style={{ color:'var(--txt0)' }}>{f.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn-primary flex items-center justify-center gap-2">
              Vamos começar <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* ── STEP 1: Renda e meta ── */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 className="text-xl font-bold mb-1" style={{ color:'var(--txt0)' }}>Qual é sua renda mensal?</h2>
            <p className="text-sm mb-6" style={{ color:'var(--txt2)' }}>
              Usamos isso para calcular sua taxa de poupança e metas.
            </p>

            <div className="card p-5 space-y-4">
              <div>
                <label className="label">Renda líquida mensal (R$)</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)}
                  placeholder="Ex: 4000" className="input" inputMode="decimal" autoFocus />
                {income && +income > 0 && (
                  <p className="text-xs mt-1" style={{ color:'var(--green)' }}>
                    Meta de {savingGoal}%: {formatCurrency(+income * savingGoal / 100)}/mês
                  </p>
                )}
              </div>

              <div>
                <label className="label">Meta de poupança: <span style={{ color:'var(--green)' }}>{savingGoal}%</span></label>
                <input type="range" min={0} max={60} value={savingGoal}
                  onChange={e => setSavingGoal(+e.target.value)}
                  className="w-full" style={{ accentColor:'var(--green)' }} />
                <div className="flex justify-between text-xs mt-1" style={{ color:'var(--txt2)' }}>
                  <span>0%</span>
                  <span>Recomendado: 20%</span>
                  <span>60%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(0)} className="btn-ghost" style={{ width:'auto', padding:'11px 16px' }}>
                <ChevronLeft size={16}/>
              </button>
              <button onClick={saveProfile} disabled={loading || !income || +income <= 0}
                className="btn-primary flex items-center justify-center gap-2 flex-1">
                {loading ? <Loader2 size={15} className="animate-spin"/> : <>Continuar <ChevronRight size={15}/></>}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Limites ── */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 className="text-xl font-bold mb-1" style={{ color:'var(--txt0)' }}>Defina limites de gastos</h2>
            <p className="text-sm mb-5" style={{ color:'var(--txt2)' }}>
              Quanto quer gastar por mês em cada categoria? Deixe em branco para sem limite.
            </p>

            <div className="card p-4 space-y-3 max-h-72 overflow-y-auto">
              {expenseCats.map(cat => (
                <div key={cat.id}>
                  <label className="label" style={{ textTransform:'none', fontSize:12 }}>
                    {cat.icon} {cat.name}
                  </label>
                  <input type="number" min={0} step={50}
                    value={limits[cat.id] ?? ''}
                    onChange={e => setLimits(prev => ({ ...prev, [cat.id]: +e.target.value }))}
                    placeholder="Sem limite" className="input" style={{ padding:'8px 12px' }} />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(1)} className="btn-ghost" style={{ width:'auto', padding:'11px 16px' }}>
                <ChevronLeft size={16}/>
              </button>
              <button onClick={saveLimits} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 flex-1">
                {loading ? <Loader2 size={15} className="animate-spin"/> : <>Continuar <ChevronRight size={15}/></>}
              </button>
            </div>
            <button onClick={() => setStep(3)} className="w-full text-center text-xs mt-2"
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt2)' }}>
              Pular por enquanto
            </button>
          </div>
        )}

        {/* ── STEP 3: Primeira transação ── */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 className="text-xl font-bold mb-1" style={{ color:'var(--txt0)' }}>Adicione sua primeira transação</h2>
            <p className="text-sm mb-5" style={{ color:'var(--txt2)' }}>
              Comece registrando seu salário ou um gasto recente.
            </p>

            {!skipTx ? (
              <div className="card p-4 space-y-3">
                <div className="flex bg-card2 rounded-xl p-1 gap-1"
                  style={{ background:'var(--bg-card2)' }}>
                  {(['INCOME','EXPENSE'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => { setTxType(t); setTxCatId('') }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: txType===t ? 'var(--bg-card)' : 'transparent',
                        color:      txType===t ? 'var(--txt0)'    : 'var(--txt2)',
                        border:     txType===t ? '1px solid var(--border)' : '1px solid transparent',
                        cursor:     'pointer',
                      }}>
                      {t==='INCOME' ? '💰 Receita' : '💸 Gasto'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="label">Valor (R$)</label>
                  <input type="number" step="0.01" value={txAmount}
                    onChange={e => setTxAmount(e.target.value)}
                    placeholder="0,00" className="input" inputMode="decimal" />
                </div>
                <div>
                  <label className="label">Descrição</label>
                  <input type="text" value={txDesc}
                    onChange={e => setTxDesc(e.target.value)}
                    placeholder={txType==='INCOME' ? 'Ex: Salário março' : 'Ex: Supermercado'}
                    className="input" />
                </div>
                <div>
                  <label className="label">Categoria</label>
                  <select value={txCatId} onChange={e => setTxCatId(e.target.value)} className="input">
                    <option value="">Selecione</option>
                    {filteredCats.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(2)} className="btn-ghost" style={{ width:'auto', padding:'11px 16px' }}>
                <ChevronLeft size={16}/>
              </button>
              <button onClick={saveFirstTx} disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 flex-1">
                {loading ? <Loader2 size={15} className="animate-spin"/> : <>Continuar <ChevronRight size={15}/></>}
              </button>
            </div>
            <button onClick={() => { setSkipTx(true); setStep(4) }}
              className="w-full text-center text-xs mt-2"
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt2)' }}>
              Pular por enquanto
            </button>
          </div>
        )}

        {/* ── STEP 4: Pronto! ── */}
        {step === 4 && (
          <div className="animate-fade-up text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
              style={{ background:'var(--green-dim)', border:'1px solid rgba(0,230,118,0.3)' }}>
              🎉
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color:'var(--txt0)' }}>Tudo pronto!</h2>
            <p className="text-sm mb-8" style={{ color:'var(--txt2)', lineHeight:1.7 }}>
              Seu perfil está configurado. Agora você tem tudo que precisa para organizar suas finanças com inteligência.
            </p>

            <div className="space-y-2 text-left mb-8">
              {[
                { done:true,  text:'Perfil financeiro configurado'     },
                { done:true,  text:'Limites por categoria definidos'   },
                { done:!skipTx, text:'Primeira transação adicionada'  },
                { done:false, text:'Explore a IA financeira'          },
                { done:false, text:'Adicione seus investimentos'      },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: item.done ? 'var(--green)' : 'var(--border)' }}>
                    {item.done && <Check size={12} color="#0A0A0A" />}
                  </div>
                  <span className="text-sm" style={{ color: item.done ? 'var(--txt0)' : 'var(--txt2)' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={goToDashboard} className="btn-primary flex items-center justify-center gap-2">
              Ir para o Dashboard <ChevronRight size={16}/>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
