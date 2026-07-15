// 상품 폼 검증 규칙 (A41 — 검증의 정본은 이 zod 스키마다)
//
// 문자열 숫자 필드(판매가·할인값)는 입력 중 원값을 보존하려 문자열로 받고 여기서 정수 형식을 판정한다.
// 옵션/SKU(variants)는 매트릭스 컴포넌트가 숫자로 관리하므로 배열·범위만 확인한다.
import * as z from 'zod/mini';

import { requiredImage, requiredText } from '../../../shared/crud';
import {
  MAX_PRODUCT_IMAGES,
  MAX_TAGS,
  PRODUCT_BRAND_MAX,
  PRODUCT_CODE_MAX,
  PRODUCT_DESCRIPTION_MAX,
  PRODUCT_NAME_MAX,
  PRODUCT_PRICE_MAX,
  PRODUCT_STOCK_MAX,
} from '../_shared/store';

const INT_RE = /^\d+$/;

const optionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(z.string()),
});

const variantSchema = z.object({
  id: z.string(),
  sku: z.string(),
  optionValues: z.array(z.string()),
  addPrice: z.number(),
  stock: z.number(),
  soldOut: z.boolean(),
});

export const productSchema = z
  .object({
    name: requiredText('상품명', PRODUCT_NAME_MAX),
    code: requiredText('상품코드', PRODUCT_CODE_MAX),
    categoryId: z
      .string()
      .check(z.refine((value) => value.trim() !== '', { error: '카테고리를 선택하세요.' })),
    brand: z.string().check(
      z.refine((value) => value.trim().length <= PRODUCT_BRAND_MAX, {
        error: `브랜드는 ${String(PRODUCT_BRAND_MAX)}자를 넘을 수 없습니다.`,
      }),
    ),
    price: z.string().check(
      z.refine((value) => value.trim() !== '', { error: '판매가를 입력하세요.' }),
      z.refine((value) => INT_RE.test(value.trim()), {
        error: '판매가는 숫자만 입력할 수 있습니다.',
      }),
      z.refine((value) => Number(value.trim()) <= PRODUCT_PRICE_MAX, {
        error: '판매가가 허용 범위를 넘었습니다.',
      }),
    ),
    discountType: z.enum(['none', 'amount', 'percent']),
    discountValue: z.string(),
    taxable: z.boolean(),
    saleStatus: z.enum(['on_sale', 'sold_out', 'stopped']),
    displayed: z.boolean(),
    shipping: z.object({
      method: z.enum(['courier', 'direct', 'pickup']),
      feeType: z.enum(['free', 'paid', 'conditional']),
      fee: z.string(),
      freeThreshold: z.string(),
    }),
    optionGroups: z.array(optionGroupSchema),
    variants: z.array(variantSchema).check(
      z.refine((values) => values.length > 0, { error: '옵션/재고를 한 줄 이상 구성하세요.' }),
      z.refine(
        (values) =>
          values.every((variant) => variant.stock >= 0 && variant.stock <= PRODUCT_STOCK_MAX),
        { error: `재고는 0 이상 ${String(PRODUCT_STOCK_MAX)} 이하로 입력하세요.` },
      ),
    ),
    coverImageUrl: requiredImage('대표 이미지'),
    imageUrls: z.array(z.string()).check(
      z.refine((values) => values.length <= MAX_PRODUCT_IMAGES, {
        error: `상세 이미지는 최대 ${String(MAX_PRODUCT_IMAGES)}장까지 등록할 수 있습니다.`,
      }),
    ),
    description: z.string().check(
      z.refine((value) => value.length <= PRODUCT_DESCRIPTION_MAX, {
        error: `상세설명은 ${String(PRODUCT_DESCRIPTION_MAX)}자를 넘을 수 없습니다.`,
      }),
    ),
    tags: z.array(z.string()).check(
      z.refine((values) => values.length <= MAX_TAGS, {
        error: `검색 태그는 최대 ${String(MAX_TAGS)}개까지 등록할 수 있습니다.`,
      }),
    ),
  })
  .check((ctx) => {
    // 할인값 — 할인 방식에 따라 범위가 다르다(정률 1~100%, 정액 1~판매가 미만).
    const { discountType, discountValue, price } = ctx.value;
    if (discountType === 'none') return;
    const raw = discountValue.trim();
    if (raw === '' || !INT_RE.test(raw)) {
      ctx.issues.push({
        code: 'custom',
        input: discountValue,
        path: ['discountValue'],
        message: '할인값은 숫자만 입력할 수 있습니다.',
      });
      return;
    }
    const value = Number(raw);
    if (discountType === 'percent' && (value < 1 || value > 100)) {
      ctx.issues.push({
        code: 'custom',
        input: discountValue,
        path: ['discountValue'],
        message: '할인율은 1% 이상 100% 이하로 입력하세요.',
      });
      return;
    }
    if (discountType === 'amount') {
      const base = INT_RE.test(price.trim()) ? Number(price.trim()) : 0;
      if (value < 1 || value >= base) {
        ctx.issues.push({
          code: 'custom',
          input: discountValue,
          path: ['discountValue'],
          message: '할인 금액은 1원 이상 판매가 미만으로 입력하세요.',
        });
      }
    }
  })
  .check((ctx) => {
    // 배송비 — 유료/조건부면 기본 배송비가 필요하고, 조건부면 무료 기준 금액도 필요하다.
    const { feeType, fee, freeThreshold } = ctx.value.shipping;
    if (
      feeType !== 'free' &&
      (fee.trim() === '' || !INT_RE.test(fee.trim()) || Number(fee.trim()) < 1)
    ) {
      ctx.issues.push({
        code: 'custom',
        input: fee,
        path: ['shipping', 'fee'],
        message: '기본 배송비를 1원 이상 입력하세요.',
      });
    }
    if (
      feeType === 'conditional' &&
      (freeThreshold.trim() === '' ||
        !INT_RE.test(freeThreshold.trim()) ||
        Number(freeThreshold.trim()) < 1)
    ) {
      ctx.issues.push({
        code: 'custom',
        input: freeThreshold,
        path: ['shipping', 'freeThreshold'],
        message: '무료배송 기준 금액을 1원 이상 입력하세요.',
      });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;
