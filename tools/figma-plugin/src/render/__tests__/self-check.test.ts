/**
 * 자기 검사 회로 자체를 검증한다 — 플러그인이 런타임에 돌리는 것과 **같은 함수**를 목 위에서
 * 돌려, 44개 계약 전부에 대해 실패 목록이 비어 있는지 본다.
 *
 * 목이 실제 Figma 와 어긋날 수 있으므로 이것이 "피그마에서 통과한다"는 증명은 아니다.
 * 다만 자기 검사 회로가 **작동한다**는 것과, 목이 보는 한 실패가 0 이라는 것은 증명한다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { buildOnMock, installFigmaMock, MockNode, MockVariable } from './figma-mock';
import { formatFailures, type CheckFailure } from '../self-check';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);
const INTER = { family: 'Inter', style: 'Regular' };

async function env(): Promise<{ vars: Map<string, MockVariable>; page: MockNode }> {
  const figma = installFigmaMock();
  for (const style of ['Regular', 'Medium', 'Semi Bold', 'Bold']) {
    await figma.loadFontAsync({ family: 'Inter', style });
  }
  const tokens = JSON.parse(
    readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8'),
  ) as { collection: string; variables: Array<{ name: string; type: string }> };
  const col = figma.variables.createVariableCollection(tokens.collection);
  const vars = new Map<string, MockVariable>();
  for (const s of tokens.variables)
    vars.set(s.name, figma.variables.createVariable(s.name, col, s.type));
  return { vars, page: figma.createPage() };
}

describe('자기 검사 — 44개 계약 전수', () => {
  it('실패 0건이어야 한다 (실패는 항목별로 이름이 찍힌다)', async () => {
    const e = await env();
    const failures: CheckFailure[] = [];
    for (const contract of CONTRACTS) {
      buildOnMock(contract, e.page, e.vars, INTER, [], failures);
    }
    const byCheck = new Map<string, number>();
    for (const f of failures) byCheck.set(f.check, (byCheck.get(f.check) ?? 0) + 1);
    console.log(
      `\n자기 검사 실패 ${String(failures.length)}건` +
        (failures.length > 0
          ? ` — 항목별: ${[...byCheck].map(([k, v]) => `${k}:${String(v)}`).join(' ')}\n` +
            formatFailures(failures).slice(0, 40).join('\n')
          : ''),
    );
    expect(failures.length, formatFailures(failures).slice(0, 30).join('\n')).toBe(0);
  });
});
