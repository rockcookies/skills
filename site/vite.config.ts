import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// 复用仓库主 services 的 install-commands.service.ts，站点里不写第二份命令拼接逻辑
export default defineConfig({
  base: process.env.SITE_BASE ?? '/skills/',
  plugins: [react()],
  resolve: { alias: { '@services': fileURLToPath(new URL('../src/services', import.meta.url)) } },
})
