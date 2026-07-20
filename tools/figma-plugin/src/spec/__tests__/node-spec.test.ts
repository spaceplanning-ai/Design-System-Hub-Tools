/**
 * 순수 계층 단위 테스트 — buildNodeSpec.
 * Figma 없이 node 에서 전부 검증 가능한 것이 이 계층의 존재 이유다.
 */
import { describe, expect, it } from 'vitest';
import type { AnatomyNode } from '../anatomy';
import type { BuildContext } from '../node-spec';
import { buildNodeSpec, collectBindings, collectUnbound, walkNodeSpec } from '../node-spec';

const VAR_NAMES = new Set([
  'color/surface/default',
  'color/text/default',
  'color/border/default',
  'radius/md',
  'space/2',
  'space/4',
  'typography/label/md/font-size',
  'typography/label/md/font-weight',
  'typography/label/md/line-height',
  'typography/label/md/font-family',
]);

const TOKENS: Record<string, string> = {
  surface: 'color.surface.default',
  text: 'color.text.default',
  border: 'color.border.default',
  radius: 'radius.md',
  paddingX: 'space.4',
  paddingY: 'space.2',
  gap: 'space.2',
  typography: 'typography.label.md',
};

function ctx(overrides: Partial<BuildContext> = {}): BuildContext {
  return {
    tokens: TOKENS,
    activeValues: [],
    varNames: VAR_NAMES,
    figmaPropertyOf: { children: 'Children', loading: 'Loading', iconLeft: 'IconLeft' },
    propValues: {},
    ...overrides,
  };
}

