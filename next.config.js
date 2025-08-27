/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-var-requires */

const nextConfig = {
  output: 'standalone',

  reactStrictMode: false,
  swcMinify: true, // 启用 SWC 压缩器，大幅提升构建速度

  experimental: {
    instrumentationHook: process.env.NODE_ENV === 'production',
    // 启用并行路由构建
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },

  // 优化构建性能
  typescript: {
    // 构建时忽略类型错误（CI 中单独运行类型检查）
    ignoreBuildErrors: true,
  },

  eslint: {
    dirs: ['src'],
    // 构建时忽略 ESLint 错误（CI 中单独运行）
    ignoreDuringBuilds: true,
  },

  // Uncoment to add domain whitelist
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\.(css|scss|sass)$/ },
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        loader: '@svgr/webpack',
        options: {
          dimensions: false,
          titleProp: true,
        },
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      crypto: false,
    };

    return config;
  },
};

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/], // 排除不必要的文件
  dynamicStartUrl: false, // 禁用动态起始URL
  fallbacks: {
    document: '/offline', // 简化离线回退
  },
});

module.exports = withPWA(nextConfig);
