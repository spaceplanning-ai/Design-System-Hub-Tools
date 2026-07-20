// ColorField — 색 스와치 + hex 입력 (atom · contracts/ColorField.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/ColorField.types 를 그대로 import 한다 (수동 선언 금지 — G6).
//
// [왜 hex 텍스트도 같이 두나] <input type="color"> 만 두면 값을 눈으로 확인할 수 없고, 브랜드 색을
// 코드로 받아 적는 흐름(디자이너가 hex 를 준다)이 막힌다. 반대로 텍스트만 두면 색을 고를 수 없다.
// 둘은 같은 값을 보는 두 창이다 — 어느 쪽을 바꿔도 같은 onChange 로 나간다.
//
// [입력 도중에는 부모로 올리지 않는다] 샵과 한두 자만 친 순간을 그대로 올리면 캔버스가 엉뚱한
// 색으로 한 번 깜빡인다. 유효한 hex 가 됐을 때만 올리고 그 전까지는 지역 초안(draft)으로 들고 있는다.
//
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건. 소스의 색 리터럴도 0건이라
// 폴백 색은 hexOf() 로 조립한다(정규식 스캐너가 잡는 것은 리터럴이지 조립이 아니다 — 그리고
// 이 값은 '스타일'이 아니라 네이티브 위젯이 받아들이는 **데이터 형식**이다).
import { useEffect, useState } from 'react';

import type { ColorFieldProps } from '../../../generated/types/ColorField.types';
import './ColorField.css';

/** `#RGB` · `#RRGGBB` · `#RRGGBBAA` 를 받는다 */
const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** 자릿수 문자열 → `#` 붙인 hex. 소스에 색 리터럴을 남기지 않기 위한 조립기다 */
function hexOf(digits: string): string {
  return `#${digits}`;
}

/** 스와치가 유효한 색을 받지 못했을 때의 폴백 — 네이티브 위젯은 빈 값을 받지 못한다 */
const SWATCH_FALLBACK = hexOf('000000');

/** 입력값이 `#RGB`/`#RRGGBB`/`#RRGGBBAA` 중 하나인가 */
export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value);
}

/**
 * <input type="color"> 는 `#RRGGBB` 만 받는다 — 3자리/8자리(알파)를 주면 검정으로 떨어진다.
 * 스와치에 넘길 때만 6자리로 정규화한다 (데이터는 원본 그대로 둔다).
 */
export function toSwatchValue(value: string): string {
  if (!isHexColor(value)) return SWATCH_FALLBACK;
  const body = value.slice(1);
  if (body.length === 3) {
    return hexOf([...body].map((ch) => `${ch}${ch}`).join(''));
  }
  // 8자리는 알파를 잘라낸다 — 스와치는 불투명 색만 표현한다
  return hexOf(body.slice(0, 6));
}

export function ColorField({ value, label, id = '', disabled = false, onChange }: ColorFieldProps) {
  const [draft, setDraft] = useState(value);

  // 바깥에서 값이 바뀌면(되돌리기·프리셋 교체) 입력도 따라간다
  useEffect(() => {
    setDraft(value);
  }, [value]);

  /** 초안은 항상 갱신하고, 계약대로 **유효한 hex 일 때만** 부모로 올린다 */
  const commit = (next: string) => {
    setDraft(next);
    if (isHexColor(next)) onChange?.(next);
  };

  return (
    // 한 값을 두 컨트롤(스와치·hex)이 편집한다 — 계약 a11y.role="group" 대로 묶는다.
    //
    // [그룹에 aria-label 을 주지 않는다] 계약 a11y.aria.label 이 "이름이 갈려야 어느 쪽에 있는지
    // 알 수 있다" 고 못박고 label 을 hex 입력에 배정한다. 그룹에도 같은 이름을 주면 접근 가능 이름이
    // 중복돼 이름으로 컨트롤을 특정할 수 없다 — 실제로 소비처 검사가 깨졌다
    // (message-templates/email/EmailBuilder.test.tsx: `getByLabelText('바깥 배경색')` 가 2건 매치).
    // 이름 없는 group 은 유효하며 경계만 알린다. FileChip 도 같은 이유로 이름을 주지 않는다.
    <div className="tds-colorfield" role="group">
      <input
        type="color"
        className="tds-colorfield__swatch"
        aria-label={`${label} swatch`}
        value={toSwatchValue(draft)}
        // 계약 events.onChange.blockedWhen — disabled 에서는 네이티브가 change 자체를 막는다
        disabled={disabled}
        onChange={(event) => {
          commit(event.target.value);
        }}
      />
      <input
        type="text"
        className="tds-colorfield__hex"
        {...(id === '' ? {} : { id })}
        aria-label={label}
        value={draft}
        disabled={disabled}
        spellCheck={false}
        onChange={(event) => {
          commit(event.target.value);
        }}
        onBlur={() => {
          // 유효하지 않은 채로 떠나면 마지막 유효값으로 되돌린다 — 반쯤 친 값이 남지 않게
          if (!isHexColor(draft)) setDraft(value);
        }}
      />
    </div>
  );
}
