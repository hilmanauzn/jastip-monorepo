# Jastip Monorepo

Multi-tenant Jastip Management System dengan:
- **Backend**: Express + Prisma + SQLite (Fly.io)
- **Dashboard**: Next.js Admin Panel (Vercel)
- **POS**: Next.js Point of Sale (Vercel)

## Struktur Project

```
jastip-monorepo/
├── apps/
│   ├── backend/          # Express API Server
│   ├── dashboard/        # Next.js Admin Dashboard
│   └── pos/              # Next.js POS/Kasir
├── packages/
│   ├── shared-types/     # Prisma schema + TypeScript types
│   ├── ui/               # Shared React components
│   ├── api-client/       # React Query hooks + API client
│   ├── auth/             # JWT auth utilities
│   └── config/           # Shared configs (TS, ESLint, Tailwind)
├── turbo.json            # Turborepo config
├── pnpm-workspace.yaml   # pnpm workspaces
└── package.json          # Root package.json
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Fly.io CLI (untuk backend)
- Vercel CLI (untuk dashboard & POS)

### Local Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Start all dev servers
pnpm dev
```

Atau jalankan terpisah:
```bash
# Terminal 1 - Backend
cd apps/backend && pnpm dev

# Terminal 2 - Dashboard
cd apps/dashboard && pnpm dev

# Terminal 3 - POS
cd apps/pos && pnpm dev
```

### Environment Variables

**Backend** (`apps/backend/.env`):
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:3000,http://localhost:4000"
NODE_ENV="development"
PORT=8080
```

**Dashboard** (`apps/dashboard/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

**POS** (`apps/pos/.env.local`):
```env
NEXT_PUBLIC_API_URL="http://localhost:8080"
```

### Database Setup

```bash
# Push schema to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed database
pnpm --filter @jastip/shared-types db:seed

# Open Prisma Studio
pnpm db:studio
```

## Deployment

### Backend (Fly.io)
```bash
# Login to Fly.io
flyctl auth login

# Create app and volume
flyctl launch --name jastip-backend --region sin --no-deploy
flyctl volumes create data --size 1 --region sin

# Set secrets
flyctl secrets set DATABASE_URL="file:/data/prod.db"
flyctl secrets set JWT_SECRET="$(openssl rand -base64 32)"
flyctl secrets set CORS_ORIGIN="https://admin.jastip.com,https://toko-a.jastip.com,https://toko-b.jastip.com"

# Deploy
flyctl deploy

# Add custom domains
flyctl certs add api.jastip.com admin.jastip.com toko-a.jastip.com toko-b.jastip.com
```

### Dashboard & POS (Vercel)
```bash
# Login to Vercel
vercel login

# Import projects from GitHub
# Dashboard: apps/dashboard -> admin.jastip.com
# POS: apps/pos -> toko-a.jastip.com, toko-b.jastip.com

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL = https://api.jastip.com
```

### GitHub Actions (Auto Deploy)
Set these secrets in GitHub repository settings:
- `FLY_API_TOKEN`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_DASHBOARD_PROJECT_ID`
- `VERCEL_POS_PROJECT_ID`
- `NEXT_PUBLIC_API_URL`

## Multi-Tenant Architecture

### Tenant Resolution
- Subdomain-based: `toko-a.jastip.com`, `toko-b.jastip.com`
- Header-based: `x-tenant-slug: toko-a`
- JWT claims: `tenantId`, `tenantSlug`

### Roles
- `SUPER_ADMIN` - Akses semua toko, CRUD tenant, global rules
- `ADMIN_TENANT` - CRUD menu, orders, rules, analytics per toko
- `STAFF` - POS operations, create orders, view menu

### Jastip Rules Engine
- `PER_UNIT` - Fee per item yang include jastip
- `PER_MULTIPLE` - Fee per kelipatan (default 6 pcs)
- `PER_ORDER` - Flat fee per order
- `TIERED` - Berlapis (qty 1-5: 2k, 6-10: 1.5k, 11+: 1k)

Global rules bisa di-override per tenant.

## API Endpoints

Base URL: `https://api.jastip.com`

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Tenants (SA) | `GET/POST /api/tenants`, `GET/PATCH/DELETE /api/tenants/:id` |
| Users | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` |
| Restaurants | `GET/POST /api/restaurants`, `GET/PATCH/DELETE /api/restaurants/:id` |
| Menu | `GET/POST /api/menu`, `GET/PATCH/DELETE /api/menu/:id`, `POST /api/menu/bulk` |
| Orders | `GET/POST /api/orders`, `POST /api/orders/preview`, `PATCH /api/orders/:id/status` |
| Customers | `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/:id` |
| Jastip Rules | `GET/PATCH /api/jastip-rules/global`, `GET/PATCH /api/jastip-rules/tenant` |
| Settings | `GET/PATCH /api/settings` |
| Analytics | `GET /api/analytics/sales`, `GET /api/analytics/top-items`, `GET /api/analytics/by-category` |

## Demo Accounts

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| admin@jastip.com | password123 | SUPER_ADMIN | Toko A |
| admin@toko-a.com | password123 | ADMIN_TENANT | Toko A |
| staff@toko-a.com | password123 | STAFF | Toko A |
| admin@toko-b.com | password123 | ADMIN_TENANT | Toko B |
| staff@toko-b.com | password123 | STAFF | Toko B |

## Cost Optimization (Free Tier)

- **Backend**: Fly.io scale-to-zero (`min_machines_running = 0`) + 1GB SQLite volume
- **Dashboard**: Vercel Hobby (gratis)
- **POS**: Vercel Hobby (gratis)
- **Total**: ~$0-4/bulan (dalam $5 Fly.io credit)

## License

MIT