import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 本地开发使用 Mock 数据，不需要代理
  // 生产环境 ESA 会自动路由 /api/* 到边缘函数
})
