# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies including devDependencies for build
RUN npm install

# Copy backend source files
COPY backend/ ./backend/

# Build TypeScript backend
RUN npm run build --workspace=backend

# ── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev --workspace=backend

# Copy built distribution from builder
COPY --from=builder /app/backend/dist ./backend/dist

# Security: run as non-root user
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

CMD ["node", "backend/dist/index.js"]
