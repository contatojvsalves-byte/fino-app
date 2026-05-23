// src/lib/auth.ts
// NextAuth v5 — configuração de autenticação

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { z } from 'zod'

const credentialsSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    // Login social Google
    GoogleProvider({
      clientId:     process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),

    // Login por e-mail/senha (básico — adicionar bcrypt em produção)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'E-mail',  type: 'email' },
        password: { label: 'Senha',   type: 'password' },
      },
      async authorize(credentials) {
  const parsed = credentialsSchema.safeParse(credentials)
  if (!parsed.success) return null

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return null

  const account = await prisma.account.findFirst({
    where: { userId: user.id, provider: 'credentials' },
  })
  if (!account?.refresh_token) return null

  const bcrypt = await import('bcryptjs')
  const valid  = await bcrypt.compare(parsed.data.password, account.refresh_token)
  if (!valid) return null

  return { id: user.id, name: user.name, email: user.email, image: user.image }
},
    }),
  ],

  session: { strategy: 'jwt' },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    // Criar perfil + plano ao registrar pela primeira vez
    async signIn({ user, account }) {
      if (!user.email) return false

      // Garante que UserPlan e FinancialProfile existam
      const existing = await prisma.user.findUnique({ where: { email: user.email } })
      if (!existing && user.id) {
        // Será criado pelo adapter; adicionar hooks pós-criação aqui se necessário
      }

      return true
    },
  },

  events: {
    // Criar plano FREE e perfil ao criar usuário
    async createUser({ user }) {
      await prisma.$transaction([
        prisma.userPlan.create({
          data: {
            userId:          user.id,
            plan:            'FREE',
            aiMessagesUsed:  0,
            aiMessagesLimit: 5,
            transactionLimit: 50,
          },
        }),
        prisma.financialProfile.create({
          data: {
            userId:           user.id,
            monthlyIncome:    0,
            savingGoalPercent: 20,
            currency:         'BRL',
          },
        }),
      ])
    },
  },
})

// Helper: retorna sessão ou lança erro 401
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  return session.user
}
