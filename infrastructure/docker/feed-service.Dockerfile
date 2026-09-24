FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

COPY services/feed-service/package*.json services/feed-service/
RUN cd services/feed-service && npm install

COPY services/feed-service/ services/feed-service/

RUN rm -rf services/feed-service/node_modules/@instagram/shared-types && \
    cp -r packages/shared-types services/feed-service/node_modules/@instagram/shared-types

RUN cd services/feed-service && npx prisma generate && npm run build && test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/services/feed-service/dist ./dist
COPY --from=builder /app/services/feed-service/node_modules ./node_modules
COPY --from=builder /app/services/feed-service/package.json ./
COPY --from=builder /app/services/feed-service/.prisma ./.prisma
COPY --from=builder /app/services/feed-service/prisma ./prisma

USER nestjs

EXPOSE 4004

CMD ["node", "dist/main"]
