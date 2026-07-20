// AUTO-GENERATED from contracts/FileDropzone.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: molecule · 카테고리: File · 상태: beta

/** 계약에 선언된 상호작용 상태 */
export type FileDropzoneState = 'default' | 'hover' | 'focus-visible' | 'disabled' | 'error';

/**
 * 가로형 파일 드롭존 — 클릭하면 탐색기가 열리고, 끌어다 놓아도 된다. 출처: apps/admin/src/shared/ui/FilePicker.tsx (사이트 설정의 파비콘·대표 이미지·비공개 이미지가 공유).
 *
 * [왜 ImageUploadField 가 아닌가] 그 필드는 미리보기를 자기가 소유하는 큰 정사각 드롭존이다. 이쪽은 FileChip 과 가로로 나란히 서는 **한 줄짜리 조각**이고, 미리보기는 완전히 다른 자리(브라우저 탭 목업·OG 카드)에 그려진다.
 *
 * [진짜 <input type="file"> 은 감춘다] 파일 입력의 기본 UI 는 스타일링이 되지 않는다. 그래서 <button> 이 AT 에 보이는 컨트롤이고 숨은 입력은 탐색기를 여는 트리거일 뿐이다(aria-hidden + tabIndex -1) — ImageUploadField 와 같은 판정이다.
 *
 * [검증하지 않는다] 파일을 고르는 일까지만 한다. 확장자·용량·해상도 검증과 업로드는 호출부가 소유한다 — 화면마다 규칙이 다르고(파비콘은 ICO 16x16, 비공개 이미지는 PNG/JPG/GIF) 해상도 검사는 비동기라 여기서 삼키면 호출부가 실패를 알 수 없다. accept 는 탐색기의 1차 필터일 뿐 **보증이 아니다**.
 *
 * [같은 파일 재선택] change 후 입력 값을 비운다 — 그러지 않으면 검증 실패 뒤 같은 파일을 다시 고르는 경로가 조용히 막힌다.
 */
export interface FileDropzoneProps {
  /**
   * 접근 가능한 이름의 뿌리 — 문구만 있는 버튼이라 무엇을 고르는 자리인지 여기서 밝힌다. 실제 aria-label 은 '<label> — 클릭하거나 파일을 끌어다 놓으세요'
   */
  label: string;
  /**
   * 1차 안내 문구 — '파일 선택 또는 끌어다 놓기'. 한국어 어절이 갈리지 않게 word-break: keep-all 로 그린다
   */
  title: string;
  /**
   * 형식·크기 안내 — '최소 16x16 / ICO'. 비우면 둘째 줄이 없다
   * @default ""
   */
  meta?: string;
  /**
   * <input type="file"> 의 accept — 탐색기의 1차 필터일 뿐 보증이 아니다(호출부가 다시 검증한다)
   * @default ""
   */
  accept?: string;
  /**
   * 오류/힌트 문단의 id — 문단 자체는 호출부가 소유한다. 비우면 aria-describedby 를 렌더하지 않는다
   * @default ""
   */
  describedBy?: string;
  /**
   * 비활성 — 클릭·드롭을 함께 막고 흐리게 표시한다. onSelect 발화 없음
   * @default false
   */
  disabled?: boolean;
  /**
   * 오류 상태 — 테두리를 danger 색으로 바꾼다. **문구는 그리지 않는다**(호출부가 describedBy 로 잇는 문단이 소유한다)
   * @default false
   */
  isInvalid?: boolean;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * 고른 파일 1건을 발화한다(탐색기 선택·드롭 모두 같은 경로). 검증은 호출부가 한다. disabled 에서는 발화 금지 — <button disabled> 와 드롭 핸들러의 조기 반환이 함께 막는다 (Storybook Play Function 이 전수 검증)
   * 발화 차단 상태: disabled (Storybook Play Function 이 전수 검증)
   */
  onSelect?: (payload: File) => void;
}
