import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // 生产环境禁用 source map，减小构建产物
  productionBrowserSourceMaps: false,

  // 编译器优化
  compiler: {
    // 生产环境移除 console.log
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // 实验性功能：优化包导入
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@base-ui/react',
    ],
  },

  // 移除 env 配置，使用 Next.js 内置环境变量支持
  // AUTH_SECRET 通过 process.env 在服务端访问
};

export default nextConfig;
