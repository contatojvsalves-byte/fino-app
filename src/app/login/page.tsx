// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, Mail, Lock, Chrome } from 'lucide-react'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (res?.error) setError('E-mail ou senha incorretos.')
    else window.location.href = '/dashboard'
  }

  async function handleGoogle() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen bg-fino-bg0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-fino-green mb-4 text-2xl shadow-lg shadow-fino-green/20">
            💎
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            fi<span className="text-fino-green">no</span>
          </h1>
          <p className="text-fino-txt1 text-sm mt-1">Finanças Inteligentes</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-fino-txt0">Entrar na conta</h2>
            <p className="text-xs text-fino-txt2 mt-0.5">Bem-vindo de volta</p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-fino-red/10 border border-fino-red/20 text-fino-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fino-txt2" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="seu@email.com"
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fino-txt2" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="input pl-9"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.07]" />
            </div>
            <div className="relative text-center text-xs text-fino-txt2 bg-fino-bg2 px-2 inline-block left-1/2 -translate-x-1/2">
              ou
            </div>
          </div>

          <button
            onClick={handleGoogle} disabled={loading}
            className="btn-ghost flex items-center justify-center gap-2"
          >
            <Chrome size={16} />
            Entrar com Google
          </button>
        </div>

        <p className="text-center text-sm text-fino-txt2 mt-4">
          Não tem conta?{' '}
          <Link href="/register" className="text-fino-green hover:text-fino-green2 font-medium transition-colors">
            Criar gratuitamente
          </Link>
        </p>
      </div>
    </div>
  )
}
