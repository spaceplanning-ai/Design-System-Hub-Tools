// 문의 → 견적 발행 이음매 회귀 테스트 — 멱등 발행 · 복수 문의 합치기 · 미배선 경로
//
// [무엇을 고정하나] 이 이음매가 없으면 상품·프로그램 문의에서 견적으로 가는 길 자체가 없다.
// 그래서 잠그는 것은 셋이다.
//   ① **두 번 눌러도 견적은 하나다** — quoteId 가 멱등키다.
//   ② **여러 문의를 하나로 합칠 수 있다** — 발행기는 배열을 받는다.
//   ③ **배선이 없으면 조용히 실패하지 않는다** — 거절 사유 문자열이 나온다.
import { afterEach, describe, expect, it } from 'vitest';

import {
  hasIssuedQuote,
  isQuoteIssuerWired,
  issuedQuoteHref,
  issueQuote,
  QUOTE_ISSUE_ALREADY,
  QUOTE_ISSUE_EMPTY,
  QUOTE_ISSUE_NOT_ISSUABLE,
  QUOTE_ISSUE_UNWIRED,
  quoteIssueBlock,
  registerQuoteIssuer,
  resetQuoteIssuer,
} from './quote-issue';
import type { IssuedQuoteRef, QuoteIssueSource } from './quote-issue';

const sourceOf = (id: string, itemName: string): QuoteIssueSource => ({
  id,
  no: id,
  channel: 'product',
  accountLabel: '김서연',
  customerName: '김서연',
  itemName,
  body: `${itemName} 문의`,
});

/** 발행기 대역 — 이미 발행된 문의가 섞이면 그 견적을 돌려준다(실제 저장소와 같은 규칙) */
function fakeIssuer() {
  const bySource = new Map<string, IssuedQuoteRef>();
  let seq = 0;
  return {
    bySource,
    issue: (sources: readonly QuoteIssueSource[]): IssuedQuoteRef => {
      for (const source of sources) {
        const existing = bySource.get(source.id);
        if (existing !== undefined) return existing;
      }
      seq += 1;
      const ref: IssuedQuoteRef = { id: `qt-${String(seq)}`, quoteNo: `Q-2026-${String(seq)}` };
      for (const source of sources) bySource.set(source.id, ref);
      return ref;
    },
  };
}

afterEach(() => {
  resetQuoteIssuer();
});

describe('발행 가드 — 버튼의 disabled 와 저장의 거절이 읽는 한 술어', () => {
  it('아무것도 고르지 않으면 막는다', () => {
    registerQuoteIssuer(fakeIssuer().issue);
    expect(quoteIssueBlock([])).toBe(QUOTE_ISSUE_EMPTY);
  });

  it('이미 견적이 있는 문의가 섞이면 막는다 — 한 문의가 견적 두 장을 갖지 않게 한다', () => {
    registerQuoteIssuer(fakeIssuer().issue);
    expect(
      quoteIssueBlock([
        { id: 'a', quoteId: '', issuable: true },
        { id: 'b', quoteId: 'qt-1', issuable: true },
      ]),
    ).toBe(QUOTE_ISSUE_ALREADY);
  });

  it('발행할 수 없는 상태(종결)가 섞이면 막는다', () => {
    registerQuoteIssuer(fakeIssuer().issue);
    expect(quoteIssueBlock([{ id: 'a', quoteId: '', issuable: false }])).toBe(
      QUOTE_ISSUE_NOT_ISSUABLE,
    );
  });

  it('전부 통과하면 null 이다', () => {
    registerQuoteIssuer(fakeIssuer().issue);
    expect(quoteIssueBlock([{ id: 'a', quoteId: '', issuable: true }])).toBeNull();
  });

  /* [왜 이것이 중요한가] 배선이 없을 때 조용히 아무 일도 하지 않으면 운영자는 버튼을 누르고
     아무 반응도 못 본 채 다시 누른다. 미배선은 **문장으로** 드러나야 한다. */
  it('배선되지 않았으면 그 사실을 이유로 돌려준다 — 조용한 무반응을 만들지 않는다', () => {
    resetQuoteIssuer();
    expect(isQuoteIssuerWired()).toBe(false);
    expect(quoteIssueBlock([{ id: 'a', quoteId: '', issuable: true }])).toBe(QUOTE_ISSUE_UNWIRED);
  });
});

describe('발행 — 멱등키는 문의 id 다', () => {
  it('같은 문의로 두 번 발행해도 견적은 하나다', () => {
    const issuer = fakeIssuer();
    registerQuoteIssuer(issuer.issue);

    const first = issueQuote([sourceOf('PIQ-1', '패딩')]);
    const second = issueQuote([sourceOf('PIQ-1', '패딩')]);
    expect(first).not.toBeNull();
    expect(second?.id).toBe(first?.id);
  });

  it('여러 문의를 넘기면 하나의 견적으로 합쳐지고 모두 같은 견적을 가리킨다', () => {
    const issuer = fakeIssuer();
    registerQuoteIssuer(issuer.issue);

    const merged = issueQuote([sourceOf('PIQ-1', '패딩'), sourceOf('PIQ-2', '티셔츠')]);
    expect(merged).not.toBeNull();
    expect(issuer.bySource.get('PIQ-1')?.id).toBe(merged?.id);
    expect(issuer.bySource.get('PIQ-2')?.id).toBe(merged?.id);
  });

  it('이미 발행된 문의가 섞이면 합치지 않고 기존 견적을 돌려준다', () => {
    const issuer = fakeIssuer();
    registerQuoteIssuer(issuer.issue);

    const first = issueQuote([sourceOf('PIQ-1', '패딩')]);
    const again = issueQuote([sourceOf('PIQ-1', '패딩'), sourceOf('PIQ-3', '데님')]);
    expect(again?.id).toBe(first?.id);
    // 끌려 들어온 문의는 견적을 얻지 못한다 — 그래서 가드가 애초에 이 조합을 막는다.
    expect(issuer.bySource.has('PIQ-3')).toBe(false);
  });

  it('배선되지 않았으면 null 이다 — 빈 참조를 지어내지 않는다', () => {
    resetQuoteIssuer();
    expect(issueQuote([sourceOf('PIQ-1', '패딩')])).toBeNull();
  });

  it('빈 목록으로는 아무것도 만들지 않는다', () => {
    registerQuoteIssuer(fakeIssuer().issue);
    expect(issueQuote([])).toBeNull();
  });
});

describe('역링크', () => {
  it('발행 여부 판정은 quoteId 하나가 정한다', () => {
    expect(hasIssuedQuote({ quoteId: '' })).toBe(false);
    expect(hasIssuedQuote({ quoteId: 'qt-1' })).toBe(true);
  });
  it('견적 상세 경로는 한 곳에서만 조립한다', () => {
    expect(issuedQuoteHref('qt-7')).toBe('/sales/quotes/qt-7');
  });
});
