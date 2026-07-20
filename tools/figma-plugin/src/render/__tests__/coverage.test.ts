/**
 * 커버리지 게이트 — **정본에서 기계적으로 열거**하고, 플러그인이 실제로 만든 노드 집합과 대조한다.
 *
 * 왜 있는가: 이번 세션에 누락을 사람이 스크린샷으로 찾는 방식이 네 번 실패했다.
 * 목록을 손으로 박아 넣으면 정본이 바뀔 때 조용히 뒤처지므로, 여기서는 어떤 이름도 하드코딩하지
 * 않는다 — contracts/*.contract.json 과 codegen 산출물을 그대로 읽어 차집합을 낸다.
 * 차집합이 비어 있지 않으면 **무엇이 빠졌는지 이름으로** 실패한다.
 *
 * 화면 계약이 아직 움직이는 중이라(다른 에이전트들이 동시에 고치고 있다) 이 구조는 그 변경을
 * 자동으로 따라간다. 새 계약이 들어오면 여기 게이트가 먼저 그것을 요구한다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { extractAllIcons } from '../../../../codegen/src/extract-icons';
import { buildComponentSetSpec } from '../../spec/component-spec';
import {
  buildOnMock,
  installFigmaMock,
  MockComponentNode,
  MockComponentSetNode,
  MockNode,
  MockVariable,
} from './figma-mock';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(HERE, '../../../generated');
const CONTRACTS_DIR = path.resolve(HERE, '../../../../../contracts');

const INTER = { family: 'Inter', style: 'Regular' };

interface RawContract {
  name: string;
  category?: string;
  states?: string[];
  props?: Record<string, { type?: string; values?: string[]; figmaProperty?: string }>;
}

/** 정본 — contracts/*.contract.json. 이름을 손으로 적지 않는다. */
const SSOT: RawContract[] = readdirSync(CONTRACTS_DIR)
  .filter((f) => f.endsWith('.contract.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(CONTRACTS_DIR, f), 'utf8')) as RawContract);

/** codegen 산출물 — 플러그인이 실제로 받는 입력 */
const GENERATED: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

function setup(): { vars: Map<string, MockVariable>; page: MockNode } {
  const figma = installFigmaMock();
  const tokens = JSON.parse(
    readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
  ) as { collection: string; variables: Array<{ name: string; type: string }> };
  const collection = figma.variables.createVariableCollection(tokens.collection);
  const vars = new Map<string, MockVariable>();
  for (const spec of tokens.variables) {
    vars.set(spec.name, figma.variables.createVariable(spec.name, collection, spec.type));
  }
  return { vars, page: figma.createPage() };
}

async function setupAsync(): Promise<ReturnType<typeof setup>> {
  const figma = installFigmaMock();
  for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
    await figma.loadFontAsync({ family: 'Inter', style });
  }
  const tokens = JSON.parse(
    readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
  ) as { collection: string; variables: Array<{ name: string; type: string }> };
  const collection = figma.variables.createVariableCollection(tokens.collection);
  const vars = new Map<string, MockVariable>();
  for (const spec of tokens.variables) {
    vars.set(spec.name, figma.variables.createVariable(spec.name, collection, spec.type));
  }
  return { vars, page: figma.createPage() };
}

describe('커버리지 — 정본 열거 대 실제 생성물', () => {
  it('모든 계약이 codegen 산출물을 갖는다 (조용한 누락 0건)', () => {
    const ssotNames = SSOT.map((c) => c.name).sort();
    const genNames = GENERATED.map((c) => c.name).sort();
    const missing = ssotNames.filter((n) => !genNames.includes(n));
    const extra = genNames.filter((n) => !ssotNames.includes(n));
    expect(missing, `codegen 산출물이 없는 계약: ${missing.join(', ')}`).toEqual([]);
    expect(extra, `정본에 없는 산출물: ${extra.join(', ')}`).toEqual([]);
  });

  it('모든 계약이 실제 노드로 조립된다 — 실패한 계약을 이름으로 보고한다', async () => {
    const env = await setupAsync();
    const failed: string[] = [];
    for (const contract of GENERATED) {
      try {
        buildOnMock(contract, env.page, env.vars, INTER, []);
      } catch (error) {
        failed.push(`${contract.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    expect(failed, `조립에 실패한 계약:\n${failed.join('\n')}`).toEqual([]);
  });

  it('계약이 선언한 모든 변형 조합이 실제 컴포넌트로 존재한다', async () => {
    const env = await setupAsync();
    const gaps: string[] = [];
    for (const contract of GENERATED) {
      const spec = buildComponentSetSpec(contract, new Set(env.vars.keys()));
      const node = buildOnMock(contract, env.page, env.vars, INTER, []);
      const declared = spec.variants.map((v) => v.name).sort();

      const actual =
        node instanceof MockComponentSetNode
          ? node.children
              .filter((c): c is MockComponentNode => c instanceof MockComponentNode)
              .map((c) => c.name)
              .sort()
          : [contract.name];

      if (declared.length === 1) continue; // 단일 컴포넌트는 이름이 계약명으로 바뀐다
      const missing = declared.filter((d) => !actual.includes(d));
      if (missing.length > 0) gaps.push(`${contract.name}: ${missing.join(' | ')}`);
    }
    expect(gaps, `변형 조합 누락:\n${gaps.join('\n')}`).toEqual([]);
  });

  it('변형축 값이 계약 enum 과 정확히 일치한다 (variant 전환 증명)', async () => {
    const env = await setupAsync();
    const gaps: string[] = [];
    for (const contract of GENERATED) {
      const node = buildOnMock(contract, env.page, env.vars, INTER, []);
      if (!(node instanceof MockComponentSetNode)) continue;

      // 계약이 선언한 축 → 값 집합
      const declared = new Map<string, Set<string>>();
      for (const p of contract.properties ?? []) {
        if (p.type === 'VARIANT' && Array.isArray(p.values)) {
          declared.set(p.name, new Set(p.values));
        }
      }
      // 실제 생성된 변형에서 축 → 값 집합
      const actual = new Map<string, Set<string>>();
      for (const child of node.children) {
        if (!(child instanceof MockComponentNode)) continue;
        const props = child.variantProperties;
        if (props === null) {
          gaps.push(`${contract.name}: 변형 '${child.name}' 이 Prop=Value 형식이 아니다`);
          continue;
        }
        for (const [axis, value] of Object.entries(props)) {
          const bucket = actual.get(axis) ?? new Set<string>();
          bucket.add(value);
          actual.set(axis, bucket);
        }
      }
      for (const [axis, values] of declared) {
        const got = actual.get(axis);
        if (got === undefined) {
          gaps.push(`${contract.name}: 축 '${axis}' 이 생성되지 않았다`);
          continue;
        }
        const missing = [...values].filter((v) => !got.has(v));
        if (missing.length > 0) {
          gaps.push(`${contract.name}.${axis}: 값 누락 ${missing.join(', ')}`);
        }
      }
    }
    expect(gaps, `변형축 누락:\n${gaps.join('\n')}`).toEqual([]);
  });

  it('커버리지 표 — 카테고리별 [정본 / 생성 / 누락]', async () => {
    const env = await setupAsync();
    const byCategory = new Map<string, { ssot: string[]; built: string[]; failed: string[] }>();

    for (const contract of GENERATED) {
      const category = contract.category ?? 'Utilities';
      const row = byCategory.get(category) ?? { ssot: [], built: [], failed: [] };
      row.ssot.push(contract.name);
      try {
        const node = buildOnMock(contract, env.page, env.vars, INTER, []);
        const variants =
          node instanceof MockComponentSetNode
            ? node.children.filter((c) => c instanceof MockComponentNode).length
            : 1;
        row.built.push(`${contract.name}(${String(variants)})`);
      } catch (error) {
        row.failed.push(`${contract.name}: ${error instanceof Error ? error.message : ''}`);
      }
      byCategory.set(category, row);
    }

    const lines = ['', '카테고리\t정본\t생성\t누락'];
    let totalMissing = 0;
    for (const [category, row] of [...byCategory.entries()].sort()) {
      totalMissing += row.failed.length;
      lines.push(
        `${category}\t${String(row.ssot.length)}\t${String(row.built.length)}\t${
          row.failed.length > 0 ? row.failed.join(' | ') : '-'
        }`,
      );
    }
    lines.push(`합계\t${String(GENERATED.length)}\t누락 ${String(totalMissing)}`);
    // 표는 리포트용이다 — 게이트는 위의 단언들이 건다
    console.log(lines.join('\n'));
    expect(totalMissing).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 아이콘 — 정본(계약 enum) 대 앱이 실제로 쓰는 아이콘
// ---------------------------------------------------------------------------

describe('아이콘 커버리지 — 계약 enum 대 실사용', () => {
  it('실제 구현에서 추출한 아이콘이 계약 enum 과 정확히 일치한다', () => {
    const repoRoot = path.resolve(HERE, '../../../../..');
    // **추출기를 그대로 쓴다** — 커버리지 판정 규칙을 여기 다시 적으면 두 벌이 되어 어긋난다.
    // (RowIcon 처럼 다른 아이콘에 위임만 하는 디스패처는 <svg> 가 없어 자연히 빠진다)
    const extracted = extractAllIcons(repoRoot)
      .map((icon) => icon.name)
      .sort();

    const contract = SSOT.find((c) => c.name === 'Icon');
    const declared = [...(contract?.props?.['name']?.values ?? [])].sort();

    const missing = extracted.filter((n) => !declared.includes(n));
    const stale = declared.filter((n) => !extracted.includes(n));

    console.log(
      `
아이콘 — 구현 ${String(extracted.length)}종 / 계약 enum ${String(declared.length)}종` +
        `
계약에 없는 구현: ${missing.length > 0 ? missing.join(', ') : '없음'}` +
        `
구현에 없는 계약값: ${stale.length > 0 ? stale.join(', ') : '없음'}`,
    );

    expect(missing, `계약 enum 에 빠진 아이콘: ${missing.join(', ')}`).toEqual([]);
    expect(stale, `구현이 사라진 계약값: ${stale.join(', ')}`).toEqual([]);
  });

  it('모든 아이콘이 실제 벡터 도형을 갖는다 (빈 글리프 0건)', () => {
    const repoRoot = path.resolve(HERE, '../../../../..');
    const empty = extractAllIcons(repoRoot)
      .filter((icon) => !/<(path|rect|circle|line|polyline|polygon|ellipse)/.test(icon.svg))
      .map((icon) => icon.name);
    expect(empty, `도형이 없는 아이콘: ${empty.join(', ')}`).toEqual([]);
  });
});
