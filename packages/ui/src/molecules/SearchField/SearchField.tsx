// SearchField — 돋보기 겹친 검색 입력 (molecule · contracts/SearchField.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/SearchField.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 목록 상단 툴바의 '검색' — value/onChange/label/placeholder 만 받는다(도메인 모름).
//
// [onChange 는 값 콜백 — 네이티브 이벤트가 아니다] 29곳 호출부가 onChange={setKeyword}(string setter)로
//   물려 있어 SelectField 식 네이티브 이벤트 패스스루로 바꾸면 전부 깨진다 — 새 문자열을 넘긴다.
//   그 외 표준 <input> 속성(name·aria-*·autoFocus …)은 <input> 으로 그대로 전달한다 (**native 마지막 spread**).
//   계약 표면(value·placeholder)·id·type·onChange·className/style 은 native 슬라이스에서 제외한다.
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건.
import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import type { SearchFieldProps } from '../../../generated/types/SearchField.types';
import './SearchField.css';

type SearchNativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'style' | 'className' | 'children' | 'id' | 'type' | 'value' | 'placeholder' | 'onChange'
>;

/** 돋보기 글리프 — 아이콘 자산 패키지에 의존하지 않는 인라인 SVG (currentColor·1.25em, 장식) */
function SearchGlyph() {
  return (
    <svg
      className="tds-search__icon-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function SearchField({
  value,
  label,
  placeholder = '검색',
  onChange,
  ...native
}: SearchFieldProps & SearchNativeProps) {
  const id = useId();

  return (
    <div className="tds-search">
      <label htmlFor={id} className="tds-search__label">
        {label}
      </label>
      <span className="tds-search__icon" aria-hidden="true">
        <SearchGlyph />
      </span>
      {/* native 가 마지막이다 — 호출부의 name / aria-* 를 그대로 흘려보낸다 */}
      <input
        id={id}
        type="search"
        className="tds-search__control"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        {...native}
      />
    </div>
  );
}
