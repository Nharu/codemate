# ==================================
# Dependencies Stage
# ==================================
FROM node:22-slim AS deps

WORKDIR /app

# Copy monorepo root files for dependency installation
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Set CI environment to skip husky install
ENV CI=true

# Install dependencies (monorepo workspace) with optional dependencies
RUN npm ci --workspace=frontend --include=optional && \
    npm install --no-save lightningcss-linux-x64-gnu@1.30.1 && \
    npm install --no-save @tailwindcss/oxide-linux-x64-gnu@4.1.13 && \
    npm rebuild lightningcss

# ==================================
# Build Stage
# ==================================
FROM node:22-slim AS builder

WORKDIR /app

# Set CI environment to skip lint/type check during build
ENV CI=true

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
# Set placeholder API URL for build (will be overridden at runtime)
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

# Install platform-specific binaries and rebuild for builder stage
RUN npm install --no-save lightningcss-linux-x64-gnu@1.30.1 && \
    npm install --no-save @tailwindcss/oxide-linux-x64-gnu@4.1.13 && \
    npm rebuild lightningcss && \
    npm rebuild @tailwindcss/oxide

# Build application (use build:ci to avoid Turbopack issues in CI)
RUN npm run build:ci --workspace=frontend

# ==================================
# Production Stage
# ==================================
FROM node:22-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

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
