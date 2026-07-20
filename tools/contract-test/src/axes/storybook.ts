/**
 * 축 2 — Contract ↔ Storybook (설계서 §5.3)
 *
 * 검사 항목:
 *  1) generated argTypes 존재 — packages/ui/generated/**\/<Name>.argtypes.ts
 *  2) <Name>.stories.tsx 가 generated argTypes 를 import 하는지 정적 검사
 *  3) enum 값 커버리지 — 계약이 선언한 enum 값이 **하나도 빠짐없이** Story 소스에 등장하는가
 *  4) 부분 구현 검출 — 변형 축이 있는데 Story 가 하나뿐인가
 *  5) 컨트롤 노출 — meta 가 컨트롤을 통째로 끄지 않고, enum/boolean prop 이 argTypes 에 다 있는가
 *
 * Story/argTypes 산출물이 전혀 없으면 축 SKIP (부트스트랩 단계).
 *
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 조합 수 세기를 그만두었나 — 2026-07-20]
 *
 * 예전 3번 검사는 `export 된 Story 수 >= combinationMatrix 크기` 였다. Button 은
 * variant 4 × size 3 × loading 2 × disabled 2 × isFullWidth 2 = **96칸**이 필요했고,
 * 그래서 `SecondarySmFullWidthLoading` 같은 export 가 96개 늘어섰다. 그것은 문서가 아니다 —
 * 사람은 사이드바에서 96줄을 읽지 않고, 96칸 중 95칸은 컨트롤 패널에서 1초에 만들어진다.
 *
 * 이 리포는 그 논거를 **이미 갖고 있었다.** 아래 assetAxisProps 주석이 자산 축에 대해
 * "59종을 Story 59개로 늘어놓는 것은 커버리지가 아니라 잡음이고 갤러리 Story 하나가 전량을
 * 보여 주는 편이 낫다" 고 적어 두었다. 같은 논리가 variant × size × boolean 축에도 그대로
 * 적용된다 — 조합은 값의 곱이지 문서의 곱이 아니다. **면제를 지우는 것이 아니라 일반화한다.**
 *
 * 그래서 재는 대상을 바꾼다: **조합의 개수**가 아니라 **문서의 품질**이다.
 *   - 값이 빠지지 않았는가 (3번) — 갤러리 한 칸이 만족시킨다
 *   - 보여 줄 것이 둘 이상 있는가 (4번) — 기본형 하나뿐인 부분 구현을 잡는다
 *   - 변수들이 실제로 컨트롤에 노출돼 있는가 (5번) — 오너가 말한 "변수로 바꿔 보면 된다" 지점
 *
 * [4번이 이름을 요구하지 않는 이유 — 2026-07-20 2차 정정]
 * 처음에는 기본형·Playground·갤러리를 **이름으로** 요구했다. 55개 중 53개가 실패했고 HEAD 에서
 * 한 줄도 안 바뀐 Button 조차 걸렸다. 원인은 리포가 그 관습을 쓰지 않는다는 것이었다 —
 * Alert 의 기본형은 `Danger`·`Info` 이고 Button 은 `PrimarySmDefault` 다. 전면 실패하는 게이트는
 * 기준이 현실과 다른 것이지 리포가 전부 틀린 것이 아니다. **조합 수 세기를 버린 그 실수를
 * 작명 강제로 반복할 뻔했다.**
 *
 * [이 게이트가 잡는 것]
 *   - 계약에 variant 값을 추가하고 Story 를 안 고친 경우 → 3번 FAIL
 *   - 변형 축이 있는데 Story 가 하나뿐인 "부분 구현" → 4번 FAIL
 *     (ssot-pipeline.md §1-④ "스토리가 기본형 하나뿐이면 존재가 아니라 부분 구현이다")
 *   - meta 에서 컨트롤을 꺼 놓아 아무것도 못 돌려보는 문서 → 5번 FAIL
 *   - codegen 이 prop 을 빠뜨려 argTypes 에 안 나오는 경우 → 5번 FAIL
 *
 * [이 게이트가 못 잡는 것 — 알고 통과시킨다]
 *   - **값이 "등장"할 뿐 실제로 렌더되는지는 모른다.** 죽은 상수 배열에 값만 적어 두면 3번은
 *     통과한다. 렌더 여부는 정적 검사의 사거리 밖이고, 그 판정은 VRT(@tds/vrt)와 사람의 눈이 한다.
 *   - **Story 두 개가 서로 다른 것을 보여 주는지는 모른다.** 4번은 개수만 센다.
 *   - **상태(states) 커버리지는 여기서 재지 않는다.** 중복 게이트를 만들지 않는다 —
 *     `@tds/test-coverage` 축2(contract-states)가 계약 states 전량을 **단언 있는** 테스트/play
 *     대조로 이미 강제한다(tools/test-coverage/src/axes/contract-states.ts). 이 축이 상태를
 *     또 세면 같은 것을 두 번 세면서 서로 다른 기준으로 싸운다.
 *   - **시각적 정확성은 전혀 못 본다.** 이 축은 문서의 존재와 구성을 볼 뿐 픽셀을 보지 않는다.
 */
