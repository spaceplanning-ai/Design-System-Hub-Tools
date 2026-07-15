// 상품 카테고리 화면 전용 타입 + 뷰 헬퍼 (A41 소유 — apps/admin/src/pages/products/**)
//
// 카테고리 정본(픽스처·사용 중 판정)은 ../_shared/store 다. 여기는 입력 타입과 사용량 문구만 둔다.
import { formatNumber } from '../../../shared/format';

/** 카테고리 등록/수정 입력 */
export interface ProductCategoryInput {
  readonly name: string;
}

export const CATEGORY_NAME_MAX = 40;

/** 사용 여부 문구 — 사용 중이면 왜 못 지우는지 알린다(삭제 차단) */
export function usageLabel(productCount: number): string {
  return productCount === 0 ? '미사용' : `${formatNumber(productCount)}개 상품`;
}
