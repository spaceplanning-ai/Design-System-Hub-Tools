/**
 * 축 1 — Contract ↔ React (설계서 §5.3)
 *
 * 검사 항목:
 *  1) packages/ui/generated/types/<Name>.types.ts 존재 여부
 *  2) 생성 타입 파일이 계약과 동일 세대인지 — 파일 내 계약 버전 주석 비교
 *     (codegen 헤더 규약: "// 자동 생성 — 원천: contracts/<Name>.contract.json@<version>"
 *      과 같이 'contract'와 semver가 같은 줄에 존재하면 인식)
 *  3) packages/ui/src/**\/<Name>.tsx 구현이 generated 타입을 import 하는지 정적 검사
 *  4) 계약 a11y.role 이 구현 트리에서 실현되는지 대조 (명시 role 속성 · 시맨틱 태그의 암묵 role ·
 *     조립된 DS 자식의 계약 role). 확정 불가는 FAIL 이 아니라 SKIP — 아래 제외 규칙 참조
 *
 * 구현 산출물(타입 파일·구현 파일)이 하나도 없으면 축 전체 SKIP — 계약만 존재하는
 * 부트스트랩 단계는 차단하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { posixBasename, readJson, readText } from '../lib/fsutil.ts';
import type { AxisContext, AxisResult, Check } from '../lib/types.ts';
import { summarizeStatuses } from '../lib/types.ts';

/** 'contract' 단어와 semver가 같은 줄에 있는 첫 번째 버전 표기를 추출 */
const VERSION_COMMENT_RE = /contract[^\r\n]*?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/i;

/* ────────────────────────────────────────────────────────────────────────────
 * 4) a11y.role 대조 — "선언한 role 이 구현 어딘가에서 실현되는가"
 *
 * [왜 '루트 대조' 가 아닌가] 최초 설계는 계약 a11y.role 을 **루트 엘리먼트**의 role 과
 * 맞대는 것이었다. 실측에서 44건 중 12건이 가짜 실패로 나왔다 — 이 리포의 계약은
 * a11y.role 에 "이 컴포넌트가 AT 에 무엇으로 보이는가" 를 적고, 그 role 은 대개 껍데기
 * <div> 가 아니라 **안쪽 컨트롤**이 갖는다 (Checkbox 의 <input type="checkbox">,
 * SelectField 의 <select>, SearchField 의 <input type="search">, Slider 의
 * <input type="range">). 그래서 루트 한 점이 아니라 **구현 트리 전체**에서 그 role 이
 * 실현되는지를 본다. 루트 대조를 고집하면 게이트가 정상 구현을 12건 때린다.
 *
 * 판정: 계약 role 이 (1) 어느 엘리먼트의 명시 role="…" 이거나 (2) 어느 네이티브 태그의
 * 암묵 role 이거나 (3) 자식으로 조립된 DS 컴포넌트의 **계약** a11y.role 이면 PASS.
 *
 * 제외(SKIP) 규칙 — 전부 정당한 형태이며 결함이 아니다. 가짜 실패보다 좁은 게이트가 낫다:
 *  a) 계약 a11y.role 이 ARIA role 토큰이 아닌 경우 — 스키마상 자유 문자열이라 산문이 들어온다
 *     (StatusBadge.contract.json:52 는 role 필드에 한 문단을 담는다). "none" 도 대조 대상이 아니다.
 *  b) role={표현식} 이 하나라도 있는 경우 — 조건에 따라 그 role 이 될 수 있어 부재를 증명할 수 없다.
 *  c) <input type={표현식}> 이 있는 경우 — 같은 이유 (TextField 는 type 을 prop 으로 받는다).
 *  d) 계약이 없는 대문자 태그(로컬 헬퍼 컴포넌트 등)가 있는 경우 — 그 안을 볼 수 없다.
 *  e) 암묵 role 매핑이 논쟁적인 태그(<svg> 등)는 '확정 불가' 로 둔다.
 *
 * 합성(composition)은 (3)이 그대로 흡수한다 — ConfirmDialog→Modal("dialog"),
 * PasswordField→TextField("textbox"), SelectAllHeaderCell→TriStateCheckbox("checkbox"),
 * ListCard/StatsCard/TodoCard→Card("region").
 * ──────────────────────────────────────────────────────────────────────────── */

