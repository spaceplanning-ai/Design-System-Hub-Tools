// AUTO-GENERATED from contracts/Skeleton.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const SkeletonArgTypes = {
  shape: {
    description: '자리표시 형태. line = 텍스트 한 줄 높이의 가로 막대(승계한 `.tds-ui-skeleton` 의 형태이며 표 9곳이 쓰던 유일한 형태), circle = 아바타/아이콘 자리의 정원, block = 카드/썸네일 자리의 큰 사각. line/block 은 컨테이너 폭을 채우고 circle 만 정사각 고정이다',
    control: {
      type: 'select',
    },
    options: ['line', 'circle', 'block'],
    table: {
      category: 'Props',
      type: {
        summary: '\'line\' | \'circle\' | \'block\'',
      },
      defaultValue: {
        summary: '"line"',
      },
    },
  },
  animated: {
    description: '맥동(pulse) 애니메이션 여부. false 면 정지한 회색 블록이 된다. 기본이 true 인 이유는 \'멈춘 화면\' 과 \'기다리는 중\' 을 구분해 주기 때문이다. `prefers-reduced-motion: reduce` 에서는 이 값과 무관하게 CSS 가 애니메이션을 끄므로, false 는 그 접근성 처리의 대체물이 아니라 정적 스냅샷(VRT·인쇄)용 옵트아웃이다',
    control: {
      type: 'boolean',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'boolean',
      },
      defaultValue: {
        summary: 'true',
      },
    },
  },
} as const;

/**
 * 커버리지 검증용 조합 행렬 — enum prop 값 곱 × boolean prop 당 2.
 * 총 6개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  { shape: 'line', animated: 'false' },
  { shape: 'line', animated: 'true' },
  { shape: 'circle', animated: 'false' },
  { shape: 'circle', animated: 'true' },
  { shape: 'block', animated: 'false' },
  { shape: 'block', animated: 'true' },
] as const;

export type SkeletonCombination = (typeof combinationMatrix)[number];
