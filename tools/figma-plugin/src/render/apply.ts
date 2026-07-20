/**
 * NodeSpec → Figma 노드 어댑터 — **얇은 계층**.
 *
 * 여기에는 레이아웃 판단이 없다. 순수 계층(src/spec/**)이 이미 결정한 트리를 따라 걸으며
 * createFrame/createText/createEllipse/createLine 을 부르고 바인딩을 옮길 뿐이다.
 * 판단을 여기로 끌어오면 vitest 로 검증할 수 없게 된다 — 그것이 이 분리의 이유다.
 */
import type { NodeSpec, VarBinding } from '../spec/node-spec';
import { fontForWeight, type LoadedFonts } from './fonts';

export interface RenderContext {
  /** Variable 이름 → Variable (파일에 실존하는 것만) */
  vars: Map<string, Variable>;
  /**
   * 텍스트 노드에 쓸 기본 폰트 — 호출 전에 loadFontAsync 로 **성공한** 것만 넘긴다.
   * null 이면 폰트를 하나도 못 얻은 상태이므로 fontName 을 건드리지 않고 문서 기본값에 맡긴다.
   */
  font: FontName | null;
  /**
   * 이 실행에서 **로드에 성공한 폰트 전체**. 주면 굵기 토큰이 걸린 텍스트에 맞는 스타일을
   * 골라 쓴다(fontForWeight). 없으면 모든 텍스트가 font 하나로 태어난다 — 예전 동작이며,
   * 그 결과 타이포 토큰이 500 이상을 말하는 84개 레이어가 전부 Regular 로 보였다.
   */
  fonts?: LoadedFonts;
  /**
   * INSTANCE_SWAP 슬롯 자리에 놓을 기본 인스턴스의 원본 컴포넌트.
   * Figma 는 INSTANCE_SWAP 속성을 InstanceNode 에만 허용하므로 슬롯은 반드시 인스턴스여야 한다.
   */
  swapPlaceholder: ComponentNode | null;
  /** 진행 로그 — 바인딩 실패 등 */
  log: string[];
}

/** 페인트 바인딩 — setBoundVariableForPaint 는 **복사본**을 돌려주므로 다시 대입해야 한다 */
function boundPaint(variable: Variable): SolidPaint {
  const placeholder: SolidPaint = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  return figma.variables.setBoundVariableForPaint(placeholder, 'color', variable);
}

function applyBindings(
  node: SceneNode,
  bindings: readonly VarBinding[],
  ctx: RenderContext,
): number {
  let applied = 0;
  for (const binding of bindings) {
    const variable = ctx.vars.get(binding.variable);
    if (!variable) {
      ctx.log.push(`[Variable 없음] ${node.name}.${binding.field} → ${binding.variable}`);
      continue;
    }
    try {
      if (binding.field === 'fills' || binding.field === 'strokes') {
        const paint = boundPaint(variable);
        if (binding.field === 'fills') (node as GeometryMixin).fills = [paint];
        else (node as GeometryMixin).strokes = [paint];
      } else {
        (
          node as unknown as {
            setBoundVariable(field: string, value: Variable): void;
          }
        ).setBoundVariable(binding.field, variable);
      }
      applied += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.log.push(`[바인딩 실패] ${node.name}.${binding.field} (${binding.variable}): ${message}`);
    }
  }
  return applied;
}

