// 회원 도메인 제공자 — @회원목록 / @고객목록 질의가 실제로 도는 곳
//
// [결합 없음] 회원 표본은 shared/fixtures/members.ts 가 갖는다. 회원 화면(pages/members)이
// 아니라 공통 층을 읽으므로 pages/ai → pages/members 결합이 생기지 않는다. (고객 설정 화면도
// 같은 이유로 이 표본을 읽는다 — fixtures 헤더 참조.)
//
// [이 파일이 아는 것] 등급이 무엇이고 가입일이 무엇인지는 여기만 안다. 파서는 필드 id 만 알고,
// 화면은 완성된 표만 받는다.
import { MEMBERS } from '../../../shared/fixtures/members';
import { TIER_LABEL } from '../../../shared/domain/member';
import type { Member } from '../../../shared/domain/member';
import { formatNumber } from '../../../shared/format';
import { registerDomainProvider, resolvePeriod, ROW_LIMIT, withinRange } from './execute';
import type { DomainProvider, ResultRow } from './execute';
import type { Condition } from './parser';

/** 조건 하나가 이 회원에게 맞는가 */
function matches(member: Member, condition: Condition, now: Date): boolean {
  switch (condition.kind) {
    case 'equals':
      if (condition.fieldId === 'tier') return member.tier === condition.valueId;
      return true;

    case 'present':
      if (condition.fieldId === 'totalPurchase') return member.totalPurchase > 0;
      if (condition.fieldId === 'points') return member.points > 0;
      return true;

    case 'period':
      if (condition.fieldId === 'joinedAt') {
        return withinRange(member.joinedAt, resolvePeriod(condition.period, now));
      }
      return true;
  }
}

function toRow(member: Member): ResultRow {
  return {
    id: member.id,
    cells: [
      member.nickname,
      member.account,
      TIER_LABEL[member.tier],
      member.joinedAt,
      `${formatNumber(member.totalPurchase)}원`,
    ],
    href: `/users/members/${member.id}`,
  };
}

/**
 * 조건을 회원 목록 화면의 쿼리스트링으로 옮긴다.
 *
 * 목록 화면이 이해하는 것은 `?tier=` 뿐이다(MembersPage 의 FILTER_DEFAULTS). 기간·구매 조건은
 * 그 화면에 필터가 **없으므로** 옮기지 않는다 — 옮기는 척하면 링크를 눌렀을 때 다른 결과가
 * 나오고, 그것은 답변이 거짓이 되는 것과 같다.
 */
function membersListUrl(conditions: readonly Condition[]): string {
  const tier = conditions.find(
    (condition) => condition.kind === 'equals' && condition.fieldId === 'tier',
  );
  if (tier !== undefined && tier.kind === 'equals') {
    return `/users/members?tier=${tier.valueId}`;
  }
  return '/users/members';
}

export const membersProvider: DomainProvider = {
  columns: ['닉네임', '계정', '등급', '가입일', '누적 구매액'],

  run(conditions, now) {
    const hits = MEMBERS.filter((member) =>
      conditions.every((condition) => matches(member, condition, now)),
    );
    return { rows: hits.slice(0, ROW_LIMIT).map(toRow), total: hits.length };
  },

  listUrl: membersListUrl,
};

// 회원은 공통 픽스처를 읽으므로 결합이 없다 — 여기서 바로 자기를 등록한다.
// (상품·문의는 각 화면이 데이터를 소유하므로 src/wiring.ts 가 등록한다.)
registerDomainProvider('members', membersProvider);
