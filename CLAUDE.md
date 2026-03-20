# Contabilita - Sistema Contabil Brasileiro

## Visao Geral
Sistema contabil completo inspirado no Dominio Empresarial (Thomson Reuters). Monorepo pnpm + Turborepo com NestJS (API), React + Vite (Web) e packages compartilhados.

## Comandos

```bash
# Desenvolvimento
pnpm dev              # Inicia API (3000) + Web (5173) em paralelo
pnpm build            # Build de todos os pacotes via Turborepo
pnpm lint             # Lint em todos os pacotes
pnpm test             # Testes em todos os pacotes
pnpm format           # Formata com Prettier

# Docker
docker compose -f docker/docker-compose.yml up -d    # MongoDB replica set + Redis
docker compose -f docker/docker-compose.yml down      # Para containers

# Pacotes individuais
pnpm --filter @contabilita/api dev     # Apenas API
pnpm --filter @contabilita/web dev     # Apenas Web
pnpm --filter @contabilita/shared build # Build shared
```

## Estrutura do Monorepo

```
apps/api/     → NestJS 11 backend (porta 3000, prefixo /api)
apps/web/     → React 19 + Vite 6 frontend (porta 5173)
packages/shared/ → Tipos, enums e constantes compartilhados
docker/       → Docker Compose (MongoDB replica set + Redis)
```

## Convencoes de Codigo

### Idioma Misto
- **Estrutural** em ingles: controllers, services, guards, hooks, utils, config
- **Dominio contabil** em portugues: `LancamentoContabil`, `PlanoDeContas`, `ApuracaoFiscal`
- **Schemas** misto: `lancamento-contabil.schema.ts` (arquivo), `LancamentoContabil` (classe)
- **Comentarios**: portugues para logica de negocio, ingles para infra
- **Commits**: ingles (Conventional Commits)
- **Enums de dominio**: portugues (`RegimeTributario.SimplesNacional`)

### Backend (NestJS)
- Mongoose ODM com schemas decorados
- `Decimal128` para TODOS os valores monetarios (NUNCA usar Number/float)
- Todas as collections tenant-scoped incluem `tenantId` indexado
- Repository Pattern: `TenantScopedRepository<T>` base
- Strategy Pattern para calculo de impostos por regime tributario
- Factory Pattern: `TaxCalculationFactory`
- EventEmitter entre modulos (ex: `invoice.posted` -> gera lancamento)
- Validacao com `class-validator` + `class-transformer`
- Auth: JWT access + refresh tokens, `@nestjs/passport`
- RBAC: `@casl/ability` (Owner/Admin/Accountant/Analyst/Viewer)

### Frontend (React)
- shadcn/ui (componentes copiaveis) + Tailwind CSS 4
- Zustand para estado global (auth, tenant, ui)
- React Query v5 para estado servidor
- React Hook Form + Zod para formularios
- Feature-based structure (`features/<modulo>/pages|hooks|services`)
- Alias `@/` aponta para `src/`

### Database
- MongoDB 7 em replica set (necessario para transactions)
- Mongoose 8 com plugins: tenant-scoped, audit-trail, soft-delete

## Variaveis de Ambiente
Copie `.env.example` para `.env` e ajuste os valores.

## Fluxo de Dados
```
Controller → Service → Repository → MongoDB
     ↓          ↓
  Swagger    EventEmitter → Listeners (cross-module)
```