/** 대조 가능한 ARIA role 토큰 — 계약에 실제로 쓰인 값 + 흔한 랜드마크/위젯 role */
const KNOWN_ARIA_ROLES = new Set([
  'alert',
  'alertdialog',
  'article',
  'banner',
  'button',
  'checkbox',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'dialog',
  'figure',
  'form',
  'grid',
  'group',
  'heading',
  'img',
  'link',
  'list',
  'listbox',
  'listitem',
  'main',
  'menu',
  'menubar',
  'menuitem',
  'meter',
  'navigation',
  'option',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowheader',
  'search',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'textbox',
  'toolbar',
  'tooltip',
  'tree',
]);

/** 시맨틱 태그 → 암묵 role (정적으로 확정되는 것만) */
const IMPLICIT_TAG_ROLES: Record<string, string> = {
  a: 'link', // href 가 있을 때만 — 아래에서 별도 확인
  article: 'article',
  aside: 'complementary',
  button: 'button',
  dialog: 'dialog',
  fieldset: 'group',
  footer: 'contentinfo',
  form: 'form',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  header: 'banner',
  hr: 'separator',
  img: 'img',
  li: 'listitem',
  main: 'main',
  menu: 'list',
  meter: 'meter',
  nav: 'navigation',
  ol: 'list',
  option: 'option',
  output: 'status',
  progress: 'progressbar',
  search: 'search',
  section: 'region',
  select: 'combobox',
  table: 'table',
  td: 'cell',
  textarea: 'textbox',
  th: 'columnheader',
  tr: 'row',
  ul: 'list',
};

/**
 * 암묵 role 이 브라우저·AT 마다 갈리는 태그 — 대조하지 않는다 (제외 규칙 e).
 * <svg> 는 접근성 트리에서 graphics-document 로 노출되는 구현이 있어 "img" 와 단정 비교할 수 없다.
 */
const AMBIGUOUS_TAGS = new Set(['svg']);

/** <input type=...> → 암묵 role. 여기 없는 type(color·date·file 등)은 대응 role 이 없다 */
const IMPLICIT_INPUT_ROLES: Record<string, string> = {
  button: 'button',
  checkbox: 'checkbox',
  email: 'textbox',
  image: 'button',
  number: 'spinbutton',
  radio: 'radio',
  range: 'slider',
  reset: 'button',
  search: 'searchbox',
  submit: 'button',
  tel: 'textbox',
  text: 'textbox',
  url: 'textbox',
};

/** 계약 JSON 에서 a11y.role 문자열만 안전하게 꺼낸다 (Contract 타입에 없는 자유 필드) */
export function readContractRole(contract: unknown): string | undefined {
  if (typeof contract !== 'object' || contract === null) return undefined;
  const a11y = (contract as Record<string, unknown>).a11y;
  if (typeof a11y !== 'object' || a11y === null) return undefined;
  const role = (a11y as Record<string, unknown>).role;
  return typeof role === 'string' ? role : undefined;
}

/**
 * a11y.role 값이 대조 가능한 단일 ARIA role 토큰인지.
 * 산문("none — 비대화형 텍스트 배지…")·"none" 은 대조 대상이 아니다 (제외 규칙 a).
 */
export function toComparableRole(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const token = raw.trim();
  return KNOWN_ARIA_ROLES.has(token) ? token : undefined;
}

/**
 * 여는 태그 하나를 통째로 잘라낸다 — 따옴표와 중괄호 깊이를 세어 속성값 안의 '>' 를 건너뛴다.
 * `start` 는 '<' 의 위치. 닫히지 않으면 undefined.
 */
function sliceOpeningTag(source: string, start: number): string | undefined {
  let depth = 0;
  let quote = '';
  for (let i = start; i < source.length; i++) {
    const ch = source[i] ?? '';
    if (quote !== '') {
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '>' && depth === 0) return source.slice(start, i + 1);
  }
  return undefined;
}

/** 여는 태그에서 정적 문자열 속성값을 읽는다. 표현식(attr={...})이면 undefined */
function staticAttr(openingTag: string, attr: string): string | undefined {
  const m = openingTag.match(new RegExp(String.raw`\b${attr}\s*=\s*"([^"]*)"`));
  return m?.[1];
}

/** 여는 태그에 해당 속성이 (값 형태와 무관하게) 존재하는가 */
function hasAttr(openingTag: string, attr: string): boolean {
  return new RegExp(String.raw`\b${attr}\s*=`).test(openingTag);
}

