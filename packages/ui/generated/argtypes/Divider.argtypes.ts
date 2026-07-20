// AUTO-GENERATED from contracts/Divider.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const DividerArgTypes = {
  orientation: {
    description: '선의 방향. `horizontal`(기본)은 부모 폭을 채우는 가로선이고, `vertical` 은 부모 높이에 맞춰(`align-self: stretch`) 늘어나는 세로선이다 — 툴바가 쓰는 쪽이 후자다. 논리 속성(inline-size/block-size)으로 그리므로 RTL 에서 따로 뒤집을 것이 없다',
    control: {
      type: 'select',
    },
    options: ['horizontal', 'vertical'],
    table: {
      category: 'Props',
      type: {
        summary: '\'horizontal\' | \'vertical\'',
      },
      defaultValue: {
        summary: '"horizontal"',
      },
    },
  },
} as const;

/**
 * 커버리지 검증용 조합 행렬 — enum prop 값 곱 × boolean prop 당 2.
 * 총 2개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  { orientation: 'horizontal' },
  { orientation: 'vertical' },
] as const;

export type DividerCombination = (typeof combinationMatrix)[number];
