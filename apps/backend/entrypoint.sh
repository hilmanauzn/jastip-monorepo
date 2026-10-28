#!/bin/sh
cd /app/packages/shared-types && ./node_modules/.bin/prisma migrate deploy
cd /app/apps/backend && exec node dist/index.js