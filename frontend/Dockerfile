# ============================================================
# Hermann Böhmer Frontend - Dockerfile
# React + Nginx
# ============================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (yarn.lock ist optional)
COPY package.json ./
COPY yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build arguments for environment variables
ARG REACT_APP_BACKEND_URL=http://localhost:8080
ARG REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
ARG REACT_APP_UNDER_CONSTRUCTION=false

# Set environment variables for build
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_STRIPE_PUBLISHABLE_KEY=$REACT_APP_STRIPE_PUBLISHABLE_KEY
ENV REACT_APP_UNDER_CONSTRUCTION=$REACT_APP_UNDER_CONSTRUCTION

# Build the application
RUN yarn build

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
