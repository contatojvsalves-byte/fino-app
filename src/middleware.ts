// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const PUBLIC_ROUTES = ['/login', '/register', '/terms', '/privacy', '/onboarding']
const AUTH_ROUTES   = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isApi    = pathname.startsWith('/api')
  const isStatic = pathname.startsWith('/_next') || pathname.includes('.')
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Não interceptar rotas estáticas ou de API
  if (isStatic || isApi) return NextResponse.next()

  // Verificar sessão
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Já logado tentando acessar login/register → dashboard
  if (AUTH_ROUTES.some(r => pathname.startsWith(r)) && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Rota protegida sem login → login
  if (!isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|sw.js).*)',
  ],
}
