/**
 * 순수 계층 단위 테스트 — buildComponentSetSpec / deriveAnatomy / 매트릭스 계획 / 카테고리 분류.
 */
import { describe, expect, it } from 'vitest';
import { groupByCategory, categoryPageBase } from '../catalog';
import type { ComponentFigmaSpec } from '../component-spec';
import { buildComponentSetSpec, cartesian, deriveAnatomy, segmentsOf } from '../component-spec';
import { planVariantMatrix } from '../matrix';
import { resolveStyleToken, tokenKeyCandidates, toVariableName, typographyVars } from '../tokens';

const VAR_NAMES = new Set([
  'color/surface/default',
  'color/feedback/danger/surface',
  'color/text/default',
  'radius/md',
  'space/2',
  'typography/label/md/font-size',
  'typography/label/md/font-weight',
]);

function spec(overrides: Partial<ComponentFigmaSpec> = {}): ComponentFigmaSpec {
  return {
    name: 'Demo',
    level: 'atom',
    category: 'Actions',
    variantProperties: {},
    properties: [],
    tokens: { surface: 'color.surface.default', text: 'color.text.default', radius: 'radius.md' },
    anatomy: {
      kind: 'frame',
      name: 'Demo',
      layout: 'HORIZONTAL',
      styles: { fill: 'surface', radius: 'radius' },
      children: [{ kind: 'text', name: 'Label', text: '데모', styles: { color: 'text' } }],
    },
    ...overrides,
  };
}

describe('토큰 해석', () => {
  it('점 경로를 Figma Variable 이름으로 바꾼다', () => {
    expect(toVariableName('color.text.default')).toBe('color/text/default');
  });

  it('변형 값 후보를 두 표기 순서로 모두 시도하고 마지막에 기본 키로 떨어진다', () => {
    expect(tokenKeyCandidates('surface', ['danger'])).toEqual([
      'surfaceDanger',
      'dangerSurface',
      'surface',
    ]);
  });

  it('역할+값 표기(surfaceDanger)를 고른다', () => {
    const resolved = resolveStyleToken(
      { surfaceDanger: 'color.feedback.danger.surface', surface: 'color.surface.default' },
      'surface',
      ['danger'],
      VAR_NAMES,
    );
    expect(resolved?.tokenKey).toBe('surfaceDanger');
  });

  it('값+역할 표기(neutralSurface)도 같은 기본 키로 고른다', () => {
    const resolved = resolveStyleToken(
      { neutralSurface: 'color.surface.default' },
      'surface',
      ['neutral'],
      VAR_NAMES,
    );
    expect(resolved?.tokenKey).toBe('neutralSurface');
  });

  it('파일에 없는 Variable 은 채택하지 않는다', () => {
    expect(
      resolveStyleToken({ surface: 'color.nope.missing' }, 'surface', [], VAR_NAMES),
    ).toBeNull();
  });

  it('합성 타이포는 실존하는 서브 Variable 만 돌려준다', () => {
    const typo = typographyVars('typography/label/md', VAR_NAMES);
    expect(typo.fontSize).toBe('typography/label/md/font-size');
    expect(typo.lineHeight).toBeUndefined();
  });
});

