# syntax=docker/dockerfile:1

###################
# Stage 1: Dependencies
# Installiert ALLE Dependencies (inkl. devDependencies), die zum Bauen gebraucht werden
###################
FROM node:20-alpine AS deps

# openssl wird von Prisma's Query Engine auf Alpine benötigt
RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

###################
# Stage 2: Build
# Generiert den Prisma Client und kompiliert TypeScript -> JavaScript
###################
FROM node:20-alpine AS build

RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy-Wert nur für den Build-Schritt - prisma.config.ts braucht *irgendeinen* Wert,
# um sich zu laden. "prisma generate" verbindet sich nicht wirklich zur DB.
# Der echte Wert kommt zur Laufzeit über --env-file und überschreibt das komplett.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/placeholder?schema=public"

# Generiert den Prisma Client basierend auf deinem schema.prisma
RUN npx prisma generate

# Kompiliert NestJS (Output landet in /app/dist)
RUN npm run build

# Entfernt devDependencies, sodass nur production node_modules übrig bleiben
RUN npm prune --omit=dev

###################
# Stage 3: Runner
# Finales, schlankes Image - enthält nur, was zur Laufzeit gebraucht wird
###################
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Non-root User aus Sicherheitsgründen (Alpine hat "node" User standardmäßig)
USER node

COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma
COPY --chown=node:node --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --from=build /app/package.json ./package.json

EXPOSE 3000

# Führt beim Container-Start ausstehende Migrationen aus, bevor die App startet
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]