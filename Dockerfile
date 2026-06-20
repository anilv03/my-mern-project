FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=server-build /app/server ./
COPY --from=client-build /app/client/dist ./public

EXPOSE 5000
CMD ["node", "server.js"]
