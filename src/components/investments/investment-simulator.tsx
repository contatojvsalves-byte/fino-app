// src/components/investments/investment-simulator.tsx
'use client'

import { useState, useMemo } from 'react'
import { Plus, X, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/finance'
import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// ── TIPOS ──────────────────────────────────────────────────────────────────

type AssetClass = 'POUPANCA' | 'STOCK' | 'FII' | 'ETF' | 'CRYPTO' | 'TREASURY_SELIC' | 'TREASURY_IPCA' | 'FIXED_CDB' | 'GOLD'

interface SimAsset {
  id:         string
  label:      AssetClass
  monthly:    number   // aporte mensal R$
  annualRate: number   // taxa anual % (editável ou pré-definida)
  color:      string
}

// ── CONFIGURAÇÕES DE CADA CLASSE ───────────────────────────────────────────

const ASSET_CONFIG: Record<AssetClass, {
  name:        string
  emoji:       string
  color:       string
  defaultRate: number   // % ao ano
  rateLabel:   string
  rateEditable: boolean
  rateHint:    string
}> = {
  POUPANCA:      { name:'Poupança',          emoji:'🏦', color:'#38bdf8', defaultRate:6.17,  rateLabel:'Taxa anual (Selic × 70%)', rateEditable:false, rateHint:'Rendimento fixo atual da poupança' },
  STOCK:         { name:'Ações (B3)',         emoji:'📈', color:'#00E676', defaultRate:12.0,  rateLabel:'Retorno médio anual (%)',  rateEditable:true,  rateHint:'Ibovespa hist. ~10-15% a.a. (estimativa)' },
  FII:           { name:'FIIs',              emoji:'🏢', color:'#4d9eff', defaultRate:10.5,  rateLabel:'Retorno médio anual (%)',  rateEditable:true,  rateHint:'Dividendos + valorização ~8-12% a.a.' },
  ETF:           { name:'ETFs',              emoji:'📊', color:'#a78bfa', defaultRate:11.0,  rateLabel:'Retorno médio anual (%)',  rateEditable:true,  rateHint:'ETFs de índice como BOVA11, IVVB11' },
  CRYPTO:        { name:'Cripto',            emoji:'₿',  color:'#f59e0b', defaultRate:40.0,  rateLabel:'Retorno estimado anual (%)', rateEditable:true, rateHint:'Alta volatilidade — apenas estimativa' },
  TREASURY_SELIC:{ name:'Tesouro Selic',     emoji:'🏛️', color:'#22c55e', defaultRate:10.75, rateLabel:'Taxa Selic atual (%)',     rateEditable:true,  rateHint:'Rentabilidade próxima à Selic' },
  TREASURY_IPCA: { name:'Tesouro IPCA+',     emoji:'📋', color:'#84cc16', defaultRate:7.0,   rateLabel:'IPCA + spread (%)',        rateEditable:true,  rateHint:'IPCA atual + taxa contratada' },
  FIXED_CDB:     { name:'CDB / LCI / LCA',   emoji:'💳', color:'#06b6d4', defaultRate:10.0,  rateLabel:'% do CDI ou taxa fixa',   rateEditable:true,  rateHint:'CDBs de bancos médios ~100-110% CDI' },
  GOLD:          { name:'Ouro',              emoji:'🥇', color:'#d97706', defaultRate:8.5,   rateLabel:'Retorno médio anual (%)',  rateEditable:true,  rateHint:'Ouro hist. ~8% a.a. em BRL' },
}

const COLORS = ['#00E676','#4d9eff','#f59e0b','#a78bfa','#ff5f6d','#22c55e','#38bdf8','#d97706','#84cc16']

let idCounter = 0
function newId() { return String(++idCounter) }

// ── CÁLCULO ────────────────────────────────────────────────────────────────

interface YearlyResult {
  year:          number
  byAsset:       Record<string, number>   // valor acumulado por ativo
  total:         number
  totalInvested: number
}

function simulate(assets: SimAsset[], years: number): YearlyResult[] {
  const results: YearlyResult[] = []
  // acumulado por ativo
  const acc: Record<string, number> = {}
  assets.forEach(a => { acc[a.id] = 0 })

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      assets.forEach(a => {
        const monthlyRate = a.annualRate / 100 / 12
        acc[a.id] = (acc[a.id] + a.monthly) * (1 + monthlyRate)
      })
    }
    const total         = Object.values(acc).reduce((s, v) => s + v, 0)
    const totalInvested = assets.reduce((s, a) => s + a.monthly * 12 * y, 0)
    results.push({ year: y, byAsset: { ...acc }, total, totalInvested })
  }
  return results
}

