/**
 * 토큰 해석 — **순수 계층**. Figma API 를 참조하지 않고 이름만 다룬다.
 *
 * 계약의 tokens 블록은 `키 → 점 경로`(예: backgroundDanger → color.feedback.danger.surface)다.
 * anatomy 의 styles.* 는 그 **키**를 가리키므로, 변형 값(primary·danger·md …)을 곁들여
 * 키를 고르고 → 점 경로를 Figma Variable 이름(슬래시)으로 바꾸는 두 단계가 필요하다.
 */

/** 점 경로 → Figma Variable 이름 (color.text.default → color/text/default) */
export function toVariableName(dotted: string): string {
  return dotted.split('.').join('/');
}

function pascal(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * 변형 값을 곁들인 토큰 키 후보를 **우선순위 순서로** 만든다.
 * 계약마다 표기가 갈린다: 'surfaceDanger'(역할+값) 와 'neutralSurface'(값+역할) 둘 다 실존하므로
 * 양쪽을 모두 시도하고, 마지막에 값 없는 기본 키로 떨어진다.
 */
export function tokenKeyCandidates(key: string, activeValues: readonly string[]): string[] {
  const out: string[] = [];
  for (const value of activeValues) {
    if (value.length === 0) continue;
    out.push(`${key}${pascal(value)}`);
    out.push(`${value}${pascal(key)}`);
  }
  out.push(key);
  return out;
}

export interface ResolvedToken {
  /** 실제로 채택된 계약 tokens 키 */
  tokenKey: string;
  /** 점 경로 */
  path: string;
  /** Figma Variable 이름 (슬래시) */
  variable: string;
  /** 이 값이 변형별 표(variantTokens)에서 왔다면 그 출처 축/값 — 리포트·패리티 검사용 */
  from?: { prop: string; value: string };
}

/**
 * 계약의 variantTokens 블록 — `prop 이름 → prop 값 → 토큰 키 → 점 경로`.
 * 변형 축이 시각을 바꾸는 컴포넌트는 이 표가 정본이고, flat tokens 는 변형 무관 값만 남는다.
 */
export type VariantTokens = Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>
>;

/** 알 수 없는 JSON → VariantTokens. 3단 중 하나라도 어긋난 가지는 통째로 버린다 */
export function normalizeVariantTokens(raw: unknown): VariantTokens {
  const out: Record<string, Record<string, Record<string, string>>> = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out;
  for (const [prop, byValue] of Object.entries(raw)) {
    if (typeof byValue !== 'object' || byValue === null || Array.isArray(byValue)) continue;
    const valueMap: Record<string, Record<string, string>> = {};
    for (const [value, tokenMap] of Object.entries(byValue)) {
      if (typeof tokenMap !== 'object' || tokenMap === null || Array.isArray(tokenMap)) continue;
      const keys: Record<string, string> = {};
      for (const [key, path] of Object.entries(tokenMap)) {
        if (typeof path === 'string' && path.length > 0) keys[key] = path;
      }
      if (Object.keys(keys).length > 0) valueMap[value] = keys;
    }
    if (Object.keys(valueMap).length > 0) out[prop] = valueMap;
  }
  return out;
}

/** varNames 가 주어졌을 때 그 이름이 실제로 바인딩 가능한지 (합성 토큰은 프리픽스 일치도 인정) */
function isBindable(variable: string, varNames?: ReadonlySet<string>): boolean {
  if (varNames === undefined) return true;
  if (varNames.has(variable)) return true;
  return hasPrefix(varNames, variable);
}

/**
 * anatomy styles 의 키 하나를 실제 Variable 이름으로 해석한다.
 *
 * 우선순위:
 *   1. variantTokens[prop][이 변형의 값][key] — 변형별 정본
 *   2. 접미/접두 후보 (surfaceDanger · dangerSurface) — 기존 표기 호환
 *   3. flat tokens[key] — 변형 무관 값
 *
 * varNames 를 주면 **파일에 실존하는 Variable** 만 채택한다(없는 이름은 다음 후보로 넘어간다).
 */
/** 상태 축의 계약 prop 이름 — codegen 이 figmaStateAxis 로 만드는 축과 같은 이름이다 */
const STATE_PROP = 'state';

/**
 * 상태 덧칠 합성 — `<다른 축의 경로>-<상태값>` 이 실제 Variable 로 존재하면 그것을 쓴다.
 *
 * 예: Variant=primary 가 component.button.primary.background 를 주고 State=hover 이면
 *     component.button.primary.background-hover 를 찾아본다. 있으면 그게 정답이다.
 * 없으면 null 을 돌려주고 호출자가 기존 순서대로(상태 표 → 후보 탐색) 계속 찾는다.
 */
function composeStateToken(
  key: string,
  propValues: Readonly<Record<string, string>>,
  variantTokens: VariantTokens,
  varNames?: ReadonlySet<string>,
): ResolvedToken | null {
  const stateValue = propValues[STATE_PROP];
  if (stateValue === undefined || stateValue.length === 0) return null;
  // 상태 표가 이 키를 다루지 않으면 그 상태는 이 속성을 바꾸지 않는다는 뜻이다
  if (variantTokens[STATE_PROP]?.[stateValue]?.[key] === undefined) return null;

  for (const [prop, value] of Object.entries(propValues)) {
    if (prop === STATE_PROP) continue;
    const basePath = variantTokens[prop]?.[value]?.[key];
    if (basePath === undefined) continue;
    const composedPath = `${basePath}-${stateValue}`;
    const variable = toVariableName(composedPath);
    if (!isBindable(variable, varNames)) continue;
    return {
      tokenKey: key,
      path: composedPath,
      variable,
      from: { prop: STATE_PROP, value: stateValue },
    };
  }
  return null;
}

export function resolveStyleToken(
  tokens: Readonly<Record<string, string>>,
  key: string,
  activeValues: readonly string[],
  varNames?: ReadonlySet<string>,
  variantTokens?: VariantTokens,
  propValues?: Readonly<Record<string, string>>,
): ResolvedToken | null {
  // 1) 변형별 표가 먼저다 — 이 변형이 그 축에서 어떤 값인지로 직접 조회한다
  if (variantTokens !== undefined && propValues !== undefined) {
    // 상태는 **다른 축 위에 얹히는 덧칠**이다: Variant=primary 이면서 State=hover 이면
    // 'primary 의 hover 색' 이 정답이지, 'primary 의 기본색' 도 'variant 없는 hover 색' 도 아니다.
    // 두 축이 같은 키를 덮어쓸 때 먼저 만난 축이 이기게 두면 상태 변형이 기본과 픽셀까지
    // 같아진다 — 상태 축을 만든 의미가 사라진다. 그래서 합성을 먼저 시도한다.
    const composed = composeStateToken(key, propValues, variantTokens, varNames);
    if (composed !== null) return composed;

    // 상태를 **먼저** 본다. 합성이 안 되는 경우(예: variant 별 disabled 색이 따로 없고
    // 공용 disabled 색 하나만 있는 경우)에도 상태가 변형을 이겨야 한다 — 변형이 이기면
    // State=disabled 가 State=default 와 완전히 같아져 구분되지 않는 변형이 만들어진다.
    const ordered = Object.entries(propValues).sort(
      ([a], [b]) => Number(b === STATE_PROP) - Number(a === STATE_PROP),
    );
    for (const [prop, value] of ordered) {
      const path = variantTokens[prop]?.[value]?.[key];
      if (path === undefined) continue;
      const variable = toVariableName(path);
      if (!isBindable(variable, varNames)) continue;
      // tokenKey 는 **계약 tokens 키 그대로**다 — 변형 출처는 from 에만 남긴다.
      // (여기에 'prop.value.key' 같은 합성 키를 넣으면 tokenKey 로 대조하는 기존 검사들이
      //  같은 속성을 다른 키로 보게 되어 조용히 어긋난다)
      return { tokenKey: key, path, variable, from: { prop, value } };
    }
  }

  // 2~3) 기존 후보 탐색 — 접미/접두 표기 후 값 없는 기본 키
  for (const candidate of tokenKeyCandidates(key, activeValues)) {
    const path = tokens[candidate];
    if (path === undefined) continue;
    const variable = toVariableName(path);
    if (!isBindable(variable, varNames)) continue;
    return { tokenKey: candidate, path, variable };
  }
  return null;
}

function hasPrefix(varNames: ReadonlySet<string>, prefix: string): boolean {
  const needle = `${prefix}/`;
  for (const name of varNames) {
    if (name.indexOf(needle) === 0) return true;
  }
  return false;
}

/** 합성 타이포 토큰이 전개되는 서브 Variable 축 — Figma 가 텍스트 노드에 바인딩할 수 있는 것만 */
export interface TypographyVars {
  /** fontSize 필드에 바인딩 */
  fontSize?: string;
  /** fontWeight 필드에 바인딩 */
  fontWeight?: string;
  /**
   * fontFamily — Figma 는 텍스트 노드의 fontFamily 를 Variable 로 바인딩할 수 없다(STRING
   * Variable 은 characters 에만 바인딩 가능). 이름만 돌려주고 실제로는 폰트 로드에 쓴다.
   */
  fontFamily?: string;
  /**
   * lineHeight — Figma 는 lineHeight 를 Variable 로 바인딩하지 않는다(2024~ 기준 미지원 필드).
   * 이름만 돌려주고 해석값을 리터럴로 적용한다.
   */
  lineHeight?: string;
}

/** 합성 타이포 토큰 프리픽스에서 서브 Variable 이름들을 뽑는다 (실존하는 것만) */
export function typographyVars(prefix: string, varNames: ReadonlySet<string>): TypographyVars {
  const out: TypographyVars = {};
  const pick = (suffix: string): string | undefined => {
    const name = `${prefix}/${suffix}`;
    return varNames.has(name) ? name : undefined;
  };
  const fontSize = pick('font-size');
  if (fontSize !== undefined) out.fontSize = fontSize;
  const fontWeight = pick('font-weight');
  if (fontWeight !== undefined) out.fontWeight = fontWeight;
  const fontFamily = pick('font-family');
  if (fontFamily !== undefined) out.fontFamily = fontFamily;
  const lineHeight = pick('line-height');
  if (lineHeight !== undefined) out.lineHeight = lineHeight;
  return out;
}
