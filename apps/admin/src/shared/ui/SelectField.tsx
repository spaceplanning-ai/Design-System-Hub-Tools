// 드롭다운 컨트롤 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 콘텐츠 폼(공지·FAQ·팝업·배너·약관·개인정보)과 회원/권한/설정 폼이 전부 raw
//   `<select>` + `controlStyle` 을 복사해 썼다. 네이티브 화살표는 브라우저마다 위치·모양이 다르고
//   오른쪽 끝에 바짝 붙어 답답했다. 여기서 네이티브 화살표를 지우고(appearance:none) 토큰 기반
//   여백을 둔 커스텀 chevron 을 얹어 **모든 화면에서 같은 드롭다운**을 낸다.
//
// [입력과 한 몸] 높이·테두리·radius·포커스링을 입력(controlStyle · tds-ui-focusable)과 그대로
//   공유한다 — 폼 안에서 input 과 select 가 어긋나 보이지 않게.
//
// [도메인을 모른다] 무슨 값을 고르는지 알지 못한다 — 네이티브 <select> 속성(value/onChange/name/
//   ref/disabled/id/aria-*)을 그대로 흘려보내고 <option> 은 호출부가 children 으로 넣는다.
//   그래서 raw `<select>` 의 **무손실 드롭인**이다 (RHF register spread · 제어형 value 모두 그대로).
//
// [스타일 보호] className/style 은 받지 않는다 — 토큰 규칙을 우회하지 못하게(Button 선례).
import { forwardRef } from 'react';
import type { CSSProperties, ReactNode, SelectHTMLAttributes } from 'react';

import { ChevronDownIcon } from './icons';
import { controlStyle } from './styles';

const wrapStyle: CSSProperties = {
  position: 'relative',
  display: 'block',
  width: '100%',
  minWidth: 0,
};

/** 커스텀 chevron 자리 — 오른쪽 여백(space-3) 안에서 세로 중앙. 클릭은 아래 select 로 통과시킨다 */
const chevronStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: 'var(--tds-space-3)',
  display: 'inline-flex',
  alignItems: 'center',
  pointerEvents: 'none',
  color: 'var(--tds-color-text-muted)',
};

/** select 표면 — 입력(controlStyle)과 동일하되 네이티브 화살표를 지우고 chevron 만큼 오른쪽 여백을 넓힌다 */
function selectStyle(invalid: boolean): CSSProperties {
  return {
    ...controlStyle(invalid),
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    // 커스텀 chevron(오른쪽 space-3 자리, 약 1.25em)이 글자와 겹치지 않게 오른쪽 여백을 넉넉히 준다
    paddingRight: 'calc(var(--tds-space-6) + var(--tds-space-3))',
    cursor: 'pointer',
  };
}

interface SelectFieldProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'className' | 'style'
> {
  /** 오류 상태 — 입력의 controlStyle(invalid) 와 같은 붉은 테두리를 낸다 */
  readonly invalid?: boolean;
  /** <option> 들 — 호출부가 넣는다 (raw <select> 와 동일) */
  readonly children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { invalid = false, children, ...native },
  ref,
) {
  return (
    <span style={wrapStyle}>
      <select ref={ref} className="tds-ui-focusable" style={selectStyle(invalid)} {...native}>
        {children}
      </select>
      <span style={chevronStyle}>
        <ChevronDownIcon />
      </span>
    </span>
  );
});
