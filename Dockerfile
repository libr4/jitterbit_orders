FROM node:18-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