function createBase(spec: NodeSpec, ctx: RenderContext): SceneNode {
  switch (spec.kind) {
    case 'text': {
      const node = figma.createText();
      // [조용히 넘어가지 않는다] 예전에는 이 자리를 try/catch 로 감싸 실패하면 로그 한 줄만 남기고
      // **빈 텍스트 레이어를 그대로 반환**했다. 그 결과 사용자는 라벨 없는 파란 버튼으로 이루어진
      // 라이브러리를 통째로 받아 보고서야 결함을 알았다. 빈 레이어를 조용히 남기는 것보다
      // 시끄럽게 실패하는 편이 낫다 — 여기서 던지면 buildComponent 가 그 계약 하나를 실패로 집계하고
      // 리포트에 남긴다(나머지 계약은 계속 조립된다).
      // 굵기는 `fontWeight` 필드가 아니라 **fontName.style** 이 정한다. 순수 계층이 넘긴
      // 해석 굵기로 **로드된** 스타일을 고른다 — 미로드 폰트를 지정하면 그 자리에서 터지므로
      // fontForWeight 는 로드된 것만 돌려주고, 없으면 기본 폰트로 물러선다.
      const weighted =
        spec.fontWeight !== undefined && ctx.fonts !== undefined
          ? fontForWeight(ctx.fonts, spec.fontWeight)
          : ctx.font;
      if (weighted !== null) node.fontName = weighted;
      node.characters = spec.characters ?? spec.name;
      return node;
    }
    case 'instance': {
      // 슬롯 자리 — 플레이스홀더가 없으면(토큰 동기화 실패 등) 빈 프레임으로 안전 폴백한다.
      // 다만 플레이스홀더가 **있는데도** 인스턴스를 못 만드는 것은 결함이다: 프레임으로 물러서면
      // INSTANCE_SWAP 속성이 붙지 못해(Figma 는 InstanceNode 에만 허용) 슬롯이 조용히 사라진다.
      if (ctx.swapPlaceholder === null) {
        ctx.log.push(`[슬롯 플레이스홀더 없음] ${spec.name}: 빈 프레임으로 대체합니다`);
        return figma.createFrame();
      }
      return ctx.swapPlaceholder.createInstance();
    }
    case 'vector': {
      // **진짜 벡터 노드**를 만든다 — 래스터가 아니다. 디자이너가 패스를 선택·편집할 수 있다.
      //
      // [왜 createNodeFromSvg 인가] 대안은 VectorNode 를 만들고 vectorPaths 에 path 데이터를
      // 직접 넣는 것인데, 그 경로는 <rect>/<circle> 같은 도형 프리미티브를 내가 손으로 패스로
      // 변환해야 하고 winding rule 까지 맞춰야 한다. 실제 아이콘 구현이 도형과 패스를 섞어
      // 쓰므로(예: image = path + rect + circle) 변환기를 새로 쓰는 셈이 된다.
      // createNodeFromSvg 는 Figma 자신의 SVG 파서를 쓰므로 그 위험이 없다.
      if (spec.svg === undefined) {
        ctx.log.push(`[벡터 없음] ${spec.name}: svg 자산이 비어 빈 프레임으로 둡니다`);
        return figma.createFrame();
      }
      const node = figma.createNodeFromSvg(spec.svg);
      // createNodeFromSvg 는 FRAME 을 돌려준다 — 아이콘 칸에서 늘어나지 않게 크기를 고정한다
      node.name = spec.name;
      return node;
    }
    case 'ellipse':
      return figma.createEllipse();
    case 'line':
      return figma.createLine();
    case 'frame':
    default:
      return figma.createFrame();
  }
}

function applyLayout(node: SceneNode, spec: NodeSpec): void {
  const frame = node as FrameNode;
  if (spec.layout === 'NONE' || typeof frame.layoutMode !== 'string') return;
  frame.layoutMode = spec.layout;
  // 자식이 채우는 축은 **고정**이어야 한다 — hug 로 두면 '줄어들면서 채운다'는 모순이라
  // Figma 가 거부하고 자식이 접힌다. 판단은 순수 계층(primaryAxisFixed)이 이미 끝냈다.
  frame.primaryAxisSizingMode = spec.primaryAxisFixed === true ? 'FIXED' : 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  if (spec.justify !== undefined) frame.primaryAxisAlignItems = spec.justify;
  if (spec.align !== undefined && spec.align !== 'BASELINE') {
    frame.counterAxisAlignItems = spec.align;
  }
  // [규칙] WRAP 은 세 조건이 **전부** 있어야 성립한다:
  // layoutMode='HORIZONTAL' + layoutWrap='WRAP' + **주축 고정 폭**.
  // 고정 폭이 없으면 줄바꿈 대신 가로로 넘쳐 다음 요소와 겹친다.
  if (spec.wrap === true && spec.layout === 'HORIZONTAL') {
    frame.layoutWrap = 'WRAP';
    frame.primaryAxisSizingMode = 'FIXED';
  }
  // 자동 크기 프레임이 내용을 잘라내지 않게 한다. 디자이너가 TEXT 속성을 길게 바꿨을 때
  // hug 체인이 한 군데라도 늦게 반응하면 clip 이 먼저 보이는데, 그 오해를 없앤다.
  frame.clipsContent = false;
  // [규칙] 오토레이아웃 프레임은 여섯 가지 사실을 **전부** 선언한다:
  // layoutMode · primaryAxisSizingMode · counterAxisSizingMode · 폭 의도 · itemSpacing · 패딩 4개.
  // 기본값으로 남는 프레임이 하나라도 있으면 그 자리의 간격이 어디서 왔는지 아무도 모른다.
  frame.itemSpacing = spec.itemSpacing ?? 0;
  frame.paddingTop = spec.padding?.top ?? 0;
  frame.paddingRight = spec.padding?.right ?? 0;
  frame.paddingBottom = spec.padding?.bottom ?? 0;
  frame.paddingLeft = spec.padding?.left ?? 0;
}

