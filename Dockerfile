# ─── BUILD STAGE ───────────────────────────────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

# 1) Install dependencies
COPY package*.json bun.lockb ./
RUN npm ci --legacy-peer-deps

# 2) Copy all source (including index.html & server.js)
COPY . .

# 3) Build your frontend into /app/dist
RUN npm run build -- --mode prod

# 4) Prune devDependencies
RUN npm prune --production


# ─── PRODUCTION STAGE ──────────────────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

# 5) Bring in built frontend + pruned modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

# 6) Copy your server entrypoint
COPY server.js .

# 7) Expose and start
EXPOSE 80
CMD ["node", "server.js"]