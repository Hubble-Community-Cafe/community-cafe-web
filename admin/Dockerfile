# Build context is the repo ROOT (npm workspaces), not this folder:
#   docker build -f admin/Dockerfile -t community-cafe-admin .

# Build stage
FROM node:20-alpine AS build
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

COPY shared-web/ ./shared-web/
COPY admin/ ./admin/

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null) \
    npm run build --workspace @cafe/admin

# Production stage
FROM nginx:alpine
RUN apk upgrade --no-cache

COPY admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/admin/dist /usr/share/nginx/html

# Runtime config injection: rewrite config.js from env at container startup.
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-inject-config.sh && \
    echo 'cat > /usr/share/nginx/html/config.js << EOF' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo 'window.__RUNTIME_CONFIG__ = {' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  API_URL: "${API_URL:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  AZURE_CLIENT_ID: "${AZURE_CLIENT_ID:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  AZURE_TENANT_ID: "${AZURE_TENANT_ID:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  REDIRECT_URI: "${REDIRECT_URI:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  ALLOWED_GROUP_ID: "${ALLOWED_GROUP_ID:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  SENTRY_DSN: "${SENTRY_DSN:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  E2E_AUTH_OID: "${E2E_AUTH_OID:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  E2E_AUTH_EMAIL: "${E2E_AUTH_EMAIL:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
    echo '  E2E_AUTH_NAME: "${E2E_AUTH_NAME:-}",' >> /docker-entrypoint.d/40-inject-config.sh && \
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
