// AUTO-GENERATED from contracts/ColorField.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const ColorFieldArgTypes = {
  value: {
    description: '현재 색 — #RGB · #RRGGBB · #RRGGBBAA 를 받는다. 제어 값이며 유효한 hex 로 확정된 onChange 로만 바뀐다',
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
  label: {
    description: '스크린 리더용 이름(aria-label) — 보이는 <label> 이 없는 자리(패널 상자 안)에서 무슨 색인지 알린다(\'Canvas color\' 등). 스와치에는 \'<label> swatch\' 로 별도 이름을 준다(한 값에 컨트롤이 둘이라 이름이 갈려야 한다)',
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
  id: {
    description: 'hex 텍스트 입력의 DOM id — 한 화면에 색 필드가 여럿일 때 호출부가 유니크 id 를 주입한다. 비우면 id 속성을 렌더하지 않는다',
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
    description: '비활성 — 스와치와 텍스트를 함께 잠그고 흐리게 표시한다. onChange 발화 없음',
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
    description: '**유효한 hex 일 때만** 새 색 문자열을 발화한다 — 입력 도중의 부분 문자열은 올리지 않는다(캔버스 깜빡임 방지). disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증) 발화 차단 상태: disabled',
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

export type ColorFieldCombination = (typeof combinationMatrix)[number];
