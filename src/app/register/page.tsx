// src/app/register/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, User, Mail, Lock, Chrome } from 'lucide-react'

export default function RegisterPage() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar conta'); setLoading(false); return }

      // Login automático após cadastro
      await signIn('credentials', { email, password, callbackUrl: '/dashboard' })
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-fino-bg0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-fino-green mb-4 text-2xl shadow-lg shadow-fino-green/20">
            💎
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            fi<span className="text-fino-green">no</span>
          </h1>
          <p className="text-fino-txt1 text-sm mt-1">Comece de graça</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-fino-txt0">Criar conta</h2>
            <p className="text-xs text-fino-txt2 mt-0.5">Grátis, sem cartão</p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-fino-red/10 border border-fino-red/20 text-fino-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="label">Nome</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fino-txt2" />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  required minLength={2} placeholder="Seu nome"
                  className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fino-txt2" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="seu@email.com"
                  className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fino-txt2" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={8} placeholder="Mínimo 8 caracteres"
                  className="input pl-9" />
              </div>
              <p className="text-xs text-fino-txt2 mt-1">Mínimo 8 caracteres, 1 maiúscula, 1 número</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Criar conta grátis'}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 border-t border-white/[0.07]" />
            <span className="relative bg-fino-bg2 px-2 text-xs text-fino-txt2">ou</span>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            disabled={loading}
            className="btn-ghost flex items-center justify-center gap-2"
          >
            <Chrome size={16} />
            Continuar com Google
          </button>

          <p className="text-xs text-fino-txt2 text-center leading-relaxed">
            Ao criar conta você concorda com nossos{' '}
            <Link href="/terms" className="text-fino-txt1 hover:text-fino-green">Termos</Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-fino-txt1 hover:text-fino-green">Política de Privacidade</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-fino-txt2 mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="text-fino-green hover:text-fino-green2 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
