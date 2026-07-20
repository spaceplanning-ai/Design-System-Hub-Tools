// AUTO-GENERATED from contracts/IconButton.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const IconButtonArgTypes = {
  icon: {
    description: '표시할 글리프. 버튼의 유일한 내용이므로 required 다 — 비면 빈 사각형이 된다. 구현은 이 슬롯을 `aria-hidden` 래퍼에 담는다: 접근 가능한 이름은 label 이 소유하고, 아이콘이 이름을 오염시키면 안 된다. Figma 에서는 아이콘 종류를 INSTANCE_SWAP 으로 59종 중에서 고른다',
    control: false,
    table: {
      category: 'Slots',
      type: {
        summary: 'ReactNode (accepts: Icon)',
      },
    },
  },
  label: {
    description: '이 버튼이 무엇을 하는지의 문구(예: \'되돌리기\'). 아이콘만 보이므로 이름을 공급할 것이 이것뿐이라 required 다. 같은 값이 `aria-label`(스크린리더)과 `title`(마우스 툴팁) 양쪽에 들어간다 — 두 사용자 집단이 같은 정보를 얻어야 하고, 값이 하나이므로 갈라질 수 없다',
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
    description: '정사각 변의 길이. 두 값 모두 실물에서 온 것이다: md 는 이메일 빌더의 space.7, sm 은 문자·알림톡 편집기의 space.6. 어느 한쪽을 틀렸다고 판정할 근거가 없어(둘 다 오너 확정 화면이다) 축으로 올렸다. 기본값 md 는 파일럿 소비자(이메일 빌더)의 현행 시각을 유지하기 위한 것이며, 시각 회귀 없이 이관하려는 화면은 자기 값을 명시한다',
    control: {
      type: 'select',
    },
    options: ['sm', 'md'],
    table: {
      category: 'Props',
      type: {
        summary: '\'sm\' | \'md\'',
      },
      defaultValue: {
        summary: '"md"',
      },
    },
  },
  pressed: {
    description: '토글 여부와 그 상태. `unset`(기본)이면 `aria-pressed` 속성을 **내지 않는다** — 실행취소처럼 상태가 없는 일반 액션이다. `on`/`off` 는 각각 `aria-pressed="true"`/`"false"` 를 낸다. 세 값을 둔 이유는 `off` 와 `unset` 이 접근성상 전혀 다른 말이기 때문이다: 전자는 \'꺼진 토글\', 후자는 \'토글이 아님\'. 시각은 `on` 에서만 달라지고 `off` 와 `unset` 은 같다 — 스타일은 `aria-pressed` 속성 셀렉터가 소유하므로 접근성 상태와 픽셀이 구조적으로 갈라질 수 없다',
    control: {
      type: 'select',
    },
    options: ['unset', 'on', 'off'],
    table: {
      category: 'Props',
      type: {
        summary: '\'unset\' | \'on\' | \'off\'',
      },
      defaultValue: {
        summary: '"unset"',
      },
    },
  },
  disabled: {
    description: '비활성. 네이티브 `disabled` 를 걸어 포커스 순서에서 빼고 onClick 을 차단한다. 툴바에서는 되돌릴 이력이 없을 때(canUndo=false) 등에 쓴다',
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
  onClick: {
    description: 'disabled 상태에서는 발화 금지 발화 차단 상태: disabled',
    action: 'onClick',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'MouseEvent',
      },
    },
  },
} as const;

/**
 * 커버리지 검증용 조합 행렬 — enum prop 값 곱 × boolean prop 당 2.
 * 총 12개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  { size: 'sm', pressed: 'unset', disabled: 'false' },
  { size: 'sm', pressed: 'unset', disabled: 'true' },
  { size: 'sm', pressed: 'on', disabled: 'false' },
  { size: 'sm', pressed: 'on', disabled: 'true' },
  { size: 'sm', pressed: 'off', disabled: 'false' },
  { size: 'sm', pressed: 'off', disabled: 'true' },
  { size: 'md', pressed: 'unset', disabled: 'false' },
  { size: 'md', pressed: 'unset', disabled: 'true' },
  { size: 'md', pressed: 'on', disabled: 'false' },
  { size: 'md', pressed: 'on', disabled: 'true' },
  { size: 'md', pressed: 'off', disabled: 'false' },
  { size: 'md', pressed: 'off', disabled: 'true' },
] as const;

export type IconButtonCombination = (typeof combinationMatrix)[number];