// ── GRÁFICO ────────────────────────────────────────────────────────────────

function SimChart({ results, assets }: { results: YearlyResult[]; assets: SimAsset[] }) {
  const ref   = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart | null>(null)

  useEffect(() => {
    if (!ref.current || !results.length) return
    chart.current?.destroy()

    const labels   = results.map(r => `${r.year}a`)
    const datasets = [
      // Total investido (linha tracejada)
      {
        label:           'Total investido',
        data:            results.map(r => r.totalInvested),
        borderColor:     'rgba(255,255,255,0.2)',
        borderDash:      [4, 4],
        borderWidth:     1.5,
        pointRadius:     0,
        fill:            false,
        tension:         0,
      },
      // Cada ativo empilhado
      ...assets.map((a, i) => ({
        label:           ASSET_CONFIG[a.label].name,
        data:            results.map(r => r.byAsset[a.id] ?? 0),
        borderColor:     a.color,
        backgroundColor: `${a.color}30`,
        borderWidth:     2,
        pointRadius:     0,
        fill:            i === 0 ? 'origin' : `-1`,
        tension:         0.4,
      })),
    ]

    chart.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction:         { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: '#606060', font: { size: 10, family: 'DM Mono' },
              callback: v => {
                const n = +v
                return n >= 1000000 ? `R$ ${(n/1000000).toFixed(1)}M`
                  : n >= 1000 ? `R$ ${(n/1000).toFixed(0)}k`
                  : `R$ ${n}`
              },
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          x: { ticks: { color: '#606060', font: { size: 10 } }, grid: { display: false } },
        },
      },
    })
    return () => { chart.current?.destroy() }
  }, [JSON.stringify(results), JSON.stringify(assets.map(a => a.id))])

  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

interface Props {
  currentPortfolioValue?: number  // valor atual da carteira real (opcional)
}

