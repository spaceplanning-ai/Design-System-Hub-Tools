// Skeleton — 로딩 자리표시 블록 (atom · contracts/Skeleton.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/Skeleton.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 시각 값은 전부 토큰 CSS 변수 — 하드코딩 hex/px 0건 (G5/G6).
//
// 승계 원본: apps/admin/src/shared/ui/ui.css 의 `.tds-ui-skeleton` 과 표 9곳의 로컬 SkeletonRows.
// 아홉 벌이 전부 같은 한 줄(`<span class="tds-ui-skeleton" aria-hidden="true" />`)을 R×C 로 반복했을 뿐이라
// **블록 한 장**만 DS 로 올린다 — <tr>/<td> 반복은 그 표의 컬럼 수에 묶여 있어 DS 가 소유할 수 없다.
//
// 항상 aria-hidden 이다 (계약 a11y). 로딩 사실은 이 블록이 아니라 이것을 담은 영역의 aria-busy 가 알린다 —
// 표 한 장에 수십 장이 렌더되므로 장마다 알리면 낭독이 무너진다.
import type { SkeletonProps } from '../../../generated/types/Skeleton.types';
import './Skeleton.css';

export function Skeleton({ shape = 'line', animated = true }: SkeletonProps) {
  const className = [
    'tds-skeleton',
    `tds-skeleton--${shape}`,
    // 정지는 클래스의 부재가 아니라 명시로 표현한다 — CSS 에서 애니메이션을 끄는 규칙이 하나로 모인다
    animated ? '' : 'tds-skeleton--static',
  ]
    .filter((token) => token !== '')
    .join(' ');

  return <span className={className} aria-hidden="true" />;
}
