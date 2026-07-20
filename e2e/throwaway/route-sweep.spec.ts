// 전 라우트 순회 하니스 (일회성 진단 · 게이트 스위트 아님)
//
// 하는 일: 라우터에 등록된 모든 경로를 실제로 열어서
//   - 콘솔 error / warning (React key·act·잘못된 prop 경고 포함)
//   - 미처리 예외 (pageerror)
//   - 네트워크 실패 (requestfailed · 4xx/5xx 응답)
//   - 에러 바운더리 노출 · 빈 본문
// 을 수집하고 JSON 으로 떨군다.
//
// 동적 파라미터는 지어내지 않는다 — 목록 화면을 먼저 열어 실제 링크(href)를 수확하고,
// 그 중 패턴에 맞는 것을 쓴다. 못 채운 패턴은 'unresolved' 로 남겨 보고한다.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

// 사이드바 활성 표시의 기대값은 **앱이 쓰는 그 함수**에서 가져온다 —
// 테스트가 두 번째 판정 규칙을 갖는 순간 이 검증은 자기 자신을 검증하게 된다.
import { findCoveringLeaf } from '../../apps/admin/src/shared/layout/nav-config';

import { allRoutes, fixtureIdFor, patternToRegExp } from './route-inventory';

interface Finding {
  readonly route: string;
  readonly pattern: string;
  readonly kind:
    | 'console-error'
    | 'console-warning'
    | 'pageerror'
    | 'network'
    | 'boundary'
    | 'empty'
    | 'nav-active';
  readonly message: string;
}

// 결과 JSON 도 러너 산출물과 같은 자리에 쓴다 — .gitignore·.prettierignore 가 이미 덮는 경로다.
const OUT_DIR = resolve(__dirname, '..', 'test-results', 'route-sweep');

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'tds.admin.session',
      JSON.stringify({
        userId: 'U-0001',
        email: 'test@example.com',
        role: 'system_admin',
        issuedAt: Date.now(),
      }),
    );
  });
}

function attach(page: Page, sink: Finding[], route: string, pattern: string): () => void {
  const onConsole = (msg: ConsoleMessage): void => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    sink.push({
      route,
      pattern,
      kind: type === 'error' ? 'console-error' : 'console-warning',
      message: msg.text().slice(0, 800),
    });
  };
  const onPageError = (err: Error): void => {
    sink.push({
      route,
      pattern,
      kind: 'pageerror',
      message: `${err.message}\n${err.stack ?? ''}`.slice(0, 1200),
    });
  };
  const onRequestFailed = (req: {
    url: () => string;
    failure: () => { errorText: string } | null;
  }): void => {
    const url = req.url();
    if (url.startsWith('data:')) return;
    sink.push({
      route,
      pattern,
      kind: 'network',
      message: `${url} :: ${req.failure()?.errorText ?? 'failed'}`,
    });
  };
  const onResponse = (res: { status: () => number; url: () => string }): void => {
    if (res.status() >= 400)
      sink.push({
        route,
        pattern,
        kind: 'network',
        message: `HTTP ${String(res.status())} ${res.url()}`,
      });
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('requestfailed', onRequestFailed);
  page.on('response', onResponse);

  return () => {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('requestfailed', onRequestFailed);
    page.off('response', onResponse);
  };
}

/** 화면이 실제로 그려졌는가 — 셸만 남고 본문이 비면 실패다 */
async function inspectRender(
  page: Page,
): Promise<{ empty: boolean; boundary: string | null; text: string }> {
  return page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    const text = (main.textContent ?? '').replace(/\s+/g, ' ').trim();
    // 에러 바운더리 복구 UI 의 흔적
    const boundaryEl = document.querySelector('[data-error-boundary], [role="alert"]');
    const boundaryText = boundaryEl
      ? (boundaryEl.textContent ?? '').replace(/\s+/g, ' ').trim()
      : '';
    const looksLikeBoundary = /문제가 발생|오류가 발생|다시 시도|일시적인 오류|참조 번호/.test(
      boundaryText,
    )
      ? boundaryText
      : null;
    return { empty: text.length < 20, boundary: looksLikeBoundary, text: text.slice(0, 200) };
  });
}

