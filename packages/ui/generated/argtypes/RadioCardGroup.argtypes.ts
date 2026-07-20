// AUTO-GENERATED from contracts/RadioCardGroup.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const RadioCardGroupArgTypes = {
  name: {
    description: '라디오들이 공유하는 name — 화면에 그룹이 둘 이상이면 서로 달라야 한다(같으면 브라우저가 한 그룹으로 묶는다). 각 항목의 DOM id 와 legend id 도 여기서 파생한다',
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
  legend: {
    description: '그룹 이름 — 눈에 보이는 제목이자 radiogroup 의 aria-labelledby 대상',
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
  value: {
    description: '선택된 항목의 value. options[].value 중 하나여야 한다',
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
  options: {
    description: '선택지 목록. description 은 \'이 선택지를 고르면 무슨 일이 일어나는가\' — 고르기 전에 읽히는 자리다. 데이터 prop 이라 Figma Component Property 대응이 없다 (ADR-0003)',
    control: false,
    table: {
      category: 'Props',
      type: {
        summary: 'ReadonlyArray<{ value: string; label: string; description: string }>',
      },
    },
  },
  disabled: {
    description: '그룹 전체 비활성 — 모든 라디오를 잠그고 라벨을 흐리게 표시한다. onChange 발화 없음',
    control: {
      type: 'boolean',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'boolean',
      },
      defaultValue: {
        summary: 'false',
      },
    },
  },
  onChange: {
    description: '선택된 항목의 value 를 발화한다. disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증) 발화 차단 상태: disabled',
    action: 'onChange',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'string',
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
  { disabled: 'false' },
  { disabled: 'true' },
] as const;

export type RadioCardGroupCombination = (typeof combinationMatrix)[number];
