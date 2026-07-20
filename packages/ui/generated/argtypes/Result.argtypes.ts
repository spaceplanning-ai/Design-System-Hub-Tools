// AUTO-GENERATED from contracts/Result.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const ResultArgTypes = {
  title: {
    description: '무슨 일이 일어났는지 한 줄로 — 문제가 발생했어요 · 접근 권한이 없습니다 등. h2 로 렌더된다. 제품 카피라 DS 가 만들지 않고 받는다',
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
  description: {
    description: '제목을 보충하는 한 문단 — 무엇을 해 보면 되는지까지 적는다. 빈 문자열이면 렌더하지 않는다',
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
  reference: {
    description: '신고에 붙일 짧은 상관관계 코드 (EXC-20). 빈 문자열이면 렌더하지 않는다 — 코드가 없는 결과 화면(권한 없음 등)이 빈 줄을 남기지 않게 한다. 값을 계산하는 것은 오류의 모양을 아는 앱이다',
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
  actions: {
    description: '빠져나갈 수단 — Button 하나 또는 여럿이 한 줄로 놓인다. 어디로 가는지도 다시 시도가 무엇을 뜻하는지도 라우터와 경계를 아는 앱만 알기 때문에 슬롯이다. 주지 않으면 액션 줄 자체를 그리지 않는다',
    control: false,
    table: {
      category: 'Slots',
      type: {
        summary: 'ReactNode (accepts: Button)',
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

export type ResultCombination = (typeof combinationMatrix)[number];
