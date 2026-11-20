import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 复用仓库主 lib 的 install-commands.ts，站点里不写第二份命令拼接逻辑
export default defineConfig({
  base: process.env.SITE_BASE ?? '/skills/',
  plugins: [react()],
  resolve: { alias: { '@lib': fileURLToPath(new URL('../src/lib', import.meta.url)) } },
})
