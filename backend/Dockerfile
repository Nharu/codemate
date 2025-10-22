# ==================================
# Build Stage
# ==================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy monorepo root files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies (monorepo workspace)
RUN npm ci --workspace=backend --ignore-scripts

# Copy backend source code
COPY backend ./backend

# Build application
RUN npm run build --workspace=backend

# ==================================
# Production Stage
# ==================================
FROM node:22-alpine AS production

WORKDIR /app

# Copy monorepo root files for dependency installation
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install production dependencies only (monorepo workspace)
RUN npm ci --workspace=backend --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "backend/dist/main"]
