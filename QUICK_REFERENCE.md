# Quick Reference - Jastip Monorepo

## 🔑 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@jastip.com | password123 |
| Admin Toko A | admin@toko-a.com | password123 |
| Staff Toko A | staff@toko-a.com | password123 |
| Admin Toko B | admin@toko-b.com | password123 |
| Staff Toko B | staff@toko-b.com | password123 |

## 🛠️ Dev Commands
```bash
cd /c/Users/Hilman\ Auzan/Documents/jastip-monorepo

# Install
pnpm install

# Build all
pnpm build

# Backend dev (port 8080)
cd apps/backend && pnpm dev

# Dashboard dev (port 3000)
cd apps/dashboard && pnpm dev

# POS dev (port 3001)
cd apps/pos && pnpm dev

# Prisma
cd packages/shared-types
pnpm prisma generate
pnpm prisma db push
pnpm tsx prisma/seed.ts
```

## 🌐 URLs (Local Dev)
- Backend API: http://localhost:8080
- Dashboard: http://localhost:3000
- POS: http://localhost:3001
- Original FE (invoice-generator): http://localhost:4000

## 📦 Package Structure
```
apps/
  backend/     # Express + Prisma
  dashboard/   # Next.js (admin.jastip.com)
  pos/         # Next.js (toko-a.jastip.com, toko-b.jastip.com)
packages/
  shared-types/   # Prisma schema + types + seed
  ui/             # React components
  api-client/     # Axios + React Query hooks
  auth/           # JWT + bcrypt + RBAC
  config/         # Shared tooling configs
```

## 🚀 Deploy Targets
| App | Platform | Domain |
|-----|----------|--------|
| Backend | Fly.io | api.jastip.com |
| Dashboard | Vercel | admin.jastip.com |
| POS | Vercel | toko-a.jastip.com, toko-b.jastip.com |

## 🔧 Key Fixes Applied (Oct 2025)
1. Added `@types/node` to api-client & ui packages
2. Fixed import paths (`./client` → `../client`)
3. Made enums accept `string` for Prisma compatibility
4. Added explicit `Router` type annotations
5. Fixed `settings` JSON stringification in tenants routes
6. Inlined utils in orders.ts (removed @jastip/ui dep from backend)
7. Fixed Select component `onValueChange` prop
8. Added Suspense boundaries for login pages
9. Fixed tailwind.config.ts relative imports
10. Added DOM types to tsconfig.base.json

## 🎯 Next Priority
1. `fly apps create jastip-backend-multi`
2. `fly volumes create data --size 1 --app jastip-backend-multi`
3. Set Fly.io secrets (DATABASE_URL, JWT_SECRET, CORS_ORIGIN)
4. `fly deploy --app jastip-backend-multi`
5. Deploy dashboard & POS to Vercel
6. Configure custom domains
7. Set GitHub Actions secrets
8. Test full multi-tenant flow