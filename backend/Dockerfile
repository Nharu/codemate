# ==================================
# Build Stage
# ==================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# ==================================
# Production Stage
# ==================================
FROM node:22-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

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
CMD ["node", "dist/main"]
