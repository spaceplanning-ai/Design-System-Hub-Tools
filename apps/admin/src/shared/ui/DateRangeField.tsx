// 노출 기간(시작~종료) 입력 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 팝업 관리와 배너 관리가 똑같이 '노출 시작~종료'를 받는다. 두 화면이 각자
// 날짜 입력 두 칸 + 종료≥시작 오류 자리를 복사하면 배치·오류 문구가 어긋난다.
//
// [도메인을 모른다] 무엇의 기간인지 알지 못한다 — 시작/종료 값·콜백과 라벨/오류만 받는다.
//   종료≥시작 같은 규칙은 호출부의 zod 스키마가 판정해 error 로 내려준다(검증 정본은 스키마).
import { useId } from 'react';
import type { CSSProperties } from 'react';

import { controlStyle, errorTextStyle, fieldLabelStyle, fieldStyle, hintStyle } from './styles';

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
};

const tildeStyle: CSSProperties = {
  color: 'var(--tds-color-text-muted)',
};

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 'var(--tds-space-1)',
  height: 'var(--tds-space-1)',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
};

interface DateRangeFieldProps {
  readonly label: string;
  readonly startValue: string;
  readonly endValue: string;
  readonly onStartChange: (value: string) => void;
  readonly onEndChange: (value: string) => void;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
}

export function DateRangeField({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  required = false,
  disabled = false,
  error,
  hint,
}: DateRangeFieldProps) {
  const startId = useId();
  const endId = useId();
  const invalid = error !== undefined && error !== '';

  return (
    <div style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>

      <div style={rowStyle}>
        <label htmlFor={startId} style={visuallyHiddenStyle}>
          {`${label} 시작일`}
        </label>
        <input
          id={startId}
          type="date"
          className="tds-ui-input tds-ui-focusable"
          style={controlStyle(invalid)}
          value={startValue}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(event) => onStartChange(event.target.value)}
        />

        <span style={tildeStyle} aria-hidden="true">
          ~
        </span>

        <label htmlFor={endId} style={visuallyHiddenStyle}>
          {`${label} 종료일`}
        </label>
        <input
          id={endId}
          type="date"
          className="tds-ui-input tds-ui-focusable"
          style={controlStyle(invalid)}
          value={endValue}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(event) => onEndChange(event.target.value)}
        />
      </div>

      {invalid ? (
        <p role="alert" style={errorTextStyle}>
          {error}
        </p>
      ) : (
        hint !== undefined && <p style={hintStyle}>{hint}</p>
      )}
    </div>
  );
}
