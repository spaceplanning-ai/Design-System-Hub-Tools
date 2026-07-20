/**
 * @tds/nav-sync — nav-config 파생물 동기화 게이트
 *
 * 실행: pnpm nav:check  (= pnpm --filter @tds/nav-sync run check)
 *
 * [왜 이 도구가 생겼나]
 * 어드민 메뉴의 정본은 `apps/admin/src/shared/layout/nav-config.ts` 하나다. 여기서 파생된
 * 사본이 둘 있는데, **둘 다 최신 여부를 아무도 검사하지 않았다.**
 *
 *   ① packages/ui/pages/_data/pages.ts        — 사람이 손으로 옮겨 적은 값 사본
 *   ② tools/figma-plugin/generated/tds-pages.json — build.mjs 가 만드는 생성물
 *
 * 그래서 둘 다 실제로 표류했다(2026-07-20 감사).
 *   ①은 없는 화면 5개를 광고하고 있는 화면 2개를 빠뜨렸다 — Storybook 이 삭제된 예약 관리
 *     메뉴를 계속 그렸다.
 *   ②는 nav 라벨을 바꾼 날 옛 라벨을 그대로 들고 있었는데 `codegen:check` 는 "생성물 전건
 *     최신 ✔" 을 냈다. codegen 이 세는 산출물 목록 밖이기 때문이다.
 *
 * [왜 기존 축에 못 넣었나]
 *   · `tools/contract-test/src/axes/*` — 축은 전부 **계약 1건 단위**로 돈다(`AxisContext` 가
 *     `Contract` 를 요구한다). nav 는 계약이 아니라 앱 IA 라 축의 단위에 들어가지 않는다.
 *   · `codegen --check` — 두 파일 다 codegen 산출물이 아니다. ①은 수기 파일이고 ②는
 *     build.mjs 소유다. codegen 의 `OUTPUT_PATTERNS` 에 넣으면 codegen 이 만들지도 않는
 *     파일을 고아로 판정해 지운다.
 *   · `@tds/drift` — 설계상 **차단하지 않는 알림 도구**다(exit 2 = Fix PR 트리거). 표류를
 *     막아야 하는 검사를 여기 두면 게이트가 장식이 된다.
 *
 * 그리고 ①은 eslint `boundaries` 의 `banApps` 로 import 가 **구조적으로 금지**돼 있어
 * (packages/ui → apps/admin 역방향 의존 금지) 타입 검사로는 원리적으로 잡을 수 없다.
 * 값을 실제로 읽어 대조하는 도구가 리포 바깥(tools/)에 따로 있어야 하는 이유다.
 *
 * 종료 코드: 0 = 전 파생물 동기 / 1 = 표류 1건 이상 (차단)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  NAV_CONFIG_PATH,
  buildPagesDoc,
  collectPages,
  serializePagesDoc,
  type PageMeta,
} from '../../figma-plugin/scripts/pages-source';
import { PAGES } from '../../../packages/ui/pages/_data/pages';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');

const PAGES_TS = 'packages/ui/pages/_data/pages.ts';
const TDS_PAGES_JSON = 'tools/figma-plugin/generated/tds-pages.json';

/** 표류 1건 — 어느 파일의 어떤 키가, 무엇이어야 하는데 무엇인가 */
interface Drift {
  /** 고쳐야 할 파일 (정본이 아니라 사본 쪽) */
  file: string;
  /** 표류한 키 — 라우트 경로 또는 필드 좌표 */
  key: string;
  expected: string;
  actual: string;
}

interface CheckResult {
  id: string;
  title: string;
  /** 이 검사가 고치라고 지목하는 파일 */
  target: string;
  /** 대조한 항목 수 — 0건 대조 후 "표류 없음" 은 공집합 위의 참이므로 따로 판정한다 */
  compared: number;
  drifts: Drift[];
  /** 사본을 다시 만드는 방법 — 오류 메시지가 처방까지 말하게 한다 */
  remedy: string;
}

