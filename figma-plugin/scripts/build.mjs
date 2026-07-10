// esbuild 번들: src/code.ts → dist/code.js, src/ui.html → dist/ui.html
import { build } from 'esbuild'
import { mkdirSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(resolve(root, 'dist'), { recursive: true })

await build({
  entryPoints: [resolve(root, 'src/code.ts')],
  bundle: true,
  outfile: resolve(root, 'dist/code.js'),
  target: 'es2017',
  logLevel: 'info',
})

copyFileSync(resolve(root, 'src/ui.html'), resolve(root, 'dist/ui.html'))
console.log('figma-plugin build OK → dist/code.js, dist/ui.html')
