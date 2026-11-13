# TutorSetu — single container: Express API + server-rendered React app.
# Build from the repo root:  docker build -t tutorsetu .

# ---------- 1. Build the React client (client + SSR bundles) ----------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# VITE_* values are baked into the bundle at build time. Leave empty when the API
# is served from the same domain (the default for this setup).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- 2. Install server production dependencies ----------
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ---------- 3. Runtime image ----------
FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=8080 \
    UPLOAD_DIR=uploads
WORKDIR /app

COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/
COPY server/src ./server/src
# Built frontend (served by Express) + site data used for sitemap.xml
COPY --from=client-build /app/client/dist ./client/dist
COPY client/src/lib/site.js ./client/src/lib/site.js

RUN mkdir -p server/uploads/public server/uploads/private \
 && chown -R node:node /app
USER node

WORKDIR /app/server
EXPOSE 8080
CMD ["node", "src/index.js"]
