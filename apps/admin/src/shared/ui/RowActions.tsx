// 목록 행의 인라인 액션 (수정 · 삭제) (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] 콘텐츠 목록(공지·FAQ·팝업·배너)의 행 끝 액션이 '수정 연필 + 삭제 휴지통'으로
// 동일하다. 네 화면이 각자 ghost 버튼 + 아이콘 + aria-label 을 복사하면 히트 영역·색이 어긋난다.
//
// [도메인을 모른다] 무엇을 수정/삭제하는지 알지 못한다 — 콜백과 접근성 라벨만 받는다.
//   삭제는 여기서 곧바로 지우지 않는다 — 호출부가 onDelete 안에서 ConfirmDialog 를 연다
//   (확인 없는 삭제 금지 — shared/ui/README.md).
import type { CSSProperties } from 'react';

import { buttonStyle } from './styles';
import { PencilIcon, TrashIcon } from './icons';

const wrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-1)',
  justifyContent: 'flex-end',
};

const dangerGhostStyle: CSSProperties = {
  ...buttonStyle('ghost'),
  color: 'var(--tds-color-feedback-danger-text)',
};

interface RowActionsProps {
  /** 수정 — 있으면 연필 버튼을 그린다. 없으면(읽기 전용 행) 생략 */
  readonly onEdit?: () => void;
  /** 삭제 — 있으면 휴지통 버튼을 그린다. 호출부가 확인 다이얼로그를 연다 */
  readonly onDelete?: () => void;
  /** 스크린 리더용 대상 이름 — 행마다 달라야 한다 ('공지 제목') */
  readonly label: string;
  /** 진행 중(삭제 요청 등) — 버튼을 잠근다 */
  readonly disabled?: boolean;
}

export function RowActions({ onEdit, onDelete, label, disabled = false }: RowActionsProps) {
  return (
    <span style={wrapStyle}>
      {onEdit !== undefined && (
        <button
          type="button"
          className="tds-ui-btn-ghost tds-ui-focusable"
          style={buttonStyle('ghost', disabled)}
          aria-label={`${label} 수정`}
          disabled={disabled}
          onClick={onEdit}
        >
          <PencilIcon />
        </button>
      )}
      {onDelete !== undefined && (
        <button
          type="button"
          className="tds-ui-btn-ghost tds-ui-focusable"
          style={disabled ? buttonStyle('ghost', true) : dangerGhostStyle}
          aria-label={`${label} 삭제`}
          disabled={disabled}
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      )}
    </span>
  );
}
