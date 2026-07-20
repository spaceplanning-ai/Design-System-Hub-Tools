/**
 * 변형 패리티 검사 — **DS(CSS)가 그리는 값**과 **Figma 페이로드가 바인딩할 값**을 변형 단위로 대조한다.
 *
 * 이 파일이 존재하는 이유: "Figma 산출물이 Storybook/앱과 다르다"는 회귀는 조용히 일어난다.
 * 계약에 변형 축이 있는데 토큰이 변형 차원을 갖지 않으면, 플러그인은 아무 오류 없이 기본 변형의
 * 값으로 **전 변형을 똑같이** 그린다(과거 Button 이 네 variant 를 전부 primary 팔레트로 그린 이유).
 * 그래서 여기서는 '바인딩이 존재하는가'가 아니라 **'변형마다 값이 갈라지는가'와 '갈라진 값이
 * CSS 와 같은 토큰인가'**를 본다.
 *
 * 검사 3종:
 *   A. 단일 원천 — 플러그인이 바인딩할 모든 Variable 은 Figma 변수 목록과 생성된 tokens.css 에
 *      **동시에** 존재해야 한다. 한쪽에만 있으면 두 소비처가 다른 것을 읽고 있다는 뜻이다.
 *   B. 변형 충실도 — 컴포넌트 CSS 의 `.tds-*--<값>` 규칙이 참조하는 CSS 변수와, 플러그인이 그
 *      변형에서 바인딩하는 Variable 이 **같은 토큰**이어야 한다.
 *   C. 평탄화 회귀 가드 — 시각 변형 축은 값마다 색 바인딩이 갈라져야 한다. 갈라지지 않아도 되는
 *      축은 FLAT_BY_DESIGN 에 **이유와 함께** 명시한다 — 조용히 통과하는 축은 없다.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec, ComponentSetSpec } from '../component-spec';
import { buildComponentSetSpec } from '../component-spec';
import { walkNodeSpec } from '../node-spec';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(HERE, '../../../generated');
const REPO = path.resolve(HERE, '../../../../..');
const UI_SRC = path.join(REPO, 'packages/ui/src');
const TOKENS_CSS = path.join(REPO, 'packages/ui/generated/tokens/tokens.css');

const VAR_NAMES: ReadonlySet<string> = new Set(
  (
    JSON.parse(readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8')) as {
      variables: Array<{ name: string }>;
    }
  ).variables.map((v) => v.name),
);

/** tokens.css 가 실제로 선언한 커스텀 프로퍼티 이름들 (--tds-...) */
const CSS_VARS: ReadonlySet<string> = new Set(
  [...readFileSync(TOKENS_CSS, 'utf8').matchAll(/^\s*(--tds-[a-z0-9-]+)\s*:/gm)].map(
    (m) => m[1] ?? '',
  ),
);

const SPECS: ComponentSetSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec)
  .map((c) => buildComponentSetSpec(c, VAR_NAMES));

/** Figma Variable 이름(슬래시) → CSS 커스텀 프로퍼티 이름 */
function toCssVar(variable: string): string {
  return `--tds-${variable.split('/').join('-')}`;
}

// ---------------------------------------------------------------------------
// 컴포넌트 CSS 찾기 — packages/ui/src/<layer>/<Name>/<Name>.css
// ---------------------------------------------------------------------------

const CSS_BY_COMPONENT = new Map<string, string>();
for (const layer of ['atoms', 'molecules', 'organisms', 'templates']) {
  const dir = path.join(UI_SRC, layer);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name, `${name}.css`);
    if (existsSync(file)) CSS_BY_COMPONENT.set(name, readFileSync(file, 'utf8'));
  }
}

/**
 * 어떤 변형 값의 CSS 규칙이 참조하는 var(--tds-*) 들을 속성별로 모은다.
 * `.tds-button--danger { background: var(--x) }` 처럼 **상태 의사클래스가 없는 기본 규칙만** 본다
 * (hover/active 는 Figma 기본 변형이 그리지 않는 상태다).
 */
