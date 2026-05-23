// src/components/charts/charts-client.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { formatCurrency, calcDebtProjection } from '@/lib/finance'
import type { CategoryExpense, Debt } from '@/types'

Chart.register(...registerables)

interface Props {
  evolution:   { month:string; value:number }[]
  categories:  CategoryExpense[]
  monthlyRG:   { month:string; income:number; expense:number }[]
  debts:       Debt[]
  cashBalance: number   // saldo em caixa atual (receitas - gastos histórico)
}

export function ChartsClient({ evolution, categories, monthlyRG, debts, cashBalance }: Props) {
  return (
    <div className="space-y-1">
      <div className="page-header mb-4">
        <h1 className="page-title">Evolução financeira</h1>
        <p className="page-sub">Saldo em caixa — receitas menos gastos</p>
      </div>

      {/* ── SALDO EM CAIXA ── */}
      <div className="card p-4 mb-1" style={{
        border:`1px solid ${cashBalance >= 0 ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
        background: cashBalance >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
      }}>
        <p className="text-xs font-semibold mb-1"
          style={{ color: cashBalance>=0 ? 'var(--green)':'var(--red)', letterSpacing:'0.07em' }}>
          SALDO EM CAIXA ACUMULADO
        </p>
        <div className="text-2xl font-bold font-mono" style={{ color: cashBalance>=0 ? 'var(--green)':'var(--red)' }}>
          {formatCurrency(cashBalance)}
        </div>
        <p className="text-xs mt-1" style={{ color:'var(--txt2)' }}>
          Total histórico de receitas menos gastos registrados
        </p>
      </div>

      <p className="section-label">Saldo em caixa ao longo do tempo</p>
      <div className="card p-4">
        <LineChartComponent
          labels={evolution.map(e => {
            const m = +e.month.split('-')[1]
            return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m-1]
          })}
          data={evolution.map(e => e.value)}
          color={cashBalance >= 0 ? '#00E676' : '#ff5f6d'}
          fill
        />
      </div>

      <p className="section-label">Receitas vs Gastos por mês</p>
      <div className="card p-4">
        <BarChartDouble data={monthlyRG} />
        <div className="flex gap-4 mt-3 text-xs" style={{ color:'var(--txt2)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background:'#00E676' }}/>Receitas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background:'#ff5f6d' }}/>Gastos
          </span>
        </div>
      </div>

      <p className="section-label">Gastos por categoria (mês atual)</p>
      <div className="card p-4">
        {categories.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color:'var(--txt2)' }}>
            Sem gastos registrados neste mês.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0" style={{ width:120, height:120 }}>
                <DoughnutChart categories={categories} />
              </div>
              <div className="flex-1 space-y-2">
                {categories.map(c => (
                  <div key={c.categoryId} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background:c.color }} />
                    <span className="text-xs flex-1 truncate" style={{ color:'var(--txt1)' }}>
                      {c.icon} {c.categoryName}
                    </span>
                    <span className="text-xs font-semibold font-mono" style={{ color:'var(--txt0)' }}>
                      {c.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Barras de orçamento */}
            <div className="mt-4 space-y-2.5">
              {categories.map(c => (
                <div key={`bar-${c.categoryId}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color:'var(--txt1)' }}>{c.icon} {c.categoryName}</span>
                    <span className="font-mono" style={{ color:'var(--txt0)' }}>
                      {formatCurrency(c.total)}
                      {c.limit && <span style={{ color:'var(--txt2)' }}> / {formatCurrency(c.limit)}</span>}
                    </span>
                  </div>
                  {c.limit && (
                    <div className="progress-wrap">
                      <div className="progress-fill" style={{
                        width:`${Math.min(c.limitPercent??0, 100)}%`,
                        background: (c.limitPercent??0) >= 100 ? 'var(--red)'
                          : (c.limitPercent??0) >= 80 ? 'var(--amber)' : c.color,
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Projeção dívidas */}
      {debts.length > 0 && (
        <>
          <p className="section-label">Projeção de quitação de dívidas</p>
          <DebtProjectionView debts={debts} />
        </>
      )}
    </div>
  )
}

// ── SUB-COMPONENTES ─────────────────────────────────────────────────────────

function LineChartComponent({ labels, data, color, fill }: {
  labels:string[]; data:number[]; color:string; fill?:boolean
}) {
  const ref   = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart|null>(null)
  useEffect(() => {
    if (!ref.current) return
    chart.current?.destroy()
    chart.current = new Chart(ref.current, {
      type:'line',
      data:{ labels, datasets:[{
        data, borderColor:color, backgroundColor:`${color}10`,
        fill, tension:0.4, pointRadius:4, pointBackgroundColor:color, borderWidth:2,
      }]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false } },
        scales:{
          y:{ ticks:{ color:'#606060', font:{ size:10, family:'DM Mono' }, callback: v => {
            const n = +v
            return n>=1000000 ? `R$ ${(n/1000000).toFixed(1)}M`
              : n>=1000 ? `R$ ${(n/1000).toFixed(0)}k`
              : `R$ ${n}`
          }}, grid:{ color:'rgba(255,255,255,0.04)' }},
          x:{ ticks:{ color:'#606060', font:{ size:10 }}, grid:{ display:false }},
        },
      },
    })
    return () => { chart.current?.destroy() }
  }, [JSON.stringify(data)])
  return <div style={{ height:150 }}><canvas ref={ref} /></div>
}

function BarChartDouble({ data }: { data:{ month:string; income:number; expense:number }[] }) {
  const ref   = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart|null>(null)
  useEffect(() => {
    if (!ref.current) return
    chart.current?.destroy()
    chart.current = new Chart(ref.current, {
      type:'bar',
      data:{
        labels:data.map(d=>d.month),
        datasets:[
          { label:'Receitas', data:data.map(d=>d.income),  backgroundColor:'rgba(0,230,118,0.7)',  borderRadius:4, borderSkipped:false },
          { label:'Gastos',   data:data.map(d=>d.expense), backgroundColor:'rgba(255,82,82,0.7)',  borderRadius:4, borderSkipped:false },
        ],
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:false }},
        scales:{
          y:{ ticks:{ color:'#606060', font:{ size:10, family:'DM Mono' }, callback: v => {
            const n = +v; return n>=1000 ? `R$ ${(n/1000).toFixed(0)}k` : `R$ ${n}`
          }}, grid:{ color:'rgba(255,255,255,0.04)' }},
          x:{ ticks:{ color:'#606060', font:{ size:10 }}, grid:{ display:false }},
        },
      },
    })
    return () => { chart.current?.destroy() }
  }, [JSON.stringify(data)])
  return <div style={{ height:150 }}><canvas ref={ref} /></div>
}

