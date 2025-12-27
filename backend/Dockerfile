# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./

# Safe option: Install all deps so migrations work
RUN npm ci 

# Copy source code and config folders
COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/seeds ./seeds
COPY --from=builder /app/server.js .

EXPOSE 5000

# FIX: Run Migrations and Seeds before starting server
CMD ["sh", "-c", "node src/utils/migrate.js && node seeds/seed.js && node server.js"]