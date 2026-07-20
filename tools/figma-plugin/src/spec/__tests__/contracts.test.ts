/**
 * 통합 테스트 — **실제 codegen 산출물 44건**을 그대로 순수 계층에 통과시킨다.
 *
 * 여기서 지키는 약속:
 *  1. 모든 계약이 실제 노드 트리로 조립된다 (스크린샷 대체 0건)
 *  2. 토큰이 걸린 시각 속성은 **빠짐없이** Variable 바인딩을 요청하거나, 못 하면 unbound 로 보고한다
 *  3. 변형은 매트릭스에 정확히 한 칸씩 배치되고 모든 칸에 라벨이 붙는다
 *  4. 카테고리 분류가 정본 순서와 어긋나지 않는다 (카테고리마다 최소 1건 검사)
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AnatomyNode, AnatomyStyles } from '../anatomy';
import { normalizeAnatomy } from '../anatomy';
import { groupByCategory } from '../catalog';
import type { ComponentFigmaSpec } from '../component-spec';
import { buildComponentSetSpec } from '../component-spec';
import { planVariantMatrix } from '../matrix';
import { walkNodeSpec } from '../node-spec';
import { normalizeVariantTokens, resolveStyleToken } from '../tokens';

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

/** 계약 category 정본 순서 — tools/codegen/src/shared.ts CATEGORY_ORDER 의 복제본 */
const CATEGORY_ORDER = [
  'Actions',
  'Inputs',
  'Selection',
  'Navigation',
  'Feedback',
  'Dialogs & Overlays',
  'Data Display',
  'Media',
  'Layout',
  'Forms',
  'Lists',
  'Tables',
  'Authentication',
  'Commerce',
  'Communication',
  'File',
  'Maps',
  'Charts',
  'Utilities',
  'Mobile',
  'AI',
  'Korean Service',
  'Foundation',
];

/** 카테고리 → 그 카테고리의 대표 계약 1건 (카테고리 전수 커버리지) */
const REPRESENTATIVES: Array<[string, ComponentFigmaSpec]> = (() => {
  const seen = new Map<string, ComponentFigmaSpec>();
  for (const contract of CONTRACTS) {
    const category = contract.category ?? 'Utilities';
    if (!seen.has(category)) seen.set(category, contract);
  }
  return [...seen.entries()];
})();

/**
 * 이 style 키가 이 노드 종류에 실제로 적용되는가.
 * color/typography 는 텍스트 전용 — 프레임에 걸면 배경이 글자색이 되므로 의도적으로 버린다.
 * radius 는 모서리가 있는 노드(frame/instance) 전용 — 타원·선·텍스트에 걸면 Figma 가 거부한다
 * (원은 이미 완전히 둥글므로 계약의 radius:full 의도는 기하로 이미 충족된다).
 */
function isApplicable(styleKey: keyof AnatomyStyles, kind: AnatomyNode['kind']): boolean {
  if (styleKey === 'color' || styleKey === 'typography') return kind === 'text';
  if (styleKey === 'radius') return kind === 'frame' || kind === 'instance';
  return true;
}

/** anatomy 트리를 훑어 (노드, style 키) 쌍을 전부 모은다 */
function collectStyleUses(
  node: AnatomyNode,
): Array<{ kind: AnatomyNode['kind']; key: keyof AnatomyStyles; token: string }> {
  const out: Array<{ kind: AnatomyNode['kind']; key: keyof AnatomyStyles; token: string }> = [];
  const visit = (n: AnatomyNode): void => {
    for (const [key, token] of Object.entries(n.styles ?? {})) {
      out.push({ kind: n.kind, key: key as keyof AnatomyStyles, token });
    }
    for (const child of n.children ?? []) visit(child);
  };
  visit(node);
  return out;
}