import path from 'node:path';
import { posixBasename, readText } from '../lib/fsutil.ts';
import type { AxisContext, AxisResult, Check, Contract } from '../lib/types.ts';
import { summarizeStatuses } from '../lib/types.ts';

/**
 * anatomy 가 svgFrom 으로 "이 prop 은 **자산(모양)을 고르는 축**" 이라고 선언한 prop 이름들.
 *
 * 자산 축은 동작(behaviour)이 아니라 데이터다 — 값마다 코드 경로가 달라지지 않고 그리는 모양만
 * 바뀐다. 아이콘 59종을 Story 59개로 늘어놓는 것은 커버리지가 아니라 잡음이고, 실제로 아무도
 * 그렇게 문서화하지 않는다(갤러리 Story 하나가 전량을 보여 주는 편이 낫다).
 *
 * 그래서 자산 축의 값은 **개별 등장을 요구하지 않는다.** 대신 갤러리 Story 존재를 요구한다
 * (아래 requiresGallery). 자산 이름 전량은 생성물에서 오는 것이 정상이라 — Icon.stories.tsx 의
 * Gallery 는 `Object.keys(ICON_SHAPES)` 를 돈다 — 소스에 리터럴로 적히지 않기 때문이다.
 * 이름 단위 전량 대조는 Figma 쪽 커버리지 게이트(tools/figma-plugin coverage.test.ts)가 한다.
 */
function assetAxisProps(contract: Contract): Set<string> {
  const out = new Set<string>();
  const walk = (node: unknown): void => {
    if (typeof node !== 'object' || node === null) return;
    const record = node as { svgFrom?: unknown; children?: unknown };
    if (typeof record.svgFrom === 'string') out.add(record.svgFrom);
    if (Array.isArray(record.children)) for (const child of record.children) walk(child);
  };
  walk((contract as { anatomy?: unknown }).anatomy);
  return out;
}

/**
 * 주석과 import 문을 걷어낸 소스 — **값 커버리지는 이 위에서만 센다.**
 *
 * [왜 반드시 걷어내는가] 주석까지 세는 검사는 설명문에 값을 적어 두는 것만으로 통과한다.
 * 실제로 이 리포에서 한 작업자가 설명 주석에 금칙어를 적어 자기 검사를 스스로 깨뜨린 적이 있다 —
 * 같은 실수의 반대 방향이 여기다. import 줄을 지우는 이유도 같다: 타입 import 의 유니온 이름이
 * 값 리터럴과 겹쳐 우연히 통과시키는 것을 막는다.
 */
function stripCommentsAndImports(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/^\s*import\s[\s\S]*?from\s*['"][^'"]*['"];?\s*$/gm, ' ');
}

