// AUTO-GENERATED from contracts/RadioCardGroup.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: molecule · 카테고리: Inputs · 상태: beta

/** 계약에 선언된 상호작용 상태 */
export type RadioCardGroupState = 'default' | 'hover' | 'focus-visible' | 'disabled' | 'selected';

/**
 * 설명이 붙은 카드형 라디오 그룹 — 선택지마다 '제목 + 결과 설명' 을 함께 보여 고르기 전에 무슨 일이 일어나는지 읽히게 한다. 출처: apps/admin/src/shared/ui/RadioCardGroup.tsx (사이트 설정 공개 범위).
 *
 * [왜 SelectField 가 아닌가] 선택지가 적고 **각각의 결과가 서로 크게 다를 때**(누구나 들어온다 / 관리자만 들어온다) 선택지를 접어 두면 안 된다. 결과 설명을 고르기 전에 읽을 수 있어야 한다 — 그래서 펼쳐 두고, 설명을 라벨과 같은 클릭 영역에 넣는다.
 *
 * [왜 SegmentedControl 이 아닌가] 세그먼티드는 라벨 한 단어짜리 트랙이다. 여기는 각 선택지가 두 줄(제목+설명)을 갖는 카드라 트랙에 들어가지 않는다.
 *
 * [a11y] role="radiogroup" + aria-labelledby 로 그룹 이름을 준다. 안의 컨트롤은 **네이티브 <input type="radio">** 다 — 같은 name 을 공유해 화살표 이동과 단일 선택을 브라우저가 공짜로 준다(aria-checked 도 네이티브가 소유한다). 설명 문단은 aria-describedby 로 각 라디오에 잇는다: <label> 이 설명까지 감싸면 접근 가능한 이름이 '전체 공개 누구나 내 사이트에 접속할 수 있어요' 한 덩어리로 읽힌다.
 *
 * [도메인을 모른다] 선택지는 options 로 주입한다 (ADR-0003) — value 는 문자열이며 좁힌 유니온으로 되돌리는 일은 호출부가 옵션 목록에서 되찾아 한다(SegmentedControl 선례).
 */
export interface RadioCardGroupProps {
  /**
   * 라디오들이 공유하는 name — 화면에 그룹이 둘 이상이면 서로 달라야 한다(같으면 브라우저가 한 그룹으로 묶는다). 각 항목의 DOM id 와 legend id 도 여기서 파생한다
   */
  name: string;
  /**
   * 그룹 이름 — 눈에 보이는 제목이자 radiogroup 의 aria-labelledby 대상
   */
  legend: string;
  /**
   * 선택된 항목의 value. options[].value 중 하나여야 한다
   */
  value: string;
  /**
   * 선택지 목록. description 은 '이 선택지를 고르면 무슨 일이 일어나는가' — 고르기 전에 읽히는 자리다. 데이터 prop 이라 Figma Component Property 대응이 없다 (ADR-0003)
   */
  options: ReadonlyArray<{ value: string; label: string; description: string }>;
  /**
   * 그룹 전체 비활성 — 모든 라디오를 잠그고 라벨을 흐리게 표시한다. onChange 발화 없음
   * @default false
   */
  disabled?: boolean;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * 선택된 항목의 value 를 발화한다. disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증)
   * 발화 차단 상태: disabled (Storybook Play Function 이 전수 검증)
   */
  onChange?: (payload: string) => void;
}