/**
 * 주석을 걷어낸다 — 이 리포의 구현 파일은 머리말 주석이 길고 거기에 `<div>`·`role=` 같은
 * 표기가 산문으로 등장한다. 스캔 전에 지우지 않으면 주석이 마크업으로 읽힌다.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

/** 구현 파일이 그리는 엘리먼트 하나 — 태그명과 여는 태그 원문 */
export interface JsxElement {
  tag: string;
  openingTag: string;
}

/**
 * 소스에서 여는 JSX 태그를 전부 긁는다 (닫는 태그 `</x>` 와 Fragment `<>` 는 제외).
 *
 * 타입 인자(`Omit<FormFieldProps, …>` · `forwardRef<HTMLInputElement, …>`)를 태그로 오인하면
 * 계약 없는 대문자 태그가 되어 검사 전체가 SKIP 으로 새어나간다 — 실제로 DateRangeField·
 * FormField 가 그렇게 빠졌다. JSX 의 `<` 앞에는 식별자 문자가 올 수 없다는 점으로 가른다.
 */
export function scanJsxElements(source: string): JsxElement[] {
  const body = stripComments(source);
  const out: JsxElement[] = [];
  const tagRe = /<([A-Za-z][\w.]*)/g;
  for (const m of body.matchAll(tagRe)) {
    const prev = m.index === 0 ? '' : (body[m.index - 1] ?? '');
    if (/[\w$]/.test(prev)) continue; // 타입 인자 — JSX 가 아니다
    const opening = sliceOpeningTag(body, m.index);
    if (opening !== undefined) out.push({ tag: m[1] ?? '', openingTag: opening });
  }
  return out;
}

export type RoleResolution =
  | { kind: 'role'; role: string; via: string }
  /** 이 엘리먼트에는 role 이 없다 — 부재가 확정됐다 */
  | { kind: 'none' }
  /** 정적으로는 role 을 확정할 수 없다 — 이 엘리먼트가 있으면 대조 자체를 보류한다 */
  | { kind: 'unknown'; via: string };

/**
 * 엘리먼트 하나의 실효 role — 명시 role 속성 > 태그(+input type)의 암묵 role.
 * 대문자 태그(DS 컴포넌트)는 여기서 다루지 않는다 — 자기 계약으로 따로 푼다.
 */
export function resolveElementRole(el: JsxElement): RoleResolution {
  if (hasAttr(el.openingTag, 'role')) {
    const explicit = staticAttr(el.openingTag, 'role');
    // role={표현식} 은 조건에 따라 달라진다 — 부재를 증명할 수 없다 (제외 규칙 b)
    if (explicit === undefined) return { kind: 'unknown', via: `<${el.tag} role={표현식}>` };
    return { kind: 'role', role: explicit, via: `<${el.tag} role="${explicit}">` };
  }

  if (el.tag === 'input') {
    if (!hasAttr(el.openingTag, 'type')) return { kind: 'role', role: 'textbox', via: '<input>' };
    const type = staticAttr(el.openingTag, 'type');
    // 제외 규칙 c — TextField 는 type 을 prop 으로 받는다
    if (type === undefined) return { kind: 'unknown', via: '<input type={표현식}>' };
    const mapped = IMPLICIT_INPUT_ROLES[type];
    // 매핑에 없는 type(color·date·file·password 등)은 대응 ARIA role 이 없다 — 부재 확정
    return mapped === undefined
      ? { kind: 'none' }
      : { kind: 'role', role: mapped, via: `<input type="${type}">` };
  }
  // <a> 는 href 가 있을 때만 link 다
  if (el.tag === 'a') {
    return hasAttr(el.openingTag, 'href')
      ? { kind: 'role', role: 'link', via: '<a href>' }
      : { kind: 'none' };
  }
  // 암묵 role 매핑이 브라우저/AT 마다 갈리는 태그는 확정하지 않는다 (제외 규칙 e)
  if (AMBIGUOUS_TAGS.has(el.tag)) return { kind: 'unknown', via: `<${el.tag}> 암묵 role 논쟁적` };

  const implicit = IMPLICIT_TAG_ROLES[el.tag];
  return implicit === undefined
    ? { kind: 'none' }
    : { kind: 'role', role: implicit, via: `<${el.tag}>` };
}

