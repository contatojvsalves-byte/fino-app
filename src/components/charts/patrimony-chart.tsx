// src/components/charts/patrimony-chart.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

interface Props {
  data: { month: string; value: number }[]
  mini?: boolean
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function PatrimonyChart({ data, mini = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef  = useRef<Chart | null>(null)

  const labels = data.map(d => {
    const [, m] = d.month.split('-')
    return MONTH_NAMES[+m - 1]
  })
  const values = data.map(d => d.value)

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data:                 values,
          borderColor:          '#00E676',
          backgroundColor:      'rgba(0,230,118,0.08)',
          fill:                 true,
          tension:              0.45,
          pointRadius:          mini ? 0 : 4,
          pointBackgroundColor: '#00E676',
          borderWidth:          mini ? 1.5 : 2,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: !mini } },
        scales: mini ? { x: { display: false }, y: { display: false } } : {
          y: {
            ticks: { color:'#606060', font:{ size:10, family:'DM Mono' }, callback: v => `R$ ${(+v/1000).toFixed(0)}k` },
            grid:  { color:'rgba(255,255,255,0.04)' },
          },
          x: { ticks: { color:'#606060', font:{ size:10 } }, grid: { display: false } },
        },
      },
    })
    return () => { chartRef.current?.destroy() }
  }, [JSON.stringify(data)])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}
