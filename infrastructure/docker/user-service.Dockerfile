FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

COPY services/user-service/package*.json services/user-service/
RUN cd services/user-service && npm install

COPY services/user-service/ services/user-service/

RUN rm -rf services/user-service/node_modules/@instagram/shared-types && \
    cp -r packages/shared-types services/user-service/node_modules/@instagram/shared-types

RUN cd services/user-service && npx prisma generate && npm run build && test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/services/user-service/dist ./dist
COPY --from=builder /app/services/user-service/node_modules ./node_modules
COPY --from=builder /app/services/user-service/package.json ./
COPY --from=builder /app/services/user-service/.prisma ./.prisma
COPY --from=builder /app/services/user-service/prisma ./prisma

USER nestjs

EXPOSE 4002

CMD ["node", "dist/main"]
