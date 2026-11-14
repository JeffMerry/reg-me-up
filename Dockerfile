FROM node:22.23.4-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
WORKDIR /app/server
COPY --from=build --chown=node:node /app /app
ENV NODE_ENV=production PORT=3000 FRONTEND_DIR=/app/client/dist
EXPOSE 3000
USER node
CMD ["node", "dist/src/index.js"]
