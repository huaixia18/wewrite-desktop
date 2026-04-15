# ─── Stage 1: Dependencies ────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate（构建时完成）
RUN npx prisma generate

RUN npm run build

# ─── Stage 3: Runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装 Python 和热点抓取依赖
RUN apk add --no-cache python3 py3-pip && \
    pip3 install --break-system-packages --no-cache-dir requests && \
    apk del py3-pip

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 从 builder 复制构建产物 + 完整 node_modules（不需要 runtime npm install）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts .
COPY --from=builder /app/node_modules ./node_modules
# 复制热点抓取脚本
COPY --from=builder /app/scripts ./scripts

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
