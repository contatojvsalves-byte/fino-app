// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { profileSchema } from '@/lib/validations'

export async function GET() {
  try {
    const user    = await requireAuth()
    const profile = await prisma.financialProfile.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ success:true, data: profile ? { ...profile, monthlyIncome: Number(profile.monthlyIncome) } : null, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const body   = await req.json()
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const profile = await prisma.financialProfile.upsert({
      where:  { userId: user.id },
      update: parsed.data,
      create: { userId: user.id, currency:'BRL', ...parsed.data },
    })

    return NextResponse.json({ success:true, data: { ...profile, monthlyIncome: Number(profile.monthlyIncome) }, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}
