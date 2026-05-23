// src/app/onboarding/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OnboardingClient } from '@/components/onboarding/onboarding-client'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Se já configurou perfil com renda > 0, ir para dashboard
  const profile = await prisma.financialProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (profile && Number(profile.monthlyIncome) > 0) {
    redirect('/dashboard')
  }

  // Buscar categorias padrão
  const categories = await prisma.category.findMany({
    where:   { userId: null },
    orderBy: { name: 'asc' },
  })

  return <OnboardingClient
    userName={session.user.name ?? 'você'}
    categories={categories}
  />
}
