// AUTO-GENERATED from contracts/FileChip.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const FileChipArgTypes = {
  src: {
    description: '썸네일 URL. 비거나 로드 실패면 ImageThumb 가 placeholder 를 그린다',
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
  name: {
    description: '파일명 — 한 줄로 자르고 넘치면 말줄임한다. 제거 버튼의 접근 가능한 이름(\'<name> 제거\')도 여기서 온다',
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
  size: {
    description: '바이트 수 — 표기는 formatFileSize 가 한다(1KB 미만 B · 1MB 미만 KB · 그 위 MB 소수 1자리). 음수/NaN 은 \'-\'',
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
  disabled: {
    description: '비활성 — 제거 버튼을 잠근다(칩 자체는 계속 읽힌다). onRemove 발화 없음',
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
  onRemove: {
    description: '제거(×) 클릭. **주지 않으면 버튼이 렌더되지 않는다** — 지울 수 없는 자리에 죽은 버튼을 만들지 않는다. disabled 에서는 발화 금지 — <button disabled> 가 네이티브로 막는다 발화 차단 상태: disabled',
    action: 'onRemove',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'void',
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

export type FileChipCombination = (typeof combinationMatrix)[number];
