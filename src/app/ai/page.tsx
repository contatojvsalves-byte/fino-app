// src/app/ai/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { AiClient } from '@/components/ai/ai-client'

export default async function AiPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userPlan = await prisma.userPlan.findUnique({ where: { userId: session.user.id } })

  return (
    <AppLayout session={session}>
      <AiClient
        remaining={userPlan ? userPlan.aiMessagesLimit - userPlan.aiMessagesUsed : 0}
        plan={userPlan?.plan ?? 'FREE'}
      />
    </AppLayout>
  )
}
