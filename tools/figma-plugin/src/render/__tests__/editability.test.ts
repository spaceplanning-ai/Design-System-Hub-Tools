/**
 * 편집 가능성 — 디자이너가 피그마 인스턴스에서 **글자를 고칠 수 있는가**를 숫자로 낸다.
 *
 * 이 파일이 생긴 이유: `레이어연결 0` 이 여섯 라운드 동안 그냥 지나갔다. 속성이 레이어에
 * 붙었는지 아무도 검사하지 않았기 때문이다(참조 구현도 attach 실패를 조용히 삼킨다 —
 * build-set.ts 의 addTextProp/addBoolProp 은 통째로 try/catch 다).
 * 붙지 않은 것을 **이름으로** 세지 않으면 0인지도 모른다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import {
  buildOnMock,
  installFigmaMock,
  MockComponentNode,
  MockComponentSetNode,
  MockNode,
  MockTextNode,
  MockVariable,
} from './figma-mock';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const INTER = { family: 'Inter', style: 'Regular' };

const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

async function setup(): Promise<{ vars: Map<string, MockVariable>; page: MockNode }> {
  const figma = installFigmaMock();
  for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
    await figma.loadFontAsync({ family: 'Inter', style });
  }
  const tokens = JSON.parse(
    readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
  ) as { collection: string; variables: Array<{ name: string; type: string }> };
  const col = figma.variables.createVariableCollection(tokens.collection);
  const vars = new Map<string, MockVariable>();
  for (const spec of tokens.variables) {
    vars.set(spec.name, figma.variables.createVariable(spec.name, col, spec.type));
  }
  return { vars, page: figma.createPage() };
}

/** 이 세트의 기본 변형(단일 컴포넌트면 자기 자신) */
function representative(node: MockNode): MockNode {
  if (node instanceof MockComponentSetNode) {
    return node.children.find((c) => c instanceof MockComponentNode) ?? node;
  }
  return node;
}

describe('편집 가능성 — 44개 전부', () => {
  let env: Awaited<ReturnType<typeof setup>>;

  beforeEach(async () => {
    env = await setup();
  });

  it('선언한 속성은 전부 세트에 실제로 생성된다', () => {
    const missing: string[] = [];
    for (const contract of CONTRACTS) {
      const node = buildOnMock(contract, env.page, env.vars, INTER, []);
      const host = node instanceof MockComponentSetNode ? node : node;
      const defs =
        host instanceof MockComponentSetNode || host instanceof MockComponentNode
          ? Object.keys(host.componentPropertyDefinitions)
          : [];
      for (const p of contract.properties ?? []) {
        if (p.type === 'VARIANT') continue;
        const found = defs.some((k) => k === p.name || k.startsWith(`${p.name}#`));
        if (!found) missing.push(`${contract.name}.${p.name} (${p.type})`);
      }
    }
    expect(missing, `세트에 생성되지 않은 속성:\n${missing.join('\n')}`).toEqual([]);
  });

  it('연결을 선언한 레이어는 실제로 연결된다 (조용한 실패 0건)', () => {
    const broken: string[] = [];
    for (const contract of CONTRACTS) {
      const node = buildOnMock(contract, env.page, env.vars, INTER, []);
      const rep = representative(node);
      // anatomy 가 textProp 을 선언한 레이어 이름들
      const wants = new Set<string>();
      const walkAnatomy = (raw: unknown): void => {
        if (typeof raw !== 'object' || raw === null) return;
        const r = raw as { kind?: unknown; name?: unknown; textProp?: unknown; children?: unknown };
        if (r.kind === 'text' && typeof r.textProp === 'string' && typeof r.name === 'string') {
          wants.add(r.name);
        }
        if (Array.isArray(r.children)) for (const c of r.children) walkAnatomy(c);
      };
      walkAnatomy(contract.anatomy);

      for (const layerName of wants) {
        const layers = rep.findAll((n) => n instanceof MockTextNode && n.name === layerName);
        if (layers.length === 0) continue; // when 조건으로 이 변형엔 없을 수 있다
        for (const layer of layers) {
          const refs = layer.componentPropertyReferences;
          if (refs?.['characters'] === undefined) {
            broken.push(`${contract.name} > ${layerName}`);
          }
        }
      }
    }
    expect(broken, `TEXT 속성이 레이어에 붙지 않았다:\n${broken.join('\n')}`).toEqual([]);
  });

  it('편집 가능/불가 텍스트 레이어 수를 계약별로 보고한다', () => {
    let editable = 0;
    let locked = 0;
    const lockedByContract: string[] = [];

    for (const contract of CONTRACTS) {
      const node = buildOnMock(contract, env.page, env.vars, INTER, []);
      const rep = representative(node);
      const texts = rep.findAll((n) => n instanceof MockTextNode);
      const names: string[] = [];
      for (const t of texts) {
        const refs = t.componentPropertyReferences;
        if (refs?.['characters'] !== undefined) editable += 1;
        else {
          locked += 1;
          names.push(t.name);
        }
      }
      if (names.length > 0) {
        lockedByContract.push(`${contract.name}: ${[...new Set(names)].join(', ')}`);
      }
    }

    console.log(
      `\n편집 가능한 텍스트 레이어 ${String(editable)}개 · 고칠 수 없는 레이어 ${String(locked)}개\n` +
        `고칠 수 없는 레이어(계약에 TEXT 속성 선언이 없다):\n${lockedByContract.join('\n')}`,
    );
    // 게이트가 아니라 **측정**이다 — 계약에 속성을 넣을 때마다 locked 가 줄어야 한다
    expect(editable + locked).toBeGreaterThan(0);
  });
});
