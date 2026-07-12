// 배포용 라이브러리 빌드 — src/lib.ts → packages/design-kit/dist/{index.js, styles.css}
// react 계열만 external(peer). CSS Module은 단일 styles.css로 번들.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: false, // 앱 public/(favicon 등)을 라이브러리 dist로 복사하지 않음
  build: {
    lib: {
      entry: 'src/lib.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'packages/design-kit/dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: false,
    rollupOptions: {
      external: (id) => /^react($|\/)/.test(id) || /^react-dom($|\/)/.test(id),
      output: {
        assetFileNames: (info) => {
          const n = info.name || (info.names && info.names[0]) || ''
          return n.endsWith('.css') ? 'styles.css' : 'assets/[name][extname]'
        },
      },
    },
  },
})
