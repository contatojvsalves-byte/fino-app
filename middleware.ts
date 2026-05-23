// src/middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/terms', '/privacy']
const AUTH_ROUTES   = ['/login', '/register']

export default auth(async (req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn   = !!req.auth

  const isApi    = pathname.startsWith('/api/auth')
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Já logado tentando acessar login/register → dashboard
  if (AUTH_ROUTES.some(r => pathname.startsWith(r)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Rota protegida sem login → login
  if (!isPublic && !isApi && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Usuário logado acessando dashboard sem ter feito onboarding
  // O redirecionamento para /onboarding é feito na própria página do dashboard
  // para evitar loop (o middleware não tem acesso ao banco)

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw.js).*)'],
}
