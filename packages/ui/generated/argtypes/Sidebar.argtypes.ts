// AUTO-GENERATED from contracts/Sidebar.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const SidebarArgTypes = {
  label: {
    description: '주 내비게이션 랜드마크의 접근 가능한 이름 — <nav aria-label> 에 그대로 들어간다. 한 화면에 내비게이션이 둘 이상이면 이름으로 갈린다(WAI-ARIA landmark 규약). 어드민은 \'주 내비게이션\' 을 쓴다',
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
  sections: {
    description: '섹션 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). 항목은 href 를 가지면 잎(링크), children 을 가지면 가지(펼침 버튼)다. icon 은 ReactNode 라 DS 가 아이콘 집합을 알 필요가 없다 — 앱이 자기 아이콘을 넣는다. **권한으로 걸러진 뒤의 목록**이 들어온다: 빈 섹션을 감추는 것도 항목을 지우는 것도 DS 의 일이 아니다',
    control: false,
    table: {
      category: 'Props',
      type: {
        summary: 'ReadonlyArray<{ id: string; title: string; items: ReadonlyArray<{ id: string; label: string; href?: string; icon?: ReactNode; children?: ReadonlyArray<{ id: string; label: string; href: string }> }> }>',
      },
    },
  },
  activeHref: {
    description: '지금 켜져야 할 링크의 href. 빈 문자열이면 아무것도 켜지 않는다. **판정은 앱이 한다** — 어드민은 \'세그먼트 경계 기준 최장 일치\'(nav-config 의 findCoveringLeaf)를 쓰고 헤더 <h1> 도 같은 답을 쓴다. DS 가 두 번째 판정 규칙을 발명하면 헤더와 사이드바가 서로 다른 곳을 가리키게 된다',
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
  openId: {
    description: '펼쳐진 가지의 id. 빈 문자열이면 전부 접힌다. 제어 prop 이다 — \'한 번에 하나만\' 도 \'경로가 바뀌면 그 가지를 연다\' 도 경로를 아는 쪽만 강제할 수 있어 DS 가 자기 상태로 들지 않는다',
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
  brand: {
    description: '상단 브랜드 영역 슬롯 — 로고·워드마크가 들어온다. DS 가 특정 회사의 로고를 담지 않으므로 슬롯이다(분류표 Foundation/logos 를 이 계약이 채우지 않는 이유). 높이는 Header 와 같은 값으로 고정돼 두 영역의 아래 구분선이 한 줄로 이어진다',
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
  onNavigate: {
    description: '링크가 활성화되면 그 href 를 전달한다. **수식키(Ctrl/Cmd/Shift/Alt) 없는 왼쪽 클릭에서만** 발화하며 그때만 preventDefault 한다 — 새 탭 열기·가운데 클릭은 브라우저에 그대로 넘긴다. 이 콜백을 주지 않으면 preventDefault 도 하지 않아 평범한 링크로 동작한다',
    action: 'onNavigate',
    control: false,
    table: {
      category: 'Events',
      type: {
        summary: 'string',
      },
    },
  },
  onToggle: {
    description: '가지의 펼침 버튼이 눌리면 그 가지의 id 를 전달한다. 열지 닫을지는 DS 가 정하지 않는다 — 호출부가 openId 를 다음 값으로 정해서 되돌려준다',
    action: 'onToggle',
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
 * 총 1개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  {  },
] as const;

export type SidebarCombination = (typeof combinationMatrix)[number];
