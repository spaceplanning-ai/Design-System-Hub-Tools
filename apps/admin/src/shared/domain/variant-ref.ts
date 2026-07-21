// 상품 옵션(SKU) 조회기 — **자리만** 만든다 (옵션·재고 수치의 정본은 상품 관리가 갖는다)
//
// ─────────────────────────────────────────────────────────────────────────────
// [왜 이 파일이 생겼나 — 클레임이 상품 저장소를 가로질러 읽고 있었다]
// 교환/반품 화면이 상품 관리(/products) 아래 있던 동안에는 `../_shared/store` 를 그냥 import 하면
// 됐다. 같은 페이지 안이었기 때문이다. 그 화면이 클레임으로 승격되어 주문(/orders/claims)으로
// 옮겨오면서 그 import 는 `pages/orders → pages/products` 가 되었다 — code-quality 축1
// (page-coupling · blocker · 임계값 0건)이 그대로 잡는 결합이다.
//
// [왜 재고 적용기(stock.ts)로는 부족한가]
// stock.ts 의 applyStockMovements 는 '이만큼 움직여라' 를 **쓰는** 통로다. 클레임에는 그 전에
// **읽어야** 하는 것이 있다: 교환할 옵션의 선택지와 그 옵션에 재고가 남았는가. 쓰기 자리만 있고
// 읽기 자리가 없으면 화면은 다시 상품 저장소를 직접 열게 된다.
//
// [왜 계약이 ProductVariant 가 아닌가]
// 가리키는 쪽에 필요한 것은 'SKU · 옵션 조합 · 남은 수량' 뿐이다. 옵션 추가금액·개별 품절 플래그는
// 상품 관리가 소유하는 축이고, 계약에 섞으면 어느 화면이 주인인지 다시 흐려진다. ProductVariant 는
// 이 모양을 **구조적으로 만족**하므로 배선은 변환 없이 그대로 넘긴다(shared/domain/stock.ts 의
// StockUnit 과 같은 판단).
//
// [왜 fail-closed 가 아니라 '모른다(null)' 인가]
// 조회기가 없을 때 빈 배열을 주면 화면은 **'교환할 옵션이 없습니다'** 라는 완결된 문장을 그린다 —
// 운영자는 그것을 사실로 읽고 '상품에서 옵션이 지워졌구나' 라고 결론짓는다. 배선 사고를 데이터
// 사고처럼 보이게 만드는 화면이다. 그래서 '없다' 와 '모른다' 를 가른다(order-ref.ts 와 같은 규약).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 다른 화면이 상품 옵션을 가리킬 때 필요한 **최소한**의 사실.
 *
 * id 를 든 이유는 표시가 아니라 **선택 값**이다 — 단일 SKU 상품의 빈 옵션 조합('')이 '미선택'과
 * 부딪히지 않으려면 select 의 value 가 옵션 조합이 아니라 이 id 여야 한다(ExchangeOptionField).
 */
export interface VariantRef {
  readonly id: string;
  /** 재고를 움직이는 단위 — 재고 이동(StockMovement)이 이 값을 키로 삼는다 */
  readonly sku: string;
  /** 옵션 조합(상품 optionGroups 순서) — 단일 상품이면 빈 배열 */
  readonly optionValues: readonly string[];
  readonly stock: number;
}

/** null = '모른다'(미배선이거나 그 상품을 찾지 못했다). 빈 배열은 '옵션이 정말 없다' 는 뜻이다 */
type VariantLookup = (productId: string) => readonly VariantRef[] | null;

/** 미배선 상태 — null 은 '옵션이 없다' 가 아니라 '어디서 읽는지 모른다' 다 */
let lookup: VariantLookup | null = null;

/** 조회기를 꽂는다 — 여러 번 불러도 결과가 같다(멱등). 호출자는 `src/wiring.ts` 하나다 */
export function registerVariantLookup(next: VariantLookup): void {
  lookup = next;
}

/** 테스트가 미배선 상태로 되돌린다 — '모른다' 경로를 실제로 밟아 보기 위한 것이다 */
export function resetVariantLookup(): void {
  lookup = null;
}

/**
 * 이 상품의 옵션들 — **배선되지 않았으면 null**(빈 배열이 아니다).
 *
 * 조회기가 던지면 그대로 올려보낸다. 여기서 삼키면 상품 쪽 사고가 '옵션 0건' 으로 둔갑한다.
 */
export function variantsOf(productId: string): readonly VariantRef[] | null {
  if (lookup === null) return null;
  return lookup(productId);
}