/* ── 검사 ① pages.ts — 사람이 옮겨 적은 값 사본 ─────────────────────────────────
 *
 * 경로 집합뿐 아니라 **한국어 라벨까지** 본다. 경로만 대조하면 nav 라벨만 바뀐 표류를
 * 놓치는데, 그것이 실제로 벌어진 표류의 한 종류다(`/settings/api-keys`).
 */
function checkPagesTs(nav: readonly PageMeta[]): CheckResult {
  const drifts: Drift[] = [];
  const navById = new Map(nav.map((p) => [p.id, p]));
  const copyByPath = new Map(PAGES.map((p) => [p.path, p]));

  for (const page of PAGES) {
    if (!navById.has(page.path)) {
      drifts.push({
        file: PAGES_TS,
        key: page.path,
        expected: '(정본에 없음 — 삭제된 화면이다)',
        actual: `'${page.ko}' 항목이 남아 있다`,
      });
    }
  }

  for (const leaf of nav) {
    const copy = copyByPath.get(leaf.id);
    if (copy === undefined) {
      drifts.push({
        file: PAGES_TS,
        key: leaf.id,
        expected: `'${leaf.name}' (메뉴 '${leaf.menu}' / 섹션 '${leaf.section}')`,
        actual: '(사본에 없음 — 추가된 화면이 반영되지 않았다)',
      });
      continue;
    }
    if (copy.ko !== leaf.name) {
      drifts.push({ file: PAGES_TS, key: `${leaf.id} .ko`, expected: leaf.name, actual: copy.ko });
    }
    if (copy.menu.ko !== leaf.menu) {
      drifts.push({
        file: PAGES_TS,
        key: `${leaf.id} .menu.ko`,
        expected: leaf.menu,
        actual: copy.menu.ko,
      });
    }
    if (copy.menu.section.ko !== leaf.section) {
      drifts.push({
        file: PAGES_TS,
        key: `${leaf.id} .menu.section.ko`,
        expected: leaf.section,
        actual: copy.menu.section.ko,
      });
    }
  }

  return {
    id: 'pages-ts-sync',
    title: `${PAGES_TS} ↔ ${NAV_CONFIG_PATH}`,
    target: PAGES_TS,
    compared: Math.max(nav.length, PAGES.length),
    drifts,
    // 자동 생성물이 아니다 — 사람이 고쳐야 한다. 영문(en) 표기는 파일 헤더의 규칙을 따른다.
    remedy: `${PAGES_TS} 를 손으로 맞춘다 (영문 표기 규칙은 그 파일 헤더 참조). 이 파일은 생성물이 아니라 값 사본이다.`,
  };
}

/* ── 검사 ② tds-pages.json — build.mjs 생성물 ────────────────────────────────
 *
 * 생성 규칙(`pages-source.ts`)을 **생성기와 같은 모듈에서** 불러 다시 만든 뒤 바이트 비교한다.
 * 규칙을 여기서 다시 구현하면 검사가 생성기와 다른 답을 내는 순간 게이트가 거짓말을 한다.
 */
