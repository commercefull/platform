# Multi-stage Dockerfile for CommerceFull Platform
# Stage 1: Build stage
FROM node:20-alpine AS builder

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

# Build CSS
RUN yarn css:build

# Build application for production
RUN yarn prd:build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
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

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads

# Set permissions
RUN chown -R commercefull:nodejs /app
USER commercefull

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["yarn", "prd:run"]
