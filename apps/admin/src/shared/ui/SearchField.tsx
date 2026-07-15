// 검색 입력 (돋보기 아이콘 겹침) (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 목록 상단 툴바의 '검색' 입력은 회원·로그인 이력·콘텐츠 목록이 똑같이 쓴다.
// 예전엔 이 입력(아이콘 겹침 + 왼쪽 패딩 보정)이 MembersToolbar·LoginHistoryToolbar 에 각각
// 복사돼 있었다. 콘텐츠 목록(공지·FAQ)이 세 번째·네 번째 소비자가 되는 자리에서 한 벌로 올린다.
//
// [도메인을 모른다] 무엇을 검색하는지 알지 못한다 — value/onChange/placeholder/라벨만 받는다.
import { useId } from 'react';
import type { CSSProperties } from 'react';

import { SearchIcon } from './icons';
import { controlStyle, visuallyHiddenStyle } from './styles';

const wrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flexGrow: 1,
  minWidth: 0,
  maxWidth: 'calc(var(--tds-space-6) * 14)',
};

/** 입력 안쪽 왼쪽에 겹치는 돋보기 — 클릭이 입력으로 통과하도록 pointerEvents 해제 */
const iconStyle: CSSProperties = {
  position: 'absolute',
  left: 'var(--tds-space-3)',
  display: 'inline-flex',
  color: 'var(--tds-color-text-muted)',
  pointerEvents: 'none',
};

const inputStyle: CSSProperties = {
  ...controlStyle(false),
  // 아이콘 폭 + 좌우 여백만큼 왼쪽 패딩을 늘린다
  paddingLeft: 'calc(var(--tds-space-6) + var(--tds-space-3))',
};

interface SearchFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** 스크린 리더용 라벨 — 무엇을 검색하는지 밝힌다 ('공지 제목 검색') */
  readonly label: string;
  readonly placeholder?: string;
}

export function SearchField({ value, onChange, label, placeholder = '검색' }: SearchFieldProps) {
  const id = useId();

  return (
    <div style={wrapStyle}>
      <label htmlFor={id} style={visuallyHiddenStyle}>
        {label}
      </label>
      <span style={iconStyle}>
        <SearchIcon />
      </span>
      <input
        id={id}
        type="search"
        className="tds-ui-input tds-ui-focusable"
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
