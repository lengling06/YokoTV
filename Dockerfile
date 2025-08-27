# ---- 第 1 阶段：依赖缓存层 ----
FROM node:20-alpine AS deps
WORKDIR /app

# 安装构建工具（缓存层）
RUN apk add --no-cache libc6-compat

# 复制依赖清单（缓存友好）
COPY package.json package-lock.json ./

# 使用 npm ci 代替 npm install，更快更可靠
# 仅安装生产依赖
RUN npm ci --only=production && \
    # 复制生产依赖到临时目录
    cp -R node_modules prod_node_modules && \
    # 安装所有依赖（包括开发依赖）
    npm ci --legacy-peer-deps

# ---- 第 2 阶段：构建器 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_ENV=true

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码（优化：先复制不常变动的文件）
COPY public ./public
COPY src ./src
COPY scripts ./scripts
COPY *.js *.ts *.json ./
COPY VERSION.txt ./

# 生成 manifest 并构建
RUN npm run gen:manifest && \
    npm run build && \
    # 清理不必要的文件
    rm -rf .next/cache

# ---- 第 3 阶段：生产镜像 ----
FROM node:20-alpine AS runner

# 安装 dumb-init 以正确处理信号
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

WORKDIR /app

# 设置生产环境变量
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DOCKER_ENV=true
ENV NEXT_TELEMETRY_DISABLED=1

# 从构建器复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/start.js ./start.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 从依赖阶段复制生产依赖（如果需要）
# COPY --from=deps --chown=nextjs:nodejs /app/prod_node_modules ./node_modules

USER nextjs
EXPOSE 3000

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "start.js"]
