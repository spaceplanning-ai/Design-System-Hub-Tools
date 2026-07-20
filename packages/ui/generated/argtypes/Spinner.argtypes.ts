// AUTO-GENERATED from contracts/Spinner.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const SpinnerArgTypes = {
  size: {
    description: '지름. inherit = `1em` 으로 부모 글자 크기를 따른다(Button 이 쓰는 값 — 버튼 size 가 바뀌면 스피너도 함께 바뀐다). sm/md/lg 는 space 토큰 고정값이며 글자 문맥이 없는 자리에 쓴다',
    control: {
      type: 'select',
    },
    options: ['inherit', 'sm', 'md', 'lg'],
    table: {
      category: 'Props',
      type: {
        summary: '\'inherit\' | \'sm\' | \'md\' | \'lg\'',
      },
      defaultValue: {
        summary: '"inherit"',
      },
    },
  },
  label: {
    description: '스크린리더에 낭독할 진행 문구(예: \'불러오는 중\'). 빈 문자열(기본)이면 장식으로 보고 `aria-hidden="true"` 를 낸다 — 부모가 `aria-busy` 로 이미 알리는 Button 안의 용법이다. 값이 있으면 `role="status"` + `aria-label` 로 승격된다',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'string',
      },
      defaultValue: {
        summary: '""',
      },
    },
  },
} as const;

/**
 * 커버리지 검증용 조합 행렬 — enum prop 값 곱 × boolean prop 당 2.
 * 총 4개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  { size: 'inherit' },
  { size: 'sm' },
  { size: 'md' },
  { size: 'lg' },
] as const;

export type SpinnerCombination = (typeof combinationMatrix)[number];