function checkTdsPagesJson(): CheckResult {
  const abs = path.join(REPO_ROOT, TDS_PAGES_JSON);
  const expected = serializePagesDoc(buildPagesDoc());
  const drifts: Drift[] = [];

  if (!fs.existsSync(abs)) {
    drifts.push({
      file: TDS_PAGES_JSON,
      key: '(파일 전체)',
      expected: '생성물이 존재해야 한다',
      actual: '파일 없음',
    });
  } else if (fs.readFileSync(abs, 'utf8') !== expected) {
    // 무엇이 달라졌는지까지 말한다 — "내용 불일치" 만 던지면 다음 사람이 다시 diff 를 떠야 한다.
    const actualDoc = JSON.parse(fs.readFileSync(abs, 'utf8')) as { pages?: PageMeta[] };
    const actualById = new Map((actualDoc.pages ?? []).map((p) => [p.id, p]));
    const expectedPages = collectPages();
    const expectedIds = new Set(expectedPages.map((p) => p.id));

    for (const want of expectedPages) {
      const got = actualById.get(want.id);
      if (got === undefined) {
        drifts.push({
          file: TDS_PAGES_JSON,
          key: want.id,
          expected: `'${want.name}' (메뉴 '${want.menu}' / 섹션 '${want.section}')`,
          actual: '(생성물에 없음)',
        });
        continue;
      }
      if (got.name !== want.name || got.menu !== want.menu || got.section !== want.section) {
        drifts.push({
          file: TDS_PAGES_JSON,
          key: want.id,
          expected: `name='${want.name}' menu='${want.menu}' section='${want.section}'`,
          actual: `name='${got.name}' menu='${got.menu}' section='${got.section}'`,
        });
      }
    }
    for (const got of actualDoc.pages ?? []) {
      if (!expectedIds.has(got.id)) {
        drifts.push({
          file: TDS_PAGES_JSON,
          key: got.id,
          expected: '(정본에 없음 — 삭제된 화면이다)',
          actual: `'${got.name}' 항목이 남아 있다`,
        });
      }
    }
    // 항목은 전부 같은데 바이트가 다르다 = 순서 또는 직렬화 형식이 어긋났다.
    if (drifts.length === 0) {
      drifts.push({
        file: TDS_PAGES_JSON,
        key: '(직렬화)',
        expected: '항목 순서·들여쓰기가 생성기 출력과 같아야 한다',
        actual: '항목은 일치하나 바이트가 다르다 (순서 또는 수기 편집 흔적)',
      });
    }
  }

  return {
    id: 'tds-pages-fresh',
    title: `${TDS_PAGES_JSON} ↔ ${NAV_CONFIG_PATH}`,
    target: TDS_PAGES_JSON,
    compared: collectPages().length,
    drifts,
    // codegen 이 만들지 않는다 — `pnpm codegen` 을 아무리 돌려도 이 파일은 안 바뀐다.
    remedy:
      'node tools/figma-plugin/build.mjs 를 실행하고 결과를 커밋한다 (pnpm codegen 이 아니다).',
  };
}

function main(): void {
  const nav = collectPages();

  // 정본을 못 읽었는데 "표류 없음" 을 내면 공집합 위의 참이다 — 검사가 아니라 착시다.
  if (nav.length === 0) {
    console.error(
      `[nav-sync] NOT_VERIFIED — ${NAV_CONFIG_PATH} 에서 화면을 한 건도 읽지 못했습니다.`,
    );
    console.error(
      '[nav-sync] 대조 0건에 표류 0건은 아무것도 보증하지 않습니다. 이것은 PASS 가 아닙니다.',
    );
    process.exitCode = 2;
    return;
  }

  const results = [checkPagesTs(nav), checkTdsPagesJson()];
  const total = results.reduce((n, r) => n + r.drifts.length, 0);

  console.log(`[nav-sync] 정본 ${NAV_CONFIG_PATH} — 화면 ${nav.length}건`);
  for (const r of results) {
    const mark = r.drifts.length === 0 ? '✔' : `✘ 표류 ${r.drifts.length}건`;
    console.log(`[nav-sync] ${r.id} — ${r.title} · 대조 ${r.compared}건 ${mark}`);
  }

  if (total === 0) {
    console.log('[nav-sync] 파생물 2종 모두 정본과 동기 상태 ✔');
    process.exitCode = 0;
    return;
  }

  for (const r of results) {
    if (r.drifts.length === 0) continue;
    console.error(`\n[nav-sync] FAIL ${r.id} — 고칠 파일: ${r.target}`);
    for (const d of r.drifts) {
      console.error(`  - ${d.key}`);
      console.error(`      정본 기대: ${d.expected}`);
      console.error(`      사본 실제: ${d.actual}`);
    }
    console.error(`  해결: ${r.remedy}`);
  }
  console.error(
    `\n[nav-sync] 표류 ${total}건 — 정본은 ${NAV_CONFIG_PATH} 다. 정본을 사본에 맞추지 마라.`,
  );
  process.exitCode = 1;
}

try {
  main();
} catch (e) {
  console.error(`[nav-sync] 실행 오류: ${(e as Error).message}`);
  process.exitCode = 2;
}
