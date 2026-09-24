FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

COPY services/notification-service/package*.json services/notification-service/
RUN cd services/notification-service && npm install

COPY services/notification-service/ services/notification-service/

RUN rm -rf services/notification-service/node_modules/@instagram/shared-types && \
    cp -r packages/shared-types services/notification-service/node_modules/@instagram/shared-types

RUN cd services/notification-service && npx prisma generate && npm run build && test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/services/notification-service/dist ./dist
COPY --from=builder /app/services/notification-service/node_modules ./node_modules
COPY --from=builder /app/services/notification-service/package.json ./
COPY --from=builder /app/services/notification-service/.prisma ./.prisma
COPY --from=builder /app/services/notification-service/prisma ./prisma

USER nestjs

EXPOSE 4005

CMD ["node", "dist/main"]
