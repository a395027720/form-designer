import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 用相对路径解析 src 别名，避开 path 模块对 @types/node 的依赖
 * import.meta.url 含 URL 编码（空格 → %20），需要 decodeURIComponent
 */
const SRC_ALIAS = decodeURIComponent(new URL('./src', import.meta.url).pathname)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': SRC_ALIAS
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