/**
 * NodeSpec 트리를 실제 노드로 만든다.
 * root 인자를 주면(변형 조립) 그 노드를 루트로 재사용한다 — ComponentNode 는 여기서 만들 수 없다.
 */
export function renderNodeSpec(
  spec: NodeSpec,
  ctx: RenderContext,
  root?: FrameNode | ComponentNode,
): SceneNode {
  const node = root ?? createBase(spec, ctx);
  node.name = spec.name;

  applyLayout(node, spec);

  // 테두리는 두께가 먼저 있어야 보인다 — 바인딩보다 앞선다
  if (spec.strokeWeight !== undefined) {
    const geo = node as GeometryMixin & { strokeAlign?: 'CENTER' | 'INSIDE' | 'OUTSIDE' };
    geo.strokeWeight = spec.strokeWeight;
    if ('strokeAlign' in geo) geo.strokeAlign = 'INSIDE';
  }
  // 배경 바인딩이 없는 컨테이너는 투명 — 색은 명시 바인딩만 (Detach 0)
  const hasFill = spec.bindings.some((b) => b.field === 'fills');
  if (!hasFill && spec.kind === 'frame') (node as FrameNode).fills = [];

  // 텍스트 리사이즈 규칙 — 디자이너가 TEXT 속성을 길게 바꿨을 때 **잘리지 않고 늘어나게** 한다.
  // Figma 텍스트 노드는 이 값을 명시하지 않으면 고정 크기로 남아, 문구가 길어지면 프레임 밖으로
  // 넘치거나 잘린다(디자이너가 가장 먼저 발견하는 문제다).
  //   grow=true  → 폭은 부모가 정하므로 높이만 내용에 맞춘다 = 줄바꿈
  //   고정 크기   → 명시 치수를 존중해 자동 리사이즈를 끈다
  //   그 외      → 양축 hug (내용만큼만 차지)
  if (spec.kind === 'text') {
    const text = node as TextNode;
    // [규칙] textAutoResize='NONE' 은 **절대 쓰지 않는다** — 내용이 길어지면 그 자리에서
    // 잘린다(실제 화면에서 컴포넌트 제목이 'Passwor…' 로 잘린 원인이 이것이다).
    //   폭이 정해진 텍스트  → 'HEIGHT'            (그 폭에서 줄바꿈하고 높이만 늘어난다)
    //   그 외              → 'WIDTH_AND_HEIGHT'  (내용만큼 감싼다)
    const widthCapped = spec.width !== undefined || spec.grow === true;
    const mode: TextNode['textAutoResize'] = widthCapped ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
    // 폰트가 로드돼 있으면 실패하지 않는다 — 실패한다면 폰트 준비가 잘못된 것이므로 드러내야 한다
    text.textAutoResize = mode;

    // 줄 높이 — Variable 바인딩은 px 로 해석되어 배수 토큰을 걸 수 없다. 대신 **해석값을
    // PERCENT 로 적용**한다(1.5 → 150%). 예전에는 통째로 포기해 거의 모든 컴포넌트가
    // Figma 기본 줄 높이로 남았다.
    if (spec.lineHeightPercent !== undefined) {
      text.lineHeight = { value: spec.lineHeightPercent, unit: 'PERCENT' };
    }
  }

  if (spec.width !== undefined || spec.height !== undefined) {
    const layout = node as LayoutMixin;
    const width = spec.width ?? layout.width;
    // 텍스트는 높이를 강제하지 않는다 — 'HEIGHT' 자동 높이와 싸워 내용을 잘라낸다.
    // 폭만 정해 주고 높이는 줄 수에 맡긴다(규칙: 폭 제한 텍스트 = HEIGHT + resize(maxW, h)).
    const height = spec.kind === 'text' ? layout.height : (spec.height ?? layout.height);
    try {
      layout.resize(Math.max(1, width), Math.max(1, height));
    } catch {
      // 오토레이아웃 자식이라 크기가 부모에 종속된 경우 — 무시하고 자동 크기를 쓴다
    }
  }
  applyBindings(node, spec.bindings, ctx);

  for (const child of spec.children) {
    const childNode = renderNodeSpec(child, ctx);
    (node as ChildrenMixin).appendChild(childNode);
    // 채움(grow)은 **부모에 붙은 뒤에만** 설정할 수 있다. layoutSizing* 은 "only valid on
    // auto-layout children" 이라 부모가 없으면 던진다 — 예전 코드는 append 전에 layoutGrow 를
    // 걸고 예외를 조용히 삼켜, grow 가 **한 번도 적용된 적이 없었다**(긴 문구가 늘어나지 않고
    // 잘리던 원인). layoutSizing* 은 layoutGrow/layoutAlign/sizingMode 를 한 번에 맞춰 주는
    // 공식 shorthand 라, '채우면서 동시에 hug' 같은 모순 조합도 알아서 정리해 준다.
    if (child.grow === true) applyFill(childNode, spec.layout, child.name, ctx);
  }

  return node;
}

