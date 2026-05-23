# 💎 Fino — Finanças Inteligentes

SaaS financeiro pessoal para brasileiros com IA integrada.

---

## Stack

| Camada     | Tecnologia                              |
|------------|------------------------------------------|
| Frontend   | Next.js 14 · React · TypeScript · Tailwind |
| Backend    | API Routes Next.js · TypeScript          |
| Banco      | PostgreSQL · Prisma ORM                  |
| Auth       | NextAuth v5 · Google OAuth               |
| IA         | Anthropic Claude (somente backend)       |
| Pagamentos | Stripe / Mercado Pago (futuro)           |

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (local ou Supabase/Neon/Railway)
- Conta Anthropic (para a IA)
- Conta Google Cloud (para login social — opcional)

---

## Configuração local

### 1. Clone e instale dependências

```bash
git clone https://github.com/seu-usuario/fino.git
cd fino
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com seus valores:

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/fino"
AUTH_SECRET="gere-com-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="seu-google-client-id"
AUTH_GOOGLE_SECRET="seu-google-client-secret"
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### 3. Crie o banco de dados

```bash
# Criar banco (se usar PostgreSQL local)
createdb fino

# Aplicar schema
npm run db:push

# Popular categorias padrão
npm run db:seed
```

### 4. Rode em desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Estrutura do projeto

```
fino/
├── prisma/
│   ├── schema.prisma          # Schema completo do banco
│   └── seed.ts                # Categorias padrão
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + metadata
│   │   ├── page.tsx           # Redirect para /dashboard
│   │   ├── login/page.tsx     # Tela de login
│   │   ├── register/page.tsx  # Tela de cadastro
│   │   ├── dashboard/page.tsx # Dashboard principal
│   │   ├── transactions/      # CRUD de transações
│   │   ├── debts/             # CRUD de dívidas
│   │   ├── charts/            # Gráficos e simulador
│   │   ├── ai/                # Chat com IA
│   │   ├── settings/          # Ajustes do perfil
│   │   ├── upgrade/           # Planos e preços
│   │   └── api/
│   │       ├── auth/          # NextAuth + registro
│   │       ├── transactions/  # CRUD transações
│   │       ├── debts/         # CRUD dívidas
│   │       ├── budgets/       # Limites por categoria
│   │       ├── profile/       # Perfil financeiro
│   │       └── ai/chat/       # IA (API key só aqui)
│   ├── components/
│   │   ├── layout/            # AppLayout (sidebar + nav)
│   │   ├── dashboard/         # DashboardClient
│   │   ├── transactions/      # TransactionsClient
│   │   ├── debts/             # DebtsClient
│   │   ├── charts/            # ChartsClient + gráficos
│   │   ├── ai/                # AiClient (chat)
│   │   └── settings/          # SettingsClient
│   ├── lib/
│   │   ├── prisma.ts          # Singleton do Prisma
│   │   ├── auth.ts            # NextAuth config
│   │   ├── finance.ts         # Cálculos financeiros
│   │   ├── validations.ts     # Schemas Zod
│   │   └── ai.ts              # Serviço Anthropic (backend)
│   ├── middleware.ts           # Proteção de rotas
│   └── types/index.ts         # Tipos TypeScript
```

---

## Scripts disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar produção
npm run db:push      # Aplicar schema ao banco
npm run db:migrate   # Criar migration
npm run db:seed      # Popular categorias padrão
npm run db:studio    # Abrir Prisma Studio (GUI do banco)
npm run lint         # Checar erros de lint
```

---

## Endpoints da API

### Autenticação
| Método | Rota                    | Descrição             |
|--------|-------------------------|-----------------------|
| POST   | /api/auth/register      | Criar conta           |
| POST   | /api/auth/signin        | Login (NextAuth)      |
| GET    | /api/auth/session       | Sessão atual          |

### Transações
| Método | Rota                    | Descrição             |
|--------|-------------------------|-----------------------|
| GET    | /api/transactions       | Listar (com filtros)  |
| POST   | /api/transactions       | Criar                 |
| PUT    | /api/transactions/[id]  | Editar                |
| DELETE | /api/transactions/[id]  | Excluir               |

### Dívidas
| Método | Rota              | Descrição     |
|--------|-------------------|---------------|
| GET    | /api/debts        | Listar        |
| POST   | /api/debts        | Criar         |
| PUT    | /api/debts/[id]   | Editar/status |
| DELETE | /api/debts/[id]   | Excluir       |

### Orçamentos
| Método | Rota          | Descrição              |
|--------|---------------|------------------------|
| GET    | /api/budgets  | Limites do mês         |
| POST   | /api/budgets  | Salvar limites em lote |

### Perfil
| Método | Rota          | Descrição        |
|--------|---------------|------------------|
| GET    | /api/profile  | Perfil financeiro |
| PUT    | /api/profile  | Atualizar perfil  |

### IA (somente backend — API key segura)
| Método | Rota           | Descrição          |
|--------|----------------|--------------------|
| POST   | /api/ai/chat   | Enviar mensagem    |

---

## Planos SaaS

| Recurso              | Grátis    | Premium     |
|----------------------|-----------|-------------|
| Transações/mês       | 50        | Ilimitado   |
| Mensagens de IA/mês  | 5         | Ilimitado   |
| Gráficos             | Básicos   | Completos   |
| Relatórios           | ✗         | ✓           |
| Open Finance         | ✗         | Em breve    |
| Suporte              | Comunidade | Prioritário |

---

## Segurança implementada

- ✅ API key da IA **nunca** vai ao frontend
- ✅ Todas as queries filtradas por `userId`
- ✅ Validação com Zod em todos os endpoints
- ✅ Rate limiting no endpoint de IA (5 req/min)
- ✅ Limite de uso da IA por plano
- ✅ Proteção de rotas via middleware
- ✅ Variáveis sensíveis em `.env.local`
- ✅ Verificação de ownership antes de update/delete
- ✅ Sessão JWT com NextAuth

---

## Deploy

### Vercel (recomendado)
```bash
# Instale a CLI
npm i -g vercel

# Deploy
vercel

# Configure as env vars no dashboard da Vercel
```

### Banco em produção
- **Supabase**: gratuito até 500MB, PostgreSQL gerenciado
- **Neon**: serverless PostgreSQL, plano free generoso
- **Railway**: fácil de configurar, paga pelo uso

---

## Próximos passos para monetização

1. **Stripe** — integrar checkout e webhooks para plano Premium
2. **Mercado Pago** — alternativa brasileira com PIX
3. **Open Finance** — integração com APIs bancárias (Belvo, Pluggy)
4. **App mobile** — React Native com Expo (mesma API)
5. **Relatórios PDF** — exportação automática mensal
6. **Alertas push** — notificações de limites e vencimentos
7. **Multi-moeda** — suporte a EUR, USD para expatriados
8. **Compartilhamento** — modo casal/família

---

## LGPD

A estrutura já está preparada para:
- Exclusão de conta (cascade no banco)
- Exportação de dados (endpoint a implementar)
- Log de consentimento (`ConsentLog`)
- Política de privacidade (página `/privacy`)

---

## Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: adiciona minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

Feito com 💚 para brasileiros que querem controle financeiro de verdade.
