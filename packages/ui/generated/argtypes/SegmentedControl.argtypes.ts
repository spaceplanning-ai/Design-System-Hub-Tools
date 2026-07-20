// AUTO-GENERATED from contracts/SegmentedControl.contract.json@1.1.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const SegmentedControlArgTypes = {
  value: {
    description: '선택된 세그먼트의 id. options[].id 중 하나여야 한다',
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
    description: '세그먼트 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003).\n\nid 는 value/onChange 가 쓰는 키, label 은 **언제나 접근 가능한 이름**이다. icon 은 Icon 계약의 name enum 과 같은 값 집합이며 label 앞에 붙는다. labelHidden=true 면 label 을 시각적으로만 감춘다(텍스트는 DOM 에 남아 접근 가능한 이름이 된다) — 아이콘만 보이는 세그먼트가 이름을 잃지 않게 하는 장치이므로 icon 없이 쓰면 안 된다',
    control: false,
    table: {
      category: 'Props',
      type: {
        summary: 'ReadonlyArray<{ id: string; label: string; icon?: \'align-bottom\' | \'align-center\' | \'align-left\' | \'align-middle\' | \'align-right\' | \'align-top\' | \'arrow-left\' | \'avatar\' | \'bar-chart\' | \'bell\' | \'box\' | \'briefcase\' | \'building\' | \'button\' | \'chevron-down\' | \'chevron-left\' | \'chevron-right\' | \'close\' | \'collapse-left\' | \'collapse-right\' | \'columns\' | \'desktop\' | \'divider\' | \'download\' | \'eye\' | \'file-text\' | \'footer\' | \'heading\' | \'headset\' | \'image\' | \'layout-grid\' | \'list\' | \'lock\' | \'logo\' | \'megaphone\' | \'menu\' | \'mic\' | \'mobile\' | \'more-horizontal\' | \'pencil\' | \'plus\' | \'plus-circle\' | \'redo\' | \'scroll-text\' | \'search\' | \'send\' | \'settings\' | \'shopping-bag\' | \'social\' | \'spacer\' | \'sparkle\' | \'sparkles\' | \'text\' | \'trash\' | \'undo\' | \'upload\' | \'users\' | \'video\' | \'x-circle\'; labelHidden?: boolean }>',
      },
    },
  },
  size: {
    description: '세그먼트 높이·좌우 패딩 스케일',
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
  disabled: {
    description: '그룹 전체 비활성. onChange 차단 + aria-disabled',
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
  ariaLabel: {
    description: 'radiogroup 의 접근 가능한 이름 (예: \'조회 기간\'). 시각 레이블이 없으므로 필수',
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
  onChange: {
    description: '선택된 세그먼트의 id 를 전달. disabled 에서는 발화 금지 — Storybook Play Function이 전수 검증 발화 차단 상태: disabled',
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
 * 총 4개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  { size: 'sm', disabled: 'false' },
  { size: 'sm', disabled: 'true' },
  { size: 'md', disabled: 'false' },
  { size: 'md', disabled: 'true' },
] as const;

export type SegmentedControlCombination = (typeof combinationMatrix)[number];
