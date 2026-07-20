/**
 * 토큰 → CSS 변수 / 타입드 맵 생성기.
 *
 * tokens/tokens.json (W3C DTCG) →
 *   packages/ui/generated/tokens/tokens.css  (:root — 라이트 단일 테마)
 *   packages/ui/generated/tokens/tokens.ts   (as const 타입드 맵 + cssVar 헬퍼)
 *
 * 규칙:
 *  - 토큰 경로 → CSS 변수명: color.action.primary.default → --tds-color-action-primary-default
 *  - 참조 토큰 {token.path} 는 값으로 풀지 않고 var(--tds-token-path) 체인으로 해석
 *    → 참조 대상 토큰만 바꿔도 체인이 자동 반영된다
 *  - number 값: $type dimension → px, duration → ms, 그 외 무단위
 *  - 합성 값(shadow 등)은 단일 선언으로 조립, 그 외 객체 값은 하위 키별 서브 변수로 전개
 */
import path from 'node:path';
import { GENERATED_TOKENS_DIR, TOKENS_JSON_PATH, relFromRepo } from './paths';
import { FlatToken, GeneratedFile, cssVarName, flattenTokens, kebab } from './shared';

const REF_RE = /\{([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9-]+)+)\}/g;

/** 문자열 내 {token.path} 참조를 var(--tds-...) 체인으로 치환 */
function resolveRefs(s: string): string {
  return s.replace(REF_RE, (_m, refPath: string) => `var(${cssVarName(refPath)})`);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function primitiveToCss(value: unknown, type: string | undefined): string {
  if (typeof value === 'string') return resolveRefs(value);
  if (typeof value === 'number') {
    if (type === 'dimension') return `${value}px`;
    if (type === 'duration') return `${value}ms`;
    return String(value);
  }
  return String(value);
}

/** DTCG shadow 합성 값 → box-shadow 선언 */
function shadowToCss(v: Record<string, unknown>, type: string | undefined): string {
  const part = (x: unknown): string => primitiveToCss(x, 'dimension');
  const pieces = [
    v['inset'] === true ? 'inset' : undefined,
    part(v['offsetX'] ?? '0'),
    part(v['offsetY'] ?? '0'),
    part(v['blur'] ?? '0'),
    v['spread'] !== undefined ? part(v['spread']) : undefined,
    typeof v['color'] === 'string' ? resolveRefs(v['color'] as string) : undefined,
  ].filter((s): s is string => s !== undefined);
  void type;
  return pieces.join(' ');
}

function isShadowLike(v: Record<string, unknown>, type: string | undefined): boolean {
  return type === 'shadow' || ('offsetX' in v && 'offsetY' in v);
}

/**
 * 합성 객체 토큰의 하위 키 목록 — `typography.label.md` → [fontFamily, fontSize, …].
 *
 * [왜 별도로 한 번 더 도는가] 합성 토큰은 **자기 이름의 변수를 갖지 않는다.** 서브 변수
 * 네 개로만 전개되므로 `--tds-typography-label-md` 는 어디에도 정의되지 않는다. 그런데
 * `{typography.label.md}` 를 값으로 갖는 **별칭 토큰**(component.button.typography)은
 * 문자열 참조라 그 사실을 모르고 `var(--tds-typography-label-md)` 한 줄을 뱉었다 —
 * **정의된 적 없는 이름을 참조하는 죽은 선언**이었다. 별칭도 같은 서브 키로 전개하려면
 * 무엇이 합성인지 먼저 알아야 하고, 참조가 참조를 물 수 있어 고정점까지 반복한다.
 */
function collectCompositeSubKeys(tokens: FlatToken[]): Map<string, string[]> {
  const subKeys = new Map<string, string[]>();

  for (const t of tokens) {
    if (!isPlainObject(t.value) || isShadowLike(t.value, t.type)) continue;
    const keys = Object.entries(t.value)
      .filter(
        ([, sub]) =>
          sub !== undefined && sub !== null && !isPlainObject(sub) && !Array.isArray(sub),
      )
      .map(([key]) => key);
    if (keys.length > 0) subKeys.set(t.path, keys);
  }

  // 별칭 사슬 전파 — `{a}` → `{b}` → 합성 처럼 여러 단을 물 수 있으므로 변화가 없을 때까지 돈다
  for (let changed = true; changed;) {
    changed = false;
    for (const t of tokens) {
      if (subKeys.has(t.path) || typeof t.value !== 'string') continue;
      const ref = /^\{([^}]+)\}$/.exec(t.value.trim());
      const target = ref?.[1];
      if (target === undefined) continue;
      const inherited = subKeys.get(target);
      if (inherited === undefined) continue;
      subKeys.set(t.path, inherited);
      changed = true;
    }
  }

  return subKeys;
}

