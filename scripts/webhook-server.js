#!/usr/bin/env node

/**
 * 简单的 Webhook 服务器
 * 监听 GitHub webhook，自动更新部署
 *
 * 使用方法:
 * 1. npm install express crypto
 * 2. 设置环境变量 WEBHOOK_SECRET
 * 3. node scripts/webhook-server.js
 * 4. 在 GitHub 仓库设置 webhook: http://your-server:3001/webhook
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

// 中间件
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// 验证 GitHub webhook 签名
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

// 执行更新命令
function executeUpdate() {
  return new Promise((resolve, reject) => {
    const updateScript = path.join(__dirname, 'update.sh');
    const command = fs.existsSync(updateScript)
      ? `bash ${updateScript}`
      : 'docker-compose pull && docker-compose up -d';

    console.log('执行更新命令:', command);

    exec(command, { cwd: path.dirname(__dirname) }, (error, stdout, stderr) => {
      if (error) {
        console.error('更新失败:', error);
        reject(error);
        return;
      }

      console.log('更新成功:', stdout);
      if (stderr) console.warn('警告:', stderr);
      resolve(stdout);
    });
  });
}

// Webhook 端点
app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return res.status(400).send('Missing signature');
  }

  const payload = JSON.stringify(req.body);

  if (!verifySignature(payload, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.headers['x-github-event'];
  const data = req.body;

  console.log(`收到 GitHub 事件: ${event}`);

  // 只处理推送到主分支的事件
  if (
    event === 'push' &&
    (data.ref === 'refs/heads/main' || data.ref === 'refs/heads/master')
  ) {
    console.log('检测到主分支推送，开始自动更新...');

    try {
      await executeUpdate();
      res.status(200).send('部署成功');
    } catch (error) {
      console.error('部署失败:', error);
      res.status(500).send('部署失败');
    }
  } else {
    res.status(200).send('事件已忽略');
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 手动触发更新端点
app.post('/deploy', async (req, res) => {
  const token = req.headers.authorization;

  if (token !== `Bearer ${SECRET}`) {
    return res.status(401).send('Unauthorized');
  }

  console.log('手动触发更新...');

  try {
    await executeUpdate();
    res.status(200).json({ message: '更新成功' });
  } catch (error) {
    console.error('更新失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Webhook 服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`Webhook URL: http://your-server:${PORT}/webhook`);
  console.log(
    `手动部署: POST http://localhost:${PORT}/deploy (需要 Bearer token)`,
  );
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭 Webhook 服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭 Webhook 服务器...');
  process.exit(0);
});
