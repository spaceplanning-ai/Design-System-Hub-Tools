/**
 * 순수 계층 단위 테스트 — 컴포넌트 문서 카드 구조.
 *
 * 참조 디자인의 블록 순서(prop 섹션 → preview → 인터랙션 매트릭스 → Resource)와
 * "prop 하나당 섹션 하나"는 조용히 퇴행하기 쉬운 축이다. 계약 44건 전수로 못박는다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../component-spec';
import { buildComponentSetSpec } from '../component-spec';
import {
  documentedValues,
  INTERACTION_COLUMNS,
  planChips,
  planComponentCard,
  planComponentPage,
  planInteractionMatrix,
  planResources,
} from '../doc-layout';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const VAR_NAMES: ReadonlySet<string> = new Set(
  (
    JSON.parse(readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8')) as {
      variables: Array<{ name: string }>;
    }
  ).variables.map((v) => v.name),
);
const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

/** 카테고리마다 대표 1건 — 카테고리 전수 커버리지 */
const REPRESENTATIVES: Array<[string, ComponentFigmaSpec]> = (() => {
  const seen = new Map<string, ComponentFigmaSpec>();
  for (const c of CONTRACTS) {
    const category = c.category ?? 'Utilities';
    if (!seen.has(category)) seen.set(category, c);
  }
  return [...seen.entries()];
})();

function cardOf(spec: ComponentFigmaSpec): ReturnType<typeof planComponentCard> {
  return planComponentCard(spec, buildComponentSetSpec(spec, VAR_NAMES));
}

