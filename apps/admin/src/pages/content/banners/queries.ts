// 배너 도메인 훅 (A41 — ADR-0008 §7.1 집행)
//
// 화면은 여기 도메인 훅만 부른다 — data-source.ts 본문이 fixture → HTTP 로 바뀌어도 화면에
// 도달하지 않는다. 연동 지점은 data-source.ts 의 // TODO(backend) 주석이다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { settleAll } from '../../../shared/bulk';
import { createBanner, deleteBanner, fetchBanner, fetchBanners, updateBanner } from './data-source';
import type { BannerInput, BannerQuery } from './data-source';
import type { Banner, BannerListResult } from './types';

const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (query: BannerQuery) => [...bannerKeys.lists(), query] as const,
  detail: (id: string) => [...bannerKeys.all, 'detail', id] as const,
} as const;

export function useBannersQuery(query: BannerQuery): UseQueryResult<BannerListResult, Error> {
  return useQuery({
    queryKey: bannerKeys.list(query),
    queryFn: ({ signal }) => fetchBanners(query, signal),
    placeholderData: (previous) => previous,
  });
}

export function useBannerQuery(id: string): UseQueryResult<Banner, Error> {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: ({ signal }) => fetchBanner(id, signal),
    enabled: id !== '',
  });
}

interface CreateVars {
  readonly input: BannerInput;
  readonly signal: AbortSignal;
}

export function useCreateBanner() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, signal }: CreateVars) => createBanner(input, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: bannerKeys.lists() });
    },
  });
}

interface UpdateVars {
  readonly id: string;
  readonly input: BannerInput;
  readonly signal: AbortSignal;
}

export function useUpdateBanner() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, signal }: UpdateVars) => updateBanner(id, input, signal),
    onSuccess: (_result, { id }) => {
      void client.invalidateQueries({ queryKey: bannerKeys.lists() });
      void client.invalidateQueries({ queryKey: bannerKeys.detail(id) });
    },
  });
}

interface DeleteVars {
  readonly id: string;
  readonly signal: AbortSignal;
}

export function useDeleteBanner() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: DeleteVars) => deleteBanner(id, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: bannerKeys.lists() });
    },
  });
}

interface BulkDeleteVars {
  readonly ids: readonly string[];
  readonly signal: AbortSignal;
}

/** 일괄 삭제 — 선택된 배너 전원. 부분 실패도 건수(반환값)로 알린다 */
export function useBulkDeleteBanners() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, signal }: BulkDeleteVars) =>
      settleAll(ids, (id) => deleteBanner(id, signal)),
    onSuccess: (failed, { signal }) => {
      if (signal.aborted) return;
      if (failed === 0) void client.invalidateQueries({ queryKey: bannerKeys.lists() });
    },
  });
}
