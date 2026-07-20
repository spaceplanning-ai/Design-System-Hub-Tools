// AUTO-GENERATED from contracts/Menu.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: molecule · 카테고리: Actions · 상태: beta

/** `Menu.align` 허용 값 (계약이 유일한 원천) */
export type MenuAlign = 'start' | 'end';

/** `Menu.trigger` 허용 값 (계약이 유일한 원천) */
export type MenuTrigger = 'more-horizontal' | 'more-vertical';

/** 계약에 선언된 상호작용 상태 */
export type MenuState = 'default' | 'hover' | 'focus-visible' | 'open' | 'disabled';

/**
 * 메뉴 버튼 — 트리거 버튼을 누르면 명령 목록(role=menu)이 열린다. WAI-ARIA Menu Button 패턴이다. 도메인을 모른다 — 항목은 items prop 으로 주입하고 선택 결과는 onSelect(id) 로만 알린다 (ADR-0003).
 *
 * [승격 근거] 어드민에 독립 구현이 둘 있었고 a11y 가 이미 갈라져 있었다 — apps/admin/src/pages/members/components/ActionMenu.tsx(화살표·Esc·Home/End 전부 구현)와 apps/admin/src/pages/settings/api-keys/components/IntegrationOverflowMenu.tsx(화살표·Home/End 없음). 리포의 승격 규율('두 번째 소비자가 생길 때 올린다')이 이미 발동된 상태였고, IntegrationOverflowMenu 는 ActionMenu 의 존재를 모른 채 '소비자 한 곳뿐'이라고 적고 있었다(그 파일 3-5줄). **키보드 계약은 강한 쪽(ActionMenu)을 정본으로 삼는다** — 약한 쪽을 기준으로 올리면 승격이 곧 접근성 퇴행이 된다.
 *
 * [선택이 아니라 명령이다] 이 컴포넌트는 값을 고르지 않는다. 각 항목은 실행되는 명령이고 '현재 선택된 항목' 개념이 없다 — 그래서 role=menu + role=menuitem 이며 aria-checked 를 쓰지 않는다. 값을 고르는 팝업(단일 선택 표시가 필요한 것)은 이 계약의 대상이 아니다.
 *
 * [잠긴 항목을 지우지 않는다] 지금 할 수 없는 명령은 목록에서 없애지 않고 잠그고 이유를 적는다 — 없애 버리면 운영자는 그 기능이 존재하지 않는다고 결론짓는다. '아직'과 '없음'은 다른 사실이다. items[].disabledReason 이 그 이유 문구이며, 값이 있으면 해당 항목은 자동으로 잠긴다(disabled 를 따로 주지 않아도 된다).
 *
 * [레이어링 — 포털을 쓰지 않는다] 팝업은 position:absolute 로 트리거 래퍼(position:relative) 안에 그린다. Modal 처럼 body 로 포털하지 않는 이유는 둘이다: (1) 이 메뉴는 표 행·툴바 안에 살아 스크롤 컨테이너와 함께 움직여야 한다, (2) 리포에 이미 포털이 Storybook 데코레이터가 감싼 DOM 을 벗어나는 실결함이 있다(Modal·ConfirmDialog — Radix Portal 이 body 에 붙는다). 같은 결함을 재생산하지 않는다. [해소 표기 2026-07-20] 이 근거의 원래 사례는 "DarkTheme 스토리가 라이트로 렌더된다" 였는데, 다크 테마 제거로 withTheme 데코레이터와 DarkTheme 스토리가 사라져 그 사례 자체가 없어졌다. 포털이 데코레이터를 벗어난다는 사실은 그대로여서 근거는 유지한다.
 */
export interface MenuProps {
  /**
   * 스크린 리더용 대상 이름 — 행마다 달라야 한다('명재우 회원 액션'). 트리거 버튼의 aria-label 이자 role=menu 의 aria-label 로 쓰인다
   */
  label: string;
  /**
   * 명령 목록. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). danger 는 파괴적 명령(붉은 텍스트), disabled 는 진행 중 잠금, disabledReason 은 '왜 못 하는지' 문구이며 값이 있으면 그 항목은 잠긴 것으로 본다
   */
  items: ReadonlyArray<{ id: string; label: string; danger?: boolean; disabled?: boolean; disabledReason?: string }>;
  /**
   * 팝업이 트리거의 어느 모서리에 맞춰지는가. 논리 속성(inset-inline)이라 RTL 에서 자동으로 뒤집힌다. 행 끝 액션은 end, 좌측 툴바는 start
   * @default "end"
   */
  align?: MenuAlign;
  /**
   * 트리거 글리프. 둘 다 DS Icon 의 more-horizontal 한 종을 쓰고 vertical 은 CSS 로 90도 돌린다 — Icon 계약(59종)에 more-vertical 이 없고 아이콘을 늘리는 것은 Icon 계약 소유자의 일이라 여기서 늘리지 않는다
   * @default "more-horizontal"
   */
  trigger?: MenuTrigger;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * 명령이 선택되면 그 항목의 id 를 전달한다. 잠긴 항목에서는 발화하지 않는다(native disabled 로 막는다). 발화 직전에 팝업을 닫되 트리거로 포커스를 되돌리지는 않는다 — 명령이 다이얼로그를 열 수 있어 포커스를 빼앗으면 안 된다
   * 발화 차단 상태: items[].disabled, items[].disabledReason (Storybook Play Function 이 전수 검증)
   */
  onSelect?: (payload: string) => void;
  /**
   * 팝업이 열리거나 닫힐 때 상태를 전달한다. 호출부가 열린 행을 강조하거나 바깥 상태를 맞출 때 쓴다
   */
  onOpenChange?: (payload: boolean) => void;
}
