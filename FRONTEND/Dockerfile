# ============================================================================
# VUKA — Frontend SSR production image (TanStack Start + Nitro)
# Multi-stage build running Node 22 Alpine
# ============================================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and compile production bundle
COPY . .
RUN npm run build

# ---- Stage 2: Minimal runtime image -----------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Non-root unprivileged container user
RUN addgroup -S vuka && adduser -S -G vuka vuka

# Copy compiled nitro SSR output
COPY --from=builder --chown=vuka:vuka /app/.output /app/.output

USER vuka
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
