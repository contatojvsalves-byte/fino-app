// src/app/investments/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { InvestmentsClient } from '@/components/investments/investments-client'

export default async function InvestmentsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const invs = await prisma.investment.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
  })

  const investments = invs.map(inv => ({
    ...inv,
    quantity:     Number(inv.quantity),
    avgPrice:     Number(inv.avgPrice),
    currentPrice: Number(inv.currentPrice),
  }))

  return (
    <AppLayout session={session}>
      <InvestmentsClient investments={investments} />
    </AppLayout>
  )
}
