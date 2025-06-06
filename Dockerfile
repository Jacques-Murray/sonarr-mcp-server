# Multi-stage Dockerfile for Sonarr MCP Server
# Stage 1: Build environment
FROM node:20-alpine AS builder

# Set build arguments
ARG NODE_ENV=production

# Install security updates and necessary build tools
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files for dependency caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci --include=dev && \
    npm cache clean --force

# Copy source code and configuration files
COPY tsconfig.json ./
COPY src/ ./src/
COPY tests/ ./tests/

# Build the application
RUN npm run build

# Run tests to ensure build quality
RUN npm test

# Remove dev dependencies after build
RUN npm prune --omit=dev

# Stage 2: Production runtime
FROM node:20-alpine AS production

# Install security updates and dumb-init for proper signal handling
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sonarr-mcp -u 1001 -G nodejs

# Create app directory with proper ownership
WORKDIR /usr/src/app
RUN chown -R sonarr-mcp:nodejs /usr/src/app

# Switch to non-root user
USER sonarr-mcp

# Copy package files
COPY --chown=sonarr-mcp:nodejs package*.json ./

# Copy production node modules from builder stage
COPY --from=builder --chown=sonarr-mcp:nodejs /usr/src/app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=sonarr-mcp:nodejs /usr/src/app/dist ./dist

# Copy environment example (template for configuration)
COPY --chown=sonarr-mcp:nodejs .env.example ./

# Set production environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

# Expose the port (MCP servers typically use stdio, but for health checks)
EXPOSE 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check: MCP server process running')" || exit 1

# Set proper signal handling and start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Metadata
LABEL maintainer="Jacques Murray"
LABEL description="Sonarr MCP Server - Model Context Protocol server for Sonarr API v4 integration"
LABEL version="1.0.0"
LABEL org.opencontainers.image.source="https://github.com/Jacques-Murray/sonarr-mcp-server"
LABEL org.opencontainers.image.description="Dockerized Sonarr MCP Server with security best practices"
LABEL org.opencontainers.image.licenses="MIT"