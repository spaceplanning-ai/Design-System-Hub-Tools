// nav-config → 화면 목록 파생 규칙 — **순수 모듈**. 파일을 쓰지 않는다.
//
// [왜 분리했나] 이 규칙에는 소비자가 둘이다.
//   · `gen-pages.ts`  — generated/tds-pages.json 을 기록한다 (build.mjs 가 매 빌드 실행)
//   · `@tds/nav-sync` — 그 기록물이 정본과 어긋나지 않았는지 검사한다
// 규칙을 양쪽이 각자 구현하면 **검사가 생성기와 다른 답을 내는 순간 게이트가 거짓말**을 한다.
// 그래서 파생 규칙은 여기 한 벌만 두고 둘 다 이것을 import 한다.
//
// [경계] 도구(tools/)가 앱(apps/admin)의 IA 데이터를 읽는다. nav-config 는 런타임 의존이
// 없다(FeatureKey 타입만 import) — tsx/esbuild 가 타입을 지우므로 안전하게 가져올 수 있다.
import { NAV_SECTIONS } from '../../../apps/admin/src/shared/layout/nav-config';

/** 한 화면(= nav 잎) — id 는 라우트, section 은 nav 섹션 제목, menu 는 상위 메뉴 라벨 */
export interface PageMeta {
  readonly id: string;
  readonly name: string;
  readonly section: string;
  readonly menu: string;
}

/** tds-pages.json 문서 형태 */
export interface PagesDoc {
  readonly $kind: 'tds-pages';
  readonly $source: string;
  readonly pages: readonly PageMeta[];
}

/** 정본 경로 — 오류 메시지가 "어디를 고쳐야 하는가"를 스스로 말하게 한다 */
export const NAV_CONFIG_PATH = 'apps/admin/src/shared/layout/nav-config.ts';

/**
 * nav 트리를 화면 목록으로 펼친다.
 *
 * 가지(branch)는 자기 라우트를 갖지 않으므로 화면이 아니다 — 하위 잎만 화면이 된다.
 * 대시보드처럼 가지 없이 잎이 최상위에 오는 메뉴는 자기 자신이 메뉴 이름이다.
 */
export function collectPages(): PageMeta[] {
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
  return pages;
}

/**
 * tds-pages.json 에 기록될 문서를 조립한다.
 *
 * `$generatedAt` 은 결정론(커밋 diff 안정)을 위해 넣지 않는다 — codegen 산출물과 같은 규율.
 * 이 결정론 덕분에 nav-sync 가 "다시 만들어 문자열 비교" 만으로 최신 여부를 판정할 수 있다.
 */
export function buildPagesDoc(): PagesDoc {
  return { $kind: 'tds-pages', $source: NAV_CONFIG_PATH, pages: collectPages() };
}

/** 파일에 기록되는 정확한 바이트열 — 생성기와 검사기가 같은 직렬화를 쓰도록 한 곳에 둔다. */
export function serializePagesDoc(doc: PagesDoc): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}
