// 이미지 URL 입력 + 미리보기 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 팝업 관리와 배너 관리가 똑같이 '이미지 URL + 미리보기'를 받는다. 두 화면이
// 각자 input + <img> 미리보기 + 로드 실패 처리를 복사하면 미리보기 크기·실패 문구가 어긋난다.
//
// [이미지 업로드 없음] URL 입력 + 미리보기(<img> max-width:100%)만 제공한다.
//   TODO(backend): POST /api/uploads — 파일 업로드가 붙으면 이 필드에 '파일 선택' 경로를 더하고
//   업로드 응답 URL 을 value 로 채운다. 지금은 운영자가 이미 호스팅된 URL 을 직접 붙여넣는다.
//
// [도메인을 모른다] 무슨 이미지인지 알지 못한다 — value/onChange 와 라벨/힌트만 받는다.
import { useId, useState } from 'react';
import type { CSSProperties } from 'react';

import { controlStyle, hintStyle } from './styles';
import { errorIdOf, FormField, hintIdOf } from './FormField';

const previewWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 'calc(var(--tds-space-6) * 4)',
  marginTop: 'var(--tds-space-2)',
  paddingTop: 'var(--tds-space-3)',
  paddingBottom: 'var(--tds-space-3)',
  paddingLeft: 'var(--tds-space-3)',
  paddingRight: 'var(--tds-space-3)',
  borderStyle: 'dashed',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
  borderRadius: 'var(--tds-radius-md)',
  background: 'var(--tds-color-surface-raised)',
};

const previewImageStyle: CSSProperties = {
  maxWidth: '100%',
  maxHeight: 'calc(var(--tds-space-6) * 6)',
  objectFit: 'contain',
};

interface ImageUrlFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
  readonly placeholder?: string | undefined;
}

export function ImageUrlField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  hint,
  placeholder = 'https://…',
}: ImageUrlFieldProps) {
  const id = useId();
  const invalid = error !== undefined && error !== '';
  // URL 이 이미지를 가리키지 않으면 <img> 가 onError 를 낸다 — 미리보기 자리에 안내를 대신 그린다
  const [loadFailed, setLoadFailed] = useState(false);
  const trimmed = value.trim();

  return (
    <FormField htmlFor={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        type="url"
        className="tds-ui-input tds-ui-focusable"
        style={controlStyle(invalid)}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorIdOf(id) : hint !== undefined ? hintIdOf(id) : undefined}
        onChange={(event) => {
          setLoadFailed(false);
          onChange(event.target.value);
        }}
      />

      {trimmed !== '' && (
        <div style={previewWrapStyle}>
          {loadFailed ? (
            <p style={hintStyle}>이미지를 불러오지 못했습니다. URL 을 확인해 주세요.</p>
          ) : (
            <img
              src={trimmed}
              alt={`${label} 미리보기`}
              style={previewImageStyle}
              onError={() => setLoadFailed(true)}
            />
          )}
        </div>
      )}
    </FormField>
  );
}