function DoughnutChart({ categories }: { categories:CategoryExpense[] }) {
  const ref   = useRef<HTMLCanvasElement>(null)
  const chart = useRef<Chart|null>(null)
  useEffect(() => {
    if (!ref.current) return
    chart.current?.destroy()
    chart.current = new Chart(ref.current, {
      type:'doughnut',
      data:{
        labels:   categories.map(c=>c.categoryName),
        datasets:[{ data:categories.map(c=>c.total), backgroundColor:categories.map(c=>c.color), borderWidth:0, hoverOffset:4 }],
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'70%', plugins:{ legend:{ display:false }}},
    })
    return () => { chart.current?.destroy() }
  }, [JSON.stringify(categories)])
  return <canvas ref={ref} style={{ width:120, height:120 }} />
}

function DebtProjectionView({ debts }: { debts:Debt[] }) {
  const [strategy, setStrategy] = useState<'avalanche'|'snowball'>('avalanche')
  const sorted   = [...debts].sort((a,b) =>
    strategy==='avalanche' ? b.monthlyInterestRate-a.monthlyInterestRate : a.currentBalance-b.currentBalance
  )
  const projs    = sorted.map(d => calcDebtProjection(d, strategy))
  const maxMonths = Math.max(...projs.map(p=>p.monthsToPayoff), 1)

  return (
    <div className="card p-4">
      <div className="flex gap-2 mb-4">
        {(['avalanche','snowball'] as const).map(s => (
          <button key={s} onClick={() => setStrategy(s)}
            className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
            style={{
              background: strategy===s ? 'var(--green)' : 'var(--bg-card2)',
              color:      strategy===s ? '#0A0A0A'       : 'var(--txt2)',
              border:     `1px solid ${strategy===s ? 'var(--green)' : 'var(--border)'}`,
              cursor:     'pointer',
            }}>
            {s==='avalanche' ? '🔥 Avalanche' : '⛄ Bola de neve'}
          </button>
        ))}
      </div>
      <p className="text-xs mb-3" style={{ color:'var(--txt2)' }}>
        {strategy==='avalanche'
          ? 'Pague a dívida com maior juros primeiro. Economiza mais no longo prazo.'
          : 'Pague a menor dívida primeiro. Gera motivação com vitórias rápidas.'}
      </p>
      <div className="space-y-3">
        {projs.map((p,i) => (
          <div key={p.debtId}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium" style={{ color:'var(--txt1)' }}>{i+1}º {p.name}</span>
              <span className="font-mono" style={{ color:'var(--txt2)' }}>
                {p.monthsToPayoff < 600
                  ? `${Math.floor(p.monthsToPayoff/12)>0?Math.floor(p.monthsToPayoff/12)+'a ':''}`+`${p.monthsToPayoff%12}m`
                  : '50+ anos'
                }
                {' · '}+{formatCurrency(p.totalInterest)} juros
              </span>
            </div>
            <div className="progress-wrap">
              <div className="progress-fill" style={{
                width:`${Math.min((p.monthsToPayoff/maxMonths)*100,100).toFixed(0)}%`,
                background: i===0 ? 'var(--green)' : 'var(--red)',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
