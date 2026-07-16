// 빈 목록 문구 (apps/admin/src/pages/notifications/**)
//
// [STATE-05] '표시할 항목이 없습니다' 하나로는 '아직 없으니 만들어라'와 '검색이 안 맞으니 지워라'를
//   구분할 수 없다. 왜 비었는지를 세 가지로 갈라 각기 다른 복구 수단을 말한다:
//     (a) 진짜 비어있음 → 만들라고 안내      (b) 검색 결과 없음 → 검색어를 지우라고 안내
//     (c) 필터 결과 없음 → 필터를 초기화하라고 안내
//
// [왜 @tds/ui Empty 를 안 쓰는가 — 공유 레이어 필요분]
//   `<Empty>` 는 이 세 상태를 삽화·복구 CTA 까지 갖춰 정확히 표현하지만, 목록을 그리는 CrudTable 의
//   `emptyLabel` 이 **string** 이라 ReactNode 를 받을 수 없다. CrudTable/CrudListShell 은 shared/crud 소유라
//   이번 배치에서 수정할 수 없어, 지금은 문구 3분기만 string 으로 낸다(삽화·CTA 는 빠진다).
//   → CrudTable 에 `empty?: ReactNode` 를 열어 `<Empty>` 를 넘길 수 있게 하는 것이 정답 — 보고서에 올린다.
//
// [ERP-13] 라벨 받침에 맞춰 조사를 고른다 — 리터럴 '이(가)' 를 내지 않는다.
import { subjectParticle } from './notification';

interface EmptyContext {
  /** 검색어가 있는가 — 있으면 '검색 결과 없음' */
  readonly hasQuery: boolean;
  readonly keyword: string;
  /** 분류 필터가 걸려 있는가 — 걸려 있으면 '필터 결과 없음' */
  readonly hasActiveFilters: boolean;
  /** 진짜 비어있을 때 덧붙일 다음 행동 (예: '이벤트에 묶을 문구를 등록해 주세요.') */
  readonly createHint: string;
}

/** 우선순위: 검색 > 필터 > 진짜 비어있음 (@tds/ui Empty 의 resolveMode 와 같은 순서) */
export function emptyLabelFor(label: string, context: EmptyContext): string {
  const particle = subjectParticle(label);

  if (context.hasQuery) {
    return `'${context.keyword}' 조건에 맞는 ${label}${particle} 없습니다. 검색어를 바꾸거나 지워 보세요.`;
  }
  if (context.hasActiveFilters) {
    return `이 분류에 등록된 ${label}${particle} 없습니다. 필터를 초기화해 보세요.`;
  }
  return `등록된 ${label}${particle} 없습니다. ${context.createHint}`;
}