export function InvestmentSimulator({ currentPortfolioValue = 0 }: Props) {
  const [assets, setAssets] = useState<SimAsset[]>([
    { id: newId(), label: 'STOCK',          monthly: 500,  annualRate: 12.0,  color: COLORS[0] },
    { id: newId(), label: 'TREASURY_SELIC', monthly: 300,  annualRate: 10.75, color: COLORS[1] },
  ])
  const [years,       setYears]       = useState(10)
  const [showAdd,     setShowAdd]     = useState(false)
  const [newType,     setNewType]     = useState<AssetClass>('FII')
  const [newMonthly,  setNewMonthly]  = useState('300')

  const results = useMemo(() => simulate(assets, years), [JSON.stringify(assets), years])
  const last    = results[results.length - 1]

  const totalMonthly  = assets.reduce((s, a) => s + a.monthly, 0)
  const totalInvested = last?.totalInvested ?? 0
  const finalValue    = last?.total ?? 0
  const totalEarnings = finalValue - totalInvested
  const earningsPct   = totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0

  // Inclui carteira real atual como ponto de partida (opcional)
  const finalWithCurrent = finalValue + currentPortfolioValue

  function addAsset() {
    const cfg   = ASSET_CONFIG[newType]
    const color = COLORS[assets.length % COLORS.length]
    setAssets(prev => [...prev, {
      id:         newId(),
      label:      newType,
      monthly:    +newMonthly || 300,
      annualRate: cfg.defaultRate,
      color,
    }])
    setShowAdd(false)
    setNewMonthly('300')
  }

  function removeAsset(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id))
  }

  function updateAsset(id: string, field: 'monthly' | 'annualRate', value: number) {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  return (
    <div className="space-y-4">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--txt0)' }}>
            Simulador de investimentos
          </h2>
          <p className="text-xs" style={{ color: 'var(--txt2)' }}>
            Compare múltiplos ativos simultaneamente
          </p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: showAdd ? 'var(--red-dim)' : 'var(--green-dim)',
            color: showAdd ? 'var(--red)' : 'var(--green)',
            border: `1px solid ${showAdd ? 'rgba(255,82,82,0.2)' : 'rgba(0,230,118,0.2)'}`,
            cursor: 'pointer' }}>
          {showAdd ? <X size={13}/> : <Plus size={13}/>}
          {showAdd ? 'Fechar' : 'Adicionar ativo'}
        </button>
      </div>

      {/* ── ADICIONAR ATIVO ── */}
      {showAdd && (
        <div className="card p-4 space-y-3 animate-fade-up">
          <p className="text-xs font-semibold" style={{ color: 'var(--txt0)' }}>Novo ativo na simulação</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(ASSET_CONFIG) as AssetClass[]).map(k => {
              const cfg = ASSET_CONFIG[k]
              return (
                <button key={k} type="button" onClick={() => setNewType(k)}
                  className="p-2 rounded-xl text-center transition-all"
                  style={{
                    background: newType === k ? `${cfg.color}18` : 'var(--bg-card2)',
                    border: `1px solid ${newType === k ? cfg.color : 'var(--border)'}`,
                    cursor: 'pointer',
                  }}>
                  <div style={{ fontSize: 16 }}>{cfg.emoji}</div>
                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: newType === k ? cfg.color : 'var(--txt2)' }}>
                    {cfg.name}
                  </div>
                </button>
              )
            })}
          </div>
          <div>
            <label className="label">Aporte mensal (R$)</label>
            <input type="number" min="1" value={newMonthly}
              onChange={e => setNewMonthly(e.target.value)}
              className="input" placeholder="300" />
          </div>
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--txt2)' }}>
              {ASSET_CONFIG[newType].emoji} <strong style={{ color: 'var(--txt0)' }}>{ASSET_CONFIG[newType].name}</strong>
              {' '}— taxa padrão: <strong style={{ color: ASSET_CONFIG[newType].color }}>{ASSET_CONFIG[newType].defaultRate}% a.a.</strong>
              <br/>{ASSET_CONFIG[newType].rateHint}
            </p>
          </div>
          <button onClick={addAsset} className="btn-primary flex items-center justify-center gap-2">
            <Plus size={14}/> Adicionar à simulação
          </button>
        </div>
      )}

      {/* ── ATIVOS CONFIGURADOS ── */}
      <div className="space-y-2">
        {assets.map((asset, idx) => {
          const cfg = ASSET_CONFIG[asset.label]
          const assetFinal = last?.byAsset[asset.id] ?? 0
          const assetInvested = asset.monthly * 12 * years
          const assetGain = assetFinal - assetInvested
          return (
            <div key={asset.id} className="card p-3">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: asset.color }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>
                  {cfg.emoji} {cfg.name}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono" style={{ color: asset.color }}>
                      {formatCurrency(assetFinal)}
                    </div>
                    <div className="text-[10px]" style={{ color: assetGain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      +{formatCurrency(assetGain)} ({((assetGain/Math.max(assetInvested,1))*100).toFixed(0)}%)
                    </div>
                  </div>
                  {assets.length > 1 && (
                    <button onClick={() => removeAsset(asset.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt2)', padding: 4 }}>
                      <X size={13}/>
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label" style={{ fontSize: 10 }}>Aporte mensal (R$)</label>
                  <input type="number" min="1" value={asset.monthly}
                    onChange={e => updateAsset(asset.id, 'monthly', +e.target.value)}
                    className="input" style={{ padding: '7px 10px', fontSize: 13 }} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: 10 }}>
                    {cfg.rateEditable ? cfg.rateLabel : cfg.rateLabel}
                  </label>
                  <input type="number" step="0.1" min="0" max="200"
                    value={asset.annualRate}
                    readOnly={!cfg.rateEditable}
                    onChange={e => cfg.rateEditable && updateAsset(asset.id, 'annualRate', +e.target.value)}
                    className="input" style={{
                      padding: '7px 10px', fontSize: 13,
                      opacity: cfg.rateEditable ? 1 : 0.6,
                      cursor: cfg.rateEditable ? 'text' : 'not-allowed',
                    }} />
                </div>
              </div>
              {!cfg.rateEditable && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--txt2)' }}>{cfg.rateHint}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── PERÍODO ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Período de simulação</label>
          <span className="text-base font-bold" style={{ color: 'var(--green)' }}>{years} anos</span>
        </div>
        <input type="range" min={1} max={40} value={years}
          onChange={e => setYears(+e.target.value)}
          className="w-full" style={{ accentColor: 'var(--green)' }} />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--txt2)' }}>
          <span>1 ano</span>
          <span>20 anos</span>
          <span>40 anos</span>
        </div>
      </div>

      {/* ── RESULTADO TOTAL ── */}
      <div className="hero-card p-5">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--green)', opacity: 0.7, letterSpacing: '0.08em' }}>
          RESULTADO DA SIMULAÇÃO — {years} ANOS
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--txt2)' }}>Total acumulado</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--txt0)' }}>
              {formatCurrency(finalValue)}
            </div>
            {currentPortfolioValue > 0 && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--green)' }}>
                + {formatCurrency(currentPortfolioValue)} carteira atual = {formatCurrency(finalWithCurrent)}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--txt2)' }}>Aporte mensal total</div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--txt0)' }}>
              {formatCurrency(totalMonthly)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] mb-1" style={{ color: 'var(--txt2)' }}>Investido</div>
            <div className="text-sm font-bold font-mono" style={{ color: 'var(--txt1)' }}>{formatCurrency(totalInvested)}</div>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <div className="text-[10px] mb-1" style={{ color: 'var(--txt2)' }}>Rendimentos</div>
            <div className="text-sm font-bold font-mono" style={{ color: 'var(--green)' }}>+{formatCurrency(totalEarnings)}</div>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'var(--purple-dim)', border: '1px solid rgba(124,77,255,0.2)' }}>
            <div className="text-[10px] mb-1" style={{ color: 'var(--txt2)' }}>Crescimento</div>
            <div className="text-sm font-bold font-mono" style={{ color: 'var(--purple)' }}>+{earningsPct.toFixed(0)}%</div>
          </div>
        </div>

        {/* Legenda dos ativos */}
        <div className="flex flex-wrap gap-2 mb-3">
          {assets.map(a => (
            <div key={a.id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
              <span className="text-xs" style={{ color: 'var(--txt2)' }}>
                {ASSET_CONFIG[a.label].name} ({formatCurrency(a.monthly)}/mês · {a.annualRate}% a.a.)
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0 border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            <span className="text-xs" style={{ color: 'var(--txt2)' }}>Total investido</span>
          </div>
        </div>

        {/* Gráfico */}
        <div style={{ height: 180 }}>
          <SimChart results={results} assets={assets} />
        </div>
      </div>

      {/* Projeção ano a ano */}
      <div className="card p-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Projeção ano a ano
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {results.filter((_, i) => i === 0 || (i+1) % 2 === 0 || i === results.length-1).map(r => {
            const gain    = r.total - r.totalInvested
            const gainPct = r.totalInvested > 0 ? (gain / r.totalInvested) * 100 : 0
            return (
              <div key={r.year} className="flex items-center justify-between p-2.5 rounded-xl"
                style={{ background: 'var(--bg-card2)' }}>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-bold" style={{ color: 'var(--txt2)', minWidth: 40 }}>
                    Ano {r.year}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--txt2)' }}>
                    investido: <span className="font-mono" style={{ color: 'var(--txt1)' }}>{formatCurrency(r.totalInvested)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono" style={{ color: 'var(--txt0)' }}>{formatCurrency(r.total)}</div>
                  <div className="text-[10px]" style={{ color: 'var(--green)' }}>+{gainPct.toFixed(0)}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>
        ⚠️ Simulação estimada com base em taxas históricas. Rentabilidade passada não garante resultados futuros.
        Não constitui recomendação de investimento.
      </p>
    </div>
  )
}
