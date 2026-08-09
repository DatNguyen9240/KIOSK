# =============================================================================
# PARKING.GO KIOSK — BACKEND REST API DOCKERFILE
# Multi-stage lightweight Node.js 20 Alpine container for Backend & Database API
# =============================================================================

FROM node:20-alpine AS base
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package.json server/package.json ./server/

# Install production dependencies
WORKDIR /app/server
RUN npm install --only=production

# Copy frontend static assets, source code & backend/database
WORKDIR /app
COPY index.html ./
COPY assets/ ./assets/
COPY src/ ./src/
COPY server/ ./server/
COPY db/ ./db/

# Environment Defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose API Port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start Backend Server
CMD ["node", "server/server.js"]
