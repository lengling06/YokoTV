#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始分析构建性能...\n');

// 设置环境变量
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_ENV = 'production';

// 记录开始时间
const startTime = Date.now();
const timings = [];

// 执行构建并分析
const buildProcess = exec('npm run build', {
  env: {
    ...process.env,
    // 启用 Next.js 构建分析
    ANALYZE: 'true',
    // 显示构建大小
    NEXT_BUILD_PROFILE: 'true',
  },
});

// 捕获输出
let output = '';
buildProcess.stdout.on('data', (data) => {
  output += data;
  process.stdout.write(data);

  // 分析关键步骤
  if (data.includes('Creating an optimized production build')) {
    timings.push({ step: '开始优化构建', time: Date.now() - startTime });
  }
  if (data.includes('Compile server')) {
    timings.push({ step: 'PWA 编译服务器', time: Date.now() - startTime });
  }
  if (data.includes('Compile client')) {
    timings.push({ step: 'PWA 编译客户端', time: Date.now() - startTime });
  }
  if (data.includes('Collecting page data')) {
    timings.push({ step: '收集页面数据', time: Date.now() - startTime });
  }
  if (data.includes('Generating static pages')) {
    timings.push({ step: '生成静态页面', time: Date.now() - startTime });
  }
  if (data.includes('Finalizing page optimization')) {
    timings.push({ step: '完成页面优化', time: Date.now() - startTime });
  }
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

buildProcess.on('close', (code) => {
  const totalTime = Date.now() - startTime;

  console.log('\n\n📊 构建性能分析报告：');
  console.log('='.repeat(50));
  console.log(`总构建时间: ${(totalTime / 1000).toFixed(2)} 秒`);
  console.log('='.repeat(50));

  // 显示各步骤耗时
  console.log('\n各步骤耗时：');
  let prevTime = 0;
  timings.forEach(({ step, time }) => {
    const duration = time - prevTime;
    console.log(`${step}: ${(duration / 1000).toFixed(2)} 秒`);
    prevTime = time;
  });

  // 分析构建产物大小
  try {
    const buildManifest = path.join(__dirname, '../.next/build-manifest.json');
    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      console.log('\n\n📦 构建产物分析：');
      console.log(`页面数量: ${Object.keys(manifest.pages || {}).length}`);
    }
  } catch (err) {
    // 忽略错误
  }

  // 提供优化建议
  console.log('\n\n💡 优化建议：');
  if (totalTime > 600000) {
    // 超过10分钟
    console.log('- ❌ 构建时间过长，建议检查以下方面：');
    console.log('  1. 是否启用了 SWC 压缩器');
    console.log('  2. 是否有大量未使用的依赖');
    console.log('  3. 考虑使用 turbopack（实验性功能）');
  } else if (totalTime > 300000) {
    // 超过5分钟
    console.log('- ⚠️  构建时间较长，可以考虑：');
    console.log('  1. 使用更强的构建机器');
    console.log('  2. 启用更多的并行构建选项');
    console.log('  3. 减少构建时的类型检查');
  } else {
    console.log('- ✅ 构建时间良好！');
  }

  process.exit(code);
});