function baseRuleVars(css: string, value: string): Map<string, string> {
  const out = new Map<string, string>();
  // 선택자에 --<값> 이 있고, 의사클래스/의사요소가 없는 규칙
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const [, rawSelector = '', body = ''] of css.matchAll(ruleRe)) {
    const selector = rawSelector.trim();
    if (!selector.includes(`--${value}`)) continue;
    if (selector.includes(':') || selector.includes('@')) continue;
    for (const [, prop = '', variable = ''] of body.matchAll(
      /([a-z-]+)\s*:\s*var\((--tds-[a-z0-9-]+)\)/g,
    )) {
      if (!out.has(prop)) out.set(prop, variable);
    }
  }
  return out;
}

/** 이 변형에서 루트 노드에 걸린 field 바인딩의 Variable */
function rootBinding(spec: ComponentSetSpec, variantName: string, field: string): string | null {
  const variant = spec.variants.find((v) => v.name === variantName);
  if (!variant) return null;
  const hit = variant.node.bindings.find((b) => b.field === field);
  return hit ? hit.variable : null;
}

/** 이 변형 트리 전체의 색 바인딩 지문 — 값이 갈라지는지 판정하는 데 쓴다 */
function colorSignature(spec: ComponentSetSpec, variantName: string): string {
  const variant = spec.variants.find((v) => v.name === variantName);
  if (!variant) return '';
  const parts: string[] = [];
  walkNodeSpec(variant.node, (node) => {
    for (const b of node.bindings) {
      if (b.field === 'fills' || b.field === 'strokes') {
        parts.push(`${node.name}|${b.field}|${b.variable}`);
      }
    }
  });
  return [...new Set(parts)].sort().join(',');
}

// ---------------------------------------------------------------------------
// A. 단일 원천 — 모든 바인딩이 Figma 변수와 CSS 변수 양쪽에 존재한다
// ---------------------------------------------------------------------------

