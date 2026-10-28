FROM node:20-alpine
WORKDIR /app

# Install openssl for Prisma engine compatibility
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/tsconfig.json ./apps/backend/
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-types/prisma ./packages/shared-types/prisma
COPY packages/auth/src ./packages/auth/src
COPY packages/auth/tsconfig.json ./packages/auth/
COPY packages/ui/src ./packages/ui/src
COPY packages/ui/tsconfig.json ./packages/ui/
COPY packages/api-client/src ./packages/api-client/src
COPY packages/api-client/tsconfig.json ./packages/api-client/
COPY packages/config/tsconfig.base.json ./packages/config/tsconfig.base.json

# Build packages needed by backend
RUN cd packages/shared-types && pnpm build
RUN cd packages/auth && pnpm build
RUN cd apps/backend && pnpm build

# Generate Prisma client
RUN cd packages/shared-types && pnpm db:generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
USER nodejs

# Copy entrypoint script
COPY --chown=nodejs:nodejs apps/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/apps/backend
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

ENTRYPOINT ["/entrypoint.sh"]