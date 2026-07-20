// generated/tds-pages.json 생성기 — 앱의 내비게이션(nav-config)을 TDS 문서용 화면 목록으로 옮긴다.
//
// [왜 nav-config 가 원천인가] 어드민 메뉴의 단일 원천은 nav-config 다(사이드바·라우트가 여기서 나온다).
// Figma 문서의 'Pages' 도 같은 구조를 따라야 앱과 어긋나지 않는다 — 화면을 손으로 나열하면 메뉴가
// 늘거나 줄 때 문서가 조용히 낡는다. 그래서 nav 를 읽어 섹션(그룹) → 메뉴 → 화면으로 펼쳐 낸다.
//
// [파생 규칙은 여기 없다] 펼치는 규칙 자체는 `pages-source.ts` 가 갖는다. 이 파일은 그 결과를
// 디스크에 쓰기만 한다 — 같은 규칙을 `@tds/nav-sync` 게이트가 검사에 재사용하기 때문이다.
//
// [이 산출물은 codegen 밖이다] `pnpm codegen:check` 는 이 파일을 세지 않는다(build.mjs 가 만든다).
// 최신 여부를 보는 것은 `pnpm nav:check` 뿐이다 — nav-config 를 고쳤으면 그쪽도 함께 돌려라.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPagesDoc, serializePagesDoc } from './pages-source';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'generated', 'tds-pages.json');

const doc = buildPagesDoc();

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, serializePagesDoc(doc));

const sections = new Set(doc.pages.map((p) => p.section)).size;
const menus = new Set(doc.pages.map((p) => `${p.section}/${p.menu}`)).size;
console.log(
  `기록 완료: generated/tds-pages.json — 섹션 ${sections} · 메뉴 ${menus} · 화면 ${doc.pages.length}`,
);