/** 해당 이름의 계약 파일이 있는가 — SKIP 사유를 '계약 없음' 과 '계약 role 이 대조 불가' 로 가른다 */
function hasContract(root: string, componentName: string): boolean {
  return fs.existsSync(path.join(root, 'contracts', `${componentName}.contract.json`));
}

/** 다른 계약의 a11y.role 을 읽는다 — 조립된 DS 자식의 role 을 되짚는 데 쓴다 */
function contractRoleOf(root: string, componentName: string): string | undefined {
  const abs = path.join(root, 'contracts', `${componentName}.contract.json`);
  if (!hasContract(root, componentName)) return undefined;
  try {
    return toComparableRole(readContractRole(readJson<unknown>(abs)));
  } catch {
    return undefined;
  }
}

export function checkReactAxis(ctx: AxisContext): AxisResult {
  const { contract, ui } = ctx;
  const name = contract.name;
  const checks: Check[] = [];

  const typesRel = `generated/types/${name}.types.ts`;
  const typesAbs = path.join(ui.base, ...typesRel.split('/'));
  const typesExists = fs.existsSync(typesAbs);

  const implRels = ui.files.filter(
    (r) => r.startsWith('src/') && posixBasename(r) === `${name}.tsx`,
  );

  // 구현 산출물이 전혀 없으면 축 SKIP (계약만 존재)
  if (!typesExists && implRels.length === 0) {
    checks.push({
      id: 'react.not-implemented',
      title: 'React 구현 존재 여부',
      status: 'SKIP',
      detail: `packages/ui/${typesRel} 및 packages/ui/src/**/${name}.tsx 미존재 — 계약만 있는 부트스트랩 단계`,
    });
    return { axis: 'react', title: 'Contract ↔ React', status: 'SKIP', checks };
  }

  // 1) generated 타입 파일 존재
  if (typesExists) {
    checks.push({
      id: 'react.types-exist',
      title: 'generated 타입 파일 존재',
      status: 'PASS',
      detail: `packages/ui/${typesRel}`,
    });
  } else {
    checks.push({
      id: 'react.types-exist',
      title: 'generated 타입 파일 존재',
      status: 'FAIL',
      detail: `구현 파일은 있으나 packages/ui/${typesRel} 이 없음 — pnpm codegen 실행 필요`,
    });
  }

  // 2) 세대 일치 — 타입 파일 내 계약 버전 주석 비교
  if (typesExists) {
    const content = readText(typesAbs);
    const m = content.match(VERSION_COMMENT_RE);
    const found = m?.[1];
    if (!found) {
      checks.push({
        id: 'react.types-generation',
        title: '생성 타입 세대(계약 버전) 일치',
        status: 'FAIL',
        detail: `버전 주석을 찾을 수 없어 세대 판별 불가 — codegen 헤더에 "contracts/${name}.contract.json@${contract.version}" 표기 필요`,
      });
    } else if (found !== contract.version) {
      checks.push({
        id: 'react.types-generation',
        title: '생성 타입 세대(계약 버전) 일치',
        status: 'FAIL',
        detail: `세대 불일치 — 계약 ${contract.version} vs 생성물 ${found}. pnpm codegen 재실행 필요`,
      });
    } else {
      checks.push({
        id: 'react.types-generation',
        title: '생성 타입 세대(계약 버전) 일치',
        status: 'PASS',
        detail: `계약/생성물 모두 ${contract.version}`,
      });
    }
  } else {
    checks.push({
      id: 'react.types-generation',
      title: '생성 타입 세대(계약 버전) 일치',
      status: 'SKIP',
      detail: '타입 파일이 없어 비교 불가',
    });
  }

  // 3) 구현 파일이 generated 타입을 import 하는지
  if (implRels.length === 0) {
    checks.push({
      id: 'react.impl-imports-generated',
      title: '구현이 generated 타입을 import',
      status: 'SKIP',
      detail: `packages/ui/src/**/${name}.tsx 없음 — codegen 산출물만 존재`,
    });
  } else {
    const importRe = new RegExp(
      String.raw`from\s+['"][^'"]*generated\/(?:types\/)?${name}(?:\.types)?(?:\.js|\.ts)?['"]`,
    );
    const missing = implRels.filter(
      (r) => !importRe.test(readText(path.join(ui.base, ...r.split('/')))),
    );
    if (missing.length === 0) {
      checks.push({
        id: 'react.impl-imports-generated',
        title: '구현이 generated 타입을 import',
        status: 'PASS',
        detail: implRels.map((r) => `packages/ui/${r}`).join(', '),
      });
    } else {
      checks.push({
        id: 'react.impl-imports-generated',
        title: '구현이 generated 타입을 import',
        status: 'FAIL',
        detail: `generated/types/${name}.types import 미검출: ${missing
          .map((r) => `packages/ui/${r}`)
          .join(', ')} — 수동 타입 선언 금지 (G6 체크리스트)`,
      });
    }
  }

  // 4) 계약 a11y.role 이 구현 트리에서 실현되는지 대조
  checks.push(checkDeclaredRole(ctx, implRels));

  return {
    axis: 'react',
    title: 'Contract ↔ React',
    status: summarizeStatuses(checks.map((c) => c.status)),
    checks,
  };
}

