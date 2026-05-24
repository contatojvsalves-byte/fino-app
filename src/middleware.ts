// src/middleware.ts
// Middleware simplificado — sem chamadas ao banco (Edge Runtime)
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_ROUTES = ['/login', '/register', '/terms', '/privacy', '/onboarding']
const AUTH_ROUTES   = ['/login', '/register']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Não interceptar API, arquivos estáticos
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verificar token JWT (não faz query no banco)
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  })

  const isLoggedIn = !!token
  const isPublic   = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

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
    '/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json).*)',
  ],
}
