// AUTO-GENERATED from contracts/Menu.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const MenuArgTypes = {
  label: {
    description: '스크린 리더용 대상 이름 — 행마다 달라야 한다(\'명재우 회원 액션\'). 트리거 버튼의 aria-label 이자 role=menu 의 aria-label 로 쓰인다',
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
  items: {
    description: '명령 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). danger 는 파괴적 명령(붉은 텍스트), disabled 는 진행 중 잠금, disabledReason 은 \'왜 못 하는지\' 문구이며 값이 있으면 그 항목은 잠긴 것으로 본다',
    control: false,
    table: {
      category: 'Props',
      type: {
        summary: 'ReadonlyArray<{ id: string; label: string; danger?: boolean; disabled?: boolean; disabledReason?: string }>',
      },
    },
  },
  align: {
    description: '팝업이 트리거의 어느 모서리에 맞춰지는가. 논리 속성(inset-inline)이라 RTL 에서 자동으로 뒤집힌다. 행 끝 액션은 end, 좌측 툴바는 start',
    control: {
      type: 'select',
    },
    options: ['start', 'end'],
    table: {
      category: 'Props',
      type: {
        summary: '\'start\' | \'end\'',
      },
      defaultValue: {
        summary: '"end"',
      },
    },
  },
  trigger: {
    description: '트리거 글리프. 둘 다 DS Icon 의 more-horizontal 한 종을 쓰고 vertical 은 CSS 로 90도 돌린다 — Icon 계약(59종)에 more-vertical 이 없고 아이콘을 늘리는 것은 Icon 계약 소유자의 일이라 여기서 늘리지 않는다',
    control: {
      type: 'select',
    },
    options: ['more-horizontal', 'more-vertical'],
    table: {
      category: 'Props',
      type: {
        summary: '\'more-horizontal\' | \'more-vertical\'',
      },
      defaultValue: {
        summary: '"more-horizontal"',
      },
    },
  },
  onSelect: {
    description: '명령이 선택되면 그 항목의 id 를 전달한다. 잠긴 항목에서는 발화하지 않는다(native disabled 로 막는다). 발화 직전에 팝업을 닫되 트리거로 포커스를 되돌리지는 않는다 — 명령이 다이얼로그를 열 수 있어 포커스를 빼앗으면 안 된다 발화 차단 상태: items[].disabled, items[].disabledReason',
    action: 'onSelect',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'string',
      },
    },
  },
  onOpenChange: {
    description: '팝업이 열리거나 닫힐 때 상태를 전달한다. 호출부가 열린 행을 강조하거나 바깥 상태를 맞출 때 쓴다',
    action: 'onOpenChange',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'boolean',
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
  { align: 'start', trigger: 'more-horizontal' },
  { align: 'start', trigger: 'more-vertical' },
  { align: 'end', trigger: 'more-horizontal' },
  { align: 'end', trigger: 'more-vertical' },
] as const;

export type MenuCombination = (typeof combinationMatrix)[number];