describe('prop 섹션 — 계약이 원천', () => {
  it.each(REPRESENTATIVES)('%s — Figma 표현이 있는 prop 마다 정확히 한 섹션', (_c, spec) => {
    const card = cardOf(spec);
    const expected = (spec.properties ?? []).map((p) => p.prop ?? p.name);
    expect(card.sections.map((s) => s.prop)).toEqual(expected);
  });

  it.each(REPRESENTATIVES)('%s — 섹션 순서가 계약 선언 순서와 같다', (_c, spec) => {
    const card = cardOf(spec);
    const declared = (spec.properties ?? []).map((p) => p.prop ?? p.name);
    expect(card.sections.map((s) => s.prop)).toEqual(declared);
  });

  it('enum prop 은 값마다 칸을 갖고 각 칸이 실제 변형을 가리킨다', () => {
    const button = CONTRACTS.find((c) => c.name === 'Button');
    expect(button).toBeDefined();
    if (!button) return;
    const card = cardOf(button);
    const variant = card.sections.find((s) => s.prop === 'variant');
    expect(variant?.valueChips).toEqual(['primary', 'secondary', 'ghost', 'danger']);
    expect(variant?.cells).toHaveLength(4);
    // 다른 축은 기본값으로 고정된다 — 한 축만 바뀌어야 비교표로 읽힌다
    // 상태 축이 생기면서 고정되는 축이 하나 늘었다 — 나머지는 전부 기본값이어야 한다
    expect(variant?.cells[0]?.variantName).toBe('Variant=primary, Size=md, State=default');
    expect(variant?.cells[3]?.variantName).toBe('Variant=danger, Size=md, State=default');
  });

  it('boolean prop 은 false/true 두 칸이다', () => {
    expect(documentedValues({ name: 'Loading', prop: 'loading', type: 'BOOLEAN' })).toEqual([
      'false',
      'true',
    ]);
  });

  it('텍스트·슬롯 prop 은 없음/있음 두 칸이다', () => {
    expect(documentedValues({ name: 'Children', prop: 'children', type: 'TEXT' })).toEqual([
      '없음',
      '있음',
    ]);
    expect(documentedValues({ name: 'IconLeft', prop: 'iconLeft', type: 'INSTANCE_SWAP' })).toEqual(
      ['없음', '있음'],
    );
  });

  it('변형축이 아닌 prop 의 칸은 변형을 가리키지 않는다 — 기본 변형으로 그린다', () => {
    const button = CONTRACTS.find((c) => c.name === 'Button');
    if (!button) return;
    // loading 은 이제 상태 축의 값이라 단독 BOOLEAN prop 이 아니다 — 여전히 BOOLEAN 인
    // isFullWidth 로 같은 성질을 검사한다(변형축이 아닌 prop 의 칸은 변형을 가리키지 않는다).
    const fullWidth = cardOf(button).sections.find((s) => s.prop === 'isFullWidth');
    expect(fullWidth).toBeDefined();
    expect(fullWidth?.cells.every((cell) => cell.variantName === null)).toBe(true);
  });

  // [칸마다 다른 그림] plugin-build-rules §11. 변형축이 아닌 prop 의 칸은 가리킬 변형이 없어
  // 전부 같은 기본 변형으로 그려졌다 — Checkbox 의 checked:false 칸과 checked:true 칸이
  // 픽셀까지 같은 파란 체크박스로 나온 원인이다. 칸이 **속성 덮어쓰기**를 실어야 그림이 갈린다.
  it('BOOLEAN prop 의 칸은 서로 다른 속성 덮어쓰기를 싣는다 (칸마다 그림이 갈린다)', () => {
    const flat: string[] = [];
    for (const spec of CONTRACTS) {
      for (const section of cardOf(spec).sections) {
        const prop = (spec.properties ?? []).find((p) => p.name === section.figmaName);
        if (prop?.type !== 'BOOLEAN') continue;
        const prints = section.cells.map((cell) => JSON.stringify(cell.propertyOverride ?? null));
        if (new Set(prints).size < section.cells.length) {
          flat.push(`${spec.name}.${section.prop} — ${prints.join(' / ')}`);
        }
      }
    }
    expect(
      flat,
      `BOOLEAN 칸이 전부 같은 그림이 된다 (${String(flat.length)}건):\n${flat.join('\n')}`,
    ).toEqual([]);
  });

  it('덮어쓰기는 그 prop 의 Figma 속성 이름을 가리킨다', () => {
    const checkbox = CONTRACTS.find((c) => c.name === 'Checkbox');
    if (!checkbox) return;
    const checked = cardOf(checkbox).sections.find((s) => s.prop === 'checked');
    expect(checked?.cells.map((c) => c.propertyOverride)).toEqual([
      { name: 'Checked', value: false },
      { name: 'Checked', value: true },
    ]);
  });

  it('모든 섹션의 값 칸이 비어 있지 않다', () => {
    for (const spec of CONTRACTS) {
      for (const section of cardOf(spec).sections) {
        expect(section.cells.length, `${spec.name}.${section.prop}`).toBeGreaterThan(0);
        expect(section.valueChips.length).toBe(section.cells.length);
      }
    }
  });

  it('한 줄 설명은 codegen 이 계약에서 뽑아 둔 값을 그대로 쓴다', () => {
    const button = CONTRACTS.find((c) => c.name === 'Button');
    if (!button) return;
    const card = cardOf(button);
    expect(card.summary).toBe('기본 액션 버튼');
    expect(card.sections.find((s) => s.prop === 'variant')?.summary).toBe('시각 위계');
  });
});

describe('상태 칩', () => {
  it('stable 만 초록이고 나머지는 회색이다', () => {
    expect(planChips({ name: 'X', status: 'stable', variantProperties: {} })[0]).toEqual({
      label: 'stable',
      tone: 'positive',
    });
    expect(planChips({ name: 'X', status: 'beta', variantProperties: {} })[0]).toEqual({
      label: 'beta',
      tone: 'neutral',
    });
  });

  it('상태·레벨·카테고리 세 칩을 만든다', () => {
    const chips = planChips({
      name: 'X',
      status: 'beta',
      level: 'atom',
      category: 'Actions',
      variantProperties: {},
    });
    expect(chips.map((c) => c.label)).toEqual(['beta', 'atom', 'Actions']);
  });
});

describe('preview 섹션', () => {
  it.each(REPRESENTATIVES)('%s — 투명·기본·융기 세 표면을 준다', (_c, spec) => {
    const surfaces = cardOf(spec).preview.surfaces;
    expect(surfaces.map((s) => s.kind)).toEqual(['transparent', 'token', 'token']);
    expect(surfaces[1]?.variable).toBe('color/surface/default');
    expect(surfaces[2]?.variable).toBe('color/surface/raised');
  });

  it('토큰 표면이 가리키는 Variable 은 실존한다 — 하드코딩 색이 아니다', () => {
    for (const surface of cardOf(CONTRACTS[0] as ComponentFigmaSpec).preview.surfaces) {
      if (surface.kind !== 'token' || surface.variable === undefined) continue;
      expect(VAR_NAMES.has(surface.variable)).toBe(true);
    }
  });
});

