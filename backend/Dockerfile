# Multi-stage build for Backend

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm ci --only=production
# Copy source code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeds ./seeds
COPY --from=builder /app/server.js .

EXPOSE 5000

# Start command handles migrations and seeds automatically 
CMD ["node", "server.js"]