/** 계약의 enum prop 중 자산 축이 아닌 것 — 값 커버리지와 갤러리 요구의 근거 */
function documentedEnumProps(contract: Contract): Array<{ name: string; values: string[] }> {
  const assetAxes = assetAxisProps(contract);
  const out: Array<{ name: string; values: string[] }> = [];
  for (const [propName, prop] of Object.entries(contract.props ?? {})) {
    if (assetAxes.has(propName)) continue;
    if (prop.type === 'enum' && Array.isArray(prop.values) && prop.values.length > 0) {
      out.push({ name: propName, values: prop.values });
    }
  }
  return out;
}

/**
 * 갤러리 Story 를 요구하는가 — 변형 축이 실제로 있는 컴포넌트만이다.
 *
 * Divider 처럼 변형이 없는 컴포넌트에 "전량 갤러리" 를 요구하는 것은 의미가 없다.
 * 자산 축(Icon)은 값 커버리지를 면제받는 대신 여기서 갤러리를 **반드시** 요구받는다.
 */
function requiresGallery(contract: Contract): boolean {
  if (assetAxisProps(contract).size > 0) return true;
  return documentedEnumProps(contract).some((p) => p.values.length >= 2);
}

/** CSF 규약: Story export 는 PascalCase `export const` — 파일들에서 고유 export 명 수집 */
function exportedStoryNames(contents: string[]): Set<string> {
  const names = new Set<string>();
  const re = /^export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*(?::|=)/gm;
  for (const content of contents) {
    for (const m of content.matchAll(re)) {
      const exported = m[1];
      if (exported !== undefined) names.add(exported);
    }
  }
  return names;
}

// [Story 이름을 보는 상수는 두지 않는다] 한때 Playground·갤러리·기본형을 이름 정규식으로 찾았다.
// 이 리포는 그 관습을 쓰지 않아 55개 중 53개가 실패했다 — 위 머리말 '2차 정정' 참조.
// 이름으로 무엇을 요구하고 싶어지면, 그 요구가 리포의 실제 작명과 맞는지 먼저 세어 보라.

/**
 * meta 영역(파일 머리 ~ 첫 Story export) 에서 컨트롤을 통째로 끄지 않았는가.
 *
 * Story 한 칸에서 컨트롤을 끄는 것은 정상이다 — 갤러리는 args 를 안 쓰므로 끄는 편이 옳다
 * (Icon.stories.tsx 의 Gallery 가 그렇게 한다). 금지 대상은 **meta 레벨**의 일괄 차단이다.
 */
function metaRegion(source: string): string {
  const firstStory = source.search(/^export\s+const\s+[A-Z]/m);
  return firstStory === -1 ? source : source.slice(0, firstStory);
}