/**
 * 하나의 토큰 값 → [CSS 변수명, CSS 값] 목록.
 * 대부분 1건이지만, 합성 객체(typography 등)는 하위 키별 서브 변수로 전개된다.
 */
function tokenToCssDeclarations(
  tokenPath: string,
  value: unknown,
  type: string | undefined,
  compositeSubKeys: Map<string, string[]>,
): Array<[string, string]> {
  const varName = cssVarName(tokenPath);

  // 합성을 가리키는 별칭 — 자기도 서브 변수로 전개한다. 그러지 않으면 존재하지 않는
  // 합성 이름을 참조하는 죽은 선언이 된다.
  if (typeof value === 'string') {
    const ref = /^\{([^}]+)\}$/.exec(value.trim());
    const target = ref?.[1];
    const targetKeys = target === undefined ? undefined : compositeSubKeys.get(target);
    if (target !== undefined && targetKeys !== undefined) {
      return targetKeys.map((key): [string, string] => [
        `${varName}-${kebab(key)}`,
        `var(${cssVarName(target)}-${kebab(key)})`,
      ]);
    }
  }

  if (Array.isArray(value)) {
    // fontFamily 스택 · 다중 shadow · cubicBezier 좌표
    const parts = value.map((item) =>
      isPlainObject(item) ? shadowToCss(item, type) : primitiveToCss(item, type),
    );
    // cubicBezier 는 4개 좌표 배열이다 — 유효한 timing-function 이 되도록 cubic-bezier() 로 감싼다.
    // (감싸지 않으면 consumer 가 bare 좌표를 받아 animation/transition shorthand 가 깨진다 — TOKEN-03)
    if (type === 'cubicBezier') return [[varName, `cubic-bezier(${parts.join(', ')})`]];
    return [[varName, parts.join(', ')]];
  }

  if (isPlainObject(value)) {
    if (isShadowLike(value, type)) return [[varName, shadowToCss(value, type)]];
    // typography 등 기타 합성 → 서브 변수 전개 (--tds-...-font-size 등)
    const decls: Array<[string, string]> = [];
    for (const [key, sub] of Object.entries(value)) {
      if (sub === undefined || sub === null || isPlainObject(sub) || Array.isArray(sub)) continue;
      decls.push([`${varName}-${kebab(key)}`, primitiveToCss(sub, undefined)]);
    }
    return decls;
  }

  return [[varName, primitiveToCss(value, type)]];
}

