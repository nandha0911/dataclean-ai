# ─── Frontend Dockerfile ─────────────────────────────────────────────────────
# Stage 1: Build React app with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API URL as build arg (will be proxied via Nginx in prod)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Install deps with layer caching
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
