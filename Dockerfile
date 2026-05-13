FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Install workspace deps
FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --workspace=@foodstack/api --workspace=@foodstack/database --workspace=@foodstack/shared --include-workspace-root

# Generate Prisma client
FROM deps AS prisma
COPY packages/database/prisma ./packages/database/prisma
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build API
FROM prisma AS builder
COPY apps/api/src ./apps/api/src
COPY apps/api/nest-cli.json ./apps/api/nest-cli.json
COPY apps/api/tsconfig*.json ./apps/api/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
RUN npm run build --workspace=@foodstack/api

# Production runner
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/packages/database/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/main"]
