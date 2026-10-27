#!/bin/sh
cd /app/packages/shared-types && pnpm prisma migrate deploy
cd /app/apps/backend && exec node dist/index.js