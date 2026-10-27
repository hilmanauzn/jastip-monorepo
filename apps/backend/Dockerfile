# Multi-stage build for Render
# ============================================
# Stage 1: Builder - install deps, build, generate Prisma
# ============================================
FROM node:20-alpine AS builder
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

# Install all dependencies (including dev for build)
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

# Build packages needed by backend (shared-types, auth, then backend)
RUN cd packages/shared-types && pnpm build
RUN cd packages/auth && pnpm build
RUN cd apps/backend && pnpm build

# Generate Prisma client
RUN cd packages/shared-types && pnpm db:generate

# Prune dev dependencies
RUN pnpm install --prod --frozen-lockfile

# ============================================
# Stage 2: Runner - minimal production image
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for Prisma engine compatibility
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

# Copy production node_modules and built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-types/prisma ./packages/shared-types/prisma
COPY --from=builder --chown=nodejs:nodejs /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nodejs:nodejs /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/auth/package.json ./packages/auth/package.json
COPY --from=builder --chown=nodejs:nodejs /app/packages/config/package.json ./packages/config/package.json

# Copy entrypoint script
COPY --chown=nodejs:nodejs apps/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nodejs

WORKDIR /app/apps/backend
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

ENTRYPOINT ["/entrypoint.sh"]