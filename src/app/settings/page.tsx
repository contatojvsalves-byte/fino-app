// src/app/settings/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [profile, userPlan, categories] = await Promise.all([
    prisma.financialProfile.findUnique({ where: { userId } }),
    prisma.userPlan.findUnique({ where: { userId } }),
    prisma.category.findMany({
      where:   { OR: [{ userId }, { userId: null }], type: 'EXPENSE' },
      orderBy: { name: 'asc' },
    }),
  ])

  // Buscar limites do mês atual
  const month = new Date().getFullYear() + '-' + String(new Date().getMonth()+1).padStart(2,'0')
  const budgetLimits = await prisma.budgetLimit.findMany({
    where:   { userId, month },
    include: { category: true },
  })

  return (
    <AppLayout session={session}>
      <SettingsClient
        profile={profile ? { ...profile, monthlyIncome: Number(profile.monthlyIncome) } : null}
        userPlan={userPlan}
        user={{ name: session.user.name, email: session.user.email, image: session.user.image }}
        categories={categories}
        budgetLimits={budgetLimits.map(b => ({
          id:         b.id,
          categoryId: b.categoryId,
          amount:     Number(b.amount),
          month:      b.month,
          category:   b.category,
        }))}
        currentMonth={month}
      />
    </AppLayout>
  )
}
