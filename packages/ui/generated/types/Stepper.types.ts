// AUTO-GENERATED from contracts/Stepper.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: molecule · 카테고리: Navigation · 상태: beta

/** 계약에 선언된 상호작용 상태 */
export type StepperState = 'default' | 'checked' | 'selected';

/**
 * 진행 단계 표시기 — 정해진 흐름의 단계를 번호 점과 라벨로 늘어놓고 현재 단계까지 채운다. 비대화형이다: 단계를 누를 수 없고 흐름을 바꾸지도 않는다. 흐름을 '보여 주기만' 한다.
 *
 * [숫자 입력 스텝퍼가 아니다] 분류표에는 stepper 항목이 두 곳에 있다 — Inputs(2번, number-input·slider·range-slider 옆)와 Navigation(4번, breadcrumb·pagination·tabs 옆). 이 계약은 **후자**다. 값을 증감시키는 +/- 컨트롤이 아니라 진행 상태를 읽히는 표시기이며, 그래서 category 가 Navigation 이다. Inputs 쪽 stepper 는 여전히 미구현으로 남는다.
 *
 * [승격 근거] 어드민에 94줄짜리 구현이 둘 있었고 diff 는 14줄, 그 14줄이 전부 도메인 명칭이었다 — apps/admin/src/pages/products/returns/components/ReturnStatusStepper.tsx(접수→수거중→검수중→완료)와 apps/admin/src/pages/sales/projects/components/PipelineStepper.tsx(리드→상담→제안→협상→수주). 스타일 60줄은 바이트 단위로 같았다. 두 파일 모두 머리말에 '한 곳만 쓰므로 페이지 전용' 이라 적었으나 **서로의 존재를 몰랐다.**
 *
 * [흐름 밖 종료는 담지 않는다] 반려·실주처럼 흐름을 벗어나 끝난 상태는 이 컴포넌트가 그리지 않는다. 단계 목록에 없는 값이 오면 아무 단계도 채우지 않고(currentIndex = -1) 흐름만 보여 준다 — 호출부가 danger 배너/배지로 따로 알린다. 두 출처 구현이 이미 그렇게 갈라 두었고 그 판단을 그대로 옮긴다.
 *
 * [states 이름이 도메인 말과 다른 이유] 스키마의 states enum 은 고정 목록이라 '완료/현재/미도달' 을 그대로 적을 수 없다. 매핑은 default = 미도달(upcoming) · checked = 완료(done, 현재 단계까지 채워진 칸) · selected = 현재 단계(current, 테두리가 굵어지고 라벨이 bold 가 된다) 이다.
 *
 * [번호는 장식이다] 점 안의 번호와 연결선은 aria-hidden 이다. 스크린 리더에는 라벨만 읽히고 순서는 <ol> 이 전달한다 — 번호를 읽히면 '1 접수 2 수거중' 처럼 라벨마다 숫자가 덧붙어 목록이 두 배로 길어진다.
 */
export interface StepperProps {
  /**
   * 흐름의 단계 목록. 순서가 곧 흐름이다. 데이터 prop — Figma Component Property 대응 없음 (ADR-0003). 도메인 상태→라벨 변환은 호출부가 소유한다(statusLabel/stageLabel)
   */
  steps: ReadonlyArray<{ id: string; label: string }>;
  /**
   * 현재 단계의 id. steps[].id 중 하나면 그 단계까지 채워지고, 목록에 없는 값(흐름 밖 종료 — 반려·실주)이면 아무 단계도 채우지 않는다
   */
  current: string;
  /**
   * 단계 목록의 접근 가능한 이름 (예: '처리 진행 단계', '파이프라인 단계')
   */
  ariaLabel: string;
}
