/**
 * 계약 하나 → 실제 Component / Component Set 조립 — **어댑터 계층**.
 *
 * main.ts 에서 떼어 낸 이유는 하나다: 여기를 **테스트가 직접 부를 수 있어야** 하기 때문이다.
 * main.ts 는 모듈 최상단에서 figma.showUI 를 부르므로 import 하는 순간 UI 가 뜬다 —
 * 그래서 조립 로직이 main.ts 안에 있는 동안에는 어떤 테스트도 이 경로를 실행할 수 없었고,
 * 폰트 크래시·layoutGrow 미적용·빈 텍스트·변형 미전환이 전부 그 구멍으로 빠져나갔다.
 *
 * 판단(부위·오토레이아웃·정렬·바인딩)은 여전히 순수 계층(src/spec/**)이 한다.
 * 여기서는 그 결정을 Figma 객체로 옮기기만 한다.
 */
import {
  buildComponentSetSpec,
  type ComponentFigmaSpec,
  type FigmaPropSpec,
} from '../spec/component-spec';
import { attachPropRefs, renderNodeSpec, type RenderContext } from './apply';
import type { LoadedFonts } from './fonts';
import { selfValidateComponent, type CheckFailure } from './self-check';

/** 오토레이아웃 격자의 기본 단위 — 컴포넌트 사이 여백 계산에만 쓴다 */
export const GRID_UNIT = 24;
export const SWAP_PLACEHOLDER_NAME = '↔ Swap Placeholder';

export function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * INSTANCE_SWAP 슬롯의 기본값이자, anatomy 의 slot 자리에 놓을 인스턴스의 원본.
 * Figma 는 INSTANCE_SWAP 기본값으로 **실제 컴포넌트 id** 를 요구하고(빈 문자열은 throw),
 * 그 속성은 InstanceNode 에만 붙일 수 있다 — 그래서 공용 플레이스홀더를 하나 만들어 재사용한다.
 */
export function ensureSwapPlaceholder(page: PageNode): ComponentNode {
  const found = figma.root.findOne(
    (n) => n.type === 'COMPONENT' && n.name === SWAP_PLACEHOLDER_NAME,
  );
  if (found && found.type === 'COMPONENT') return found;
  const comp = figma.createComponent();
  comp.name = SWAP_PLACEHOLDER_NAME;
  comp.resize(GRID_UNIT, GRID_UNIT);
  // 오프캔버스로 밀어 실제 컴포넌트/스캔과 겹치지 않게 한다(슬롯 기본값 전용 더미)
  comp.x = -2000;
  comp.y = -2000;
  page.appendChild(comp);
  return comp;
}

/**
 * 계약 slot 의 accepts(['Icon'] 등)를 INSTANCE_SWAP 의 preferredValues 로 옮긴다 —
 * 디자이너가 스왑 목록에서 **DS 컴포넌트만** 고르게 하는 큐레이션이다.
 *
 * [published 제약] preferredValues 는 node.id 가 아니라 **key** 를 받고, key 는
 * "이미 published 된 것만 import 할 수 있다"(plugin-api.d.ts:8948). 라이브러리를
 * 퍼블리시하기 전에는 Figma UI 의 스왑 목록이 비어 보일 수 있다 — 수동 스왑은 그래도 된다.
 */
function preferredValuesFor(accepts: readonly string[]): InstanceSwapPreferredValue[] {
  const out: InstanceSwapPreferredValue[] = [];
  for (const name of accepts) {
    const set = figma.root.findOne((n) => n.type === 'COMPONENT_SET' && n.name === name);
    if (set && set.type === 'COMPONENT_SET') {
      out.push({ type: 'COMPONENT_SET', key: set.key });
      continue;
    }
    const comp = figma.root.findOne(
      (n) => n.type === 'COMPONENT' && n.name === name && n.parent?.type !== 'COMPONENT_SET',
    );
    if (comp && comp.type === 'COMPONENT') out.push({ type: 'COMPONENT', key: comp.key });
  }
  return out;
}

/**
 * **후처리** — 모든 컴포넌트를 조립한 뒤, INSTANCE_SWAP 슬롯에 preferredValues 를 건다.
 * 조립 도중에는 걸 수 없다(accepts 대상이 아직 없을 수 있다). 여기서는 파일에 전부 존재한다.
 */