describe('인터랙션 매트릭스', () => {
  it('열은 Interaction / Active / Focus / Active+Focus 고정이다', () => {
    expect([...INTERACTION_COLUMNS]).toEqual(['Interaction', 'Active', 'Focus', 'Active+Focus']);
    for (const [, spec] of REPRESENTATIVES) {
      expect(cardOf(spec).interactions.columns).toEqual([...INTERACTION_COLUMNS]);
    }
  });

  it('행은 계약 states 에서 오고, 열로 승격된 상태는 행에서 빠진다', () => {
    const matrix = planInteractionMatrix([
      'default',
      'hover',
      'active',
      'focus-visible',
      'disabled',
    ]);
    expect(matrix.rows.map((r) => r.state)).toEqual(['default', 'hover', 'disabled']);
  });

  it('모든 행이 열 수만큼 칸을 갖고 칸마다 조건 라벨이 있다', () => {
    for (const [, spec] of REPRESENTATIVES) {
      const matrix = cardOf(spec).interactions;
      for (const row of matrix.rows) {
        expect(row.cells).toHaveLength(matrix.columns.length);
        for (const cell of row.cells) expect(cell.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('칸 라벨이 상태 조합을 정확히 적는다', () => {
    const row = planInteractionMatrix(['hover']).rows[0];
    expect(row?.cells.map((c) => c.label)).toEqual([
      'hover',
      'hover + active',
      'hover + focus-visible',
      'hover + active + focus-visible',
    ]);
  });

  it('states 가 비면 행이 0개지만 열은 그대로다 — 표가 깨지지 않는다', () => {
    const matrix = planInteractionMatrix([]);
    expect(matrix.rows).toHaveLength(0);
    expect(matrix.columns).toEqual([...INTERACTION_COLUMNS]);
  });

  it('계약 44건 모두 매트릭스 행이 하나 이상이다', () => {
    for (const spec of CONTRACTS) {
      expect(cardOf(spec).interactions.rows.length, spec.name).toBeGreaterThan(0);
    }
  });
});

describe('Resource 섹션', () => {
  it.each(REPRESENTATIVES)('%s — anatomy 직속 부위를 순서대로 담는다', (_c, spec) => {
    const resources = planResources(spec);
    for (const [i, resource] of resources.entries()) {
      expect(resource.index).toBe(i);
      expect(resource.name.length).toBeGreaterThan(0);
    }
  });

  it('부위 이름은 anatomy 가 정한 레이어 이름 그대로다', () => {
    const button = CONTRACTS.find((c) => c.name === 'Button');
    if (!button) return;
    expect(planResources(button).map((r) => r.name)).toEqual([
      'Icon Left',
      'Spinner',
      'Label',
      'Icon Right',
    ]);
  });
});

describe('페이지 계획', () => {
  it('카테고리 제목·설명과 컴포넌트 카드를 순서대로 담는다', () => {
    const entries = CONTRACTS.filter((c) => c.category === 'Actions').map((spec) => ({
      spec,
      set: buildComponentSetSpec(spec, VAR_NAMES),
    }));
    const page = planComponentPage('Actions', '액션 컴포넌트', entries);
    expect(page.title).toBe('Actions');
    expect(page.summary).toBe('액션 컴포넌트');
    expect(page.cards.map((c) => c.name)).toEqual(entries.map((e) => e.spec.name));
  });

  it('카드마다 다섯 블록이 모두 채워진다 — 하나라도 비면 문서가 반쪽이 된다', () => {
    for (const spec of CONTRACTS) {
      const card = cardOf(spec);
      expect(card.name.length, spec.name).toBeGreaterThan(0);
      expect(card.chips.length).toBeGreaterThan(0);
      expect(card.sections.length).toBeGreaterThan(0);
      expect(card.preview.surfaces.length).toBe(3);
      expect(card.interactions.rows.length).toBeGreaterThan(0);
      // Resource 는 단일 부위 컴포넌트에서 비어 있을 수 있다 — 존재만 보장한다
      expect(Array.isArray(card.resources)).toBe(true);
    }
  });
});
