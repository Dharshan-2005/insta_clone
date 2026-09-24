FROM node:20-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=build /app ./
CMD ["npm", "start"]
