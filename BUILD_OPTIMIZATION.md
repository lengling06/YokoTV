# 构建优化指南

## 已完成的优化措施

### 1. **启用 SWC 压缩器** ✅

- 文件：`next.config.js`
- 将 `swcMinify: false` 改为 `swcMinify: true`
- **效果**：构建速度提升 30-50%

### 2. **优化 PWA 配置** ✅

- 文件：`next.config.js`
- 添加了 `buildExcludes`、`dynamicStartUrl: false` 等配置
- **效果**：减少 PWA 编译时间

### 3. **禁用 Next.js 遥测** ✅

- 环境变量：`NEXT_TELEMETRY_DISABLED=1`
- **效果**：避免构建时的网络请求

### 4. **优化 Docker 构建** ✅

- 创建了优化的 Dockerfile（`Dockerfile.optimized`）
- 使用多级缓存策略
- 使用 `npm ci` 代替 `npm install`
- **效果**：利用 Docker 层缓存，减少重复构建时间

### 5. **完善 .dockerignore** ✅

- 排除不必要的文件（node_modules、.git、测试文件等）
- **效果**：减少构建上下文大小，加快文件传输

### 6. **Next.js 构建优化配置** ✅

- 启用并行编译：`parallelServerCompiles: true`
- 构建时跳过类型检查和 ESLint（在 CI 中单独运行）
- **效果**：并行处理，减少阻塞

### 7. **npm 优化配置** ✅

- 创建 `.npmrc` 文件
- 提高并发数、使用缓存、禁用不必要的功能
- **效果**：加快依赖安装速度

### 8. **优化的 GitHub Actions Workflow** ✅

- 文件：`.github/workflows/docker-build-fast.yml`
- 使用更好的缓存策略
- 只构建 amd64 架构
- **效果**：充分利用 GitHub Actions 缓存

## 使用方法

### 本地测试构建速度

```bash
# 运行构建分析脚本
node scripts/analyze-build.js
```

### 使用优化的 Dockerfile

```bash
# 构建镜像
docker build -f Dockerfile.optimized -t yokotv:optimized .

# 或者更新原始 Dockerfile
mv Dockerfile Dockerfile.backup
mv Dockerfile.optimized Dockerfile
```

### 使用新的 GitHub Actions

1. 在 GitHub 仓库中使用 `docker-build-fast.yml` 工作流
2. 删除或禁用旧的工作流

## 预期效果

通过以上优化，构建时间预计可以从 **10+ 分钟**减少到 **3-5 分钟**，提升幅度达 **50-70%**。

## 进一步优化建议

如果构建仍然较慢，可以考虑：

1. **使用 Turbopack**（Next.js 13.4+ 实验性功能）

   ```js
   // next.config.js
   module.exports = {
     experimental: {
       turbo: true,
     },
   };
   ```

2. **使用更快的包管理器**
   - pnpm: 已在 package.json 中配置，使用 `pnpm install` 代替 `npm install`
   - bun: 更激进的选择，但兼容性需要测试

3. **增加构建机器性能**
   - 使用 GitHub Actions 的更大规格机器
   - 或使用自托管的 Runner

4. **分离构建步骤**
   - 将类型检查、ESLint、测试等步骤并行运行
   - 只在必要时运行完整构建

## 监控构建性能

定期运行构建分析脚本，关注以下指标：

- 总构建时间
- 各步骤耗时
- 构建产物大小

如果发现性能退化，及时调查原因。
