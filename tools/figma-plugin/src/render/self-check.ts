/**
 * 플러그인 자기 검사 — **실제 Figma 런타임에서** 자기가 만든 트리를 순회하며 검사한다.
 *
 * 목(figma-mock.ts)은 실제 API 의 근사일 뿐이라 언제든 어긋날 수 있다. 이 모듈은 플러그인이
 * 피그마 **안에서** 돌면서 자기 산출물을 직접 읽으므로 최종 심판이다 — 목이 초록인데 피그마에서
 * 비어 있는 상태(이번 세션에 두 번 일어났다)를 여기서 잡는다.
 *
 * 순수 계층이 "무엇을 그리기로 했는가"(NodeSpec)를 알고 있으므로, 그 선언과 실제 노드를 1:1로
 * 대조한다. 컴포넌트별 분기는 없다 — 대조 규칙은 계약에서 파생된 spec 하나뿐이다.
 */
import type { ComponentSetSpec } from '../spec/component-spec';
import type { NodeSpec } from '../spec/node-spec';

/** 검사 실패 한 건 — [컴포넌트 / 검사 항목 / 실패 사유] */
export interface CheckFailure {
  component: string;
  /** 검사 항목 — '텍스트'·'변형'·'레이아웃'·'토큰'·'슬롯' */
  check: string;
  /** 문제가 난 레이어 이름 */
  node: string;
  reason: string;
}

/** 노드가 자식을 갖는지 (구조적 검사 — 유니언 내로잉 대신) */
function childrenOf(node: SceneNode): readonly SceneNode[] {
  const holder = node as SceneNode & { children?: readonly SceneNode[] };
  return Array.isArray(holder.children) ? holder.children : [];
}

function boundVariablesOf(node: SceneNode): Readonly<Record<string, unknown>> {
  const holder = node as SceneNode & { boundVariables?: Readonly<Record<string, unknown>> };
  return holder.boundVariables ?? {};
}

/** 페인트 배열에 Variable 바인딩이 하나라도 있는가 */
function paintsBound(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.some((paint) => {
    if (typeof paint !== 'object' || paint === null) return false;
    const bound = (paint as { boundVariables?: { color?: unknown } }).boundVariables;
    return bound !== undefined && bound.color !== undefined;
  });
}

/**
 * NodeSpec 선언과 실제 노드를 대조한다.
 * spec 트리와 node 트리는 renderNodeSpec 이 1:1 순서로 만들었으므로 위치로 짝지을 수 있다.
 */
