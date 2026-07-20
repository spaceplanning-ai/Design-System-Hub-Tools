/**
 * 아이콘 SVG 추출 — **정본은 앱·DS 의 실제 아이콘 구현이다.**
 *
 * 손으로 베낀 두 번째 사본을 만들지 않는다. 아이콘이 늘거나 패스가 바뀌면 이 추출기가 그대로
 * 따라가고, 어긋나면 codegen:check 가 즉시 드러낸다.
 *
 * 원천 두 갈래:
 *   (a) assets/icons/ds-icon-geometry.json — DS 정식 아이콘의 **저작 기하**.
 *       Icon.tsx 가 아니라 별도 JSON 인 이유: Icon.tsx 는 이 추출기의 산출물을 소비하므로,
 *       거기서 다시 읽으면 원천과 산출물이 겹쳐 순환이 된다(실제로 한 번 깨졌다).
 *   (b) apps/admin/src/**\/icons.tsx — 앱이 인라인 SVG 로 갖고 있는 아이콘 컴포넌트들.
 *       (@tds/ui 에 범용 Icon 이 생기기 전에 앱이 먼저 갖게 된 것들)
 *
 * 산출물은 Figma 플러그인이 `figma.createNodeFromSvg` 로 **진짜 벡터 노드**를 만드는 데 쓴다.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export interface ExtractedIcon {
  /** kebab-case 아이콘 이름 — 계약 name enum 값과 1:1 */
  name: string;
  /** 독립 실행 가능한 SVG 문자열 (24 그리드, stroke 기반) */
  svg: string;
  /** 이 아이콘이 어디서 왔는지 (리포트·추적용) */
  source: string;
}

/**
 * DS 정식 아이콘의 **저작 기하** 파일 (저장소 루트 기준).
 * 컴포넌트 폴더가 아니라 assets/icons/ 에 두는 이유는 두 가지다:
 *  1. 이건 컴포넌트가 아니라 디자인 자산이다 — packages/ui 의 컴포넌트 파일 명명 규칙 대상이 아니다.
 *  2. 산출물(generated/icons/icon-geometry.ts)을 소비하는 Icon.tsx 와 **같은 폴더에 두면 안 된다** —
 *     원천과 산출물이 뒤섞이면 추출기가 자기 산출물을 읽는 순환이 생긴다(실제로 한 번 깨졌다).
 */
export const DS_GEOMETRY_PATH = ['assets', 'icons', 'ds-icon-geometry.json'];

/** 24 그리드 stroke 아이콘의 공통 껍데기 — 앱·DS 의 BASE 와 같은 값이다 */
const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="#000000" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">';

