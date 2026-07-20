/**
 * 렌더 품질 게이트 — **실제 Figma 화면에서 관측된 증상** 기준으로 44개 전부를 검사한다.
 *
 * 이 파일이 생긴 이유: 자기 검사가 "텍스트가 비지 않았다" 만 보고 있어서, 툴바 버튼 8개가
 * 전부 'B' 인 것도, 탭 4개가 전부 '대시보드' 인 것도 초록으로 통과시켰다.
 * **비어 있지 않은 것과 제대로 만들어진 것은 다르다.**
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { ComponentFigmaSpec } from '../../spec/component-spec';
import { buildComponentSetSpec } from '../../spec/component-spec';
import { walkNodeSpec, type NodeSpec } from '../../spec/node-spec';

const GEN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../generated');
const CONTRACTS: ComponentFigmaSpec[] = readdirSync(GEN)
  .filter((f) => f.endsWith('.figma.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(GEN, f), 'utf8')) as ComponentFigmaSpec);

const VAR_NAMES: ReadonlySet<string> = new Set(
  (
    JSON.parse(readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8')) as {
      variables: Array<{ name: string }>;
    }
  ).variables.map((v) => v.name),
);

/** Variable 이름 → 해석값 (플러그인이 런타임에 Variable 에서 읽는 것과 같은 데이터) */
const TOKEN_VALUES: ReadonlyMap<string, string | number | boolean> = new Map(
  (
    JSON.parse(readFileSync(path.join(GEN, 'tokens/figma-variables.json'), 'utf8')) as {
      variables: Array<{ name: string; values: { light: string | number | boolean } }>;
    }
  ).variables.map((v) => [v.name, v.values.light]),
);

/** 기본 변형 하나의 트리 */
function defaultTree(contract: ComponentFigmaSpec): NodeSpec | null {
  const spec = buildComponentSetSpec(contract, VAR_NAMES, TOKEN_VALUES);
  const variant = spec.variants.find((v) => v.isDefault) ?? spec.variants[0];
  return variant?.node ?? null;
}

