# Multi-stage Dockerfile for Commercefull Platform
# Stage 1: Build stage
# Node 22 LTS matches package.json "engines" (>=22) and still receives security patches.
# For reproducible builds, pin by digest: node:22-alpine@sha256:<digest>
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies (including dev dependencies for build)
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build CSS + storefront bundle + application (prd:build includes css:build and storefront:build)
RUN yarn prd:build

# Stage 2: Production stage
FROM node:22-alpine AS production

ENV NODE_ENV=production

# Install runtime dependencies (apk upgrade picks up base-image CVE fixes)
RUN apk upgrade --no-cache && apk add --no-cache \
    dumb-init \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S commercefull -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true \
    && yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/app.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/web ./web
COPY --from=builder /app/locales ./locales
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeds ./seeds
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/modules ./modules
COPY --from=builder /app/boot ./boot
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/knexfile.js ./

# Create necessary directories. Only the runtime-writable paths are owned by the
# app user — code stays root-owned/read-only so an RCE cannot tamper with it.
RUN mkdir -p /app/logs /app/uploads /app/public/uploads \
    && chown -R commercefull:nodejs /app/logs /app/uploads /app/public/uploads
USER commercefull

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application directly (no --watch, no yarn wrapper → signals reach node)
CMD ["node", "./app.mjs"]
