// Icon — 단색 선 아이콘 (atom · contracts/Icon.contract.json@1.0.0)
//
// 비대화형 표시 전용 — 클릭 이벤트를 갖지 않는다. 버튼이 필요하면 Button 안에 넣는다.
// 색은 스스로 정하지 않고 currentColor 로 부모를 따른다 — 대비 책임은 부모 문맥에 있다(계약 a11y).
// label 이 비면 장식으로 보고 aria-hidden, 값이 있으면 role=img + aria-label 을 붙인다.
import { createElement } from 'react';
import { ICON_SHAPES } from '../../../generated/icons/icon-geometry';
import type { IconProps } from '../../../generated/types/Icon.types';
import './Icon.css';

// 기하(어떤 패스·원·사각으로 그리는가)는 더 이상 이 파일이 들고 있지 않다.
// generated/icons/icon-geometry.ts 가 정본이고, 그건 codegen 이 이 저장소의 실제 아이콘
// 구현에서 추출한다 — 계약 enum 에 아이콘이 늘면 자동으로 따라오고, 손으로 옮겨 적는 사본이
// 생기지 않는다. (예전에는 여기 PATHS 를 직접 적어 계약과 어긋날 여지가 있었다.)

export function Icon({ name, size = 'inherit', label = '' }: IconProps) {
  const labelled = label.length > 0;
  return (
    <svg
      className={`tds-icon tds-icon--${size}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable={false}
      {...(labelled ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {ICON_SHAPES[name].map((shape, index) =>
        // 태그·속성이 데이터라 createElement 로 편다. 속성은 전부 소문자 기하 속성
        // (d·cx·cy·r·x·y·width·height·rx)이라 React 의 camelCase 변환 대상이 아니다.
        createElement(shape.tag, { key: `${shape.tag}-${String(index)}`, ...shape.attrs }),
      )}
    </svg>
  );
}
