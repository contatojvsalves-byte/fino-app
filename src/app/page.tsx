// src/app/page.tsx — Landing page do Fino
import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{
      background: '#0A0A0A',
      minHeight: '100vh',
      fontFamily: "'Sora', sans-serif",
      color: '#F5F5F5',
      overflowX: 'hidden',
    }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,230,118,0.3); }
          50%       { box-shadow: 0 0 0 16px rgba(0,230,118,0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.4s ease both; }

        .float { animation: float 4s ease-in-out infinite; }
        .float-2 { animation: float 5s 1s ease-in-out infinite; }
        .float-3 { animation: float 6s 2s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(90deg, #00E676, #fff, #00E676, #7C4DFF, #00E676);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .card-hover {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          border-color: rgba(0,230,118,0.3) !important;
          box-shadow: 0 20px 60px rgba(0,230,118,0.08);
        }

        .btn-glow:hover {
          box-shadow: 0 0 30px rgba(0,230,118,0.4);
          transform: translateY(-2px);
        }

        .noise {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .grid-bg {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(0,230,118,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,230,118,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 99px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          background: rgba(0,230,118,0.08); color: #00E676;
          border: 1px solid rgba(0,230,118,0.2);
        }

        .feature-card {
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 28px;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,230,118,0.4), transparent);
        }

        .stat-number {
          font-size: 48px; font-weight: 800; letter-spacing: -2px;
          font-family: 'DM Mono', monospace;
          background: linear-gradient(135deg, #00E676, #7C4DFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .plan-card {
          background: #111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .plan-card.featured {
          border-color: rgba(0,230,118,0.3);
          background: linear-gradient(145deg, #0d1a0d, #111);
        }
        .plan-card.featured::before {
          content: '';
          position: absolute;
          top: -1px; left: 20%; right: 20%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00E676, transparent);
        }

        .mockup-screen {
          background: #111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }

        .cursor-blink {
          display: inline-block;
          width: 2px; height: 1em;
          background: #00E676;
          margin-left: 2px;
          animation: blink 1s infinite;
          vertical-align: middle;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 40px !important; }
          .hide-mobile { display: none !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .plan-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Noise overlay */}
      <div className="noise" />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 5%',
        background: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: '#00E676', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#0A0A0A',
          }}>ƒ</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px' }}>fino</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
            background: 'rgba(0,230,118,0.1)', color: '#00E676',
            border: '1px solid rgba(0,230,118,0.2)', marginLeft: 4,
          }}>BETA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            color: '#A0A0A0', textDecoration: 'none',
            transition: 'color 0.2s',
          }}>Entrar</Link>
          <Link href="/register" style={{
            padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: '#00E676', color: '#0A0A0A', textDecoration: 'none',
            transition: 'all 0.2s',
          }} className="btn-glow">Começar grátis</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', textAlign: 'center',
        padding: '120px 5% 80px', position: 'relative',
      }}>
        <div className="grid-bg" />

        {/* Glow orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,77,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          <div className="tag fade-up" style={{ marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E676', animation: 'pulse-green 2s infinite' }} />
            Inteligência financeira com IA
          </div>

          <h1 className="hero-title fade-up-1" style={{
            fontSize: 72, fontWeight: 800, letterSpacing: '-3px', lineHeight: 1.05,
            marginBottom: 24,
          }}>
            Seu dinheiro,<br />
            <span className="shimmer-text">finalmente organizado</span>
          </h1>

          <p className="fade-up-2" style={{
            fontSize: 18, color: '#A0A0A0', lineHeight: 1.7, maxWidth: 540,
            margin: '0 auto 40px',
          }}>
            O Fino é um assistente financeiro inteligente que analisa seus dados reais
            e te ajuda a economizar, quitar dívidas e investir com clareza.
          </p>

          <div className="fade-up-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: '#00E676', color: '#0A0A0A', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }} className="btn-glow">
              Começar gratuitamente →
            </Link>
            <Link href="/login" style={{
              padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', color: '#F5F5F5',
              border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              Já tenho conta
            </Link>
          </div>

          <p className="fade-up-4" style={{ fontSize: 12, color: '#606060', marginTop: 16 }}>
            Grátis para sempre · Sem cartão de crédito · Dados protegidos pela LGPD
          </p>
        </div>

        {/* Mockup flutuante */}
        <div className="fade-up-4" style={{
          marginTop: 80, position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 360,
        }}>
          <div className="float mockup-screen" style={{ padding: 0 }}>
            {/* Topo do mockup */}
            <div style={{
              background: 'linear-gradient(135deg, #0d1f0d, #0a0a1a)',
              padding: '24px 20px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(0,230,118,0.6)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>PATRIMÔNIO TOTAL</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', fontFamily: 'DM Mono', color: '#F5F5F5' }}>R$ 24.750<span className="cursor-blink" /></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <div style={{ flex: 1, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#A0A0A0', marginBottom: 4 }}>Receitas</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00E676', fontFamily: 'DM Mono' }}>R$ 8.650</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#A0A0A0', marginBottom: 4 }}>Gastos</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FF5252', fontFamily: 'DM Mono' }}>R$ 4.230</div>
                </div>
              </div>
            </div>
            {/* Transações */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#606060', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Últimas transações</div>
              {[
                { icon: '💰', name: 'Salário', cat: 'Receita', val: '+R$ 5.200', color: '#00E676' },
                { icon: '🛒', name: 'Mercado Extra', cat: 'Alimentação', val: '-R$ 156', color: '#FF5252' },
                { icon: '📱', name: 'Netflix', cat: 'Assinatura', val: '-R$ 55', color: '#FF5252' },
              ].map((tx, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{tx.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#F5F5F5' }}>{tx.name}</div>
                    <div style={{ fontSize: 10, color: '#606060' }}>{tx.cat}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tx.color, fontFamily: 'DM Mono' }}>{tx.val}</div>
                </div>
              ))}
            </div>
            {/* IA tip */}
            <div style={{ margin: '0 16px 16px', padding: '12px 14px', background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7C4DFF', marginBottom: 4 }}>✦ Fino IA</div>
              <div style={{ fontSize: 11, color: '#A0A0A0', lineHeight: 1.5 }}>Seus gastos com alimentação aumentaram 12% este mês. Quer ver como otimizar?</div>
            </div>
          </div>

          {/* Cards flutuantes ao redor */}
          <div className="float-2" style={{
            position: 'absolute', top: -20, right: -60,
            background: '#111', border: '1px solid rgba(0,230,118,0.2)',
            borderRadius: 14, padding: '12px 16px', textAlign: 'left',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 10, color: '#606060', marginBottom: 4 }}>Economia este mês</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#00E676', fontFamily: 'DM Mono' }}>+R$ 4.420</div>
            <div style={{ fontSize: 10, color: '#00E676', marginTop: 2 }}>↑ 12% vs mês anterior</div>
          </div>

          <div className="float-3" style={{
            position: 'absolute', bottom: 40, left: -70,
            background: '#111', border: '1px solid rgba(124,77,255,0.2)',
            borderRadius: 14, padding: '12px 16px', textAlign: 'left',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 10, color: '#606060', marginBottom: 4 }}>PETR4 hoje</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#F5F5F5', fontFamily: 'DM Mono' }}>R$ 38,42</div>
            <div style={{ fontSize: 10, color: '#00E676', marginTop: 2 }}>▲ +2,4%</div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, textAlign: 'center' }} className="grid-3">
          {[
            { num: 'R$ 0', label: 'Para começar', sub: 'Plano gratuito completo' },
            { num: '100%', label: 'Seguro', sub: 'Dados criptografados e LGPD' },
            { num: '✦ IA', label: 'Personalizada', sub: 'Análise com seus dados reais' },
          ].map((s, i) => (
            <div key={i}>
              <div className="stat-number">{s.num}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#F5F5F5', marginTop: 8 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: '#606060', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 5%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="tag" style={{ marginBottom: 16 }}>Funcionalidades</div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>
              Tudo que você precisa,<br />em um só lugar
            </h2>
            <p style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 480, margin: '0 auto' }}>
              Do controle de gastos aos investimentos — com IA que entende sua situação real.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-3">
            {[
              {
                icon: '📊', title: 'Dashboard inteligente',
                desc: 'Patrimônio, saldo, receitas e gastos em tempo real. Alertas automáticos quando ultrapassar limites.',
                color: '#00E676',
              },
              {
                icon: '💳', title: 'Controle de dívidas',
                desc: 'Cadastre dívidas parceladas ou avulsas. Registre pagamentos parciais e acompanhe o progresso de quitação.',
                color: '#7C4DFF',
              },
              {
                icon: '📈', title: 'Carteira de investimentos',
                desc: 'Ações, FIIs, ETFs, cripto, ouro e tesouro — com cotações ao vivo da B3 e CoinGecko.',
                color: '#FFB300',
              },
              {
                icon: '✦', title: 'IA Financeira',
                desc: 'Analisa seus dados reais e responde perguntas personalizadas. Como sair das dívidas? Quando investir?',
                color: '#7C4DFF',
              },
              {
                icon: '🎯', title: 'Simulador avançado',
                desc: 'Simule múltiplos investimentos simultaneamente — poupança, ações, cripto e tesouro lado a lado.',
                color: '#00E676',
              },
              {
                icon: '🔔', title: 'Alertas e metas',
                desc: 'Defina limites por categoria e receba alertas quando estiver perto de ultrapassar. Meta de poupança mensal.',
                color: '#FF5252',
              },
            ].map((f, i) => (
              <div key={i} className="feature-card card-hover">
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${f.color}18`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#F5F5F5' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#606060', lineHeight: 1.65 }}>{f.desc}</p>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)`,
                  opacity: 0,
                  transition: 'opacity 0.3s',
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section style={{ padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="tag" style={{ marginBottom: 16 }}>Planos</div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>
              Comece grátis,<br />cresça quando quiser
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="plan-grid">
            {/* FREE */}
            <div className="plan-card">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A0', marginBottom: 8 }}>Gratuito</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>
                R$ 0<span style={{ fontSize: 16, fontWeight: 400, color: '#606060' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#606060', marginBottom: 28, lineHeight: 1.5 }}>
                Tudo que você precisa para começar a organizar as finanças.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {[
                  '50 transações por mês',
                  '5 mensagens de IA por mês',
                  'Dashboard completo',
                  'Controle de dívidas',
                  'Carteira de investimentos',
                  'Gráficos e evolução',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#A0A0A0' }}>
                    <span style={{ color: '#00E676', fontWeight: 700, fontSize: 14 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/register" style={{
                display: 'block', textAlign: 'center', padding: '12px',
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: 'rgba(255,255,255,0.06)', color: '#F5F5F5',
                border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                Começar grátis
              </Link>
            </div>

            {/* PREMIUM */}
            <div className="plan-card featured">
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: '#00E676', color: '#0A0A0A', fontSize: 10, fontWeight: 800,
                padding: '4px 14px', borderRadius: 99, letterSpacing: '0.06em', whiteSpace: 'nowrap',
              }}>
                ✦ RECOMENDADO
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#00E676', marginBottom: 8 }}>Premium</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4 }}>
                R$ 19<span style={{ fontSize: 20 }}>,90</span>
                <span style={{ fontSize: 16, fontWeight: 400, color: '#606060' }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: '#606060', marginBottom: 28, lineHeight: 1.5 }}>
                Para quem leva as finanças a sério. IA sem limites.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {[
                  'Transações ilimitadas',
                  'IA ilimitada e avançada',
                  'Relatórios em PDF',
                  'Alertas inteligentes',
                  'Categorias personalizadas',
                  'Open Finance (em breve)',
                  'Suporte prioritário',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F5F5F5' }}>
                    <span style={{ color: '#00E676', fontWeight: 700, fontSize: 14 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Link href="/register" style={{
                display: 'block', textAlign: 'center', padding: '12px',
                borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: '#00E676', color: '#0A0A0A', textDecoration: 'none',
                transition: 'all 0.2s',
              }} className="btn-glow">
                Assinar Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{
        padding: '100px 5%', textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', marginBottom: 20 }}>
            Pronto para organizar<br />
            <span className="shimmer-text">suas finanças?</span>
          </h2>
          <p style={{ fontSize: 16, color: '#A0A0A0', maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Junte-se a quem já está no controle. Grátis para sempre, sem cartão de crédito.
          </p>
          <Link href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '16px 40px', borderRadius: 14, fontSize: 16, fontWeight: 800,
            background: '#00E676', color: '#0A0A0A', textDecoration: 'none',
            transition: 'all 0.2s',
          }} className="btn-glow">
            Criar conta gratuita →
          </Link>
          <p style={{ fontSize: 12, color: '#404040', marginTop: 16 }}>
            Dados protegidos · LGPD · SSL
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '32px 5%',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: '#00E676', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#0A0A0A',
          }}>ƒ</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>fino</span>
          <span style={{ fontSize: 12, color: '#404040', marginLeft: 8 }}>
            © {new Date().getFullYear()} · Finanças Inteligentes
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#606060' }}>
          <Link href="/login" style={{ color: '#606060', textDecoration: 'none' }}>Entrar</Link>
          <Link href="/register" style={{ color: '#606060', textDecoration: 'none' }}>Cadastrar</Link>
          <span>Feito com 💚 no Brasil</span>
        </div>
      </footer>

    </main>
  )
}
