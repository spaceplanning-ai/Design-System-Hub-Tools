// 앱 CSS 토큰 회귀 방지 가드 (TOKEN-01 · TOKEN-02) — apps/admin/src/**/*.css
//
// [왜 여기에 또 있나] packages/ui 의 TokenGuard 는 @tds/ui 컴포넌트 CSS 만 스캔한다 (레이어 규칙상
// UI 패키지가 앱 코드를 알 수 없다 — eslint no-restricted-imports 가 **/apps/** 를 막는다).
// 그래서 앱 CSS 는 앱 쪽에서 같은 불변식을 건다. 이 가드가 없으면 app-shell.css 처럼 **가장 많이
// 포커스되는 표면**이 토큰을 벗어나도 아무 게이트도 울리지 않는다 (TOKEN-02 가 실제로 그렇게 샜다).
//
// 검사: 하드코딩 hex 0 · px 리터럴 0 · CSS border/outline 키워드 0 · :focus-visible 링은 단일
//       토큰(border-width.medium) · box-shadow 는 shadow 토큰 참조.
//
// [왜 import.meta.glob('?raw') 가 아니라 node:fs 인가]
//   vitest 는 기본값(css:false)에서 CSS 를 스텁하며 **`?raw` import 조차 빈 문자열로 만든다** —
//   그러면 이 가드가 빈 문자열 위에서 전부 참이 되어 **위반이 있어도 초록불**이 된다 (실제로 이
//   함정에 빠져 app-shell.css 위반을 못 잡았다). css:true 로 켜면 앱 전체 CSS 가 vite 파이프라인을
//   타 메모리가 급증해 OOM 이 났다. fs 로 읽으면 vitest css 설정과 무관하게 **항상 실제 바이트**를
//   보므로 두 문제가 동시에 사라진다.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** apps/admin/src — 이 파일(src/shared/token-guard.test.ts)의 상위 */
const SRC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

function collectCssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectCssFiles(full));
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

/** [src 기준 POSIX 상대경로, 원문] 목록 */
const cssEntries: [string, string][] = collectCssFiles(SRC_DIR).map((file) => [
  relative(SRC_DIR, file).split('\\').join('/'),
  readFileSync(file, 'utf8'),
]);

/**
 * 주석 블록을 지운다 — 주석 속 설명 문구(치수를 말로 설명하는 것)는 위반이 아니다.
 * 내용을 없애되 **줄 구조는 보존한다**(개행만 남기고 나머지는 공백) — 그래야 위반 보고의 줄 번호가
 * 원본 파일과 일치한다. 통째로 지우면 줄이 당겨져 엉뚱한 줄을 가리킨다.
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '));
}

/**
 * 선언 라인만 남긴다.
 * `@media` prelude 는 제외한다 — CSS 스펙상 커스텀 프로퍼티는 media feature 값에 못 쓰므로
 * (`@media (max-width: var(--x))` 는 무효) 미디어 쿼리는 토큰 값을 리터럴로 **미러링해야 한다**.
 * 이 예외는 tokens.json 의 primitive.breakpoint $description 이 명시적으로 규정한 것이다.
 */
function declarationLines(css: string): { line: string; n: number }[] {
  return stripComments(css)
    .split(/\r?\n/)
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => line.includes(':') && !line.trimStart().startsWith('@media'));
}

/**
 * px 리터럴 예외 — 시각적 숨김(.tds-visually-hidden)의 최소 클립 상자.
 * `width/height` + `clip-path: inset(50%)` 로 스크린리더에는 남기고 화면에서만 지우는 표준 기법이며,
 * 여기서 그 치수는 '간격'이 아니라 **잘라낼 최소 상자**라 spacing 토큰으로 표현할 대상이 아니다.
 * 새 예외는 이 목록에 명시적으로 추가해야 한다 (리뷰 대상).
 */
const PX_EXCEPTIONS: readonly { file: string; decl: RegExp }[] = [
  { file: 'app.css', decl: /^\s*(?:width|height):\s*\d+px;?$/ },
];

/** 경로는 src 기준 상대경로다 ('app.css' · 'shared/layout/app-shell.css') — 경계를 정확히 맞춘다 */
const isFile = (path: string, file: string): boolean => path === file || path.endsWith(`/${file}`);

