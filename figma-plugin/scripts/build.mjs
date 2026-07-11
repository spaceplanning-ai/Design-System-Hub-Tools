// esbuild 번들: src/code.ts → dist/code.js, src/ui.html → dist/ui.html
import { build } from 'esbuild'
import { mkdirSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(resolve(root, 'dist'), { recursive: true })

// 문서 선언(docs-content.json)을 소스로 임베드해 원격 로드 없이 문서 페이지 생성 가능하게 한다.
await import('./sync-docs.mjs')

await build({
  entryPoints: [resolve(root, 'src/code.ts')],
  bundle: true,
  outfile: resolve(root, 'dist/code.js'),
  target: 'es2017',
  logLevel: 'info',
})

copyFileSync(resolve(root, 'src/ui.html'), resolve(root, 'dist/ui.html'))
console.log('figma-plugin build OK → dist/code.js, dist/ui.html')
