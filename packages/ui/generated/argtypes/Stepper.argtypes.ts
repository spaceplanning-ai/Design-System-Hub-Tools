// AUTO-GENERATED from contracts/Stepper.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const StepperArgTypes = {
  steps: {
    description: '흐름의 단계 목록. 순서가 곧 흐름이다. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). 도메인 상태→라벨 변환은 호출부가 소유한다(statusLabel/stageLabel)',
    control: false,
    table: {
      category: 'Props',
      type: {
        summary: 'ReadonlyArray<{ id: string; label: string }>',
      },
    },
  },
  current: {
    description: '현재 단계의 id. steps[].id 중 하나면 그 단계까지 채워지고, 목록에 없는 값(흐름 밖 종료 — 반려·실주)이면 아무 단계도 채우지 않는다',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'string',
      },
    },
  },
  ariaLabel: {
    description: '단계 목록의 접근 가능한 이름 (예: \'처리 진행 단계\', \'파이프라인 단계\')',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'string',
      },
    },
  },
} as const;

/**
 * 커버리지 검증용 조합 행렬 — enum prop 값 곱 × boolean prop 당 2.
 * 총 1개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  {  },
] as const;

export type StepperCombination = (typeof combinationMatrix)[number];
