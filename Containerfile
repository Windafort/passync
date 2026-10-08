# syntax=docker/dockerfile:1

##############################
# 1) Build stage - compile the Vue / Vite SPA
##############################
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies in their own layer so they are cached across rebuilds.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build a production bundle into ./dist.
#
# --base=/ overrides Vite's default base (`/passync/`, used for the GitHub Pages
#   deploy) so the app is served from the web-server root inside the container.
COPY . .
RUN npm run build -- --base=/

##############################
# 2) Serve stage - serve the static bundle with nginx
##############################
FROM nginx:1.27-alpine AS runtime

# SPA fallback + sensible defaults for a purely static single-page app.
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built SPA from the build stage.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 127.0.0.1 (not "localhost"): nginx listens on IPv4 only, and `localhost` can
# resolve to ::1 (IPv6) first inside the container, causing false failures.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://127.0.0.1/ > /dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
