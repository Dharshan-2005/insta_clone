FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

COPY services/api-gateway/package*.json services/api-gateway/
RUN cd services/api-gateway && npm install

COPY services/api-gateway/ services/api-gateway/
RUN cd services/api-gateway && npm run build && test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/services/api-gateway/dist ./dist
COPY --from=builder /app/services/api-gateway/node_modules ./node_modules
COPY --from=builder /app/services/api-gateway/package.json ./

USER nestjs

EXPOSE 3051

CMD ["node", "dist/main"]
