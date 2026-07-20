// AUTO-GENERATED from contracts/Slider.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const SliderArgTypes = {
  value: {
    description: '현재 값. 제어 값이며 onChange 로만 바뀐다',
    control: {
      type: 'number',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'number',
      },
    },
  },
  min: {
    description: '허용 최솟값 — 네이티브가 aria-valuemin 으로 노출한다',
    control: {
      type: 'number',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'number',
      },
    },
  },
  max: {
    description: '허용 최댓값 — 네이티브가 aria-valuemax 로 노출한다',
    control: {
      type: 'number',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'number',
      },
    },
  },
  step: {
    description: '증감 단위. 화살표 키 한 번이 움직이는 크기이기도 하다',
    control: {
      type: 'number',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'number',
      },
      defaultValue: {
        summary: '1',
      },
    },
  },
  label: {
    description: '스크린 리더용 이름(aria-label) — 보이는 <label> 이 없는 자리(패널 상자 안)에서 무엇을 조절하는지 알린다(\'Padding top\' 등)',
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
  unit: {
    description: '값 옆에 붙는 단위 표기(\'px\' 등). 비우면 숫자만 보인다. 값 표시는 aria-hidden 장식이므로 이 문구가 접근 가능한 이름을 오염시키지 않는다',
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
  id: {
    description: 'range 입력의 DOM id — 한 화면에 슬라이더가 여럿일 때 호출부가 유니크 id 를 주입한다. 비우면 id 속성을 렌더하지 않는다',
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
  disabled: {
    description: '비활성 — 잠그고 흐리게 표시한다. onChange 발화 없음',
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
    description: '새 값(정수)을 인자로 발화한다. disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증) 발화 차단 상태: disabled',
    action: 'onChange',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'number',
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

export type SliderCombination = (typeof combinationMatrix)[number];
