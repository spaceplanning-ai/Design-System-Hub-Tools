// SkeletonRows — 표 로딩 자리표시 행 (앱 공통)
//
// [왜 DS 가 아니라 여기인가]
// 블록 한 장(회색 막대)은 @tds/ui 의 Skeleton 이 소유한다 — 계약이 있고 토큰을 읽는다.
// 그러나 **R×C 배치는 <tr>/<td> 구조와 tdStyle 에 묶여 있어 DS 가 소유할 수 없다.**
// DS 는 앱의 표 골격(tdStyle · 컬럼 수)을 모르고, 알게 되면 도메인이 DS 로 새어 들어간다
// (Skeleton 계약 description 의 "반복은 왜 계약에 없나" 항이 이 판정의 정본이다).
//
// [무엇을 대체했나]
// 표 9곳이 이 함수를 **각자 로컬로 정의**하고 있었다 — AdminsTable · LogoListTable ·
// BannersTable · FaqTable · NoticesTable · PopupsTable · LoginHistoryTable · LogTable ·
// MembersTable. 시그니처가 셋으로 갈려 있었으나(무인자 ×5 · {columns} ×3 · {rows,cols} ×1)
// 본문은 아홉 벌이 **완전히 동일**했다. 여기서 {rows, cols} 하나로 합친다 — LogTable 의 것이며
// 나머지 여덟이 상수로 굳혀 두었던 두 값을 호출부가 그대로 명시하면 되는 상위집합이다.
import type { CSSProperties } from 'react';

import { Skeleton } from '@tds/ui';

import { tdStyle } from './styles';

interface SkeletonRowsProps {
  /** 그릴 행 수. 기본 5 — 승계한 9곳 중 값을 굳혀 두지 않은 쪽(LogoListTable · CrudTable)이 쓰던 값이다 */
  readonly rows?: number;
  /** 그릴 칸 수. 표마다 다르므로 기본값을 두지 않는다 — 틀리면 헤더와 칸 수가 어긋나 표가 깨진다 */
  readonly cols: number;
  /** 칸 스타일 재정의. 기본은 본문 셀과 같은 tdStyle 이다 */
  readonly cellStyle?: CSSProperties;
}

export function SkeletonRows({ rows = 5, cols, cellStyle = tdStyle }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr key={`skeleton-${String(index)}`}>
          {Array.from({ length: cols }, (_, cell) => (
            <td key={`cell-${String(cell)}`} style={cellStyle}>
              {/* 로딩 사실은 이 블록이 아니라 표를 담은 영역의 aria-busy 가 알린다 (Skeleton 계약 a11y) */}
              <Skeleton />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