describe('codegen 산출물 44건', () => {
  it('44건 전부 로드된다', () => {
    expect(CONTRACTS.length).toBe(44);
  });

  it('모든 계약이 anatomy 를 선언한다 — 파생 폴백에 기대지 않는다', () => {
    const derived = CONTRACTS.filter(
      (c) => buildComponentSetSpec(c, VAR_NAMES).anatomySource !== 'contract',
    ).map((c) => c.name);
    expect(derived).toEqual([]);
  });

  it('모든 계약이 실제 노드 트리로 조립된다 — 빈 컴포넌트가 하나도 없다', () => {
    for (const contract of CONTRACTS) {
      const built = buildComponentSetSpec(contract, VAR_NAMES);
      expect(built.variants.length).toBeGreaterThan(0);
      for (const variant of built.variants) {
        let nodeCount = 0;
        walkNodeSpec(variant.node, () => {
          nodeCount += 1;
        });
        expect(nodeCount, `${contract.name}/${variant.name}`).toBeGreaterThan(1);
      }
    }
  });

  it('anatomy 의 styles 값은 전부 그 계약 tokens / variantTokens 의 실존 키다', () => {
    const bad: string[] = [];
    for (const contract of CONTRACTS) {
      const anatomy = normalizeAnatomy(contract.anatomy);
      if (!anatomy) continue;
      const tokens = contract.tokens ?? {};
      const variantTokens = normalizeVariantTokens(contract.variantTokens);
      const axisValues = Object.values(contract.variantProperties).flatMap((d) => d.values);
      for (const use of collectStyleUses(anatomy)) {
        // 변형 값 후보까지 포함해 하나라도 걸리면 통과 (surface → surfaceDanger 등).
        // 변형별로만 존재하는 키(ToggleSwitch 의 track·stateLabel 처럼 flat tokens 에는 없고
        // variantTokens 에만 있는 값)도 인정한다 — 그 축의 **어느 한 값**에서라도 풀리면 된다.
        const inFlat = resolveStyleToken(tokens, use.token, axisValues) !== null;
        const inVariant = Object.values(variantTokens).some((byValue) =>
          Object.values(byValue).some((keys) => keys[use.token] !== undefined),
        );
        if (!inFlat && !inVariant) bad.push(`${contract.name}.${String(use.key)} → '${use.token}'`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('Variable 바인딩 — 토큰이 걸린 속성은 하나도 빠지지 않는다', () => {
  it.each(REPRESENTATIVES)(
    '%s — 대표 계약이 모든 토큰 속성의 바인딩을 요청한다',
    (_category, contract) => {
      const built = buildComponentSetSpec(contract, VAR_NAMES);
      const anatomy = normalizeAnatomy(contract.anatomy);
      expect(anatomy).not.toBeNull();
      if (!anatomy) return;

      const tokens = contract.tokens ?? {};
      // 축 이름(Figma) → 계약 prop 이름. 실제 빌더가 쓰는 propValues 를 그대로 재현해야
      // 같은 tokenKey 로 대조된다 (상태 축이 생기면서 단순 호출과 결과가 갈렸다).
      const propOfAxis = new Map(built.axes.map((a) => [a.name, a.prop]));
      for (const variant of built.variants) {
        const requested = new Set<string>();
        const reported = new Set<string>();
        walkNodeSpec(variant.node, (node) => {
          for (const binding of node.bindings) requested.add(binding.tokenKey);
          for (const gap of node.unbound) reported.add(gap.tokenKey);
        });

        for (const use of collectStyleUses(anatomy)) {
          if (!isApplicable(use.key, use.kind)) continue;
          const propValues: Record<string, string> = {};
          for (const [axisName, value] of Object.entries(variant.values)) {
            const prop = propOfAxis.get(axisName);
            if (prop !== undefined) propValues[prop] = value;
          }
          const resolved = resolveStyleToken(
            tokens,
            use.token,
            Object.values(variant.values),
            VAR_NAMES,
            built.variantTokens,
            propValues,
          );
          if (resolved === null) continue; // 이 변형에 해당 Variable 이 없다 — 바인딩 대상 아님
          expect(
            requested.has(resolved.tokenKey) || reported.has(resolved.tokenKey),
            `${contract.name}/${variant.name}: ${String(use.key)}='${use.token}' 이 바인딩도 unbound 보고도 되지 않았다`,
          ).toBe(true);
        }
      }
    },
  );

  it('바인딩 요청은 전부 파일에 실존하는 Variable 을 가리킨다', () => {
    for (const contract of CONTRACTS) {
      const built = buildComponentSetSpec(contract, VAR_NAMES);
      for (const binding of built.bindings) {
        expect(VAR_NAMES.has(binding.variable), `${contract.name}: ${binding.variable}`).toBe(true);
      }
    }
  });

  it('바인딩 불가 항목은 전부 사유를 남긴다 — 조용한 누락 금지', () => {
    for (const contract of CONTRACTS) {
      for (const gap of buildComponentSetSpec(contract, VAR_NAMES).unbound) {
        expect(gap.reason.length, `${contract.name}.${gap.field}`).toBeGreaterThan(0);
      }
    }
  });

  it('바인딩 불가는 알려진 세 축에 국한된다 (그 밖은 전부 바인딩돼야 한다)', () => {
    // lineHeight·fontFamily — Figma 의 단위/규격과 토큰이 어긋나는 축.
    // strokeWeight — 계약이 테두리 **색 없이 두께만** 선언한 자리. Figma 는 획이 없는 노드의
    //   strokeWeight 바인딩을 받지 않으므로(실제 실행에서 Pagination·RowActions 가 그랬다)
    //   요청하지 않고 unbound 로 보고한다. 계약에서 stroke 를 채우면 사라진다.
    const fields = new Set<string>();
    for (const contract of CONTRACTS) {
      for (const gap of buildComponentSetSpec(contract, VAR_NAMES).unbound) fields.add(gap.field);
    }
    expect([...fields].sort()).toEqual(['fontFamily', 'lineHeight', 'strokeWeight']);
  });

  it('테두리 색 없이 두께만 선언한 계약을 이름으로 보고한다', () => {
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      for (const gap of buildComponentSetSpec(contract, VAR_NAMES).unbound) {
        if (gap.field !== 'strokeWeight') continue;
        offenders.push(`${contract.name} (${gap.tokenKey})`);
      }
    }
    // 게이트가 아니라 **목록**이다 — 계약을 고칠 때마다 이 숫자가 줄어야 한다
    console.log(
      `
테두리 색 없이 두께만 선언 — ${String(new Set(offenders).size)}건: ` +
        [...new Set(offenders)].join(', '),
    );
    expect(Array.isArray(offenders)).toBe(true);
  });
});

describe('오토레이아웃 — 손으로 놓은 좌표가 없다', () => {
  it.each(REPRESENTATIVES)(
    '%s — 자식을 가진 프레임은 전부 오토레이아웃이다',
    (_category, contract) => {
      const built = buildComponentSetSpec(contract, VAR_NAMES);
      for (const variant of built.variants) {
        walkNodeSpec(variant.node, (node) => {
          if (node.children.length > 0) {
            expect(node.layout, `${contract.name}/${node.name}`).not.toBe('NONE');
          }
        });
      }
    },
  );

  it.each(REPRESENTATIVES)(
    '%s — 가로 스택의 교차축 정렬이 지정돼 베이스라인이 어긋나지 않는다',
    (_category, contract) => {
      const built = buildComponentSetSpec(contract, VAR_NAMES);
      for (const variant of built.variants) {
        walkNodeSpec(variant.node, (node) => {
          if (node.layout === 'HORIZONTAL') expect(node.align).toBeDefined();
        });
      }
    },
  );
});

describe('변형 매트릭스 — 모든 변형이 라벨 붙은 칸 하나씩', () => {
  it.each(REPRESENTATIVES)('%s — 칸 수가 변형 수와 정확히 같다', (_category, contract) => {
    const built = buildComponentSetSpec(contract, VAR_NAMES);
    const plan = planVariantMatrix(built);
    expect(plan.cellCount).toBe(built.variants.length);

    const placed = plan.blocks.flatMap((b) =>
      b.rows.flatMap((r) => r.cells.map((c) => c.variantName)),
    );
    expect(new Set(placed).size).toBe(built.variants.length);
    for (const cell of plan.blocks.flatMap((b) => b.rows.flatMap((r) => r.cells))) {
      expect(cell.label.length).toBeGreaterThan(0);
    }
  });

  it('변형이 가장 많은 계약(Icon)도 상한 안에서 전부 배치된다', () => {
    const icon = CONTRACTS.find((c) => c.name === 'Icon');
    expect(icon).toBeDefined();
    if (!icon) return;
    const built = buildComponentSetSpec(icon, VAR_NAMES);
    expect(built.variants.length).toBeGreaterThan(1);
    expect(planVariantMatrix(built).cellCount).toBe(built.variants.length);
  });
});

describe('카테고리 분류', () => {
  it('44건이 정본 순서 그대로, 누락 없이 묶인다', () => {
    const groups = groupByCategory(
      CONTRACTS.map((c) => ({ name: c.name, category: c.category ?? 'Utilities' })),
      CATEGORY_ORDER,
    );
    expect(groups.map((g) => g.category)).toEqual(CATEGORY_ORDER);
    expect(groups.reduce((sum, g) => sum + g.items.length, 0)).toBe(CONTRACTS.length);
  });

  it('계약이 있는 모든 카테고리에 대표 검사가 존재한다', () => {
    const withItems = new Set(CONTRACTS.map((c) => c.category ?? 'Utilities'));
    expect(new Set(REPRESENTATIVES.map(([category]) => category))).toEqual(withItems);
  });
});
