// AI 에이전트 도메인 배선 — 질의 가능한 도메인의 제공자를 꽂는다
//
// [왜 wiring.ts 와 분리했나] 배선의 이유는 같지만(서로 모르는 도메인을 합성 지점에서 잇는다)
// **비용이 다르다.** 이 파일은 상품·문의 스토어를 통째로 끌어온다. wiring.ts 안에 두면
// `wireDomains()` 를 부르는 쪽 — 운영자 그룹 테스트(pages/admins/*.test.tsx) — 이 자기와
// 무관한 두 도메인의 픽스처까지 매번 적재하게 되고, 그만큼 느려진다(실제로 그 테스트가
// 병렬 실행에서 시간 초과로 넘어갔다). 배선은 필요한 곳만 지불하면 된다.
//
// [왜 pages/ai 안이 아닌가] 상품·문의 데이터는 각 화면이 소유한다. AI 화면이 그 스토어를 직접
// import 하면 pages/ai → pages/products 결합이 된다(code-quality 축1). AI 화면은 슬롯만 알고
// (pages/ai/_shared/execute.ts), 구현은 두 도메인을 모두 아는 이 파일이 넣는다 —
// 관리자 그룹 ↔ 메시지 템플릿이 이미 쓰는 것과 같은 패턴이다(wiring.ts 머리말).
//
// [회원은 여기 없다] 회원 표본은 shared/fixtures 에 있어 결합이 없다 —
// pages/ai/_shared/provider-members.ts 가 스스로 등록한다.
import { registerDomainProvider, resolvePeriod, withinRange } from './pages/ai/_shared/execute';
import { createSimpleProvider, equalsValue } from './pages/ai/_shared/provider-simple';
import { registerAiProviderLookup } from './shared/fixtures/ai-providers';
import { aiProviderStatuses } from './pages/settings/api-keys/data-source';
import { finalPrice, listProducts } from './pages/products/_shared/store';
import { listTickets } from './pages/support/_shared/store';
import { ticketPriorityLabel, ticketStatusLabel } from './pages/support/_shared/domain';
import { formatNumber } from './shared/format';

/** 판매상태 표시명 — 스토어가 라벨 함수를 내보내지 않아 여기서 한 벌 갖는다 */
const PRODUCT_SALE_STATUS_LABEL = {
  on_sale: '판매중',
  sold_out: '품절',
  stopped: '판매중지',
} as const;

/**
 * AI 질의 도메인 제공자를 꽂는다 — 여러 번 불러도 결과가 같다(멱등).
 *
 * 호출 지점은 App.tsx 한 곳이다. 화면 단위 테스트는 자기가 필요한 도메인만 등록하면 된다.
 */
/**
 * AI 모델 프로바이더 연동 상태를 꽂는다 — 응답 모드의 잠금이 여기서 풀린다.
 *
 * ✔ **연동 카탈로그에 AI 프로바이더가 생겨 이제 실제로 꽂는다.** 정본은 시스템 설정의
 * 연동 저장소(pages/settings/api-keys/data-source.ts)가 갖고, 그쪽이 저장된 자격증명에서
 * 상태를 해소해(`aiProviderStatuses`) 핵심 4종(OpenAI · Claude · Gemini · Grok)만 넘겨준다.
 *
 * [조회기는 한 벌뿐이다] 계약은 shared/fixtures/ai-providers.ts 가 정의한다 — 설정 화면과
 * AI 화면이 서로를 모르는 채로 같은 사실을 읽는 **유일한** 통로다
 * (축1: pages/ai → pages/settings 직접 import 금지). 두 번째 조회기를 만들지 않는다.
 *
 * [처음에는 전부 잠겨 있다 — 그리고 그것이 옳다] 저장된 연동이 0건이면 네 프로바이더 모두
 * `enabled: false` 다. 배선이 없을 때와 결과는 같지만 **이유가 다르다**: '모르는 상태' 가
 * 아니라 '확인한 결과 없음' 이다.
 *
 * ✔ **이제 그 잠금이 실제로 풀린다.** 자격증명 저장 화면(/settings/api-keys/:providerId)에서
 * 프로바이더를 켜고 키를 저장하면 `aiProviderStatuses` 가 곧바로 `enabled: true` 를 돌려주고
 * /ai/chat 의 '빠른 · 전문가 · 헤비' 가 열린다 — 모드가 조회 시점에 해소되기 때문이다
 * (pages/ai/_shared/modes.ts 의 resolveResponseModes).
 *
 * ⚠ `enabled === true` 는 '자격증명이 갖춰졌다' 이지 '방금 호출해 확인했다' 가 아니다 —
 * 실제 연결 검증은 서버가 해야 하고(ai-connections.ts 의 verify 심) 아직 없다.
 */
function wireAiProviders(): void {
  registerAiProviderLookup(aiProviderStatuses);
}

export function wireAiDomains(): void {
  wireAiProviders();

  registerDomainProvider(
    'products',
    createSimpleProvider({
      columns: ['상품명', '상품코드', '카테고리', '판매상태', '판매가'],
      rows: listProducts,
      matches: (product, condition) => {
        const status = equalsValue(condition, 'saleStatus');
        if (status !== null) return product.saleStatus === status;
        const displayed = equalsValue(condition, 'displayed');
        if (displayed !== null) return product.displayed === (displayed === 'true');
        // 상품에는 기간으로 걸 날짜가 없다 — 파서가 이미 걸러 여기 오지 않는다
        return true;
      },
      toRow: (product) => ({
        id: product.id,
        cells: [
          product.name,
          product.code,
          product.categoryLabel,
          PRODUCT_SALE_STATUS_LABEL[product.saleStatus],
          `${formatNumber(finalPrice(product.pricing))}원`,
        ],
        href: `/products/${product.id}/edit`,
      }),
      listUrl: () => '/products',
    }),
  );

  registerDomainProvider(
    'tickets',
    createSimpleProvider({
      columns: ['문의번호', '제목', '유형', '우선순위', '처리상태', '접수일'],
      rows: listTickets,
      matches: (ticket, condition, now) => {
        const status = equalsValue(condition, 'status');
        if (status !== null) return ticket.status === status;
        const priority = equalsValue(condition, 'priority');
        if (priority !== null) return ticket.priority === priority;
        if (condition.kind === 'period' && condition.fieldId === 'receivedAt') {
          return withinRange(ticket.receivedAt, resolvePeriod(condition.period, now));
        }
        return true;
      },
      toRow: (ticket) => ({
        id: ticket.id,
        cells: [
          ticket.ticketNo,
          ticket.title,
          ticket.categoryLabel,
          ticketPriorityLabel(ticket.priority),
          ticketStatusLabel(ticket.status),
          ticket.receivedAt.slice(0, 10),
        ],
        href: `/support/tickets/${ticket.id}`,
      }),
      listUrl: () => '/support/tickets',
    }),
  );
}
