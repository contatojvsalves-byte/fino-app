// src/app/open-finance/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { OpenFinanceClient } from '@/components/open-finance/open-finance-client'

export default async function OpenFinancePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const connections = await prisma.bankConnection.findMany({
    where:   { userId },
    include: { accounts: true },
    orderBy: { createdAt: 'desc' },
  })

  const connectionsNorm = connections.map(c => ({
    ...c,
    accounts: c.accounts.map(a => ({
      ...a,
      balance:     Number(a.balance),
      creditLimit: a.creditLimit ? Number(a.creditLimit) : null,
    })),
  }))

  return (
    <AppLayout session={session}>
      <OpenFinanceClient connections={connectionsNorm as any} />
    </AppLayout>
  )
}