/** PascalCase 컴포넌트 이름 → kebab-case 아이콘 이름 (XIcon/XGlyph 접미 제거) */
export function toIconName(componentName: string): string {
  return componentName
    .replace(/(Icon|Glyph)$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** JSX 속성명 → SVG 속성명 (strokeWidth → stroke-width) */
function toSvgAttr(name: string): string {
  if (name === 'className') return 'class';
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * JSX 도형 조각을 SVG 마크업으로 정규화한다.
 * - `{...BASE}` / `{...props}` 스프레드 제거
 * - camelCase 속성 → kebab-case
 * - `{1.5}` 형태의 중괄호 표현식 → 따옴표 값 (숫자 리터럴만 허용)
 * - React 프래그먼트(`<>`, `</>`) 제거
 */
function normalizeJsxToSvg(jsx: string): string {
  let out = jsx;
  out = out.replace(/<\/?>/g, '');
  out = out.replace(/\{\s*\.\.\.[A-Za-z0-9_]+\s*\}/g, '');
  // {1.75} → "1.75"
  out = out.replace(/=\{\s*(-?[\d.]+)\s*\}/g, '="$1"');
  // camelCase 속성명 정규화 (값 앞의 속성 이름만)
  out = out.replace(/(\s)([a-zA-Z]+[A-Z][a-zA-Z]*)=/g, (_m, ws: string, attr: string) => {
    return `${ws}${toSvgAttr(attr)}=`;
  });
  return out.replace(/\s+/g, ' ').trim();
}

/** 문자열 안에서 `<svg ...>` … `</svg>` 의 **안쪽**을 꺼낸다 */
function innerSvg(source: string, from: number): string | null {
  const open = source.indexOf('<svg', from);
  if (open < 0) return null;
  const openEnd = source.indexOf('>', open);
  const close = source.indexOf('</svg>', openEnd);
  if (openEnd < 0 || close < 0) return null;
  return source.slice(openEnd + 1, close);
}

/**
 * (b) 앱의 인라인 SVG 아이콘 파일에서 추출한다.
 * `export function XIcon(...) { return (<svg …>…</svg>); }` 형태를 기대한다.
 */
export function extractFromIconModule(source: string, origin: string): ExtractedIcon[] {
  const out: ExtractedIcon[] = [];
  const re = /export\s+(?:function|const)\s+([A-Za-z0-9_]*(?:Icon|Glyph))\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    const componentName = match[1];
    if (componentName === undefined) continue;
    const body = innerSvg(source, match.index);
    if (body === null) continue;
    const markup = normalizeJsxToSvg(body);
    if (markup.length === 0) continue;
    out.push({
      name: toIconName(componentName),
      svg: `${SVG_OPEN}${markup}</svg>`,
      source: origin,
    });
  }
  return out;
}

/**
 * (a) DS 정식 아이콘의 기하 — **손으로 관리하는 JSON 정본**에서 읽는다.
 *
 * [왜 Icon.tsx 를 긁지 않는가] 예전에는 Icon.tsx 의 PATHS 레코드를 정규식으로 긁었다.
 * 그런데 Icon.tsx 가 이 추출기의 **산출물을 소비하도록** 바뀌면서 순환이 생겼다 —
 * 추출기가 읽던 원본이 사라지자 DS 아이콘 11종이 통째로 빠지고 앱의 동명 사본으로 대체됐다
 * (image 의 사각형 좌표가 조용히 달라졌다). 원본과 산출물을 같은 파일에 두면 안 된다.
 * 그래서 저작(authored) 기하는 JSON 으로 분리하고, 추출기는 그것과 앱 아이콘을 합치기만 한다.
 */
export function extractFromDsGeometry(json: string, origin: string): ExtractedIcon[] {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) return [];
  const out: ExtractedIcon[] = [];
  for (const [name, shapes] of Object.entries(parsed)) {
    if (name.startsWith('$') || !Array.isArray(shapes)) continue;
    const markup = shapes
      .map((shape: unknown) => {
        if (typeof shape !== 'object' || shape === null) return '';
        const { tag, attrs } = shape as { tag?: unknown; attrs?: unknown };
        if (typeof tag !== 'string') return '';
        const pairs =
          typeof attrs === 'object' && attrs !== null
            ? Object.entries(attrs)
                .map(([k, v]) => `${k}="${String(v)}"`)
                .join(' ')
            : '';
        return `<${tag}${pairs.length > 0 ? ` ${pairs}` : ''}/>`;
      })
      .join('');
    if (markup.length > 0) out.push({ name, svg: `${SVG_OPEN}${markup}</svg>`, source: origin });
  }
  return out;
}

/** 앱의 icons.tsx 파일을 재귀로 찾는다 */
function findIconFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === 'dist' || entry === 'storybook-static') continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      // Icon.tsx 는 이제 산출물을 **소비**하므로 원천이 아니다 — 긁으면 순환이 된다.
      else if (/^icons?\.tsx$/i.test(entry)) out.push(full);
    }
  };
  walk(root);
  return out;
}

/**
 * 저장소 전체에서 아이콘을 전수 추출한다.
 * 같은 이름이 둘 이상이면 **DS 구현이 이긴다** — 앱의 사본보다 정식 아톰이 정본이기 때문이다.
 */
export function extractAllIcons(repoRoot: string): ExtractedIcon[] {
  const byName = new Map<string, ExtractedIcon>();

  // (a) DS 저작 기하가 **먼저** 등록된다 — 앱에 동명 사본이 있어도 정식 아톰이 이긴다
  const dsPath = path.join(repoRoot, ...DS_GEOMETRY_PATH);
  if (existsSync(dsPath)) {
    const origin = path.relative(repoRoot, dsPath).split(path.sep).join('/');
    for (const icon of extractFromDsGeometry(readFileSync(dsPath, 'utf8'), origin)) {
      byName.set(icon.name, icon);
    }
  }

  // (b) 앱이 인라인 SVG 로 갖고 있는 아이콘들
  for (const file of findIconFiles(path.join(repoRoot, 'apps', 'admin', 'src'))) {
    const origin = path.relative(repoRoot, file).split(path.sep).join('/');
    for (const icon of extractFromIconModule(readFileSync(file, 'utf8'), origin)) {
      if (!byName.has(icon.name)) byName.set(icon.name, icon);
    }
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}
