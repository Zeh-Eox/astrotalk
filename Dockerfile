# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix backend \
  && npm ci --prefix frontend

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY backend ./backend
COPY frontend ./frontend
RUN npm run build --prefix backend \
  && npm run build --prefix frontend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=build /app/backend/package*.json ./backend/
RUN npm ci --omit=dev --prefix backend && npm cache clean --force
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/frontend/dist ./frontend/dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "backend/dist/server.js"]