export function generateTokenOutputs(doc: Record<string, unknown>): GeneratedFile[] {
  const flat = flattenTokens(doc);
  const tokens = [...flat.values()];

  const compositeSubKeys = collectCompositeSubKeys(tokens);

  // --- tokens.css ------------------------------------------------------------
  // 토큰 경로 → 그 토큰이 실제로 뱉은 변수명들. tokenVars 를 여기서 만들기 위해 함께 모은다 —
  // **CSS 에 나온 것만 타입에 오른다**(아래 주석 참조).
  const emittedFor = new Map<string, string[]>();
  const decls: Array<[string, string]> = [];
  for (const t of tokens) {
    const d = tokenToCssDeclarations(t.path, t.value, t.type, compositeSubKeys);
    emittedFor.set(
      t.path,
      d.map(([name]) => name),
    );
    decls.push(...d);
  }

  const css: string[] = [];
  css.push(
    `/* AUTO-GENERATED from ${relFromRepo(TOKENS_JSON_PATH)} — DO NOT EDIT (pnpm codegen) */`,
  );
  css.push('');
  css.push('/* 라이트 단일 테마 — 모드 오버라이드 없음 */');
  css.push(':root {');
  for (const [name, value] of decls) css.push(`  ${name}: ${value};`);
  css.push('}');
  css.push('');

  // --- tokens.ts ---------------------------------------------------------------
  const ts: string[] = [];
  ts.push(`// AUTO-GENERATED from ${relFromRepo(TOKENS_JSON_PATH)} — DO NOT EDIT (pnpm codegen)`);
  ts.push('');
  ts.push('/**');
  ts.push(' * 토큰 경로 → CSS 변수명 타입드 맵.');
  ts.push(' *');
  ts.push(' * [CSS 에 실제로 나온 이름만 오른다] 합성 토큰(typography 등)은 자기 이름의 변수를');
  ts.push(' * 갖지 않고 서브 변수로만 전개된다. 예전에는 합성 경로도 그대로 이 맵에 올라');
  ts.push(
    " * `cssVar('typography.label.md')` 가 **정의된 적 없는** `var(--tds-typography-label-md)`",
  );
  ts.push(' * 를 내줬다 — 타입 검사를 통과하는데 렌더는 조용히 상속값으로 떨어지는 조합이다.');
  ts.push(' * 이제 서브 경로(`typography.label.md.font-size`)가 대신 오른다.');
  ts.push(' * 네 속성을 한 번에 쓰려면 아래 typography() 를 쓴다.');
  ts.push(' */');
  ts.push('export const tokenVars = {');
  for (const t of tokens) {
    const emitted = emittedFor.get(t.path) ?? [];
    const own = cssVarName(t.path);
    for (const varName of emitted) {
      // 서브 변수는 `--tds-a-b-font-size` 꼴이다 — 자기 접두사를 떼어 경로 조각으로 되돌린다
      const suffix = varName.startsWith(`${own}-`) ? varName.slice(own.length + 1) : '';
      ts.push(`  '${suffix === '' ? t.path : `${t.path}.${suffix}`}': '${varName}',`);
    }
  }
  ts.push('} as const;');
  ts.push('');
  ts.push('export type TokenPath = keyof typeof tokenVars;');
  ts.push('');
  ts.push('/** 토큰 경로를 var() 참조 문자열로 변환 — 컴포넌트 스타일에서 사용 */');
  ts.push('export function cssVar(tokenPath: TokenPath): string {');
  ts.push('  return `var(${tokenVars[tokenPath]})`;');
  ts.push('}');
  ts.push('');

  // --- typography 헬퍼 ----------------------------------------------------------
  // 합성 타이포그래피는 네 속성이 항상 함께 움직인다. 호출부가 fontSize·lineHeight·
  // fontFamily·fontWeight 를 각각 손으로 적으면 한 줄만 빠뜨려도 조용히 어긋나고,
  // 실제로 어드민에서 그 네 줄이 654번 반복되고 있었다.
  const typographyTokens = tokens.filter(
    (t) => t.type === 'typography' && (compositeSubKeys.get(t.path)?.length ?? 0) > 0,
  );

  ts.push('/**');
  ts.push(' * 타이포그래피 합성 토큰 → CSS 속성별 변수명.');
  ts.push(' * 네 속성이 한 덩어리로 움직이므로 낱개로 쓰지 말고 typography() 로 펼친다.');
  ts.push(' */');
  ts.push('export const typographyVars = {');
  for (const t of typographyTokens) {
    const keys = compositeSubKeys.get(t.path) ?? [];
    ts.push(`  '${t.path}': {`);
    for (const key of keys) {
      ts.push(`    ${key}: '${cssVarName(t.path)}-${kebab(key)}',`);
    }
    ts.push('  },');
  }
  ts.push('} as const;');
  ts.push('');
  ts.push('export type TypographyPath = keyof typeof typographyVars;');
  ts.push('');
  ts.push('/**');
  ts.push(' * 타이포그래피 토큰을 인라인 style 조각으로 펼친다.');
  ts.push(' *');
  ts.push(" *   style={{ ...typography('label.md'), color: cssVar('color.text.muted') }}");
  ts.push(' *');
  ts.push(' * 반환 키는 경로별로 정확히 좁혀지므로 없는 속성을 읽으면 컴파일이 막는다.');
  ts.push(' */');
  ts.push('export function typography<P extends TypographyPath>(');
  ts.push('  tokenPath: P,');
  ts.push('): { [K in keyof (typeof typographyVars)[P]]: string } {');
  ts.push('  const entry = typographyVars[tokenPath] as Record<string, string>;');
  ts.push('  const out: Record<string, string> = {};');
  ts.push('  for (const key of Object.keys(entry)) out[key] = `var(${entry[key]})`;');
  ts.push('  return out as { [K in keyof (typeof typographyVars)[P]]: string };');
  ts.push('}');
  ts.push('');

  return [
    { filePath: path.join(GENERATED_TOKENS_DIR, 'tokens.css'), content: css.join('\n') },
    { filePath: path.join(GENERATED_TOKENS_DIR, 'tokens.ts'), content: ts.join('\n') },
  ];
}
