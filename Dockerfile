FROM node:22-alpine

WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]