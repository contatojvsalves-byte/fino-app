import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z.object({
  name:     z.string().min(2).trim(),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 })

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({ data: { name, email } })

    await prisma.account.create({
      data: {
        userId: user.id, type: 'credentials',
        provider: 'credentials', providerAccountId: user.id,
        refresh_token: passwordHash,
      },
    })

    await prisma.$transaction([
      prisma.userPlan.create({
        data: { userId: user.id, plan: 'FREE', aiMessagesUsed: 0, aiMessagesLimit: 5, transactionLimit: 50 },
      }),
      prisma.financialProfile.create({
        data: { userId: user.id, monthlyIncome: 0, savingGoalPercent: 20, currency: 'BRL' },
      }),
    ])

    return NextResponse.json({ success: true }, { status: 201 })
    } catch (err: any) {
    console.error('[register] ERRO COMPLETO:', err?.message ?? err)
    console.error('[register] STACK:', err?.stack)
    return NextResponse.json(
      { error: err?.message ?? 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}