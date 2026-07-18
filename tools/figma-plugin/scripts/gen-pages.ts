// generated/tds-pages.json 생성기 — 앱의 내비게이션(nav-config)을 TDS 문서용 화면 목록으로 옮긴다.
//
// [왜 nav-config 가 원천인가] 어드민 메뉴의 단일 원천은 nav-config 다(사이드바·라우트가 여기서 나온다).
// Figma 문서의 'Pages' 도 같은 구조를 따라야 앱과 어긋나지 않는다 — 화면을 손으로 나열하면 메뉴가
// 늘거나 줄 때 문서가 조용히 낡는다. 그래서 nav 를 읽어 섹션(그룹) → 메뉴 → 화면으로 펼쳐 낸다.
//
// [경계] 이 스크립트는 도구(tools/figma-plugin)가 앱(apps/admin)의 IA 데이터를 읽는다. nav-config 는
// 런타임 의존이 없다(FeatureKey 타입만 import) — tsx 가 타입을 지우므로 안전하게 가져올 수 있다.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NAV_SECTIONS } from '../../../apps/admin/src/shared/layout/nav-config';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'generated', 'tds-pages.json');

/** 한 화면(= nav 잎) — id 는 라우트, section 은 nav 섹션 제목, menu 는 상위 메뉴 라벨 */
interface PageMeta {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly menu: string;
}

const pages: PageMeta[] = [];

for (const section of NAV_SECTIONS) {
  for (const entry of section.entries) {
    const item = entry.item;
    if (item.kind === 'leaf') {
      // 대시보드처럼 자기 라우트를 가진 단일 메뉴
      pages.push({ id: item.to, name: item.label, section: section.title, menu: item.label });
    } else {
      // 가지 — 하위 잎 각각이 화면이다. 메뉴 이름은 가지 라벨(예: '사용자 관리')
      for (const leaf of item.children) {
        pages.push({ id: leaf.to, name: leaf.label, section: section.title, menu: item.label });
      }
    }
  }
}

mkdirSync(path.dirname(OUT), { recursive: true });
// $generatedAt 은 결정론(커밋 diff 안정)을 위해 넣지 않는다 — codegen 산출물과 같은 규율
const doc = { $kind: 'tds-pages', $source: 'apps/admin/src/shared/layout/nav-config.ts', pages };
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);

const sections = new Set(pages.map((p) => p.section)).size;
const menus = new Set(pages.map((p) => `${p.section}/${p.menu}`)).size;
console.log(
  `기록 완료: generated/tds-pages.json — 섹션 ${sections} · 메뉴 ${menus} · 화면 ${pages.length}`,
);