test('route sweep', async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);

  await seedAuth(page);

  const routes = allRoutes();
  const statics = routes.filter((r) => !r.dynamic);
  const dynamics = routes.filter((r) => r.dynamic && !r.pattern.includes('*'));

  /*
   * splat('*') 은 패턴이 아니라 **넘겨주기**다 — 옛 경로 북마크를 새 경로로 보내는 리다이렉트거나
   * (`/marketing/message-templates/*`) 정의되지 않은 주소의 기본 착지(`*`)다. 파라미터를 채울
   * 것이 없으므로 대표 주소 하나를 실제로 열어 **어디에 착지하는지** 본다. 건너뛰면 '북마크가
   * 죽었는지' 를 아무도 확인하지 않은 채 초록불이 된다.
   */
  const splats = routes
    .filter((r) => r.pattern.includes('*'))
    .map((r) =>
      r.pattern === '*' ? '/이-경로는-없다' : r.pattern.replace('*', 'legacy-bookmark'),
    );

  const findings: Finding[] = [];
  const harvested = new Set<string>();
  const rowIdsByList = new Map<string, readonly string[]>();
  const visited: string[] = [];

  /**
   * 목록 화면의 **첫 행을 실제로 눌러** 상세 경로를 알아낸다.
   * 행 클릭 이동(useRowNavigation)을 쓰는 목록은 링크도 체크박스도 없어서 이 길밖에 없다.
   */
  async function idByClickingFirstRow(listPath: string): Promise<string | null> {
    await page.goto(listPath, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const row = page.locator('tr.tds-ui-row').first();
    if ((await row.count()) === 0) return null;
    await row.click();
    await page.waitForTimeout(700);
    const after = new URL(page.url()).pathname;
    if (!after.startsWith(`${listPath}/`)) return null;
    return after.slice(listPath.length + 1).split('/')[0] ?? null;
  }

  async function visit(url: string, pattern: string): Promise<void> {
    const detach = attach(page, findings, url, pattern);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);
      const info = await inspectRender(page);
      if (info.boundary !== null)
        findings.push({
          route: url,
          pattern,
          kind: 'boundary',
          message: info.boundary.slice(0, 400),
        });
      else if (info.empty)
        findings.push({
          route: url,
          pattern,
          kind: 'empty',
          message: `본문 텍스트 ${String(info.text.length)}자: "${info.text}"`,
        });

      // 링크 수확 — 동적 라우트의 실제 id 는 여기서 나온다
      const hrefs = await page.$$eval('a[href^="/"]', (as) =>
        as.map((a) => a.getAttribute('href') ?? ''),
      );
      for (const h of hrefs) harvested.add(h.split('?')[0] as string);

      // 행 선택 셀의 `#select-<id>` — 목록에 링크가 없어도 첫 행의 실제 id 를 알려 준다
      const rowIds = await page.$$eval('[id^="select-"]', (els) =>
        els
          .map((e) => (e.getAttribute('id') ?? '').slice('select-'.length))
          .filter((s) => s.length > 0),
      );
      if (rowIds.length > 0) rowIdsByList.set(url, rowIds);

      /*
       * [사이드바 활성 표시] 상세·편집 라우트에서 메뉴가 통째로 꺼지던 결함의 회귀 가드.
       * 기대: 어느 라우트에서든 nav 안의 aria-current="page" 는 **정확히 하나**이고,
       *       그 href 는 findCoveringLeaf(경로) 와 같다. 목록 화면에서 상위 항목이 같이 켜지는
       *       회귀도 '하나뿐' 조건이 잡는다.
       */
      const expected = findCoveringLeaf(new URL(page.url()).pathname);
      const actual = await page.$$eval(
        'nav[aria-label="주 내비게이션"] [aria-current="page"]',
        (els) => els.map((e) => e.getAttribute('href') ?? ''),
      );
      if (expected !== null) {
        if (actual.length !== 1 || actual[0] !== expected.to) {
          findings.push({
            route: url,
            pattern,
            kind: 'nav-active',
            message: `기대 aria-current=["${expected.to}"] · 실제 [${actual.map((a) => `"${a}"`).join(', ')}]`,
          });
        }
      } else if (actual.length !== 0) {
        findings.push({
          route: url,
          pattern,
          kind: 'nav-active',
          message: `어떤 잎에도 속하지 않는 경로인데 켜진 항목이 있다: [${actual.join(', ')}]`,
        });
      }

      visited.push(url);
    } finally {
      detach();
    }
  }

  for (const r of statics) await visit(r.pattern, r.pattern);
  for (const url of splats) await visit(url, url);

  // 동적 패턴을 수확한 링크로 채운다
  const unresolved: string[] = [];
  for (const r of dynamics) {
    const re = patternToRegExp(r.pattern);
    const match = [...harvested].find((h) => re.test(h) && !h.includes(':'));
    if (match === undefined) {
      // 목록에서 링크를 못 얻었으면 같은 리소스의 다른 패턴에서 id 를 빌려 온다
      const prefix = r.pattern.slice(0, r.pattern.indexOf('/:'));
      const sibling = [...harvested].find(
        (h) => h.startsWith(`${prefix}/`) && h !== prefix && !/\/(new|edit)$/.test(h),
      );
      const id =
        (sibling !== undefined
          ? (sibling.slice(prefix.length + 1).split('/')[0] as string)
          : null) ??
        rowIdsByList.get(prefix)?.[0] ??
        (await idByClickingFirstRow(prefix)) ??
        fixtureIdFor(r.pattern);
      if (id === null || id === undefined) {
        unresolved.push(r.pattern);
        continue;
      }
      await visit(r.pattern.replace(/:[^/]+/, id), r.pattern);
      continue;
    }
    await visit(match, r.pattern);
  }

  /*
   * [확인 패스] 이 저장소는 지금 여러 에이전트가 동시에 파일을 고치고 있고, 그때마다 vite 가
   * full reload / 의존성 재최적화를 건다. 그 순간 순회 중이던 화면은 모듈 요청이 통째로 ERR_ABORTED
   * 되고 본문이 비어 보인다 — **화면의 결함이 아니라 순회의 결함이다.**
   *
   * 그렇다고 그 메시지를 필터로 지우면 진짜 로드 실패까지 함께 지운다. 그래서 지우지 않고
   * **다시 연다**: 오류가 났던 라우트만 한 번 더 순회해서, 두 번 다 난 것만 confirmed 로 센다.
   * 한 번만 난 것은 버리지 않고 transient 로 남겨 보고한다.
   */
  const suspect = [...new Set(findings.map((f) => f.route))];
  const second: Finding[] = [];
  for (const url of suspect) {
    const pattern = findings.find((f) => f.route === url)?.pattern ?? url;
    const detach = attach(page, second, url, pattern);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const info = await inspectRender(page);
      if (info.boundary !== null)
        second.push({
          route: url,
          pattern,
          kind: 'boundary',
          message: info.boundary.slice(0, 400),
        });
      else if (info.empty)
        second.push({
          route: url,
          pattern,
          kind: 'empty',
          message: `본문 텍스트 ${String(info.text.length)}자: "${info.text}"`,
        });

      const expected = findCoveringLeaf(new URL(page.url()).pathname);
      const actual = await page.$$eval(
        'nav[aria-label="주 내비게이션"] [aria-current="page"]',
        (els) => els.map((e) => e.getAttribute('href') ?? ''),
      );
      if (expected !== null) {
        if (actual.length !== 1 || actual[0] !== expected.to) {
          second.push({
            route: url,
            pattern,
            kind: 'nav-active',
            message: `기대 aria-current=["${expected.to}"] · 실제 [${actual.map((a) => `"${a}"`).join(', ')}]`,
          });
        }
      } else if (actual.length !== 0) {
        second.push({
          route: url,
          pattern,
          kind: 'nav-active',
          message: `어떤 잎에도 속하지 않는 경로인데 켜진 항목이 있다: [${actual.join(', ')}]`,
        });
      }
    } finally {
      detach();
    }
  }

  const key = (f: Finding): string => `${f.route}::${f.kind}::${f.message.split('\n')[0] ?? ''}`;
  const secondKeys = new Set(second.map(key));
  const confirmed = findings.filter((f) => secondKeys.has(key(f)));
  const transient = findings.filter((f) => !secondKeys.has(key(f)));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    resolve(OUT_DIR, 'findings.json'),
    JSON.stringify(
      { visitedCount: visited.length, visited, unresolved, confirmed, transient, findings },
      null,
      2,
    ),
    'utf8',
  );

  // eslint-disable-next-line no-console
  console.log(
    `\n=== 순회 ${String(visited.length)} 라우트 / 확정 오류 ${String(confirmed.length)} / 일시적 ${String(transient.length)} / 미해결 패턴 ${String(unresolved.length)} ===`,
  );
  expect(true).toBe(true);
});
