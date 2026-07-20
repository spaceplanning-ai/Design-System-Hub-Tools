// Result — 결과 화면 상태 (molecule · contracts/Result.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/Result.types 를 그대로 import 한다 (수동 선언 금지 — G6).
// 요청한 내용을 그릴 수 없을 때 그 자리를 대신 채운다: 제목 + 설명 + 참조 코드 + 빠져나갈 액션.
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건.
//
// [문구를 만들지 않는다] Empty 는 label 로 문구를 조립하지만 Result 는 title·description 을 받는다.
//   화면이 실패하는 사유는 유한하지 않아서(렌더 예외·권한·점검·정지) DS 가 그 카피를 다 알 수 없고,
//   제품 카피를 DS 가 들면 다른 제품에서 쓸 수 없다 (계약 description '무엇이 DS 이고 무엇이 앱인가').
//
// [a11y] role="alert" — 화면이 그려지지 못했다는 사실은 즉시 전달돼야 한다. 승격 전 두 화면
//   (apps/admin/src/shared/errors/ErrorScreens.tsx)이 쓰던 값을 그대로 승계했다 — 동작을 바꾸지 않았다.
//   제목은 h2 다: 페이지의 h1 은 화면 이름을 가진 Header 가 소유한다.
import type { ResultProps } from '../../../generated/types/Result.types';
import './Result.css';

export function Result({ title, description = '', reference = '', actions = null }: ResultProps) {
  // 빈 문자열이면 그 줄 자체를 그리지 않는다 — 참조 코드가 없는 결과 화면(권한 없음 등)이
  // 빈 줄을 남기지 않게 하는 것이 계약이 센티널을 빈 문자열로 정한 이유다.
  const hasDescription = description !== '';
  const hasReference = reference !== '';
  const hasActions = actions !== null && actions !== undefined && actions !== false;

  return (
    <div className="tds-result" role="alert">
      <h2 className="tds-result__title">{title}</h2>
      {hasDescription ? <p className="tds-result__description">{description}</p> : null}
      {hasReference ? <p className="tds-result__reference">{reference}</p> : null}
      {hasActions ? <div className="tds-result__actions">{actions}</div> : null}
    </div>
  );
}
