# ─── BUILD STAGE ───────────────────────────────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

# Set environment variables for build
ENV VITE_APP_VERSION=0.0.3

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

# Set environment variables for runtime
ENV APP_VERSION=0.0.3

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy server entrypoint
COPY server.js .

# Expose port 80
EXPOSE 6645

# Start the server
CMD ["server.js"]