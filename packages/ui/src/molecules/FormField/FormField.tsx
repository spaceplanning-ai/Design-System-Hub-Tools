// FormField — 라벨 붙은 폼 필드 껍데기 (molecule · contracts/FormField.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/FormField.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 계약 dependencies: HelpTip (atom). 라벨 옆 ⓘ 도움말은 HelpTip 을 조립해 그린다.
//
// [도메인을 모른다] 무슨 필드인지 알지 못한다 — 라벨/오류/힌트 문자열과 자식 컨트롤(children)만 받는다.
//   컨트롤 자체(input/select/textarea)는 호출부가 넣고, 이 껍데기는 label 의 htmlFor 로만 잇는다.
//
// [오류·힌트 id 파생 — 헬퍼] 오류/힌트 <p> 의 id 를 htmlFor 에서 파생해 노출한다(errorIdOf·hintIdOf).
//   호출부가 이 id 를 자식 컨트롤의 aria-describedby 에 물린다 (TextField 의 textFieldErrorId 선례).
//
// [exactOptionalPropertyTypes] 호출부는 error={errors.x?.message}(string|undefined)를 그대로 넘긴다.
//   계약 타입(error?: string)을 그 경계에서 undefined 허용으로 넓혀 받고, 빈 문자열/undefined 를
//   '오류 없음' 으로 정규화한다 (TriStateCheckbox.describedBy 의 '' 정규화 선례 — 호출부 45곳 무변경).
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건.
import { HelpTip } from '../../atoms/HelpTip';
import type { FormFieldProps } from '../../../generated/types/FormField.types';
import './FormField.css';

/** 힌트 <p> 의 id — 호출부가 자식 컨트롤의 aria-describedby 에 물린다 (계약 a11y) */
export function hintIdOf(htmlFor: string): string {
  return `${htmlFor}-hint`;
}

/** 오류 <p> 의 id — 호출부가 자식 컨트롤의 aria-describedby 에 물린다 (계약 a11y) */
export function errorIdOf(htmlFor: string): string {
  return `${htmlFor}-error`;
}

/**
 * 계약의 옵셔널 문자열 prop 을 경계에서 undefined 허용으로 넓힌 컴포넌트 props.
 * (exactOptionalPropertyTypes 하에서 호출부의 string|undefined 를 그대로 받기 위함 — 값은 '' 로 정규화)
 */
type FormFieldComponentProps = Omit<FormFieldProps, 'error' | 'hint' | 'counter'> & {
  readonly error?: string | undefined;
  readonly hint?: string | undefined;
  readonly counter?: string | undefined;
};

export function FormField({
  htmlFor,
  label,
  required = false,
  error,
  hint,
  counter,
  help,
  children,
}: FormFieldComponentProps) {
  const invalid = error !== undefined && error !== '';

  return (
    <div className="tds-formfield">
      <div className="tds-formfield__row">
        <span className="tds-formfield__labelgroup">
          <label htmlFor={htmlFor} className="tds-formfield__label">
            {label}
            {required && (
              <span className="tds-formfield__required" aria-hidden="true">
                {' *'}
              </span>
            )}
          </label>
          {help !== undefined && <HelpTip label={`${label} 설명`}>{help}</HelpTip>}
        </span>
        {counter !== undefined && <span className="tds-formfield__counter">{counter}</span>}
      </div>

      {children}

      {invalid ? (
        <p id={errorIdOf(htmlFor)} role="alert" className="tds-formfield__error">
          {error}
        </p>
      ) : (
        hint !== undefined && (
          <p id={hintIdOf(htmlFor)} className="tds-formfield__hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