describe('렌더 품질 — 44개 전부', () => {
  it('반복된 형제 텍스트가 회차마다 같으면 안 된다 (만들다 만 것으로 보인다)', () => {
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      const tree = defaultTree(contract);
      if (!tree) continue;
      walkNodeSpec(tree, (node) => {
        // 반복 전개된 형제들은 이름이 'X 1' 'X 2' … 로 갈린다
        const groups = new Map<string, string[]>();
        for (const child of node.children) {
          const matched = /^(.*) \d+$/.exec(child.name);
          const base = matched?.[1];
          if (base === undefined) continue;
          const texts: string[] = [];
          walkNodeSpec(child, (n) => {
            if (n.kind === 'text' && n.characters !== undefined) texts.push(n.characters);
          });
          if (texts.length === 0) continue;
          // 계약이 '회차가 같은 것이 옳다' 고 선언한 반복은 예외다
          // (갤러리 타일마다 붙는 동일한 삭제 버튼, 표의 행 골격 등)
          if (child.uniformRepeat === true) continue;
          const bucket = groups.get(base) ?? [];
          bucket.push(texts.join(''));
          groups.set(base, bucket);
        }
        for (const [base, prints] of groups) {
          if (prints.length < 2) continue;
          if (new Set(prints).size === 1) {
            const shown = (prints[0] ?? '').split('').join(' + ');
            offenders.push(`${contract.name} > ${base} x${String(prints.length)} = "${shown}"`);
          }
        }
      });
    }
    expect(
      offenders,
      `반복 부위가 회차마다 같은 글자다 (${String(offenders.length)}건):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('폭·높이가 모두 고정된 텍스트가 없어야 한다 (내용이 길어지면 잘린다)', () => {
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      const tree = defaultTree(contract);
      if (!tree) continue;
      walkNodeSpec(tree, (node) => {
        if (node.kind !== 'text') return;
        if (node.width !== undefined && node.height !== undefined) {
          offenders.push(
            `${contract.name} > ${node.name} (${String(node.width)}x${String(node.height)})`,
          );
        }
      });
    }
    expect(
      offenders,
      `폭·높이가 모두 고정된 텍스트 (${String(offenders.length)}건):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('자식이 채우는 축은 부모가 고정이어야 한다 (hug+fill 모순 0건)', () => {
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      const tree = defaultTree(contract);
      if (!tree) continue;
      walkNodeSpec(tree, (node) => {
        const hasGrowChild = node.children.some((c) => c.grow === true);
        if (hasGrowChild && node.layout !== 'NONE' && node.primaryAxisFixed !== true) {
          offenders.push(`${contract.name} > ${node.name}`);
        }
      });
    }
    expect(
      offenders,
      `hug 인데 자식이 채우려 한다 (${String(offenders.length)}건):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  // [반복 텍스트] 위 검사는 **기본 변형 하나**만 본다. 반복이 when 조건 안에 있거나 변형마다
  // 회차 수가 다르면 기본 변형에서는 멀쩡하고 다른 변형에서만 회차가 같아질 수 있다 —
  // 기본형만 보는 게이트는 그 자리를 구조적으로 못 본다.
  it('반복 회차 동일은 기본 변형만이 아니라 **모든 변형**에서 없다', () => {
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      const spec = buildComponentSetSpec(contract, VAR_NAMES, TOKEN_VALUES);
      for (const variant of spec.variants) {
        walkNodeSpec(variant.node, (node) => {
          const groups = new Map<string, string[]>();
          for (const child of node.children) {
            const base = /^(.*) \d+$/.exec(child.name)?.[1];
            if (base === undefined) continue;
            if (child.uniformRepeat === true) continue;
            const texts: string[] = [];
            walkNodeSpec(child, (n) => {
              if (n.kind === 'text' && n.characters !== undefined) texts.push(n.characters);
            });
            if (texts.length === 0) continue;
            const bucket = groups.get(base) ?? [];
            bucket.push(texts.join(''));
            groups.set(base, bucket);
          }
          for (const [base, prints] of groups) {
            if (prints.length < 2) continue;
            if (new Set(prints).size === 1) {
              offenders.push(
                `${contract.name}/${variant.name} > ${base} x${String(prints.length)}`,
              );
            }
          }
        });
      }
    }
    expect(
      [...new Set(offenders)],
      `반복 회차가 같은 자리 (${String(new Set(offenders).size)}건):\n${[...new Set(offenders)].join('\n')}`,
    ).toEqual([]);
  });

  // [기호 → 벡터] 아이콘 59종이 전부 같은 글리프로 보였던 결함의 게이트.
  // 이름 커버리지(coverage.test.ts)는 '계약 enum 과 구현 목록이 같다'만 보므로, 변형마다
  // **실제로 다른 도형**이 실리는지는 아무도 확인하지 않았다. 그 둘은 다른 사실이다.
  it('아이콘 변형은 저마다 다른 벡터를 싣는다 (전부 같은 글리프 0건)', () => {
    const icon = CONTRACTS.find((c) => c.name === 'Icon');
    expect(icon, 'Icon 계약이 없다').toBeDefined();
    if (!icon) return;
    const spec = buildComponentSetSpec(icon, VAR_NAMES, TOKEN_VALUES);

    const svgOf = new Map<string, string>();
    const missing: string[] = [];
    for (const variant of spec.variants) {
      walkNodeSpec(variant.node, (n) => {
        if (n.kind !== 'vector') return;
        if (n.svg === undefined || n.svg.length === 0) missing.push(variant.name);
        else svgOf.set(variant.name, n.svg);
      });
    }
    expect(missing, `벡터 자산이 비어 빈 프레임이 될 변형: ${missing.join(', ')}`).toEqual([]);
    // 크기 축이 있으면 같은 이름의 변형이 여러 개다 — 도형 자체의 가짓수로 센다
    const distinct = new Set(svgOf.values()).size;
    console.log(`아이콘 변형 ${String(svgOf.size)}개 · 서로 다른 벡터 ${String(distinct)}종`);
    expect(distinct, '모든 아이콘 변형이 같은 도형을 싣고 있다').toBeGreaterThan(1);
  });

  // [기호 → 벡터] 남은 자리의 **목록**이다 — 게이트가 아니다.
  // 고칠 곳이 계약(contracts/*.contract.json 의 anatomy)이라 플러그인 쪽에서 통과시킬 수 없다.
  // 텍스트로 남은 기호는 런타임 폰트 폴백을 일으키고, 그 폴백 폰트가 미로드면 그 노드의
  // 이후 모든 쓰기가 터진다(plugin-build-rules §5.3·5.5). 계약이 kind:'vector' + svgIcon 으로
  // 바뀔 때마다 이 숫자가 줄어야 한다.
  it('텍스트로 남은 기호 글리프를 이름으로 보고한다', () => {
    /** ASCII 인쇄 가능 + 한글만 안전하다고 본다 — 그 밖은 폴백 후보다 */
    const SAFE = /^[ -~가-힣ㄱ-ㆎ]*$/;
    const offenders: string[] = [];
    for (const contract of CONTRACTS) {
      const tree = defaultTree(contract);
      if (!tree) continue;
      walkNodeSpec(tree, (n) => {
        if (n.kind !== 'text' || n.characters === undefined) return;
        // 산문이 아니라 **기호 하나로 이루어진 부위**만 센다. 본문 속의 가운뎃점·en dash 는
        // 폴백이 나더라도 Noto 계열이 이미 로드돼 있어 실무상 문제가 되지 않았다.
        if (n.characters.length > 2 || SAFE.test(n.characters)) return;
        offenders.push(`${contract.name} > ${n.name} "${n.characters}"`);
      });
    }
    console.log(
      `\n텍스트로 남은 기호 글리프 — ${String(new Set(offenders).size)}건 (계약 수정 대상): ` +
        [...new Set(offenders)].join(', '),
    );
    expect(Array.isArray(offenders)).toBe(true);
  });

  it('타이포 토큰이 걸린 텍스트는 줄 높이가 실제로 적용된다 (바인딩 불가로 포기하지 않는다)', () => {
    let applied = 0;
    const givenUp: string[] = [];
    for (const contract of CONTRACTS) {
      const spec = buildComponentSetSpec(contract, VAR_NAMES, TOKEN_VALUES);
      for (const gap of spec.unbound) {
        if (gap.field === 'lineHeight') givenUp.push(`${contract.name} (${gap.tokenKey})`);
      }
      const tree = defaultTree(contract);
      if (!tree) continue;
      walkNodeSpec(tree, (n) => {
        if (n.kind === 'text' && n.lineHeightPercent !== undefined) applied += 1;
      });
    }
    console.log(
      `줄 높이 적용 ${String(applied)}개 레이어 · 여전히 포기 ${String(new Set(givenUp).size)}건`,
    );
    expect(applied, '줄 높이가 적용된 레이어가 하나도 없다').toBeGreaterThan(0);
    expect(
      [...new Set(givenUp)],
      `줄 높이를 여전히 포기한 계약: ${[...new Set(givenUp)].join(' | ')}`,
    ).toEqual([]);
  });
});