function checkNodeTree(
  spec: NodeSpec,
  node: SceneNode,
  component: string,
  parentLayout: NodeSpec['layout'],
  out: CheckFailure[],
): void {
  const fail = (check: string, reason: string): void => {
    out.push({ component, check, node: spec.name, reason });
  };

  // --- 텍스트: 비어 있지 않고, 폰트가 단일(로드된) 폰트여야 한다 ---
  if (spec.kind === 'text') {
    if (node.type !== 'TEXT') {
      fail('텍스트', `text 부위가 ${node.type} 로 만들어졌다`);
    } else {
      if (node.characters.length === 0) {
        fail('텍스트', 'characters 가 비어 있다 — 피그마에서 글자 없이 보인다');
      }
      if (node.fontName === figma.mixed) {
        fail('텍스트', 'fontName 이 mixed 다 — 폰트 로드가 부분적으로 실패했다');
      }
    }
  }

  // --- 슬롯: INSTANCE_SWAP 은 InstanceNode 에만 붙는다 ---
  if (spec.kind === 'instance' && node.type !== 'INSTANCE') {
    fail('슬롯', `slot 부위가 ${node.type} 로 폴백됐다 — INSTANCE_SWAP 속성이 붙지 못한다`);
  }

  // --- 컨테이너: 오토레이아웃이 실제로 걸렸는가 ---
  if (spec.layout !== 'NONE') {
    const frame = node as SceneNode & { layoutMode?: string };
    if (frame.layoutMode !== spec.layout) {
      fail(
        '레이아웃',
        `layoutMode 가 '${String(frame.layoutMode)}' — '${spec.layout}' 이어야 한다`,
      );
    }
  }

  // --- 채움: grow 선언이 실제로 적용됐는가 (append 순서 문제가 여기서 드러난다) ---
  if (spec.grow === true && parentLayout !== 'NONE') {
    const axis = parentLayout === 'HORIZONTAL' ? 'layoutSizingHorizontal' : 'layoutSizingVertical';
    const sizing = (node as SceneNode & Record<string, unknown>)[axis];
    const grow = (node as SceneNode & { layoutGrow?: number }).layoutGrow;
    if (sizing !== 'FILL' && grow !== 1) {
      fail(
        '레이아웃',
        `grow 선언이 적용되지 않았다 (${axis}=${String(sizing)}, layoutGrow=${String(grow)})`,
      );
    }
  }

  // --- 토큰: 계약이 토큰을 건 자리는 전부 Variable 바인딩이어야 한다 (하드코딩이면 실패) ---
  const bound = boundVariablesOf(node);
  for (const binding of spec.bindings) {
    if (binding.field === 'fills' || binding.field === 'strokes') {
      const paints = (node as SceneNode & Record<string, unknown>)[binding.field];
      if (!paintsBound(paints)) {
        fail('토큰', `${binding.field} 가 ${binding.variable} 에 바인딩되지 않았다 (하드코딩 값)`);
      }
    } else if (bound[binding.field] === undefined) {
      fail('토큰', `${binding.field} 가 ${binding.variable} 에 바인딩되지 않았다 (하드코딩 값)`);
    }
  }

  const kids = childrenOf(node);
  for (let i = 0; i < spec.children.length; i += 1) {
    const childSpec = spec.children[i];
    const childNode = kids[i];
    if (childSpec === undefined) continue;
    if (childNode === undefined) {
      out.push({
        component,
        check: '구조',
        node: childSpec.name,
        reason: '선언된 부위가 트리에 없다 — 조립 도중 유실됐다',
      });
      continue;
    }
    checkNodeTree(childSpec, childNode, component, spec.layout, out);
  }
}

/**
 * 조립된 Component / ComponentSet 하나를 검사한다.
 * 변형 세트면 **모든 변형**을 각자의 선언과 대조한다 — variant 미전환이 여기서 드러난다.
 */
export function selfValidateComponent(
  target: SceneNode,
  spec: ComponentSetSpec,
  out: CheckFailure[],
): void {
  const name = spec.name;

  if (target.type === 'COMPONENT_SET') {
    const variants = target.children.filter(
      (child): child is ComponentNode => child.type === 'COMPONENT',
    );
    // 선언한 조합이 전부 존재하는가
    const actualNames = new Set(variants.map((v) => v.name));
    for (const declared of spec.variants) {
      if (!actualNames.has(declared.name)) {
        out.push({
          component: name,
          check: '변형',
          node: declared.name,
          reason: '선언된 변형 조합이 만들어지지 않았다',
        });
      }
    }
    for (const variant of variants) {
      const declared = spec.variants.find((v) => v.name === variant.name);
      if (declared === undefined) continue;
      // variant 가 실제로 전환됐는가 — 이름만 맞고 속성이 비면 Figma 가 변형으로 인식하지 않는다
      const props = variant.variantProperties;
      if (props === null) {
        out.push({
          component: name,
          check: '변형',
          node: variant.name,
          reason: 'variantProperties 가 null — 변형으로 전환되지 않았다',
        });
      } else {
        for (const [axis, value] of Object.entries(declared.values)) {
          if (props[axis] !== value) {
            out.push({
              component: name,
              check: '변형',
              node: variant.name,
              reason: `${axis} 가 '${String(props[axis])}' — '${value}' 여야 한다`,
            });
          }
        }
      }
      checkNodeTree(declared.node, variant, name, 'NONE', out);
    }
    return;
  }

  const only = spec.variants[0];
  if (only !== undefined) checkNodeTree(only.node, target, name, 'NONE', out);
}

/** 실패 목록을 사람이 읽는 줄로 편다 */
export function formatFailures(failures: readonly CheckFailure[]): string[] {
  return failures.map((f) => `[${f.check}] ${f.component} › ${f.node}: ${f.reason}`);
}
