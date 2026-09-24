FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy shared packages first
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

# Copy service files
COPY services/auth-service/package*.json services/auth-service/
RUN cd services/auth-service && npm install

COPY services/auth-service/ services/auth-service/

RUN rm -rf services/auth-service/node_modules/@instagram/shared-types && \
    cp -r packages/shared-types services/auth-service/node_modules/@instagram/shared-types

# Generate Prisma client and build
RUN cd services/auth-service && npx prisma generate && npm run build && test -f dist/main.js

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/services/auth-service/node_modules ./node_modules
COPY --from=builder /app/services/auth-service/package.json ./
COPY --from=builder /app/services/auth-service/.prisma ./.prisma
COPY --from=builder /app/services/auth-service/prisma ./prisma

USER nestjs

EXPOSE 4001

CMD ["node", "dist/main"]
