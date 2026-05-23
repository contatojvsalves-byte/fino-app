// prisma/seed.ts
import { PrismaClient, CategoryType } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CATEGORIES = [
  // RECEITAS
  { name: 'Salário',       icon: '💰', color: '#00e5a0', type: CategoryType.INCOME,  isDefault: true },
  { name: 'Freelance',     icon: '💻', color: '#4d9eff', type: CategoryType.INCOME,  isDefault: true },
  { name: 'Investimentos', icon: '📈', color: '#4ade80', type: CategoryType.INCOME,  isDefault: true },
  { name: 'Outros',        icon: '💵', color: '#a78bfa', type: CategoryType.INCOME,  isDefault: true },

  // GASTOS
  { name: 'Casa',       icon: '🏠', color: '#00e5a0', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Alimentação',   icon: '🛒', color: '#4d9eff', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Transporte',    icon: '🚌', color: '#ffb830', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Saúde',         icon: '💊', color: '#ff5f6d', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Lazer',         icon: '🎉', color: '#a78bfa', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Educação',      icon: '📚', color: '#38bdf8', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Assinatura',    icon: '📱', color: '#818cf8', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Dívida',        icon: '💳', color: '#f87171', type: CategoryType.EXPENSE, isDefault: true },
  { name: 'Outros',        icon: '📦', color: '#94a3b8', type: CategoryType.EXPENSE, isDefault: true },
]

async function main() {
  console.log('🌱 Seeding default categories...')

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        // upsert simples por nome+tipo padrão
        id: `default-${cat.name}-${cat.type}`.toLowerCase().replace(/\s/g, '-'),
      },
      update: cat,
      create: {
        id: `default-${cat.name}-${cat.type}`.toLowerCase().replace(/\s/g, '-'),
        ...cat,
        userId: null,
      },
    })
  }

  console.log('✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
