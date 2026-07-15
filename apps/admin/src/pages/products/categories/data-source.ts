// 상품 카테고리 데이터 소스 어댑터 (A41 소유 — apps/admin/src/pages/products/**)
//
// [백엔드 연동 지점] 공용 CRUD 프레임워크의 CrudAdapter 를 _shared/store 저장소 위에 배선한다.
// 목록 항목은 '카테고리 + 사용 중 상품 수'라 삭제 차단(사용 중 409)을 store.removeProductCategory 가 강제한다.
import { wait } from '../../../shared/async';
import { failIfRequested, LATENCY_MS } from '../../../shared/crud';
import type { CrudAdapter } from '../../../shared/crud';
import {
  addProductCategory,
  getProductCategoryUsage,
  listProductCategoryUsage,
  removeProductCategory,
  updateProductCategory,
} from '../_shared/store';
import type { ProductCategoryUsage } from '../_shared/store';
import type { ProductCategoryInput } from './types';

/** react-query 키 루트 겸 실패 스코프 — 페이지와 모달이 같은 키를 쓴다 */
export const CATEGORY_RESOURCE = 'product-categories';
const SCOPE = CATEGORY_RESOURCE;

// TODO(backend): GET/POST /api/products/categories · PUT/DELETE /api/products/categories/:id (사용 중이면 409)
export const productCategoryAdapter: CrudAdapter<ProductCategoryUsage, ProductCategoryInput> = {
  async fetchAll(signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested(SCOPE, 'list');
    return listProductCategoryUsage();
  },
  async fetchOne(id, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested(SCOPE, 'detail');
    return getProductCategoryUsage(id);
  },
  async create(input, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested(SCOPE, 'save');
    addProductCategory(input.name);
  },
  async update(id, input, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested(SCOPE, 'save');
    updateProductCategory(id, input.name);
  },
  async remove(id, signal) {
    await wait(LATENCY_MS, signal);
    failIfRequested(SCOPE, 'delete');
    removeProductCategory(id);
  },
};
