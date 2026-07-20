// 제공자 조립기 — 배선 지점(src/wiring.ts)이 짧은 선언만으로 도메인을 꽂을 수 있게 한다
//
// [왜 있는가] 상품·문의 제공자는 pages/products · pages/support 의 스토어를 읽어야 해서
// pages/ai 안에 둘 수 없다(결합). 그렇다고 wiring.ts 에 필터 루프와 슬라이스 로직을 두 벌
// 복사하면 그 파일이 배선이 아니라 조회 로직을 갖게 된다. 반복되는 뼈대(전 조건 AND · 상한
// 자르기 · 전체 건수 세기)는 여기 한 벌만 두고, 배선은 **도메인이 다른 부분만** 넘긴다.
import { ROW_LIMIT } from './execute';
import type { DomainProvider, ResultRow } from './execute';
import type { Condition } from './parser';

export interface SimpleProviderSpec<T> {
  readonly columns: readonly string[];
  /** 원본 행 — 호출 시점에 읽는다(스토어가 그 사이 바뀌었을 수 있다) */
  readonly rows: () => readonly T[];
  /** 조건 하나가 이 행에 맞는가. 모르는 조건은 true 를 돌려 무시한다 */
  readonly matches: (item: T, condition: Condition, now: Date) => boolean;
  readonly toRow: (item: T) => ResultRow;
  readonly listUrl: (conditions: readonly Condition[]) => string;
}

/** 뼈대는 공유하고 도메인 지식만 주입받아 제공자를 만든다 */
export function createSimpleProvider<T>(spec: SimpleProviderSpec<T>): DomainProvider {
  return {
    columns: spec.columns,

    run(conditions, now) {
      const hits = spec
        .rows()
        .filter((item) => conditions.every((condition) => spec.matches(item, condition, now)));
      return { rows: hits.slice(0, ROW_LIMIT).map(spec.toRow), total: hits.length };
    },

    listUrl: spec.listUrl,
  };
}

/** 'equals' 조건의 값 — 필드가 다르거나 조건 종류가 다르면 null */
export function equalsValue(condition: Condition, fieldId: string): string | null {
  return condition.kind === 'equals' && condition.fieldId === fieldId ? condition.valueId : null;
}
