# Build context is the repo ROOT (npm workspaces), not this folder:
#   docker build -f public-meteor/Dockerfile -t public-meteor .

# Build stage
FROM node:26-alpine AS build

# Security patches
RUN apk upgrade --no-cache

WORKDIR /app

# Copy every workspace manifest first (npm ci validates the whole workspace tree
# against the lockfile), for better layer caching.
COPY package.json package-lock.json ./
COPY shared-web/package.json ./shared-web/
COPY public-hubble/package.json ./public-hubble/
COPY public-meteor/package.json ./public-meteor/
COPY admin/package.json ./admin/
RUN npm ci --include=optional

# Copy the sources this app needs (the shared package + the app itself).
COPY shared-web/ ./shared-web/
COPY public-meteor/ ./public-meteor/

# Build (SENTRY_AUTH_TOKEN + SENTRY_ORG enable source map upload when both present).
ARG SENTRY_ORG
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null) \
    SENTRY_ORG=${SENTRY_ORG} \
    npm run build --workspace @cafe/public-meteor

# Production stage
FROM nginx:alpine

RUN apk upgrade --no-cache

COPY public-meteor/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/public-meteor/dist /usr/share/nginx/html

# Runtime config injection: rewrite config.js from env at container startup.
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-config.sh && \
    echo 'cat > /usr/share/nginx/html/config.js << EOF' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo 'window.__RUNTIME_CONFIG__ = {' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  API_URL: "${API_URL:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  SENTRY_DSN: "${SENTRY_DSN:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '};' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo 'EOF' >> /docker-entrypoint.d/40-inject-config.sh && \
    chmod +x /docker-entrypoint.d/40-inject-config.sh

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

EXPOSE 80
USER nginx
CMD ["nginx", "-g", "daemon off;"]
