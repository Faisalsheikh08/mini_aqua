# # # # Production Dockerfile for Question Bank App
# # # FROM node:18-alpine AS builder

# # # # Set working directory
# # # WORKDIR /app

# # # # Copy package files
# # # COPY package*.json ./

# # # # Install dependencies
# # # RUN npm ci --only=production

# # # # Copy source code
# # # COPY . .

# # # # Build the application
# # # RUN npm run build

# # # # Production stage
# # # FROM node:18-alpine AS production

# # # # Set working directory
# # # WORKDIR /app

# # # # Copy package files
# # # COPY package*.json ./

# # # # Install production dependencies only
# # # RUN npm ci --only=production && npm cache clean --force

# # # # Copy built application from builder stage
# # # COPY --from=builder /app/dist ./dist

# # # # Create non-root user
# # # RUN addgroup -g 1001 -S nodejs
# # # RUN adduser -S questionbank -u 1001

# # # # Change ownership
# # # RUN chown -R questionbank:nodejs /app
# # # USER questionbank

# # # # Expose port
# # # EXPOSE 5000

# # # # Health check
# # # HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
# # #   CMD curl -f http://localhost:5000/api/health || exit 1

# # # # Start command
# # # CMD ["node", "dist/index.js"]


# # # Production Dockerfile for Question Bank App
# # FROM node:18-alpine AS builder

# # # Set working directory
# # WORKDIR /app

# # # Copy package files
# # COPY package*.json ./

# # # Install ALL dependencies (including dev dependencies for building)
# # RUN npm ci --include=dev

# # # Copy source code
# # COPY . .

# # # Build the application
# # RUN npm run build

# # # Production stage
# # FROM node:18-alpine AS production

# # # Set working directory
# # WORKDIR /app

# # # Copy package files
# # COPY package*.json ./

# # # Install production dependencies only
# # RUN npm ci --only=production && npm cache clean --force

# # # Copy built application from builder stage
# # COPY --from=builder /app/dist ./dist

# # # Create non-root user
# # RUN addgroup -g 1001 -S nodejs
# # RUN adduser -S questionbank -u 1001

# # # Change ownership
# # RUN chown -R questionbank:nodejs /app
# # USER questionbank

# # # # Expose port (Railway will set PORT environment variable)
# # # EXPOSE $PORT

# # # # Health check
# # # HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
# # #   CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/api/health || exit 1

# #   HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
# #   CMD sh -c 'wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1'

# # # Start command
# # CMD ["node", "dist/index.js"]

# # ------------------ Builder Stage ------------------
# FROM node:18-alpine AS builder
# WORKDIR /app

# # Copy package.json & install dev deps for building
# COPY package*.json ./
# RUN npm ci --include=dev

# # Copy all source code
# COPY . .

# # Build the project
# RUN npm run build

# # ------------------ Production Stage ------------------
# FROM node:18-alpine AS production
# WORKDIR /app

# # Copy only package files & install production deps
# COPY package*.json ./
# RUN npm ci --only=production && npm cache clean --force

# # Copy built app from builder
# COPY --from=builder /app/dist ./dist

# # Create non-root user
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S questionbank -u 1001
# RUN chown -R questionbank:nodejs /app
# USER questionbank

# # Expose port set by Railway
# EXPOSE 5000

# # Healthcheck (give server time to start & DB connect)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
#   CMD sh -c 'wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1'

# # Start app
# CMD ["node", "dist/index.js"]

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S questionbank -u 1001
RUN chown -R questionbank:nodejs /app
USER questionbank

EXPOSE 5000

# Healthcheck: gives server 40s to start + DB retries
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD sh -c 'wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1'

CMD ["node", "dist/index.js"]

