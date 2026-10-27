# Jastip Monorepo - Project Plan & Progress Documentation

**Last Updated**: 2025-10-27  
**Monorepo Path**: `C:/Users/Hilman Auzan/Documents/jastip-monorepo`

---

## 🎯 Goal

Build a multi-tenant monorepo architecture for 2 stores with:
- Shared dashboard (admin.jastip.com)
- Separate POS per tenant (toko-a.jastip.com, toko-b.jastip.com)
- Backend API (api.jastip.com)
- Role-based access: SUPER_ADMIN, ADMIN_TENANT, STAFF
- Free tier deployment: Fly.io (backend) + Vercel (frontends)

---

## 📁 Monorepo Structure

```
jastip-monorepo/
├── apps/
│   ├── backend/          # Express + Prisma (port 8080)
│   ├── dashboard/        # Next.js 14 (admin.jastip.com)
│   └── pos/              # Next.js 14 (toko-a.jastip.com, toko-b.jastip.com)
├── packages/
│   ├── shared-types/     # Prisma schema + TypeScript types + seed
│   ├── ui/               # Shared React components (Button, Input, Select, etc.)
│   ├── api-client/       # Typed API client + React Query hooks
│   ├── auth/             # JWT (jose), bcrypt, RBAC permissions
│   └── config/           # Shared ESLint, Prettier, Tailwind, TSConfig
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## ✅ Completed Tasks

### Backend (apps/backend)
- [x] Express server with CORS, helmet, morgan, compression
- [x] Prisma schema with multi-tenant models:
  - Tenant, User, Restaurant, MenuItem
  - JastipRuleGlobal, JastipRuleTenant, JastipRuleTier
  - Order, OrderItem, Customer, Settings
- [x] Auth routes: login, refresh, me, register
- [x] Tenant routes (SUPER_ADMIN): CRUD + stats
- [x] User routes: CRUD per tenant
- [x] Restaurant routes: CRUD + jastip override
- [x] Menu routes: CRUD + bulk import + categories
- [x] Order routes: CRUD + preview + status/payment updates
- [x] Customer routes: CRUD
- [x] Jastip Rules routes: global + tenant + tier
- [x] Settings routes: get/update
- [x] Analytics routes: sales, top items, by category, by restaurant
- [x] Seed script with 2 tenants, 5 users, 4 restaurants, 17 menu items, sample orders
- [x] Database pushed & seeded successfully
- [x] Backend runs on port 8080
- [x] **Build passes** (TypeScript compiles without errors)

### Shared Packages
- [x] `@jastip/shared-types`: Prisma schema + TypeScript types + seed
- [x] `@jastip/ui`: Button, Input, Select, Textarea, Card, Table, Badge, utils (cn, formatCurrency)
- [x] `@jastip/api-client`: Axios instance + React Query hooks for all endpoints
- [x] `@jastip/auth`: JWT (jose), bcrypt, RBAC (hasPermission, requireAuth, etc.)
- [x] `@jastip/config`: Shared tooling configs

### Dashboard (apps/dashboard)
- [x] Next.js 14 with App Router
- [x] Login page with Suspense boundary
- [x] Super Admin layout with sidebar + tenant switcher
- [x] Role-based navigation
- [x] Dashboard page with stats, sales chart, top items, quick actions
- [x] **Build passes**

### POS (apps/pos)
- [x] Next.js 14 with App Router
- [x] Login page with Suspense boundary
- [x] POS page with:
  - Restaurant filter (Select component)
  - Menu categories sidebar
  - Cart with quantity controls
  - Order preview with jastip calculation
  - Customer info form
  - Submit order
- [x] **Build passes**

### DevOps / Config
- [x] Turborepo config with build pipeline
- [x] GitHub Actions workflow (deploy.yml) for Fly.io + Vercel
- [x] Fly.io config (apps/backend/fly.toml) with scale-to-zero
- [x] Vercel configs (apps/dashboard/vercel.json, apps/pos/vercel.json)
- [x] Dockerfile for backend with openssl for Prisma
- [x] pnpm workspace with 9 packages

---

## 🔧 Key Technical Decisions

| Decision | Detail |
|----------|--------|
| **Custom IDs** | Removed `@default(cuid())` from Restaurant/MenuItem to preserve FE mock IDs (rest1-rest19, m1-m279) |
| **SQLite-compatible Prisma** | No Json type, no native enums (String with validation), JSON stored as String |
| **Settings model** | `@default(cuid())` with unique tenantId (not singleton) |
| **Subdomain routing** | `toko-a.jastip.com` → tenant A, `admin.jastip.com` → dashboard, `api.jastip.com` → backend |
| **Scale-to-zero** | Fly.io: `min_machines_running = 0`, `auto_stop_machines = "stop"` |
| **Free tier only** | Fly.io free tier + Vercel free tier = $0/month |
| **CORS** | Comma-separated origins: `http://localhost:4000,http://localhost:3000,https://jastip-frontend.fly.dev` |

---

