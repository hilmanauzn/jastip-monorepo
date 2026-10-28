#!/bin/sh
cd /app/packages/shared-types && ./node_modules/.bin/prisma db push --accept-data-loss --skip-generate
cd /app/apps/backend && exec node dist/index.js