const isPxException = (path: string, line: string): boolean =>
  PX_EXCEPTIONS.some((e) => isFile(path, e.file) && e.decl.test(line));

describe('앱 CSS 토큰 가드 — TOKEN-01: 하드코딩 값 0건', () => {
  // [이 가드가 공허해질 수 있는 경로를 스스로 막는다]
  //  스캔 대상이 0건이거나 내용이 비면 아래 모든 단언이 '위반 0건'으로 참이 된다 — 그건 통과가 아니라
  //  측정 불가다. 목록과 내용이 모두 실재함을 먼저 못 박는다.
  it('스캔 대상 CSS 가 내용과 함께 로드된다 (빈 목록/빈 내용 위에서 통과하지 않는다)', () => {
    expect(cssEntries.length).toBeGreaterThan(0);
    for (const [path, css] of cssEntries) {
      expect(css.length, `${path} 를 빈 문자열로 읽었다`).toBeGreaterThan(0);
    }
    // 앱 CSS 는 토큰 변수를 참조한다 — 한 건도 안 보이면 내용을 못 읽고 있다는 뜻이다
    expect(cssEntries.some(([, css]) => css.includes('var(--tds-'))).toBe(true);
  });

  it('app-shell.css 가 스캔 범위에 실제로 포함된다 (가장 많이 포커스되는 표면이 사각지대면 안 된다)', () => {
    expect(cssEntries.some(([path]) => isFile(path, 'app-shell.css'))).toBe(true);
  });

  it('하드코딩 hex 가 없다', () => {
    const hits: string[] = [];
    for (const [path, css] of cssEntries) {
      for (const { line, n } of declarationLines(css)) {
        if (/#[0-9a-fA-F]{3,8}\b/.test(line)) hits.push(`${path}:${n} → ${line.trim()}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('px 리터럴이 없다 (0 · 미디어쿼리 미러링 · visually-hidden 클립 제외)', () => {
    const hits: string[] = [];
    for (const [path, css] of cssEntries) {
      for (const { line, n } of declarationLines(css)) {
        if (isPxException(path, line)) continue;
        for (const m of line.matchAll(/\b(\d+(?:\.\d+)?)px\b/g)) {
          if (m[1] !== undefined && Number.parseFloat(m[1]) !== 0)
            hits.push(`${path}:${n} → ${m[0]}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('CSS border/outline 키워드(thin/medium/thick)를 값으로 쓰지 않는다', () => {
    const hits: string[] = [];
    // 콜론 직후의 bare 키워드만 잡는다 — var(--tds-border-width-medium) 안의 medium 은 매칭되지 않는다
    const re = /\b(?:outline|border(?:-[a-z]+)*)\s*:\s*(?:thin|medium|thick)\b/;
    for (const [path, css] of cssEntries) {
      for (const { line, n } of declarationLines(css)) {
        if (re.test(line)) hits.push(`${path}:${n} → ${line.trim()}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe('앱 CSS 토큰 가드 — TOKEN-02: 단일 focus-ring 토큰', () => {
  it('모든 outline 선언이 var(--tds-border-width-medium) 로 두께를 렌더한다 (nav 링이 button 과 픽셀 동일)', () => {
    const hits: string[] = [];
    for (const [path, css] of cssEntries) {
      for (const { line, n } of declarationLines(css)) {
        if (!/^\s*outline\s*:/.test(line)) continue;
        const value = line.trim();
        if (value.includes('outline: none') || value.includes('outline:none')) continue;
        if (!value.includes('var(--tds-border-width-medium)')) hits.push(`${path}:${n} → ${value}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe('앱 CSS 토큰 가드 — TOKEN-04: elevation 은 shadow 토큰에서만', () => {
  it('모든 box-shadow 값이 shadow 토큰(var(--tds-…shadow…))을 참조한다', () => {
    const hits: string[] = [];
    for (const [path, css] of cssEntries) {
      for (const { line, n } of declarationLines(css)) {
        const m = /box-shadow\s*:\s*([^;]+)/.exec(line);
        if (m === null || m[1] === undefined) continue;
        const value = m[1].trim();
        if (value === 'none') continue;
        if (!/var\(--tds-[^)]*shadow[^)]*\)/.test(value)) hits.push(`${path}:${n} → ${value}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