describe('A. 토큰 단일 원천', () => {
  /**
   * 합성 typography 토큰의 서브 축은 두 생성기가 **다른 모양으로** 전개한다:
   *   Figma  — component/button/typography/{font-size,font-weight,…} 네 변수로 펼친다
   *   CSS    — --tds-component-button-typography: var(--tds-typography-label-md) 한 줄 별칭만 낸다
   * 이름은 다르지만 별칭을 따라가면 같은 값이다. 그래서 서브 축은 **부모 변수의 존재**로 확인한다.
   */
  const TYPO_SUB_AXES = ['font-size', 'font-weight', 'font-family', 'line-height'] as const;

  function cssCounterpartExists(variable: string): boolean {
    if (CSS_VARS.has(toCssVar(variable))) return true;
    for (const axis of TYPO_SUB_AXES) {
      const suffix = `/${axis}`;
      if (!variable.endsWith(suffix)) continue;
      const parent = variable.slice(0, variable.length - suffix.length);
      if (CSS_VARS.has(toCssVar(parent))) return true;
    }
    return false;
  }

  it('플러그인이 바인딩할 모든 Variable 이 tokens.css 에도 선언돼 있다', () => {
    const missing: string[] = [];
    for (const spec of SPECS) {
      for (const binding of spec.bindings) {
        if (cssCounterpartExists(binding.variable)) continue;
        missing.push(
          `${spec.name}: ${binding.variable} → ${toCssVar(binding.variable)} (tokens.css 에 없음)`,
        );
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// B. 변형 충실도 — CSS 규칙과 Figma 바인딩이 같은 토큰을 가리킨다
// ---------------------------------------------------------------------------

/** CSS 속성 → 루트 노드의 Figma 바인딩 필드 */
const PROP_TO_FIELD: ReadonlyArray<readonly [string, string]> = [
  ['background', 'fills'],
  ['border-color', 'strokes'],
];

describe('B. 변형 충실도 (CSS ↔ Figma)', () => {
  const checked: string[] = [];
  const mismatches: string[] = [];

  for (const spec of SPECS) {
    const css = CSS_BY_COMPONENT.get(spec.name);
    if (css === undefined) continue;
    for (const axis of spec.axes) {
      for (const value of axis.values) {
        const cssVars = baseRuleVars(css, value);
        if (cssVars.size === 0) continue; // 이 값에 대응하는 CSS 규칙이 없다 → C 가 따로 본다
        const variantName = spec.variants.find((v) => v.values[axis.name] === value)?.name;
        if (variantName === undefined) continue;
        for (const [prop, field] of PROP_TO_FIELD) {
          const cssVar = cssVars.get(prop);
          if (cssVar === undefined) continue;
          const bound = rootBinding(spec, variantName, field);
          if (bound === null) continue;
          const boundCssVar = toCssVar(bound);
          checked.push(`${spec.name}.${axis.name}=${value}.${prop}`);
          if (boundCssVar !== cssVar) {
            mismatches.push(
              `${spec.name} ${axis.name}=${value} ${prop}: CSS=${cssVar} vs Figma=${boundCssVar}`,
            );
          }
        }
      }
    }
  }

  it('CSS 변형 규칙과 Figma 변형 바인딩이 같은 토큰을 읽는다', () => {
    expect(mismatches).toEqual([]);
  });

  it('대조한 (컴포넌트 × 변형 × 속성) 조합이 0건이 아니다', () => {
    // 검사 자체가 무력화되는(선택자 규칙이 바뀌어 아무것도 못 찾는) 회귀를 막는다
    expect(checked.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// C. 평탄화 회귀 가드
// ---------------------------------------------------------------------------

/**
 * 색이 변형마다 갈라지지 **않아도 되는** 축 — 전부 이유가 있다.
 * 여기 없는 시각 축이 평탄해지면 테스트가 깨진다. 새 축을 무심코 추가하면 걸린다.
 */
const FLAT_BY_DESIGN: Readonly<Record<string, string>> = {
  'Button.Size': '크기 축 — 여백/글자 크기만 바꾼다. 색은 Variant 축이 소유한다',
  'Card.Padding': '여백 축 — 색과 무관',
  'Card.Elevation':
    '그림자만 다르다. anatomy 모델에 shadow 축이 없어 Figma 에 표현되지 않는다(미해결 갭)',
  'Icon.Size': '크기 축 — 색은 currentColor 로 부모를 따른다',
  'Icon.Name': '글리프 종류 축 — 색·크기가 아니라 모양이 바뀐다',
  'SegmentedControl.Size': '크기 축 — segment 좌우 여백만 바꾼다',
  'TextField.Type': 'HTML input type — 시각 변형이 아니다',
};

describe('C. 평탄화 회귀 가드', () => {
  it('시각 변형 축은 값마다 색 바인딩이 갈라진다', () => {
    const flat: string[] = [];
    for (const spec of SPECS) {
      for (const axis of spec.axes) {
        if (axis.values.length < 2) continue;
        const key = `${spec.name}.${axis.name}`;
        const signatures = new Set(
          axis.values.map((value) => {
            const variantName = spec.variants.find((v) => v.values[axis.name] === value)?.name;
            return variantName === undefined ? '' : colorSignature(spec, variantName);
          }),
        );
        const isFlat = signatures.size === 1;
        if (isFlat && FLAT_BY_DESIGN[key] === undefined) {
          flat.push(`${key}(${axis.values.join('|')}) — 전 변형 색 바인딩 동일`);
        }
      }
    }
    expect(flat).toEqual([]);
  });

  it('FLAT_BY_DESIGN 에 적힌 축은 실제로 존재한다 (죽은 예외 금지)', () => {
    const real = new Set<string>();
    for (const spec of SPECS) for (const axis of spec.axes) real.add(`${spec.name}.${axis.name}`);
    const dead = Object.keys(FLAT_BY_DESIGN).filter((k) => !real.has(k));
    expect(dead).toEqual([]);
  });

  it('어떤 변형도 색 바인딩이 통째로 비어 있지 않다', () => {
    // Toast 의 cancelled/error 가 정확히 이 상태였다 — 계약에 그 값의 토큰이 아예 없어
    // Figma 가 배경·테두리·글자색 없이 그렸다.
    const empty: string[] = [];
    for (const spec of SPECS) {
      // 색 토큰을 하나도 안 쓰는 컴포넌트(Icon 등)는 기준선 자체가 비어 있다 — 제외
      const anyColor = spec.variants.some((v) => colorSignature(spec, v.name).length > 0);
      if (!anyColor) continue;
      for (const variant of spec.variants) {
        if (colorSignature(spec, variant.name).length === 0) {
          empty.push(`${spec.name} [${variant.name}]`);
        }
      }
    }
    expect(empty).toEqual([]);
  });
});