export function applySwapPreferredValues(
  specs: readonly ComponentFigmaSpec[],
  log: string[],
): void {
  let curated = 0;
  let skipped = 0;
  for (const spec of specs) {
    const accepts = new Map<string, string[]>();
    for (const p of spec.properties ?? []) {
      if (p.type === 'INSTANCE_SWAP' && Array.isArray(p.accepts) && p.accepts.length > 0) {
        accepts.set(p.name, p.accepts);
      }
    }
    if (accepts.size === 0) continue;

    const target =
      figma.root.findOne((n) => n.type === 'COMPONENT_SET' && n.name === spec.name) ??
      figma.root.findOne(
        (n) => n.type === 'COMPONENT' && n.name === spec.name && n.parent?.type !== 'COMPONENT_SET',
      );
    if (!target || (target.type !== 'COMPONENT_SET' && target.type !== 'COMPONENT')) continue;

    for (const [propName, acceptNames] of accepts) {
      // 'Icon Left#12:3' 처럼 접미가 붙은 정식 키를 찾는다
      const keyed = Object.keys(target.componentPropertyDefinitions).find(
        (k) => k === propName || k.indexOf(`${propName}#`) === 0,
      );
      if (keyed === undefined) continue;
      const preferred = preferredValuesFor(acceptNames);
      if (preferred.length === 0) {
        skipped += 1;
        log.push(
          `[스왑 큐레이션 없음] ${spec.name}.${propName}: accepts ${acceptNames.join('·')} 를 파일에서 찾지 못했다 — 수동 스왑은 그대로 동작한다`,
        );
        continue;
      }
      try {
        target.editComponentProperty(keyed, { preferredValues: preferred });
        curated += 1;
      } catch (error) {
        skipped += 1;
        log.push(`[스왑 큐레이션 실패] ${spec.name}.${propName}: ${errMsg(error)}`);
      }
    }
  }
  log.push(
    `스왑 큐레이션(preferredValues) — 적용 ${String(curated)} · 미적용 ${String(skipped)}. ` +
      `key 는 로컬 컴포넌트에도 존재하지만 **퍼블리시된 것만 import 된다**(plugin-api.d.ts:8948) — ` +
      `라이브러리 퍼블리시 전에는 Figma 스왑 목록이 비어 보일 수 있고, 그때도 수동 스왑은 된다.`,
  );
}

/**
 * 계약의 BOOLEAN/TEXT/INSTANCE_SWAP 속성을 Component(Set)에 부여하고 **반환 키를 모은다**.
 * 반환 키('Children#0:1')를 레이어의 componentPropertyReferences 에 넣어야 실제로 연결된다.
 *
 * [TEXT 기본값] 계약의 default 가 비어 있으면 anatomy 표본 문구(specimenOf)를 기본값으로 쓴다.
 * Figma 는 TEXT 속성이 걸린 레이어의 characters 를 **속성값으로 덮어쓴다** — 빈 기본값을 그대로
 * 넣으면 레이어에 무슨 글자를 써 놨든 화면에서는 빈 칸이 된다(= 라벨 없는 파란 버튼).
 */
export function addContractProperties(
  target: ComponentNode | ComponentSetNode,
  props: readonly FigmaPropSpec[],
  placeholder: ComponentNode,
  specimenOf: ReadonlyMap<string, string>,
  boundProps: ReadonlySet<string>,
  log: string[],
): Map<string, string> {
  const keys = new Map<string, string>();
  for (const p of props) {
    try {
      if (p.type === 'BOOLEAN') {
        keys.set(
          p.name,
          target.addComponentProperty(
            p.name,
            'BOOLEAN',
            p.default === true || p.default === 'true',
          ),
        );
      } else if (p.type === 'TEXT') {
        const declared = typeof p.default === 'string' ? p.default : '';
        const fallback = specimenOf.get(p.name) ?? '';
        const value = declared.length > 0 ? declared : fallback;
        // 레이어에 걸리지 않는 코드 전용 속성(Id·Src·Href…)은 비어도 무해하다 —
        // 화면에 나타나는 자리가 없기 때문이다. 실제로 레이어가 참조하는데 표본이 없을 때만 알린다.
        if (value.length === 0 && boundProps.has(p.name)) {
          log.push(
            `[TEXT 표본 없음] ${target.name}.${p.name}: 계약 default 도 anatomy text 도 비어 있어 빈 레이어로 남는다`,
          );
        }
        keys.set(p.name, target.addComponentProperty(p.name, 'TEXT', value));
      } else if (p.type === 'INSTANCE_SWAP') {
        // 기본값은 실제 컴포넌트 id 여야 한다(빈 문자열은 throw) — 플레이스홀더를 쓴다.
        keys.set(p.name, target.addComponentProperty(p.name, 'INSTANCE_SWAP', placeholder.id));
      }
    } catch (error) {
      log.push(`[속성 실패] ${target.name}.${p.name} (${p.type}): ${errMsg(error)}`);
    }
  }
  return keys;
}