## 🧪 Demo Credentials (Seeded)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@jastip.com | password123 |
| Admin Toko A | admin@toko-a.com | password123 |
| Staff Toko A | staff@toko-a.com | password123 |
| Admin Toko B | admin@toko-b.com | password123 |
| Staff Toko B | staff@toko-b.com | password123 |

---

## 🔑 Environment Variables Needed

### Backend (Fly.io secrets)
```bash
DATABASE_URL=file:/data/dev.db
JWT_SECRET=<generate-with-openssl>
CORS_ORIGIN=http://localhost:4000,http://localhost:3000,https://admin.jastip.com,https://toko-a.jastip.com,https://toko-b.jastip.com
```

### Dashboard (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://api.jastip.com
```

### POS (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://api.jastip.com
```

---

## 📋 Remaining Tasks (Priority Order)

### 1. Deploy Backend to Fly.io
- [ ] Create Fly.io app: `fly apps create jastip-backend-multi`
- [ ] Create volume: `fly volumes create data --size 1 --app jastip-backend-multi`
- [ ] Set secrets (DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
- [ ] Deploy: `fly deploy --app jastip-backend-multi`
- [ ] Run migrations: `fly ssh console --app jastip-backend-multi -C "pnpm prisma migrate deploy"`

### 2. Deploy Dashboard to Vercel
- [ ] Create Vercel project for dashboard
- [ ] Connect GitHub repo, set root to `apps/dashboard`
- [ ] Add environment variable: `NEXT_PUBLIC_API_URL=https://api.jastip.com`
- [ ] Configure custom domain: `admin.jastip.com`

### 3. Deploy POS to Vercel (2 projects or 1 with subdomains)
- [ ] Create Vercel project for POS
- [ ] Connect GitHub repo, set root to `apps/pos`
- [ ] Add environment variable: `NEXT_PUBLIC_API_URL=https://api.jastip.com`
- [ ] Configure custom domains: `toko-a.jastip.com`, `toko-b.jastip.com`

### 4. GitHub Actions Secrets
- [ ] `FLY_API_TOKEN`
- [ ] `VERCEL_TOKEN`
- [ ] `VERCEL_ORG_ID`
- [ ] `VERCEL_PROJECT_ID_DASHBOARD`
- [ ] `VERCEL_PROJECT_ID_POS`

### 5. End-to-End Testing
- [ ] Test Super Admin login → tenant switcher → manage menus/orders
- [ ] Test Admin Toko A login → POS → create order
- [ ] Test Staff Toko B login → POS → create order
- [ ] Verify data isolation between tenants
- [ ] Verify jastip calculation works per tenant rules

---

## 🐛 Known Issues / Tech Debt

1. **Dashboard routes not fully implemented**: `/dashboard/tenants`, `/dashboard/menu`, `/dashboard/orders`, `/dashboard/rules` return 404
2. **POS needs tenant resolution**: Currently uses hardcoded tenant; need subdomain-based tenant detection
3. **No integration tests**: Only manual testing done
4. **Jastip rules engine**: Tier-based rules not fully implemented in order preview
5. **Real-time updates**: No WebSocket for live order updates

---

## 🚀 Quick Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run backend dev server
cd apps/backend && pnpm dev

# Run dashboard dev server
cd apps/dashboard && pnpm dev

# Run POS dev server
cd apps/pos && pnpm dev

# Generate Prisma client
cd packages/shared-types && pnpm prisma generate

# Push schema to dev DB
cd packages/shared-types && pnpm prisma db push

# Seed database
cd packages/shared-types && pnpm tsx prisma/seed.ts

# Run backend tests (when added)
cd apps/backend && pnpm test
```

---

## 📝 Session Handoff Notes

**Current State**: Full monorepo builds successfully. All packages compile. Ready for deployment phase.

**Next Session Should Start With**:
1. Deploy backend to Fly.io (create app, volume, set secrets, deploy, migrate)
2. Deploy dashboard to Vercel
3. Deploy POS to Vercel (configure subdomains)
4. Set up GitHub Actions secrets
5. Test full multi-tenant flow

**Key Files to Review**:
- `packages/shared-types/prisma/schema.prisma` - Full schema
- `apps/backend/src/index.ts` - Express app entry
- `apps/dashboard/src/app/(super-admin)/layout.tsx` - Dashboard layout
- `apps/pos/src/app/pos/page.tsx` - POS main page
- `.github/workflows/deploy.yml` - CI/CD pipeline

---

## 🔗 Related Repositories

- **Original Backend**: `C:/Users/Hilman Auzan/Documents/jastip-backend` (deployed, working, single-tenant)
- **Frontend (Invoice Generator)**: `C:/Users/Hilman Auzan/Documents/invoice-generator` (port 4000, needs integration)
- **This Monorepo**: `C:/Users/Hilman Auzan/Documents/jastip-monorepo` (current work)

---

## 📚 References

- Fly.io docs: https://fly.io/docs/
- Vercel docs: https://vercel.com/docs
- Turborepo docs: https://turbo.build/repo/docs
- Prisma docs: https://www.prisma.io/docs
- Next.js 14 App Router: https://nextjs.org/docs/app