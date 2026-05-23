// src/middleware.ts
// Proteção de rotas — redireciona usuários não autenticados

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES  = ['/login', '/register', '/terms', '/privacy']
const AUTH_ROUTES    = ['/login', '/register']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn   = !!req.auth

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isApi    = pathname.startsWith('/api/auth')

  // Rota pública de auth — redireciona para dashboard se já logado
  if (AUTH_ROUTES.some(r => pathname.startsWith(r)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Rota protegida — redireciona para login se não autenticado
  if (!isPublic && !isApi && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json).*)'],
}
