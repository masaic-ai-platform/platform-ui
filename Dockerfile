# ─── BUILD STAGE ───────────────────────────────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies for build
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the frontend
RUN npm run build -- --mode prod

# ─── PRODUCTION STAGE ──────────────────────────────────────────────────────────
FROM gcr.io/distroless/nodejs18-debian12 AS production
WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server entrypoint
COPY server.js .

# Expose port 80
EXPOSE 80

# Start the server
CMD ["server.js"]