/** 부모 주축 방향으로 자식을 채운다 — append 이후에만 호출해야 한다 */
function applyFill(
  childNode: SceneNode,
  parentLayout: NodeSpec['layout'],
  name: string,
  ctx: RenderContext,
): void {
  if (parentLayout === 'NONE') return;
  const axis = parentLayout === 'HORIZONTAL' ? 'layoutSizingHorizontal' : 'layoutSizingVertical';
  const target = childNode as SceneNode & Record<string, unknown>;
  try {
    target[axis] = 'FILL';
    // **대입했다고 적용된 것이 아니다.** 그 속성이 없는 노드 종류라면 값만 얹히고 조용히
    // 무시된다 — 예전 코드는 여기서 return 해 버려 채움이 안 된 것을 아무도 몰랐다.
    // 반드시 읽어서 확인한다.
    if (target[axis] === 'FILL') return;
  } catch {
    // layoutSizing* 을 지원하지 않는 노드 종류 — 구형 경로(layoutGrow)로 물러난다
  }
  try {
    const legacy = childNode as LayoutMixin & { layoutGrow: number };
    legacy.layoutGrow = 1;
    if (legacy.layoutGrow === 1) return;
    ctx.log.push(`[채움 실패] ${name}: layoutSizing·layoutGrow 어느 쪽도 적용되지 않았다`);
  } catch (error) {
    ctx.log.push(`[채움 실패] ${name}: ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * NodeSpec 의 propRefs 를 실제 컴포넌트 속성 키에 연결한다.
 * propertyKeys 는 addComponentProperty 가 돌려준 'Children#12:3' 형태의 키 맵이다 —
 * 이걸 연결하지 않으면 Figma 가 '어느 레이어도 사용하지 않는 속성' 경고를 남긴다.
 */
export function attachPropRefs(
  node: SceneNode,
  spec: NodeSpec,
  propertyKeys: ReadonlyMap<string, string>,
  log: string[],
): number {
  let bound = 0;
  if (spec.propRefs) {
    const refs: Record<string, string> = {};
    const put = (field: string, figmaName: string | undefined): void => {
      if (figmaName === undefined) return;
      const key = propertyKeys.get(figmaName);
      if (key !== undefined) refs[field] = key;
    };
    put('characters', spec.propRefs.characters);
    put('visible', spec.propRefs.visible);
    put('mainComponent', spec.propRefs.mainComponent);
    if (Object.keys(refs).length > 0) {
      try {
        (
          node as SceneNode & { componentPropertyReferences: Record<string, string> | null }
        ).componentPropertyReferences = refs;
        bound += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log.push(`[속성 연결 실패] ${node.name}: ${message}`);
      }
    }
  }

  const children = (node as ChildrenMixin).children;
  if (Array.isArray(children)) {
    for (let i = 0; i < spec.children.length && i < children.length; i += 1) {
      const childSpec = spec.children[i];
      const childNode = children[i];
      if (childSpec && childNode) bound += attachPropRefs(childNode, childSpec, propertyKeys, log);
    }
  }
  return bound;
}
