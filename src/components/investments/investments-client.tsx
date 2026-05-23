// src/components/investments/investments-client.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, Loader2, Trash2, RefreshCw,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Wallet, BarChart3,
} from 'lucide-react'
import { formatCurrency } from '@/lib/finance'
import { InvestmentSimulator } from './investment-simulator'

// ── TIPOS ──────────────────────────────────────────────────────────────────

type InvType = 'STOCK'|'FII'|'ETF'|'CRYPTO'|'TREASURY'|'GOLD'|'FIXED'|'OTHER'

interface Investment {
  id:           string
  ticker:       string
  name:         string
  type:         InvType
  quantity:     number
  avgPrice:     number
  currentPrice: number
  broker:       string | null
  notes:        string | null
}

interface InvWithCalc extends Investment {
  totalCost:    number
  currentValue: number
  gainLoss:     number
  gainLossPct:  number
}

// ── CONSTANTES ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<InvType, { label:string; emoji:string; color:string; bg:string }> = {
  STOCK:    { label:'Ações',       emoji:'📈', color:'var(--green)',  bg:'var(--green-dim)'  },
  FII:      { label:'FIIs',        emoji:'🏢', color:'#4d9eff',      bg:'rgba(77,158,255,0.10)' },
  ETF:      { label:'ETFs',        emoji:'📊', color:'var(--purple)', bg:'var(--purple-dim)' },
  CRYPTO:   { label:'Cripto',      emoji:'₿',  color:'var(--amber)',  bg:'var(--amber-dim)'  },
  TREASURY: { label:'Tesouro',     emoji:'🏛️', color:'#22c55e',      bg:'rgba(34,197,94,0.10)' },
  GOLD:     { label:'Ouro',        emoji:'🥇', color:'#f59e0b',      bg:'rgba(245,158,11,0.10)' },
  FIXED:    { label:'Renda Fixa',  emoji:'🏦', color:'#38bdf8',      bg:'rgba(56,189,248,0.10)' },
  OTHER:    { label:'Outros',      emoji:'💼', color:'var(--txt1)',   bg:'rgba(160,160,184,0.10)' },
}

const TICKER_SUGGESTIONS: Record<InvType, string[]> = {
  STOCK:    ['PETR4','VALE3','ITUB4','BBDC4','WEGE3','MGLU3','ABEV3','B3SA3','RENT3','LREN3'],
  FII:      ['MXRF11','HGLG11','XPML11','BCFF11','VISC11','KNRI11','HSML11','GGRC11'],
  ETF:      ['BOVA11','SMAL11','IVVB11','HASH11','GOLD11','XFIX11','DIVO11'],
  CRYPTO:   ['BTC','ETH','SOL','BNB','ADA','XRP','DOGE','MATIC'],
  TREASURY: ['TESOURO-SELIC','TESOURO-IPCA','TESOURO-PRE'],
  GOLD:     ['XAU'],
  FIXED:    ['CDB','LCI','LCA','DEBENTURE'],
  OTHER:    [],
}

const TABS = [
  { id: 'carteira',   label: 'Carteira',   icon: Wallet    },
  { id: 'simulador',  label: 'Simulador',  icon: BarChart3 },
]

// ── UTILS ──────────────────────────────────────────────────────────────────

