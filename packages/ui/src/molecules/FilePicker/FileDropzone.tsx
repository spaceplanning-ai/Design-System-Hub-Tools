// FileDropzone — 가로형 파일 드롭존 (molecule · contracts/FileDropzone.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/FileDropzone.types 를 그대로 import 한다 (수동 선언 금지 — G6).
//
// [진짜 <input type="file"> 은 감춰 둔다] 파일 입력의 기본 UI 는 스타일링이 되지 않는다. 그래서
// **<button> 이 AT 에 보이는 컨트롤**이고 숨은 입력은 탐색기를 여는 트리거일 뿐이다
// (ImageUploadField 와 같은 판정 — 탭 정지점이 둘이 되지 않게 aria-hidden + tabIndex -1).
//
// [검증하지 않는다] 파일을 고르는 일까지만 한다. 확장자·용량·해상도 검증과 업로드는 호출부가
// 소유한다 — 화면마다 규칙이 다르고 해상도 검사는 비동기라 여기서 삼키면 실패를 알 수 없다.
//
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건 (상태는 data-* / :disabled 선택자가 소유).
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';

import type { FileDropzoneProps } from '../../../generated/types/FileDropzone.types';
import './FilePicker.css';

export function FileDropzone({
  label,
  title,
  meta = '',
  accept = '',
  describedBy = '',
  disabled = false,
  isInvalid = false,
  onSelect,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file !== undefined) onSelect?.(file);
    // 같은 파일을 다시 골라도 change 가 나게 값을 비운다 (검증 실패 후 재시도가 막히지 않는다)
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(false);
    // 계약 events.onSelect.blockedWhen — 드래그 경로는 <button disabled> 가 막아주지 않으므로 직접 막는다
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file !== undefined) onSelect?.(file);
  };

  return (
    <>
      <button
        type="button"
        className="tds-dropzone"
        data-drag-active={dragActive}
        data-invalid={isInvalid}
        disabled={disabled}
        aria-label={`${label} — 클릭하거나 파일을 끌어다 놓으세요`}
        {...(describedBy === '' ? {} : { 'aria-describedby': describedBy })}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <span className="tds-dropzone__title">{title}</span>
        {meta !== '' && <span className="tds-dropzone__meta">{meta}</span>}
      </button>

      {/* AT 에는 위 버튼만 보인다 — 이 입력은 탐색기를 여는 트리거일 뿐이다 */}
      <input
        ref={inputRef}
        type="file"
        className="tds-dropzone__input"
        {...(accept === '' ? {} : { accept })}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={onInputChange}
      />
    </>
  );
}
