// docs/docs-content.json → figma-plugin/src/docs-content-data.ts (플러그인 내장 문서 기본값).
// 원격 URL 로드 없이도 '문서 페이지'가 생성되도록 선언을 번들에 임베드한다.
// 재생성: pnpm --dir figma-plugin sync:docs (build 시 자동 실행)
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '..', '..')
const src = resolve(repoRoot, 'docs', 'docs-content.json')
const parsed = JSON.parse(readFileSync(src, 'utf8'))

if (!Array.isArray(parsed.sections) || typeof parsed.tables !== 'object') {
  throw new Error('docs-content.json 형식 오류: sections[] / tables{} 필요')
}

const ts =
  '// AUTO-GENERATED from docs/docs-content.json — 플러그인 내장 문서 기본값.\n' +
  '// DO NOT EDIT. 재생성: pnpm --dir figma-plugin sync:docs (build 시 자동)\n' +
  "import type { DocsContent } from './generators/docs'\n" +
  `export const DOCS_CONTENT: DocsContent = ${JSON.stringify(parsed, null, 2)}\n`

writeFileSync(resolve(here, '..', 'src', 'docs-content-data.ts'), ts)
console.log(`sync-docs OK — ${parsed.sections.length} sections → figma-plugin/src/docs-content-data.ts`)
