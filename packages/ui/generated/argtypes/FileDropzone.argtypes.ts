// AUTO-GENERATED from contracts/FileDropzone.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const FileDropzoneArgTypes = {
  label: {
    description: '접근 가능한 이름의 뿌리 — 문구만 있는 버튼이라 무엇을 고르는 자리인지 여기서 밝힌다. 실제 aria-label 은 \'<label> — 클릭하거나 파일을 끌어다 놓으세요\'',
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
  title: {
    description: '1차 안내 문구 — \'파일 선택 또는 끌어다 놓기\'. 한국어 어절이 갈리지 않게 word-break: keep-all 로 그린다',
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
  meta: {
    description: '형식·크기 안내 — \'최소 16x16 / ICO\'. 비우면 둘째 줄이 없다',
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
  accept: {
    description: '<input type="file"> 의 accept — 탐색기의 1차 필터일 뿐 보증이 아니다(호출부가 다시 검증한다)',
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
  describedBy: {
    description: '오류/힌트 문단의 id — 문단 자체는 호출부가 소유한다. 비우면 aria-describedby 를 렌더하지 않는다',
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
    description: '비활성 — 클릭·드롭을 함께 막고 흐리게 표시한다. onSelect 발화 없음',
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
  isInvalid: {
    description: '오류 상태 — 테두리를 danger 색으로 바꾼다. **문구는 그리지 않는다**(호출부가 describedBy 로 잇는 문단이 소유한다)',
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
  onSelect: {
    description: '고른 파일 1건을 발화한다(탐색기 선택·드롭 모두 같은 경로). 검증은 호출부가 한다. disabled 에서는 발화 금지 — <button disabled> 와 드롭 핸들러의 조기 반환이 함께 막는다 (Storybook Play Function 이 전수 검증) 발화 차단 상태: disabled',
    action: 'onSelect',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'File',
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
  { disabled: 'false', isInvalid: 'false' },
  { disabled: 'false', isInvalid: 'true' },
  { disabled: 'true', isInvalid: 'false' },
  { disabled: 'true', isInvalid: 'true' },
] as const;

export type FileDropzoneCombination = (typeof combinationMatrix)[number];
