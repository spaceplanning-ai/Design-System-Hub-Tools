// FAQ 도메인 훅 (A41 — ADR-0008 §7.1 집행)
//
// 화면은 여기 도메인 훅만 부른다 — data-source.ts 의 본문이 fixture → HTTP 로 바뀌어도
// 화면에 도달하지 않는다. 연동 지점은 data-source.ts 의 // TODO(backend) 주석이다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import {
  createFaq,
  createFaqCategory,
  deleteFaq,
  fetchFaq,
  fetchFaqCategories,
  fetchFaqs,
  updateFaq,
} from './data-source';
import type { FaqCategoryInput, FaqInput, FaqQuery } from './data-source';
import type { Faq, FaqCategory, FaqListResult } from './types';

const faqKeys = {
  all: ['faqs'] as const,
  lists: () => [...faqKeys.all, 'list'] as const,
  list: (query: FaqQuery) => [...faqKeys.lists(), query] as const,
  detail: (id: string) => [...faqKeys.all, 'detail', id] as const,
  categories: () => [...faqKeys.all, 'categories'] as const,
} as const;

/* ── 조회 ────────────────────────────────────────────────────────────────── */

export function useFaqsQuery(query: FaqQuery): UseQueryResult<FaqListResult, Error> {
  return useQuery({
    queryKey: faqKeys.list(query),
    queryFn: ({ signal }) => fetchFaqs(query, signal),
    placeholderData: (previous) => previous,
  });
}

export function useFaqQuery(id: string): UseQueryResult<Faq, Error> {
  return useQuery({
    queryKey: faqKeys.detail(id),
    queryFn: ({ signal }) => fetchFaq(id, signal),
  });
}

export function useFaqCategoriesQuery(): UseQueryResult<readonly FaqCategory[], Error> {
  return useQuery({
    queryKey: faqKeys.categories(),
    queryFn: ({ signal }) => fetchFaqCategories(signal),
  });
}

/* ── 쓰기 ────────────────────────────────────────────────────────────────── */

interface CreateCategoryVars {
  readonly input: FaqCategoryInput;
  readonly signal: AbortSignal;
}

export function useCreateFaqCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, signal }: CreateCategoryVars) => createFaqCategory(input, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: faqKeys.categories() });
    },
  });
}

interface CreateVars {
  readonly input: FaqInput;
  readonly signal: AbortSignal;
}

export function useCreateFaq() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, signal }: CreateVars) => createFaq(input, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: faqKeys.lists() });
    },
  });
}

interface UpdateVars {
  readonly id: string;
  readonly input: FaqInput;
  readonly signal: AbortSignal;
}

export function useUpdateFaq() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, signal }: UpdateVars) => updateFaq(id, input, signal),
    onSuccess: (_result, { id }) => {
      void client.invalidateQueries({ queryKey: faqKeys.lists() });
      void client.invalidateQueries({ queryKey: faqKeys.detail(id) });
    },
  });
}

interface DeleteVars {
  readonly id: string;
  readonly signal: AbortSignal;
}

export function useDeleteFaq() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: DeleteVars) => deleteFaq(id, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: faqKeys.lists() });
    },
  });
}
