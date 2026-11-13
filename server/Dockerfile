# TutorSetu API server only (frontend is deployed separately).
# Build from the server folder:  docker build -t tutorsetu-api ./server

FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=8080 \
    UPLOAD_DIR=uploads
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
RUN mkdir -p uploads/public uploads/private && chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "src/index.js"]
