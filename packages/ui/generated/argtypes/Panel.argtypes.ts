// AUTO-GENERATED from contracts/Panel.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const PanelArgTypes = {
  children: {
    description: '패널이 쌓을 블록들 — 필터 축·역할 목록·폼 섹션 내비게이션 등 무엇이든 온다. 블록 사이 간격은 이 껍데기가 소유한다: 화면마다 그릇을 만들면 축 사이 간격이 화면마다 어긋나고 **실제로 어긋나 있었다**',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'ReactNode',
      },
    },
  },
  notice: {
    description: '맨 아래 안내 영역 — 위쪽 구분선으로 본문과 갈린다. `<div>` 라 문단 여럿을 받는다. null 이면 구분선과 여백까지 함께 사라진다(빈 영역이 남아 아래가 떠 보이지 않게)',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'ReactNode',
      },
      defaultValue: {
        summary: 'null',
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

export type PanelCombination = (typeof combinationMatrix)[number];
