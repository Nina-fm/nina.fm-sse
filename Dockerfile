# Dockerfile multi-stage pour Nina.fm SSE
FROM node:20-alpine AS base

# Enable corepack and yarn
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Set working directory
WORKDIR /app

# Dependencies stage
FROM base AS dependencies

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Development stage
FROM dependencies AS development

# Copy source code
COPY . .

# Expose development port
EXPOSE 3001

# Start development server
CMD ["yarn", "dev"]

# Build stage
FROM dependencies AS build

# Copy source code
COPY . .

# Build application (TypeScript compilation)
RUN yarn build

# Production stage
FROM node:20-alpine AS production

# Enable corepack
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

WORKDIR /app

# Copy built application
COPY --from=build --chown=nodeuser:nodejs /app/build ./build
COPY --from=build --chown=nodeuser:nodejs /app/package.json ./package.json

# Install production dependencies only
RUN yarn install --frozen-lockfile --production --ignore-scripts

USER nodeuser

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Start the server (paths already resolved by tsc-alias during build)
CMD ["node", "build/server.js"]
