FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

COPY services/post-service/package*.json services/post-service/
RUN cd services/post-service && npm install

COPY services/post-service/ services/post-service/

RUN rm -rf services/post-service/node_modules/@instagram/shared-types && \
    cp -r packages/shared-types services/post-service/node_modules/@instagram/shared-types

RUN cd services/post-service && npx prisma generate && npm run build && test -f dist/main.js

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/services/post-service/dist ./dist
COPY --from=builder /app/services/post-service/node_modules ./node_modules
COPY --from=builder /app/services/post-service/package.json ./
COPY --from=builder /app/services/post-service/.prisma ./.prisma
COPY --from=builder /app/services/post-service/prisma ./prisma

USER nestjs

EXPOSE 4003

CMD ["node", "dist/main"]
