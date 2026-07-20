// AUTO-GENERATED from contracts/FileChip.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: molecule · 카테고리: File · 상태: beta

/** 계약에 선언된 상호작용 상태 */
export type FileChipState = 'default' | 'hover' | 'focus-visible' | 'disabled';

/**
 * 지금 걸려 있는 파일 한 건 — 썸네일 + 파일명 + 용량, 그리고 선택적 제거(×). 출처: apps/admin/src/shared/ui/FilePicker.tsx (사이트 설정의 파비콘·대표 이미지·비공개 이미지가 공유).
 *
 * [FileDropzone 과 짝이다] 둘은 가로로 나란히 서고, 미리보기는 드롭존이 아니라 브라우저 탭 목업·OG 카드라는 **다른 자리**에 그려진다. 그래서 미리보기를 자기가 소유하는 ImageUploadField 로 대체할 수 없다 — 미리보기의 주인이 다르다.
 *
 * [제거 버튼은 onRemove 를 준 만큼만 생긴다] 지울 수 없는 자리(필수 자산)에 죽은 버튼을 두지 않는다 — Alert.onClose 와 같은 판단이다.
 *
 * [용량 표기] formatFileSize 순수 함수가 소유한다. 소수점은 MB 부터만 붙인다 — KB 단위의 '12.7KB' 는 정보가 아니라 소음이고, 칩이 보여줄 것은 '작다/크다' 이지 정확한 바이트가 아니다.
 */
export interface FileChipProps {
  /**
   * 썸네일 URL. 비거나 로드 실패면 ImageThumb 가 placeholder 를 그린다
   * @default ""
   */
  src?: string;
  /**
   * 파일명 — 한 줄로 자르고 넘치면 말줄임한다. 제거 버튼의 접근 가능한 이름('<name> 제거')도 여기서 온다
   */
  name: string;
  /**
   * 바이트 수 — 표기는 formatFileSize 가 한다(1KB 미만 B · 1MB 미만 KB · 그 위 MB 소수 1자리). 음수/NaN 은 '-'
   */
  size: number;
  /**
   * 비활성 — 제거 버튼을 잠근다(칩 자체는 계속 읽힌다). onRemove 발화 없음
   * @default false
   */
  disabled?: boolean;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * 제거(×) 클릭. **주지 않으면 버튼이 렌더되지 않는다** — 지울 수 없는 자리에 죽은 버튼을 만들지 않는다. disabled 에서는 발화 금지 — <button disabled> 가 네이티브로 막는다
   * 발화 차단 상태: disabled (Storybook Play Function 이 전수 검증)
   */
  onRemove?: (payload: void) => void;
}