/**
 * 계약 a11y.role 이 구현 트리 안에서 실현되는지 본다.
 * 정적으로 확정 못 하는 요소가 하나라도 있으면 FAIL 이 아니라 SKIP — 가짜 실패 금지가 우선이다.
 */
function checkDeclaredRole(ctx: AxisContext, implRels: string[]): Check {
  const { root, contract, ui } = ctx;
  const name = contract.name;
  const id = 'react.a11y-role';
  const title = '계약 a11y.role 이 구현에 실현됨';

  const raw = readContractRole(contract);
  const expected = toComparableRole(raw);
  if (expected === undefined) {
    const shown = raw === undefined ? '' : `: "${raw.slice(0, 40)}${raw.length > 40 ? '…' : ''}"`;
    return {
      id,
      title,
      status: 'SKIP',
      detail:
        raw === undefined
          ? '계약에 a11y.role 없음 — 대조 대상 아님'
          : `a11y.role 이 단일 ARIA role 토큰이 아님(산문/none) — 대조 대상 아님${shown}`,
    };
  }

  if (implRels.length !== 1) {
    return {
      id,
      title,
      status: 'SKIP',
      detail: `packages/ui/src/**/${name}.tsx 가 ${String(implRels.length)}개 — 구현 트리 특정 불가`,
    };
  }
  const rel = implRels[0] ?? '';
  const elements = scanJsxElements(readText(path.join(ui.base, ...rel.split('/'))));
  if (elements.length === 0) {
    return {
      id,
      title,
      status: 'SKIP',
      detail: `packages/ui/${rel} 에서 JSX 를 찾지 못함 — 대조 보류`,
    };
  }

  const unresolved: string[] = [];
  for (const el of elements) {
    // 대문자 태그 = 조립된 DS 컴포넌트. role 은 그 컴포넌트의 계약이 소유한다 (합성 상속)
    if (/^[A-Z]/.test(el.tag)) {
      const childRole = contractRoleOf(root, el.tag);
      if (childRole === expected) {
        return {
          id,
          title,
          status: 'PASS',
          detail: `"${expected}" — <${el.tag}> 합성 (contracts/${el.tag}.contract.json 의 a11y.role)`,
        };
      }
      // 계약이 없는 대문자 태그는 안을 볼 수 없다 (제외 규칙 d)
      if (childRole === undefined) {
        const known = hasContract(root, el.tag);
        unresolved.push(`<${el.tag}> ${known ? '계약 role 이 대조 불가(산문/none)' : '계약 없음'}`);
      }
      continue;
    }
    const resolved = resolveElementRole(el);
    if (resolved.kind === 'role' && resolved.role === expected) {
      return {
        id,
        title,
        status: 'PASS',
        detail: `"${expected}" — ${resolved.via} (packages/ui/${rel})`,
      };
    }
    if (resolved.kind === 'unknown') unresolved.push(resolved.via);
  }

  if (unresolved.length > 0) {
    return {
      id,
      title,
      status: 'SKIP',
      detail: `role="${expected}" 부재를 정적으로 증명할 수 없음 — ${[...new Set(unresolved)].join(' · ')} (packages/ui/${rel})`,
    };
  }
  return {
    id,
    title,
    status: 'FAIL',
    detail: `계약 a11y.role="${expected}" 인데 packages/ui/${rel} 어디에도 그 role 이 없음 — 명시 role 속성·시맨틱 태그의 암묵 role·조립된 DS 자식 계약 어느 쪽으로도 실현되지 않음 (계약이 틀렸다면 계약을 고친다: contracts/${name}.contract.json)`,
  };
}