export function checkStorybookAxis(ctx: AxisContext): AxisResult {
  const { contract, ui } = ctx;
  const name = contract.name;
  const checks: Check[] = [];

  const storiesRels = ui.files.filter(
    (r) => r.startsWith('src/') && posixBasename(r) === `${name}.stories.tsx`,
  );
  const argtypesBaseRe = new RegExp(`^${name}\\.arg[tT]ypes\\.tsx?$`);
  const argtypesRels = ui.files.filter(
    (r) => r.startsWith('generated/') && argtypesBaseRe.test(posixBasename(r)),
  );

  if (storiesRels.length === 0 && argtypesRels.length === 0) {
    checks.push({
      id: 'storybook.not-implemented',
      title: 'Storybook 산출물 존재 여부',
      status: 'SKIP',
      detail: `packages/ui/src/**/${name}.stories.tsx 및 packages/ui/generated/argtypes/${name}.argtypes.ts 미존재 — 부트스트랩 단계`,
    });
    return { axis: 'storybook', title: 'Contract ↔ Storybook', status: 'SKIP', checks };
  }

  // 1) generated argTypes 존재
  if (argtypesRels.length > 0) {
    checks.push({
      id: 'storybook.argtypes-exist',
      title: 'generated argTypes 존재',
      status: 'PASS',
      detail: argtypesRels.map((r) => `packages/ui/${r}`).join(', '),
    });
  } else {
    checks.push({
      id: 'storybook.argtypes-exist',
      title: 'generated argTypes 존재',
      status: 'FAIL',
      detail: `Story 파일은 있으나 packages/ui/generated/argtypes/${name}.argtypes.ts 가 없음 — pnpm codegen 실행 필요 (argTypes 수기 작성 금지)`,
    });
  }

  const storiesContents = storiesRels.map((r) => readText(path.join(ui.base, ...r.split('/'))));

  // 2) Story 파일이 generated argTypes 를 import
  if (storiesRels.length === 0) {
    checks.push({
      id: 'storybook.stories-import-argtypes',
      title: 'Story 파일이 generated argTypes 를 import',
      status: 'SKIP',
      detail: `Story 파일 없음 — codegen 산출물만 존재`,
    });
  } else {
    const specRe = new RegExp(
      String.raw`from\s+['"][^'"]*generated[^'"]*${name}\.arg[tT]ypes(?:\.js|\.ts)?['"]`,
    );
    const lcName = name.charAt(0).toLowerCase() + name.slice(1);
    const namedRe = new RegExp(
      String.raw`import\s+(?:type\s+)?\{[^}]*\b(?:${lcName}|${name})ArgTypes\b[^}]*\}\s*from\s+['"][^'"]*generated[^'"]*['"]`,
    );
    const imported = storiesContents.some((c) => specRe.test(c) || namedRe.test(c));
    checks.push({
      id: 'storybook.stories-import-argtypes',
      title: 'Story 파일이 generated argTypes 를 import',
      status: imported ? 'PASS' : 'FAIL',
      detail: imported
        ? storiesRels.map((r) => `packages/ui/${r}`).join(', ')
        : `${storiesRels
            .map((r) => `packages/ui/${r}`)
            .join(
              ', ',
            )} 에서 generated argTypes import 미검출 — 계약 생성 argTypes 사용 필수 (G5 체크리스트)`,
    });
  }

  if (storiesRels.length === 0) {
    for (const [id, title] of [
      ['storybook.enum-value-coverage', 'enum 값 커버리지 (전 값이 Story 소스에 등장)'],
      ['storybook.documented-roles', '문서 역할 Story 존재 (Playground · 갤러리)'],
      ['storybook.controls-exposed', '컨트롤 노출 (변수 조작 가능)'],
    ] as const) {
      checks.push({ id, title, status: 'SKIP', detail: 'Story 파일 없음' });
    }
    return {
      axis: 'storybook',
      title: 'Contract ↔ Storybook',
      status: summarizeStatuses(checks.map((c) => c.status)),
      checks,
    };
  }

  const stripped = storiesContents.map(stripCommentsAndImports);
  const storyNames = exportedStoryNames(storiesContents);

  // 3) enum 값 커버리지 — 조합이 아니라 **값**이 빠지지 않았는가
  const enumProps = documentedEnumProps(contract);
  if (enumProps.length === 0) {
    checks.push({
      id: 'storybook.enum-value-coverage',
      title: 'enum 값 커버리지 (전 값이 Story 소스에 등장)',
      status: 'PASS',
      detail: '계약에 자산 축 밖의 enum prop 이 없음 — 대상 0건',
    });
  } else {
    const missing: string[] = [];
    let total = 0;
    for (const prop of enumProps) {
      for (const value of prop.values) {
        total += 1;
        const literal = new RegExp(`['"\`]${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`);
        if (!stripped.some((c) => literal.test(c))) missing.push(`${prop.name}=${value}`);
      }
    }
    checks.push({
      id: 'storybook.enum-value-coverage',
      title: 'enum 값 커버리지 (전 값이 Story 소스에 등장)',
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      detail:
        missing.length === 0
          ? `enum 값 ${total}개 전부 Story 소스에 등장 (주석·import 제외 후 대조)`
          : `enum 값 ${total}개 중 ${missing.length}개가 Story 소스에 없음: ${missing.join(', ')} — 갤러리 Story 한 칸에 전량을 실으면 충족된다 (조합 전수 export 는 요구하지 않는다)`,
    });
  }

  // 4) 부분 구현 검출 — 조합 개수도, 특정 이름도 아니라 "읽을 것이 두 개 이상 있는가"
  //
  // [이름을 요구하지 않는 이유] 한때 기본형·Playground·갤러리 세 역할을 **이름으로** 요구했더니
  // 55개 계약 중 53개가 실패했다. HEAD 에서 한 줄도 안 바뀐 Button(Story 115건)조차 걸렸다.
  // 원인은 리포가 그 관습을 쓰지 않는다는 것이었다 — Alert 의 기본형은 `Danger`·`Info`·`Success`
  // 이고 Button 은 `PrimarySmDefault` 다. 이 리포에 `Default` 라는 export 는 거의 없다.
  // 전면 실패하는 게이트는 기준이 현실과 다른 것이지 리포가 전부 틀린 것이 아니다.
  //
  // 이름 요구를 걷어내도 잃는 것이 없다. 두 관심사는 이미 다른 검사가 재고 있다:
  //   변형 값이 눈에 보이는가 → 3번 enum-value-coverage 가 값 단위로 검사
  //   변수를 돌려 볼 수 있는가 → 5번 controls-exposed 가 argTypes 노출로 검사
  //
  // 남는 것은 `ssot-pipeline.md` §1-④ 가 실제로 걱정한 것 하나다: **"스토리가 기본형 하나뿐이면
  // 존재가 아니라 부분 구현이다."** 그것은 이름이 아니라 개수의 문제이므로 개수로 잰다.
  // 변형 축이 없는 컴포넌트(Divider 등)에는 요구하지 않는다 — 보여 줄 두 번째 모습이 없다.
  const missingRoles: string[] = [];
  if (requiresGallery(contract) && storyNames.size < 2) {
    missingRoles.push(
      `변형 축이 있는데 Story 가 ${storyNames.size}건뿐 — 기본형 하나는 부분 구현이다`,
    );
  }
  checks.push({
    id: 'storybook.documented-roles',
    title: '부분 구현 검출 (변형 축 대비 Story 수)',
    status: missingRoles.length === 0 ? 'PASS' : 'FAIL',
    detail:
      missingRoles.length === 0
        ? `Story ${storyNames.size}건 — 부분 구현 아님`
        : `역할 누락: ${missingRoles.join(' · ')}`,
  });

  // 5) 컨트롤 노출 — 오너 지적("변수로 바꿔 볼 수 있으면 된다")을 기계로 옮긴 항목
  const controlProblems: string[] = [];
  const metaDisabled = storiesContents
    .map(metaRegion)
    .some((m) => /controls\s*:\s*\{[^}]*disable\s*:\s*true/.test(m));
  if (metaDisabled) {
    controlProblems.push(
      'meta.parameters 에서 controls 를 일괄 비활성화 — 개별 갤러리 Story 에서 끄는 것은 허용되나 meta 레벨 차단은 문서를 죽인다',
    );
  }
  if (argtypesRels.length > 0) {
    const argtypesSrc = argtypesRels
      .map((r) => readText(path.join(ui.base, ...r.split('/'))))
      .join('\n');
    const flippable = Object.entries(contract.props ?? {}).filter(
      ([, p]) => p.type === 'enum' || p.type === 'boolean',
    );
    const absent = flippable
      .filter(([propName]) => !new RegExp(`^\\s{2}${propName}\\s*:`, 'm').test(argtypesSrc))
      .map(([propName]) => propName);
    if (absent.length > 0) {
      controlProblems.push(
        `generated argTypes 에 enum/boolean prop 누락: ${absent.join(', ')} — pnpm codegen 재실행 필요`,
      );
    }
  }
  checks.push({
    id: 'storybook.controls-exposed',
    title: '컨트롤 노출 (변수 조작 가능)',
    status: controlProblems.length === 0 ? 'PASS' : 'FAIL',
    detail:
      controlProblems.length === 0
        ? 'meta 레벨 컨트롤 차단 없음 · enum/boolean prop 전부 argTypes 에 존재'
        : controlProblems.join(' / '),
  });

  return {
    axis: 'storybook',
    title: 'Contract ↔ Storybook',
    status: summarizeStatuses(checks.map((c) => c.status)),
    checks,
  };
}