function calc(inv: Investment): InvWithCalc {
  const price        = inv.currentPrice > 0 ? inv.currentPrice : inv.avgPrice
  const totalCost    = inv.quantity * inv.avgPrice
  const currentValue = inv.quantity * price
  const gainLoss     = currentValue - totalCost
  const gainLossPct  = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0
  return { ...inv, totalCost, currentValue, gainLoss, gainLossPct }
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

export function InvestmentsClient({ investments: initial }: { investments: Investment[] }) {
  const router = useRouter()
  const [investments, setInvestments] = useState<Investment[]>(initial)
  const [quotes,      setQuotes]      = useState<Record<string, { price:number; change:number }>>({})
  const [showForm,    setShowForm]    = useState(false)
  const [loadingQ,    setLoadingQ]    = useState(false)
  const [loadingAdd,  setLoadingAdd]  = useState(false)
  const [filterType,  setFilterType]  = useState<InvType|'ALL'>('ALL')
  const [expanded,    setExpanded]    = useState<string|null>(null)
  const [activeTab,   setActiveTab]   = useState<'carteira'|'simulador'>('carteira')

  const [form, setForm] = useState({
    ticker:'', name:'', type:'STOCK' as InvType,
    quantity:'', avgPrice:'', broker:'', notes:'',
  })

  // ── Enriquecer com cotações ──
  const enriched: InvWithCalc[] = useMemo(() => {
    return investments.map(inv => {
      const q = quotes[inv.ticker]
      return calc({ ...inv, currentPrice: q?.price ?? inv.currentPrice })
    })
  }, [investments, quotes])

  const filtered = filterType === 'ALL' ? enriched : enriched.filter(i => i.type === filterType)

  // ── Totais ──
  const totalInvested   = enriched.reduce((s, i) => s + i.totalCost, 0)
  const totalValue      = enriched.reduce((s, i) => s + i.currentValue, 0)
  const totalGain       = totalValue - totalInvested
  const totalGainPct    = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0
  const typesWithData   = [...new Set(enriched.map(i => i.type))]

  // ── Distribuição por tipo ──
  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    enriched.forEach(i => { map[i.type] = (map[i.type] ?? 0) + i.currentValue })
    return Object.entries(map).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])
  }, [enriched])

  // ── Buscar cotações ──
  useEffect(() => { if (investments.length > 0) fetchQuotes() }, [investments.length])

  async function fetchQuotes() {
    setLoadingQ(true)
    try {
      const items = investments.map(i => ({ ticker: i.ticker, type: i.type }))
      const res   = await fetch('/api/investments/quotes', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.success) {
        const map: Record<string, { price:number; change:number }> = {}
        Object.entries(data.data).forEach(([ticker, q]: [string, any]) => {
          map[ticker] = { price: q.price, change: q.change }
        })
        setQuotes(map)
        setInvestments(prev => prev.map(inv => ({
          ...inv, currentPrice: map[inv.ticker]?.price ?? inv.currentPrice,
        })))
      }
    } catch { /* silencioso */ }
    finally { setLoadingQ(false) }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoadingAdd(true)
    try {
      const res = await fetch('/api/investments', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          ticker:   form.ticker.toUpperCase().trim(),
          name:     form.name || form.ticker.toUpperCase(),
          type:     form.type,
          quantity: +form.quantity,
          avgPrice: +form.avgPrice,
          broker:   form.broker || undefined,
          notes:    form.notes  || undefined,
        }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      const { data } = await res.json()
      setInvestments(prev => [data, ...prev])
      setForm({ ticker:'', name:'', type:'STOCK', quantity:'', avgPrice:'', broker:'', notes:'' })
      setShowForm(false)
      router.refresh()
      setTimeout(() => fetchQuotes(), 600)
    } catch { alert('Erro ao adicionar.') }
    finally { setLoadingAdd(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este ativo da carteira?')) return
    setInvestments(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/investments/${id}`, { method:'DELETE' })
    router.refresh()
  }

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Investimentos</h1>
          <p className="page-sub">{investments.length} ativo{investments.length!==1?'s':''} na carteira</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'carteira' && (
            <>
              <button onClick={fetchQuotes} disabled={loadingQ}
                style={{ background:'var(--bg-card2)', border:'1px solid var(--border)',
                  borderRadius:10, padding:'8px 10px', cursor:'pointer', color:'var(--txt1)' }}>
                <RefreshCw size={15} className={loadingQ ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="btn-primary flex items-center gap-1.5"
                style={{ width:'auto', padding:'8px 16px' }}>
                {showForm ? <X size={15}/> : <Plus size={15}/>}
                {showForm ? 'Fechar' : 'Adicionar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
              color:      activeTab === tab.id ? 'var(--txt0)'   : 'var(--txt2)',
              border:     activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
              cursor:     'pointer',
              boxShadow:  activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
            }}>
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════ ABA CARTEIRA ════════════ */}
      {activeTab === 'carteira' && (
        <>
          {/* PATRIMÔNIO REAL */}
          {investments.length > 0 && (
            <>
              <div className="hero-card p-5 mb-3">
                <p className="text-xs font-semibold mb-1"
                  style={{ color:'var(--green)', opacity:0.7, letterSpacing:'0.08em' }}>
                  PATRIMÔNIO EM INVESTIMENTOS
                </p>
                <div className="text-3xl font-bold font-mono mb-1" style={{ color:'var(--txt0)' }}>
                  {formatCurrency(totalValue)}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className={totalGain >= 0 ? 'badge-green' : 'badge-red'}>
                    {totalGain >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                    {fmtPct(totalGainPct)}
                  </span>
                  <span className="text-xs" style={{ color:'var(--txt1)' }}>
                    {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} em relação ao custo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)' }}>
                    <div className="text-xs mb-1" style={{ color:'var(--txt2)' }}>Custo total</div>
                    <div className="text-base font-bold font-mono" style={{ color:'var(--txt1)' }}>
                      {formatCurrency(totalInvested)}
                    </div>
                  </div>
                  <div className="rounded-xl p-3"
                    style={{ background: totalGain>=0 ? 'var(--green-dim)':'var(--red-dim)',
                      border:`1px solid ${totalGain>=0 ? 'rgba(0,230,118,0.2)':'rgba(255,82,82,0.2)'}` }}>
                    <div className="text-xs mb-1" style={{ color:'var(--txt2)' }}>Ganho / Perda</div>
                    <div className="text-base font-bold font-mono"
                      style={{ color: totalGain>=0 ? 'var(--green)':'var(--red)' }}>
                      {totalGain>=0?'+':''}{formatCurrency(totalGain)}
                    </div>
                  </div>
                </div>

                {loadingQ && (
                  <div className="flex items-center gap-2 mt-3">
                    <Loader2 size={12} className="animate-spin" style={{ color:'var(--txt2)' }} />
                    <span className="text-xs" style={{ color:'var(--txt2)' }}>Atualizando cotações...</span>
                  </div>
                )}
              </div>

              {/* DISTRIBUIÇÃO */}
              {byType.length > 1 && (
                <div className="card p-4 mb-3">
                  <p className="text-xs font-semibold mb-3"
                    style={{ color:'var(--txt2)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                    Distribuição da carteira
                  </p>
                  <div className="space-y-2.5">
                    {byType.map(([type, value]) => {
                      const cfg = TYPE_CONFIG[type as InvType]
                      const pct = totalValue > 0 ? (value/totalValue)*100 : 0
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color:'var(--txt1)' }}>{cfg.emoji} {cfg.label}</span>
                            <span className="font-mono font-semibold" style={{ color:'var(--txt0)' }}>
                              {formatCurrency(value)}
                              <span style={{ color:'var(--txt2)', marginLeft:6 }}>({pct.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="progress-wrap">
                            <div className="progress-fill" style={{ width:`${pct}%`, background:cfg.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* FORMULÁRIO ADICIONAR */}
          {showForm && (
            <form onSubmit={handleAdd} className="card p-5 mb-4 space-y-3 animate-fade-up">
              <h2 className="text-sm font-semibold" style={{ color:'var(--txt0)' }}>Adicionar ativo</h2>

              <div>
                <label className="label">Tipo de ativo</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(TYPE_CONFIG) as InvType[]).map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, type:t, ticker:'', name:'' }))}
                      className="p-2 rounded-xl text-center transition-all"
                      style={{
                        background: form.type===t ? TYPE_CONFIG[t].bg : 'var(--bg-card2)',
                        border:`1px solid ${form.type===t ? TYPE_CONFIG[t].color : 'var(--border)'}`,
                        cursor:'pointer',
                      }}>
                      <div style={{ fontSize:16 }}>{TYPE_CONFIG[t].emoji}</div>
                      <div className="text-[10px] font-semibold mt-0.5"
                        style={{ color: form.type===t ? TYPE_CONFIG[t].color : 'var(--txt2)' }}>
                        {TYPE_CONFIG[t].label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {TICKER_SUGGESTIONS[form.type].length > 0 && (
                <div>
                  <label className="label">Sugestões</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TICKER_SUGGESTIONS[form.type].slice(0,8).map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, ticker:t, name:t }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: form.ticker===t ? TYPE_CONFIG[form.type].bg : 'var(--bg-card2)',
                          border:`1px solid ${form.ticker===t ? TYPE_CONFIG[form.type].color : 'var(--border)'}`,
                          color: form.ticker===t ? TYPE_CONFIG[form.type].color : 'var(--txt1)',
                          cursor:'pointer',
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ticker / Código</label>
                  <input required value={form.ticker}
                    onChange={e => setForm(f => ({ ...f, ticker:e.target.value.toUpperCase() }))}
                    placeholder={form.type==='CRYPTO' ? 'Ex: BTC' : form.type==='GOLD' ? 'XAU' : 'Ex: PETR4'}
                    className="input" style={{ fontFamily:'var(--font-dm-mono)' }} />
                </div>
                <div>
                  <label className="label">Nome (opcional)</label>
                  <input value={form.name}
                    onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                    placeholder="Nome completo" className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantidade</label>
                  <input required type="number" step="any" min="0.00000001"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity:e.target.value }))}
                    placeholder="0" className="input" />
                </div>
                <div>
                  <label className="label">Preço médio (R$)</label>
                  <input required type="number" step="any" min="0.000001"
                    value={form.avgPrice}
                    onChange={e => setForm(f => ({ ...f, avgPrice:e.target.value }))}
                    placeholder="0,00" className="input" />
                </div>
              </div>

              {form.quantity && form.avgPrice && (
                <div className="p-3 rounded-xl"
                  style={{ background:'var(--bg-card2)', border:'1px solid var(--border)' }}>
                  <p className="text-xs" style={{ color:'var(--txt2)' }}>
                    Total investido:{' '}
                    <span className="font-bold font-mono" style={{ color:'var(--txt0)' }}>
                      {formatCurrency(+form.quantity * +form.avgPrice)}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="label">Corretora (opcional)</label>
                <input value={form.broker}
                  onChange={e => setForm(f => ({ ...f, broker:e.target.value }))}
                  placeholder="Ex: XP, Rico, Clear, Binance" className="input" />
              </div>

              <button type="submit" disabled={loadingAdd}
                className="btn-primary flex items-center justify-center gap-2">
                {loadingAdd ? <Loader2 size={15} className="animate-spin"/> : 'Adicionar à carteira'}
              </button>
            </form>
          )}

          {/* FILTROS */}
          {investments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth:'none' }}>
              <button onClick={() => setFilterType('ALL')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                style={{
                  background: filterType==='ALL' ? 'var(--green)' : 'var(--bg-card2)',
                  color:      filterType==='ALL' ? '#0A0A0A'      : 'var(--txt1)',
                  border:'1px solid var(--border)', cursor:'pointer',
                }}>
                Todos ({enriched.length})
              </button>
              {typesWithData.map(t => {
                const cfg   = TYPE_CONFIG[t]
                const count = enriched.filter(i => i.type===t).length
                return (
                  <button key={t} onClick={() => setFilterType(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all flex items-center gap-1.5"
                    style={{
                      background: filterType===t ? cfg.bg          : 'var(--bg-card2)',
                      color:      filterType===t ? cfg.color        : 'var(--txt1)',
                      border:`1px solid ${filterType===t ? cfg.color : 'var(--border)'}`,
                      cursor:'pointer',
                    }}>
                    {cfg.emoji} {cfg.label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* LISTA */}
          {investments.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm font-semibold" style={{ color:'var(--txt0)' }}>Carteira vazia</p>
              <p className="text-xs mt-1 mb-4" style={{ color:'var(--txt2)' }}>
                Adicione seus ativos para acompanhar a evolução e rentabilidade.
              </p>
              <button onClick={() => setShowForm(true)}
                className="btn-primary" style={{ width:'auto', padding:'10px 24px', margin:'0 auto' }}>
                + Adicionar primeiro ativo
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(inv => {
                const cfg        = TYPE_CONFIG[inv.type]
                const isExpanded = expanded === inv.id
                const q          = quotes[inv.ticker]

                return (
                  <div key={inv.id} className="card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background:cfg.bg }}>
                          {cfg.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold font-mono" style={{ color:'var(--txt0)' }}>
                              {inv.ticker}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background:cfg.bg, color:cfg.color }}>
                              {cfg.label}
                            </span>
                            {loadingQ && !inv.currentPrice && (
                              <Loader2 size={11} className="animate-spin" style={{ color:'var(--txt2)' }} />
                            )}
                            {q && (
                              <span className={q.change>=0 ? 'badge-green':'badge-red'} style={{ fontSize:10 }}>
                                {q.change>=0 ? '▲':'▼'} {Math.abs(q.change).toFixed(2)}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-0.5 truncate" style={{ color:'var(--txt2)' }}>
                            {inv.name !== inv.ticker ? inv.name : cfg.label}
                            {inv.broker && ` · ${inv.broker}`}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-bold font-mono" style={{ color:'var(--txt0)' }}>
                            {formatCurrency(inv.currentValue)}
                          </div>
                          <div className="text-xs font-semibold"
                            style={{ color: inv.gainLoss>=0 ? 'var(--green)':'var(--red)' }}>
                            {inv.gainLoss>=0?'+':''}{formatCurrency(inv.gainLoss)}
                            <span className="ml-1 opacity-70">({fmtPct(inv.gainLossPct)})</span>
                          </div>
                        </div>
                      </div>

                      {inv.gainLossPct !== 0 && (
                        <div className="mt-3">
                          <div className="progress-wrap" style={{ height:3 }}>
                            <div className="progress-fill" style={{
                              width:`${Math.min(Math.abs(inv.gainLossPct)*2, 100)}%`,
                              background: inv.gainLoss>=0 ? 'var(--green)':'var(--red)',
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-4 pb-3 flex items-center gap-2">
                      <button onClick={() => setExpanded(isExpanded ? null : inv.id)}
                        className="flex items-center gap-1 text-xs transition-all"
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt2)' }}>
                        {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>} Detalhes
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="btn-danger ml-auto">
                        <Trash2 size={12}/> Remover
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fade-up">
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl"
                          style={{ background:'var(--bg-card2)' }}>
                          {[
                            { label:'Quantidade',      value: inv.quantity % 1 === 0
                              ? inv.quantity.toLocaleString('pt-BR')
                              : inv.quantity.toFixed(8).replace(/\.?0+$/,'') },
                            { label:'Preço médio',     value: formatCurrency(inv.avgPrice) },
                            { label:'Cotação atual',   value: inv.currentPrice > 0 ? formatCurrency(inv.currentPrice) : '—' },
                            { label:'Total investido', value: formatCurrency(inv.totalCost) },
                            { label:'Valor atual',     value: formatCurrency(inv.currentValue) },
                            { label:'Rentabilidade',   value: fmtPct(inv.gainLossPct) },
                          ].map(d => (
                            <div key={d.label}>
                              <div className="text-xs" style={{ color:'var(--txt2)' }}>{d.label}</div>
                              <div className="text-xs font-semibold font-mono" style={{ color:'var(--txt0)' }}>
                                {d.value}
                              </div>
                            </div>
                          ))}
                        </div>
                        {inv.notes && (
                          <p className="text-xs mt-2 px-1" style={{ color:'var(--txt2)' }}>{inv.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 card p-3 flex items-start gap-2">
            <span style={{ fontSize:14 }}>ℹ️</span>
            <p className="text-xs" style={{ color:'var(--txt2)', lineHeight:1.5 }}>
              Cotações atualizadas via B3 (ações, FIIs, ETFs), CoinGecko (cripto) e mercado de ouro.
              Delay de até 15 min. Não constitui recomendação de investimento.
            </p>
          </div>
        </>
      )}

      {/* ════════════ ABA SIMULADOR ════════════ */}
      {activeTab === 'simulador' && (
        <InvestmentSimulator currentPortfolioValue={totalValue} />
      )}
    </div>
  )
}
