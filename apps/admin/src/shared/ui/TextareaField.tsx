// 제어 textarea + 글자수 카운터 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 콘텐츠 본문(공지 본문·FAQ 답변·약관 조문·개인정보 처리방침)이 전부 같은
// '긴 글 입력' 컨트롤을 쓴다. 네 화면이 각자 textarea + 카운터 + 검증 배선을 복사하면
// 최대 길이·오류 자리·카운터 형식이 화면마다 어긋난다. 한 벌만 둔다.
//
// TODO: 리치 텍스트 에디터는 라이브러리 선정 + ADR 필요.
//   지금은 **제어된 textarea**로만 본문을 받는다 (WYSIWYG 라이브러리를 설치하지 않는다 —
//   번들 크기·에디터 선정은 A80 의 ADR 결정 사안이다). 서식 있는 본문이 요구되면 그때
//   이 컴포넌트의 내부만 에디터로 바꾸고, 호출부(value/onChange 계약)는 그대로 둔다.
//
// [도메인을 모른다] 무슨 본문인지 알지 못한다 — value/onChange/maxLength 와 라벨 문자열만 받는다.
import { useId } from 'react';
import type { CSSProperties } from 'react';

import { controlStyle } from './styles';
import { errorIdOf, FormField, hintIdOf } from './FormField';

const textareaStyle = (invalid: boolean): CSSProperties => ({
  ...controlStyle(invalid),
  minHeight: 'calc(var(--tds-space-6) * 4)',
  resize: 'vertical',
  fontFamily: 'var(--tds-typography-body-md-font-family)',
  lineHeight: 'var(--tds-typography-body-md-line-height)',
});

interface TextareaFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** 최대 길이 — 카운터('N/max')와 maxLength 를 함께 정한다 */
  readonly maxLength: number;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly rows?: number;
}

export function TextareaField({
  label,
  value,
  onChange,
  maxLength,
  required = false,
  disabled = false,
  error,
  hint,
  placeholder,
  rows = 8,
}: TextareaFieldProps) {
  const id = useId();
  const invalid = error !== undefined && error !== '';

  return (
    <FormField
      htmlFor={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      counter={`${String(value.length)}/${String(maxLength)}`}
    >
      <textarea
        id={id}
        className="tds-ui-input tds-ui-focusable"
        style={textareaStyle(invalid)}
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorIdOf(id) : hint !== undefined ? hintIdOf(id) : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
