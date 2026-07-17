/**
 * Storybook 정적 빌드(storybook-static)에서 스토리 스크린샷을 캡처하는 모듈.
 *
 * - index.json(Storybook 7/8 스토리 인덱스)에서 type === "story" 항목을 수집한다.
 * - node:http 기반 초경량 정적 서버로 storybook-static을 서빙한다 (외부 의존성 없음).
 * - Playwright(chromium)로 iframe.html?id=<storyId> 를 열어 #storybook-root 요소를 캡처한다.
 * - Playwright가 설치되지 않은 환경에서는 null을 반환한다 (graceful skip — 호출부가 안내 출력).
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

export interface StoryEntry {
  id: string;
  title: string;
  name: string;
}

export interface CapturedStory {
  storyId: string;
  /** 캡처된 스크린샷 파일 절대 경로 (실패 시 undefined) */
  file?: string;
  /** 캡처 실패 사유 */
  error?: string;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

/** storybook-static/index.json에서 스토리 목록을 읽는다. 없거나 파싱 불가 시 null. */
export function readStoriesIndex(storybookDir: string): StoryEntry[] | null {
  const indexPath = path.join(storybookDir, 'index.json');
  if (!fs.existsSync(indexPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
      entries?: Record<string, { type?: string; id: string; title: string; name: string }>;
      stories?: Record<string, { id: string; title: string; name: string }>;
    };
    // Storybook 7/8: entries, 6.x: stories
    const entries = raw.entries ?? raw.stories ?? {};
    return Object.values(entries)
      .filter((e) => !('type' in e) || (e as { type?: string }).type === 'story')
      .map((e) => ({ id: e.id, title: e.title, name: e.name }));
  } catch {
    return null;
  }
}