/**
 * 계약 하나를 **실제 Component / Component Set** 으로 만든다.
 * 재실행 결정론을 위해 기존 동명 셋/컴포넌트는 지우고 새로 만든다.
 */
export function buildComponent(
  raw: ComponentFigmaSpec,
  page: PageNode,
  vars: Map<string, Variable>,
  font: FontName | null,
  log: string[],
  failures?: CheckFailure[],
  tokenValues?: ReadonlyMap<string, string | number | boolean>,
  /** 이 실행에서 로드된 폰트 전체 — 주면 굵기 토큰대로 스타일을 고른다(타이포 배관) */
  fonts?: LoadedFonts,
): SceneNode | null {
  // 기존 동명 셋/단일 컴포넌트 제거(플레이스홀더는 이름이 달라 안전)
  for (const set of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] })) {
    if (set.name === raw.name) set.remove();
  }
  const dupe = figma.root.findOne(
    (n) => n.type === 'COMPONENT' && n.name === raw.name && n.parent?.type !== 'COMPONENT_SET',
  );
  if (dupe) dupe.remove();

  const varNames = new Set(vars.keys());
  const setSpec = buildComponentSetSpec(raw, varNames, tokenValues);
  const placeholder = ensureSwapPlaceholder(page);
  const ctx: RenderContext = {
    vars,
    font,
    swapPlaceholder: placeholder,
    log,
    ...(fonts !== undefined ? { fonts } : {}),
  };

  // 변형마다 ComponentNode 를 만들고 그 자체를 루트 프레임으로 써서 트리를 그린다
  const built: Array<{ node: ComponentNode; spec: (typeof setSpec.variants)[number] }> = [];
  for (const variant of setSpec.variants) {
    const comp = figma.createComponent();
    renderNodeSpec(variant.node, ctx, comp);
    comp.name = variant.name;
    built.push({ node: comp, spec: variant });
  }

  let target: ComponentNode | ComponentSetNode;
  const first = built[0];
  if (!first) return null;
  if (built.length === 1) {
    first.node.name = raw.name;
    page.appendChild(first.node);
    target = first.node;
  } else {
    // combineAsVariants 는 자동 배치를 하지 않는다 — 좌표를 안 주면 전부 (0,0)에 겹치고
    // defaultVariant(=공간상 좌상단)도 불확정해진다. 기본 조합을 맨 앞(x=0)에 두고 한 줄로 펼친다.
    let x = 0;
    for (const item of built) {
      item.node.x = x;
      item.node.y = 0;
      x += item.node.width + GRID_UNIT;
    }
    target = figma.combineAsVariants(
      built.map((item) => item.node),
      page,
    );
    target.name = raw.name;
  }

  const keys = addContractProperties(
    target,
    setSpec.properties,
    placeholder,
    setSpec.textSpecimens,
    setSpec.textBoundProps,
    log,
  );
  // 속성 참조는 **모든 변형**에 걸어야 경고가 사라진다(기본 변형만으론 부족하다)
  let refs = 0;
  for (const item of built) refs += attachPropRefs(item.node, item.spec.node, keys, log);

  log.push(
    `계약 컴포넌트: ${raw.name} — anatomy ${setSpec.anatomySource === 'contract' ? '계약 선언' : '토큰 파생'} · 변형 ${String(
      setSpec.variants.length,
    )}(${setSpec.axes.map((a) => a.name).join('×') || '없음'}) · 속성 ${String(keys.size)} · 바인딩 ${String(
      setSpec.bindings.length,
    )} · 레이어연결 ${String(refs)}`,
  );
  if (setSpec.unbound.length > 0) {
    const seen = new Set<string>();
    for (const gap of setSpec.unbound) {
      const key = `${gap.field}/${gap.tokenKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      log.push(`  [바인딩 불가] ${raw.name}.${gap.field} (${gap.tokenKey}): ${gap.reason}`);
    }
  }
  // **자기 검사** — 목이 아니라 실제 런타임에서 자기 산출물을 읽어 대조한다.
  // 여기서 걸린 항목이 검증 페이지에 그대로 실린다.
  if (failures !== undefined) selfValidateComponent(target, setSpec, failures);

  return target;
}