describe('변형축 · 조합', () => {
  it('카테시안 곱은 축 선언 순서를 보존한다', () => {
    expect(
      cartesian([
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toEqual([
      ['a', '1'],
      ['a', '2'],
      ['b', '1'],
      ['b', '2'],
    ]);
  });

  it('VARIANT 만 변형축이 되고 BOOLEAN/TEXT/INSTANCE_SWAP 은 컴포넌트 속성이 된다', () => {
    const built = buildComponentSetSpec(
      spec({
        variantProperties: { Tone: { values: ['info', 'danger'], default: 'info' } },
        properties: [
          {
            name: 'Tone',
            prop: 'tone',
            type: 'VARIANT',
            values: ['info', 'danger'],
            default: 'info',
          },
          { name: 'Loading', prop: 'loading', type: 'BOOLEAN', default: false },
          { name: 'Children', prop: 'children', type: 'TEXT', default: '' },
        ],
      }),
      VAR_NAMES,
    );
    expect(built.axes.map((a) => a.name)).toEqual(['Tone']);
    expect(built.properties.map((p) => p.name)).toEqual(['Loading', 'Children']);
    expect(built.variants).toHaveLength(2);
  });

  it('기본 조합을 맨 앞에 둔다 — Figma 는 공간상 좌상단을 defaultVariant 로 삼는다', () => {
    const built = buildComponentSetSpec(
      spec({
        variantProperties: { Size: { values: ['sm', 'md', 'lg'], default: 'md' } },
        properties: [
          {
            name: 'Size',
            prop: 'size',
            type: 'VARIANT',
            values: ['sm', 'md', 'lg'],
            default: 'md',
          },
        ],
      }),
      VAR_NAMES,
    );
    expect(built.variants[0]?.name).toBe('Size=md');
    expect(built.variants[0]?.isDefault).toBe(true);
    expect(built.variants.filter((v) => v.isDefault)).toHaveLength(1);
  });

  it('변형축이 없으면 단일 컴포넌트다', () => {
    const built = buildComponentSetSpec(spec(), VAR_NAMES);
    expect(built.isSet).toBe(false);
    expect(built.variants).toHaveLength(1);
    expect(built.variants[0]?.name).toBe('Demo');
  });

  it('축 값이 중복돼도 조합 이름이 충돌하지 않게 중복을 제거한다', () => {
    const built = buildComponentSetSpec(
      spec({
        variantProperties: { Tone: { values: ['info', 'info'], default: 'info' } },
        properties: [
          {
            name: 'Tone',
            prop: 'tone',
            type: 'VARIANT',
            values: ['info', 'info'],
            default: 'info',
          },
        ],
      }),
      VAR_NAMES,
    );
    expect(built.variants).toHaveLength(1);
  });

  it('조합 상한을 넘으면 계약 분리를 요구하며 던진다', () => {
    // 상한(320)을 확실히 넘기는 조합: 33 × 10 = 330
    const values = Array.from({ length: 33 }, (_, i) => `v${String(i)}`);
    expect(() =>
      buildComponentSetSpec(
        spec({
          variantProperties: {
            A: { values, default: 'v0' },
            B: { values: values.slice(0, 10), default: 'v0' },
          },
          properties: [
            { name: 'A', prop: 'a', type: 'VARIANT', values, default: 'v0' },
            { name: 'B', prop: 'b', type: 'VARIANT', values: values.slice(0, 10), default: 'v0' },
          ],
        }),
        VAR_NAMES,
      ),
    ).toThrow(/계약 분리/);
  });

  it('변형마다 그 변형의 토큰을 고른다', () => {
    const built = buildComponentSetSpec(
      spec({
        tokens: {
          surface: 'color.surface.default',
          surfaceDanger: 'color.feedback.danger.surface',
          text: 'color.text.default',
          radius: 'radius.md',
        },
        variantProperties: { Tone: { values: ['info', 'danger'], default: 'info' } },
        properties: [
          {
            name: 'Tone',
            prop: 'tone',
            type: 'VARIANT',
            values: ['info', 'danger'],
            default: 'info',
          },
        ],
      }),
      VAR_NAMES,
    );
    const danger = built.variants.find((v) => v.name === 'Tone=danger');
    expect(danger?.node.bindings.find((b) => b.field === 'fills')?.variable).toBe(
      'color/feedback/danger/surface',
    );
  });
});

describe('anatomy 파생 폴백', () => {
  it('anatomy 가 없으면 tokens 키에서 부위를 역산한다', () => {
    const built = buildComponentSetSpec(
      spec({
        anatomy: undefined,
        tokens: {
          surface: 'color.surface.default',
          headText: 'color.text.default',
          radius: 'radius.md',
        },
      }),
      VAR_NAMES,
    );
    expect(built.anatomySource).toBe('derived');
    const names = built.variants[0]?.node.children.map((c) => c.name) ?? [];
    expect(names).toContain('Label');
    expect(names).toContain('Head');
  });

  it('계약이 anatomy 를 선언하면 그것을 쓴다', () => {
    expect(buildComponentSetSpec(spec(), VAR_NAMES).anatomySource).toBe('contract');
  });

  it('상태 수식어 토큰(backgroundHover)은 기본 상태 부위로 삼지 않는다', () => {
    const derived = deriveAnatomy(
      spec({
        anatomy: undefined,
        tokens: { background: 'color.surface.default', backgroundHover: 'color.surface.default' },
      }),
    );
    expect((derived.children ?? []).map((c) => c.name)).not.toContain('Background');
  });

  it('camelCase 키를 토막으로 가른다', () => {
    expect(segmentsOf('headPaddingX')).toEqual(['head', 'padding', 'x']);
  });
});

describe('변형 매트릭스 계획', () => {
  const twoAxis = buildComponentSetSpec(
    spec({
      variantProperties: {
        Variant: { values: ['primary', 'ghost'], default: 'primary' },
        Size: { values: ['sm', 'md', 'lg'], default: 'md' },
      },
      properties: [
        {
          name: 'Variant',
          prop: 'variant',
          type: 'VARIANT',
          values: ['primary', 'ghost'],
          default: 'primary',
        },
        { name: 'Size', prop: 'size', type: 'VARIANT', values: ['sm', 'md', 'lg'], default: 'md' },
      ],
    }),
    VAR_NAMES,
  );

  it('1번 축이 열, 2번 축이 행이다', () => {
    const plan = planVariantMatrix(twoAxis);
    expect(plan.columnAxis?.name).toBe('Variant');
    expect(plan.rowAxis?.name).toBe('Size');
    expect(plan.blocks).toHaveLength(1);
  });

  it('모든 변형이 정확히 한 칸씩 배치된다 — 빠지거나 겹치지 않는다', () => {
    const plan = planVariantMatrix(twoAxis);
    expect(plan.cellCount).toBe(twoAxis.variants.length);
    const placed = plan.blocks.flatMap((b) =>
      b.rows.flatMap((r) => r.cells.map((c) => c.variantName)),
    );
    expect(new Set(placed).size).toBe(twoAxis.variants.length);
    for (const variant of twoAxis.variants) expect(placed).toContain(variant.name);
  });

  it('모든 칸과 머리행/머리열에 라벨이 붙는다 — 어느 칸이 어느 변형인지 읽을 수 있어야 한다', () => {
    const plan = planVariantMatrix(twoAxis);
    for (const block of plan.blocks) {
      expect(block.columnLabels.every((l) => l.includes('='))).toBe(true);
      for (const row of block.rows) {
        expect(row.label).toMatch(/^Size=/);
        for (const cell of row.cells) expect(cell.label).toMatch(/^Variant=/);
      }
    }
  });

  it('축이 3개 이상이면 나머지 축 조합마다 라벨 붙은 블록으로 쪼갠다', () => {
    const threeAxis = buildComponentSetSpec(
      spec({
        variantProperties: {
          A: { values: ['a1', 'a2'], default: 'a1' },
          B: { values: ['b1', 'b2'], default: 'b1' },
          C: { values: ['c1', 'c2'], default: 'c1' },
        },
        properties: [
          { name: 'A', prop: 'a', type: 'VARIANT', values: ['a1', 'a2'], default: 'a1' },
          { name: 'B', prop: 'b', type: 'VARIANT', values: ['b1', 'b2'], default: 'b1' },
          { name: 'C', prop: 'c', type: 'VARIANT', values: ['c1', 'c2'], default: 'c1' },
        ],
      }),
      VAR_NAMES,
    );
    const plan = planVariantMatrix(threeAxis);
    expect(plan.blockAxes.map((a) => a.name)).toEqual(['C']);
    expect(plan.blocks).toHaveLength(2);
    expect(plan.blocks.every((b) => b.label.startsWith('C='))).toBe(true);
    expect(plan.cellCount).toBe(8);
  });

  it('단일 구성 컴포넌트도 칸 하나짜리 계획을 만든다', () => {
    const plan = planVariantMatrix(buildComponentSetSpec(spec(), VAR_NAMES));
    expect(plan.cellCount).toBe(1);
  });
});

describe('카테고리 분류', () => {
  const ORDER = ['Actions', 'Inputs', 'Feedback'];

  it('정본 순서를 따르고 계약이 0개인 카테고리도 빈 그룹으로 남긴다', () => {
    const groups = groupByCategory(
      [
        { name: 'Alert', category: 'Feedback' },
        { name: 'Button', category: 'Actions' },
      ],
      ORDER,
    );
    expect(groups.map((g) => g.category)).toEqual(ORDER);
    expect(groups[1]?.items).toEqual([]);
  });

  it('그룹 안 순서는 이름 오름차순으로 결정적이다', () => {
    const groups = groupByCategory(
      [
        { name: 'SelectionBar', category: 'Actions' },
        { name: 'Button', category: 'Actions' },
        { name: 'RowActions', category: 'Actions' },
      ],
      ORDER,
    );
    expect(groups[0]?.items.map((i) => i.name)).toEqual(['Button', 'RowActions', 'SelectionBar']);
  });

  it('정본에 없는 카테고리도 뒤에 붙여 누락 0 을 지킨다', () => {
    const groups = groupByCategory([{ name: 'X', category: 'Charts' }], ORDER);
    expect(groups.map((g) => g.category)).toEqual([...ORDER, 'Charts']);
  });

  it('페이지 이름 규칙은 main.ts/tds-doc.ts 가 맞물리는 한 지점이다', () => {
    expect(categoryPageBase('Actions')).toBe('🧩 Components — Actions');
  });
});
