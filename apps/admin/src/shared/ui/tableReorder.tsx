// 표 행 드래그 재정렬 (A41 소유 — apps/admin/src/shared/ui/**)
//
// [왜 공통인가] FAQ 목록이 '행을 드래그해 정렬 순서를 바꾼다'를 처음 구현했고(오너 피드백 ③),
// 배너 목록이 같은 상호작용을 갖게 되며 **소비자가 둘**이 됐다. moveArrayItem · 드래그 핸들러 ·
// grip/화살표 아이콘 · 이동 버튼이 두 페이지에 복사되면 히트 영역·색·순서 계산이 어긋난다
// (shared/ui/README 규칙 1: 2곳 이상이 쓰면 공통 모듈). 그래서 여기로 승격한다.
//
// [도메인을 모른다] 무엇을 재정렬하는지 알지 못한다 — id 목록과 onReorder 콜백, 그리고 각 행의
// 접근성 라벨 문구만 받는다. FAQ 인지 배너인지 알지 못한다.
//
// [마우스 + 키보드] 드래그는 마우스 전용이라, 각 행에 위/아래 이동 버튼(↑↓)을 함께 제공한다.
// 드래그와 버튼 둘 다 결국 moveArrayItem 으로 귀결된다(같은 순수 연산).
import { useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';

import { buttonStyle, tdStyle, thStyle, visuallyHiddenStyle } from './styles';

/**
 * 배열에서 한 항목을 from → to 로 옮긴 새 배열을 돌려준다(재정렬의 원자 연산).
 * 드래그(overId 위치로)와 키보드(±1)가 모두 이 순수 함수로 귀결된다. 범위를 벗어나면 원본 복사본을 돌려준다.
 */
export function moveArrayItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...items];
  next.splice(to, 0, moved);
  return next;
}

/* ── 재정렬 전용 아이콘 (이 모듈에서만 쓴다) ─────────────────────────────────── */

const ICON_BASE = {
  width: '1.25em',
  height: '1.25em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** 드래그 손잡이 — 세로 점 6개 */
function GripVerticalIcon() {
  return (
    <svg {...ICON_BASE}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg {...ICON_BASE}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg {...ICON_BASE}>
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  );
}

/* ── 드래그 상태 훅 ──────────────────────────────────────────────────────────── */

interface ReorderableRows {
  /** <tr> 에 펼쳐 넣는 드래그 핸들러 */
  readonly rowProps: (id: string) => {
    readonly draggable: boolean;
    readonly onDragStart: (event: DragEvent<HTMLTableRowElement>) => void;
    readonly onDragOver: (event: DragEvent<HTMLTableRowElement>) => void;
    readonly onDrop: (event: DragEvent<HTMLTableRowElement>) => void;
    readonly onDragEnd: () => void;
  };
  /** 드래그 중 시각 피드백(끄는 행은 흐리게, 놓을 자리 위에 강조선)을 base 스타일에 얹는다 */
  readonly rowStyle: (id: string, base: CSSProperties) => CSSProperties;
  /** 키보드 이동 버튼 — index 를 delta(±1)만큼 옮긴 새 순서로 onReorder 를 부른다 */
  readonly moveBy: (index: number, delta: number) => void;
}

/**
 * 표 행 드래그 재정렬 상태. ids(현재 화면 순서)와 onReorder(새 순서 요청), locked(저장 중 잠금)를 받는다.
 * 저장/낙관적 업데이트·롤백은 호출부(페이지)가 한다 — 이 훅은 '새 순서 배열'만 만들어 넘긴다.
 */
export function useReorderableRows(
  ids: readonly string[],
  onReorder: (orderedIds: readonly string[]) => void,
  locked: boolean,
): ReorderableRows {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const reorderTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    onReorder(moveArrayItem(ids, from, to));
  };

  const clear = () => {
    setDraggingId(null);
    setOverId(null);
  };

  const rowProps = (id: string) => ({
    draggable: !locked,
    onDragStart: (event: DragEvent<HTMLTableRowElement>) => {
      if (locked) return;
      setDraggingId(id);
      event.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (event: DragEvent<HTMLTableRowElement>) => {
      if (draggingId === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      if (overId !== id) setOverId(id);
    },
    onDrop: (event: DragEvent<HTMLTableRowElement>) => {
      event.preventDefault();
      if (draggingId !== null) reorderTo(draggingId, id);
      clear();
    },
    onDragEnd: clear,
  });

  const rowStyle = (id: string, base: CSSProperties): CSSProperties => {
    const style: CSSProperties = { ...base };
    if (draggingId === id) style.opacity = 0.5;
    // 놓을 자리 위에 강조선 — 어디에 떨어질지 보여준다
    if (overId === id && draggingId !== null && draggingId !== id) {
      style.boxShadow = 'inset 0 var(--tds-border-width-medium) 0 0 var(--tds-color-border-focus)';
    }
    return style;
  };

  const moveBy = (index: number, delta: number) => {
    onReorder(moveArrayItem(ids, index, index + delta));
  };

  return { rowProps, rowStyle, moveBy };
}

/* ── 재사용 셀·버튼 ──────────────────────────────────────────────────────────── */

const gripHeadStyle: CSSProperties = { ...thStyle, width: 'var(--tds-space-6)' };

const gripCellStyle: CSSProperties = {
  ...tdStyle,
  width: 'var(--tds-space-6)',
  color: 'var(--tds-color-text-muted)',
  cursor: 'grab',
  textAlign: 'center',
};

/** 헤더의 grip 열 — 보이지 않는 라벨만 둔다 */
export function ReorderGripHeaderCell() {
  return (
    <th scope="col" style={gripHeadStyle}>
      <span style={visuallyHiddenStyle}>정렬 손잡이</span>
    </th>
  );
}

/** 행의 grip 열 — 드래그 손잡이 아이콘 */
export function ReorderGripCell() {
  return (
    <td style={gripCellStyle} aria-hidden="true">
      <GripVerticalIcon />
    </td>
  );
}

interface ReorderMoveButtonsProps {
  /** 스크린 리더용 대상 이름 — 행마다 달라야 한다('첫 번째 질문') */
  readonly label: string;
  readonly index: number;
  /** 전체 행 수 — 마지막 행의 '아래로'를 잠근다 */
  readonly count: number;
  /** 저장 진행 중 — 전부 잠근다 */
  readonly locked: boolean;
  readonly onMove: (index: number, delta: number) => void;
}

/** 키보드/보조 접근 경로 — 위/아래 이동 버튼 한 쌍 */
export function ReorderMoveButtons({
  label,
  index,
  count,
  locked,
  onMove,
}: ReorderMoveButtonsProps) {
  return (
    <>
      <button
        type="button"
        className="tds-ui-btn-ghost tds-ui-focusable"
        style={buttonStyle('ghost', locked || index === 0)}
        aria-label={`${label} 위로 이동`}
        disabled={locked || index === 0}
        onClick={() => onMove(index, -1)}
      >
        <ArrowUpIcon />
      </button>
      <button
        type="button"
        className="tds-ui-btn-ghost tds-ui-focusable"
        style={buttonStyle('ghost', locked || index === count - 1)}
        aria-label={`${label} 아래로 이동`}
        disabled={locked || index === count - 1}
        onClick={() => onMove(index, 1)}
      >
        <ArrowDownIcon />
      </button>
    </>
  );
}
