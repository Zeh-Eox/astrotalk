FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY backend ./backend
COPY frontend ./frontend

RUN npm install --prefix backend \
  && npm install --prefix frontend

RUN npm run build --prefix backend

RUN npm run build --prefix frontend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start", "--prefix", "backend"]