describe('buildNodeSpec — 오토레이아웃', () => {
  it('layout·정렬·간격을 계약이 말한 대로 옮긴다', () => {
    const anatomy: AnatomyNode = {
      kind: 'frame',
      name: 'Root',
      layout: 'HORIZONTAL',
      justify: 'CENTER',
      align: 'CENTER',
      styles: { fill: 'surface', gap: 'gap', padX: 'paddingX', padY: 'paddingY' },
    };
    const spec = buildNodeSpec(anatomy, ctx());
    expect(spec.layout).toBe('HORIZONTAL');
    expect(spec.justify).toBe('CENTER');
    expect(spec.align).toBe('CENTER');
  });

  it('wrap 은 HORIZONTAL 에서만 살아남는다 — Figma 가 VERTICAL 에 걸면 던지기 때문', () => {
    const horizontal = buildNodeSpec(
      { kind: 'frame', name: 'Row', layout: 'HORIZONTAL', wrap: true },
      ctx(),
    );
    expect(horizontal.wrap).toBe(true);

    const vertical = buildNodeSpec(
      { kind: 'frame', name: 'Col', layout: 'VERTICAL', wrap: true },
      ctx(),
    );
    expect(vertical.wrap).toBeUndefined();
  });

  it('가로 레이아웃의 교차축 정렬 기본값은 CENTER 다 — 베이스라인이 어긋나지 않게', () => {
    const spec = buildNodeSpec({ kind: 'frame', name: 'Row', layout: 'HORIZONTAL' }, ctx());
    expect(spec.align).toBe('CENTER');
  });

  it('간격 토큰이 있으면 리터럴 itemSpacing 을 쓰지 않고 바인딩만 요청한다', () => {
    const withGap = buildNodeSpec(
      { kind: 'frame', name: 'Row', layout: 'HORIZONTAL', styles: { gap: 'gap' } },
      ctx(),
    );
    expect(withGap.itemSpacing).toBeUndefined();
    expect(withGap.bindings.map((b) => b.field)).toContain('itemSpacing');

    const withoutGap = buildNodeSpec({ kind: 'frame', name: 'Row', layout: 'HORIZONTAL' }, ctx());
    expect(withoutGap.itemSpacing).toBe(8);
  });

  it('토큰이 패딩을 말하지 않는 민무늬 컨테이너는 패딩 0 이다 — 임의 여백은 정렬을 깬다', () => {
    const plain = buildNodeSpec({ kind: 'frame', name: 'Group', layout: 'VERTICAL' }, ctx());
    expect(plain.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('배경/테두리가 있는 부위만 최소 여백을 갖는다', () => {
    const skinned = buildNodeSpec(
      { kind: 'frame', name: 'Card', layout: 'VERTICAL', styles: { fill: 'surface' } },
      ctx(),
    );
    expect(skinned.padding).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
  });

  it('테두리 색만 있으면 헤어라인 두께를 준다 — 두께 0 이면 색이 보이지 않는다', () => {
    const spec = buildNodeSpec(
      { kind: 'frame', name: 'Box', layout: 'VERTICAL', styles: { stroke: 'border' } },
      ctx(),
    );
    expect(spec.strokeWeight).toBe(1);
  });
});

describe('buildNodeSpec — 자식 순서', () => {
  const tree: AnatomyNode = {
    kind: 'frame',
    name: 'Root',
    layout: 'HORIZONTAL',
    children: [
      { kind: 'instance', name: 'Icon' },
      { kind: 'text', name: 'Label', text: '확인' },
      { kind: 'ellipse', name: 'Dot' },
    ],
  };

  it('선언 순서를 그대로 보존한다', () => {
    const spec = buildNodeSpec(tree, ctx());
    expect(spec.children.map((c) => c.name)).toEqual(['Icon', 'Label', 'Dot']);
  });

  it('repeat 는 제자리에서 전개되고 1부터 번호를 붙인다', () => {
    const spec = buildNodeSpec(
      {
        kind: 'frame',
        name: 'List',
        layout: 'VERTICAL',
        children: [
          { kind: 'text', name: 'Head', text: '머리' },
          { kind: 'frame', name: 'Row', repeat: 3 },
          { kind: 'text', name: 'Foot', text: '꼬리' },
        ],
      },
      ctx(),
    );
    expect(spec.children.map((c) => c.name)).toEqual(['Head', 'Row 1', 'Row 2', 'Row 3', 'Foot']);
  });

  it('when 조건이 맞지 않는 부위는 그리지 않는다', () => {
    const anatomy: AnatomyNode = {
      kind: 'frame',
      name: 'Root',
      layout: 'VERTICAL',
      children: [
        { kind: 'text', name: 'Always', text: '항상' },
        {
          kind: 'text',
          name: 'DangerOnly',
          text: '위험',
          when: { prop: 'tone', equals: ['danger'] },
        },
      ],
    };
    const shown = buildNodeSpec(anatomy, ctx({ propValues: { tone: 'danger' } }));
    expect(shown.children.map((c) => c.name)).toEqual(['Always', 'DangerOnly']);

    const hidden = buildNodeSpec(anatomy, ctx({ propValues: { tone: 'info' } }));
    expect(hidden.children.map((c) => c.name)).toEqual(['Always']);
  });

  it('조건 prop 이 변형축이 아니면 그린다 — 문서에서 조용히 빠지는 편이 더 나쁘다', () => {
    const spec = buildNodeSpec(
      {
        kind: 'frame',
        name: 'Root',
        layout: 'VERTICAL',
        children: [{ kind: 'text', name: 'Maybe', when: { prop: 'unknown', equals: ['x'] } }],
      },
      ctx(),
    );
    expect(spec.children).toHaveLength(1);
  });
});

describe('buildNodeSpec — Variable 바인딩 요청', () => {
  it('토큰이 걸린 모든 시각 속성에 대해 바인딩을 요청한다', () => {
    const spec = buildNodeSpec(
      {
        kind: 'frame',
        name: 'Root',
        layout: 'HORIZONTAL',
        styles: {
          fill: 'surface',
          stroke: 'border',
          radius: 'radius',
          padX: 'paddingX',
          padY: 'paddingY',
          gap: 'gap',
        },
      },
      ctx(),
    );
    const fields = spec.bindings.map((b) => b.field);
    expect(fields).toContain('fills');
    expect(fields).toContain('strokes');
    expect(fields).toEqual(
      expect.arrayContaining([
        'topLeftRadius',
        'topRightRadius',
        'bottomLeftRadius',
        'bottomRightRadius',
      ]),
    );
    expect(fields).toEqual(expect.arrayContaining(['paddingLeft', 'paddingRight']));
    expect(fields).toEqual(expect.arrayContaining(['paddingTop', 'paddingBottom']));
    expect(fields).toContain('itemSpacing');
    // 리터럴 색은 어디에도 없다 — 전부 Variable 이름으로만 참조한다
    for (const binding of spec.bindings) expect(binding.variable).toMatch(/^[a-z]/);
  });

  it('합성 타이포 토큰을 서브 Variable 로 전개한다', () => {
    const spec = buildNodeSpec(
      { kind: 'text', name: 'Label', text: '레이블', styles: { typography: 'typography' } },
      ctx(),
    );
    const byField = new Map(spec.bindings.map((b) => [b.field, b.variable]));
    expect(byField.get('fontSize')).toBe('typography/label/md/font-size');
    expect(byField.get('fontWeight')).toBe('typography/label/md/font-weight');
  });

  it('바인딩할 수 없는 축은 조용히 버리지 않고 unbound 로 보고한다', () => {
    const spec = buildNodeSpec(
      { kind: 'text', name: 'Label', styles: { typography: 'typography' } },
      ctx(),
    );
    const unboundFields = spec.unbound.map((u) => u.field);
    expect(unboundFields).toContain('lineHeight');
    expect(unboundFields).toContain('fontFamily');
    for (const gap of spec.unbound) expect(gap.reason.length).toBeGreaterThan(0);
  });

  it('글자색·타이포는 텍스트 노드에만 적용한다 — 프레임에 걸면 배경이 글자색으로 칠해진다', () => {
    const frame = buildNodeSpec(
      {
        kind: 'frame',
        name: 'Row',
        layout: 'HORIZONTAL',
        styles: { color: 'text', typography: 'typography' },
      },
      ctx(),
    );
    expect(frame.bindings).toHaveLength(0);

    const text = buildNodeSpec({ kind: 'text', name: 'Label', styles: { color: 'text' } }, ctx());
    expect(text.bindings.map((b) => b.field)).toContain('fills');
  });

  // [타이포 배관] 굵기는 `fontWeight` 필드가 아니라 fontName.style 이 정한다. 바인딩만 요청하고
  // 해석값을 넘기지 않으면 어댑터는 '이 레이어가 몇 굵기인가'를 알 길이 없어 실행 폰트 하나
  // (Inter Regular)로 노드를 만든다 — 실제로 108개 타이포 레이어 중 84개가 그렇게 태어났다.
  it('굵기 토큰의 해석값을 fontWeight 로 넘긴다 — 어댑터가 스타일을 고를 수 있게', () => {
    const spec = buildNodeSpec(
      { kind: 'text', name: 'Label', text: '레이블', styles: { typography: 'typography' } },
      ctx({ tokenValues: new Map([['typography/label/md/font-weight', 600]]) }),
    );
    expect(spec.fontWeight).toBe(600);
  });

  it('굵기 Variable 값을 모르면 fontWeight 를 지어내지 않는다', () => {
    const spec = buildNodeSpec(
      { kind: 'text', name: 'Label', styles: { typography: 'typography' } },
      ctx(),
    );
    // 바인딩 요청은 그대로 남는다 — 값을 모를 뿐이지 토큰이 없는 것은 아니다
    expect(spec.bindings.map((b) => b.field)).toContain('fontWeight');
    expect(spec.fontWeight).toBeUndefined();
  });

  it('fontWeight 는 텍스트 노드에만 실린다 — 프레임에는 굵기가 없다', () => {
    const frame = buildNodeSpec(
      { kind: 'frame', name: 'Row', layout: 'HORIZONTAL', styles: { typography: 'typography' } },
      ctx({ tokenValues: new Map([['typography/label/md/font-weight', 700]]) }),
    );
    expect(frame.fontWeight).toBeUndefined();
  });

  it('파일에 없는 Variable 로는 바인딩을 요청하지 않는다', () => {
    const spec = buildNodeSpec(
      { kind: 'frame', name: 'Root', layout: 'VERTICAL', styles: { fill: 'surface' } },
      ctx({ varNames: new Set<string>() }),
    );
    expect(spec.bindings).toHaveLength(0);
  });
});

describe('buildNodeSpec — 컴포넌트 속성 연결', () => {
  it('textProp·visibleProp·slotProp 을 Figma 속성 이름으로 옮긴다', () => {
    const spec = buildNodeSpec(
      {
        kind: 'frame',
        name: 'Root',
        layout: 'HORIZONTAL',
        children: [
          { kind: 'text', name: 'Label', textProp: 'children' },
          { kind: 'ellipse', name: 'Spinner', visibleProp: 'loading' },
          { kind: 'instance', name: 'Icon', slotProp: 'iconLeft' },
        ],
      },
      ctx(),
    );
    expect(spec.children[0]?.propRefs?.characters).toBe('Children');
    expect(spec.children[1]?.propRefs?.visible).toBe('Loading');
    expect(spec.children[2]?.propRefs?.mainComponent).toBe('IconLeft');
  });

  it('계약에 없는 prop 이름은 연결하지 않는다', () => {
    const spec = buildNodeSpec({ kind: 'text', name: 'Label', textProp: 'nope' }, ctx());
    expect(spec.propRefs).toBeUndefined();
  });
});

describe('순회 유틸', () => {
  const tree: AnatomyNode = {
    kind: 'frame',
    name: 'Root',
    layout: 'VERTICAL',
    styles: { fill: 'surface' },
    children: [
      { kind: 'text', name: 'Label', styles: { color: 'text', typography: 'typography' } },
    ],
  };

  it('walkNodeSpec 은 전위 순회하며 깊이를 준다', () => {
    const seen: Array<[string, number]> = [];
    walkNodeSpec(buildNodeSpec(tree, ctx()), (node, depth) => seen.push([node.name, depth]));
    expect(seen).toEqual([
      ['Root', 0],
      ['Label', 1],
    ]);
  });

  it('collectBindings/collectUnbound 가 트리 전체를 모은다', () => {
    const spec = buildNodeSpec(tree, ctx());
    expect(collectBindings(spec).length).toBeGreaterThan(2);
    expect(collectUnbound(spec).length).toBeGreaterThan(0);
  });
});