/** storybook-static을 서빙하는 초경량 정적 서버. */
export async function serveStatic(
  rootDir: string,
): Promise<{ url: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const filePath = path.normalize(path.join(rootDir, rel));
    // 경로 탈출(path traversal) 방지
    if (!filePath.startsWith(path.normalize(rootDir))) {
      res.writeHead(403).end();
      return;
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/**
 * 전체 스토리를 순회하며 스크린샷을 캡처한다.
 * @returns Playwright 미설치 시 null (호출부에서 graceful skip 처리)
 */
export async function captureStories(
  storybookDir: string,
  stories: StoryEntry[],
  outDir: string,
): Promise<CapturedStory[] | null> {
  let chromium: typeof import('playwright').chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return null; // playwright 미설치 — graceful skip
  }

  fs.mkdirSync(outDir, { recursive: true });
  const server = await serveStatic(storybookDir);
  const results: CapturedStory[] = [];

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      reducedMotion: 'reduce', // 모션 토큰에 의한 애니메이션 흔들림 제거
      deviceScaleFactor: 1, // DPR 고정 — 머신마다 다르면 크기 불일치로 전건 fail 한다
    });
    const page = await context.newPage();
    // 컨텍스트 옵션과 별개로 페이지 레벨에서도 강제한다 (이중 안전장치).
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 외부 네트워크 차단 — 결정성의 전제.
    // ImageThumb.stories 의 BrokenImage 는 https://invalid.example/nope.png 를 실제로 요청한다.
    // ImageThumb 은 onError 에서 크기가 다른 placeholder 로 교체되므로, DNS 실패가
    // 스크린샷 전에 도착했는지에 따라 캡처 크기가 달라진다 — 실행마다 결과가 뒤집히는 경합이다.
    // (실측: 이 스토리 1건이 두 번의 동일 실행에서 '이미지 크기 불일치'로 잡혔다.)
    // 로컬 서버 외 요청을 즉시 abort 하면 실패가 항상 같은 시점에 확정된다.
    // 부수 효과로 외부 폰트/CDN 에 의한 흔들림도 함께 사라진다 — 기준 이미지는 네트워크 상태를
    // 기록해선 안 된다.
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(server.url) || url.startsWith('data:') || url.startsWith('blob:')) {
        void route.continue();
      } else {
        void route.abort();
      }
    });

    await assertReducedMotionApplies(page, server.url);

    for (const story of stories) {
      const file = path.join(outDir, `${sanitizeId(story.id)}.png`);
      try {
        await page.goto(
          `${server.url}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`,
          { waitUntil: 'load', timeout: 15_000 },
        );
        const root = page.locator('#storybook-root');
        await root.waitFor({ state: 'attached', timeout: 10_000 });
        await page.waitForTimeout(300); // 렌더 안정화 대기

        // #storybook-root 가 비어 있으면(박스 크기 0) 포털 스토리다 — Modal·ConfirmDialog 는
        // createPortal 로 document.body 에 붙으므로 root 밑에 아무것도 없다.
        // 이때 root.screenshot() 은 "not visible" 로 타임아웃나고, 예전 구현은 그것을
        // capture-error 로 넘긴 뒤 **집계에서 제외**해서 21건이 조용히 사라졌다.
        // (Modal 7건 · ConfirmDialog 13건 · SelectionBar 1건 — 하필 시각적으로 가장 중요한 오버레이들)
        // 포털은 뷰포트 안에 있으므로 뷰포트 스냅샷으로 잡는다.
        const rootBox = await root.boundingBox();
        if (rootBox && rootBox.width > 0 && rootBox.height > 0) {
          await root.screenshot({ path: file });
        } else {
          await page.screenshot({ path: file });
        }
        results.push({ storyId: story.id, file });
      } catch (err) {
        results.push({
          storyId: story.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return results;
}

/**
 * reducedMotion 이 **실제로 먹었는지** 선단언한다. 안 먹었으면 즉시 던진다.
 *
 * 왜 선단언인가 — 이 저장소는 `test.use({ reducedMotion })` 가 **조용히 적용되지 않은** 전례가 있다.
 * 옵션을 넘겼다는 사실은 그것이 적용됐다는 증거가 아니다. 적용 실패 시 스피너/펄스
 * (Button.css `tds-button-spin` · ListCard/StatsCard/TodoCard `*-pulse` — 전부 `infinite`)가
 * 계속 돌아 기준 이미지가 캡처 타이밍마다 달라지고, VRT 는 무작위로 빨간불이 된다.
 * 그 상태의 기준 이미지는 회귀를 잡는 게 아니라 노이즈를 잡는다.
 *
 * matchMedia(JS API)만 믿지 않고 **CSS 캐스케이드가 실제로 reduce 분기를 적용하는지**까지 본다 —
 * 게이트가 검사해야 할 것은 API 응답이 아니라 픽셀을 정하는 캐스케이드다.
 */
async function assertReducedMotionApplies(
  page: import('playwright').Page,
  serverUrl: string,
): Promise<void> {
  await page.goto(`${serverUrl}/iframe.html`, { waitUntil: 'load', timeout: 15_000 });
  const probe = await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = [
      '@keyframes __tds_vrt_probe { from { opacity: 1 } to { opacity: 0 } }',
      '#__tds_vrt_probe { animation: __tds_vrt_probe 10s linear infinite; }',
      '@media (prefers-reduced-motion: reduce) { #__tds_vrt_probe { animation: none; } }',
    ].join('\n');
    document.head.appendChild(style);
    const el = document.createElement('div');
    el.id = '__tds_vrt_probe';
    document.body.appendChild(el);
    const cascadeAnimationName = getComputedStyle(el).animationName;
    const matches = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.remove();
    style.remove();
    return { matches, cascadeAnimationName };
  });

  if (!probe.matches) {
    throw new Error(
      'reducedMotion 이 적용되지 않았습니다 — matchMedia("(prefers-reduced-motion: reduce)") 가 false. ' +
        '이 상태로 캡처한 기준 이미지는 애니메이션 프레임에 좌우되어 신뢰할 수 없습니다.',
    );
  }
  if (probe.cascadeAnimationName !== 'none') {
    throw new Error(
      `reducedMotion 이 CSS 캐스케이드에 적용되지 않았습니다 — 프로브 요소의 animation-name 이 ` +
        `"${probe.cascadeAnimationName}" (기대: "none"). matchMedia 는 true 였지만 실제 스타일은 감속되지 않았습니다.`,
    );
  }
  console.log('[vrt] reducedMotion 선단언 통과 — matchMedia=true · 캐스케이드 animation-name=none');
}

/** storyId를 안전한 파일명으로 정규화한다 (기준 이미지 파일명 규칙과 동일). */
export function sanitizeId(storyId: string): string {
  return storyId.replace(/[^a-zA-Z0-9._-]/g, '_');
}
