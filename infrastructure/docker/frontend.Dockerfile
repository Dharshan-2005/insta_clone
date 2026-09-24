FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared packages
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/ packages/shared-types/
RUN cd packages/shared-types && npm install && npm run build

# Copy frontend
COPY frontend/package*.json frontend/
RUN cd frontend && npm install

COPY frontend/ frontend/
RUN mkdir -p frontend/public
RUN cd frontend && npm run build && test -f .next/BUILD_ID

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3050

COPY --from=builder /app/frontend/package*.json ./
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/node_modules ./node_modules

EXPOSE 3050

CMD ["npm", "run", "start"]
