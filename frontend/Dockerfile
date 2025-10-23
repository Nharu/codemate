# ==================================
# Dependencies Stage
# ==================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy monorepo root files for dependency installation
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies (monorepo workspace)
RUN npm ci --workspace=frontend --ignore-scripts

# ==================================
# Build Stage
# ==================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json files for workspace commands
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Copy dependencies from deps stage (workspace installs to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy frontend source code
COPY frontend ./frontend

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build application (use build:ci to avoid Turbopack issues in CI)
RUN npm run build:ci --workspace=frontend

# ==================================
# Production Stage
# ==================================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only necessary files from builder
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"

# Start application
CMD ["node", "server.js"]
