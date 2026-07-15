// 팝업 도메인 훅 (A41 — ADR-0008 §7.1 집행)
//
// 화면은 여기 도메인 훅만 부른다 — data-source.ts 본문이 fixture → HTTP 로 바뀌어도 화면에
// 도달하지 않는다. 연동 지점은 data-source.ts 의 // TODO(backend) 주석이다.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { settleAll } from '../../../shared/bulk';
import { createPopup, deletePopup, fetchPopup, fetchPopups, updatePopup } from './data-source';
import type { PopupInput, PopupQuery } from './data-source';
import type { Popup, PopupListResult } from './types';

const popupKeys = {
  all: ['popups'] as const,
  lists: () => [...popupKeys.all, 'list'] as const,
  list: (query: PopupQuery) => [...popupKeys.lists(), query] as const,
  detail: (id: string) => [...popupKeys.all, 'detail', id] as const,
} as const;

export function usePopupsQuery(query: PopupQuery): UseQueryResult<PopupListResult, Error> {
  return useQuery({
    queryKey: popupKeys.list(query),
    queryFn: ({ signal }) => fetchPopups(query, signal),
    placeholderData: (previous) => previous,
  });
}

export function usePopupQuery(id: string): UseQueryResult<Popup, Error> {
  return useQuery({
    queryKey: popupKeys.detail(id),
    queryFn: ({ signal }) => fetchPopup(id, signal),
    enabled: id !== '',
  });
}

interface CreateVars {
  readonly input: PopupInput;
  readonly signal: AbortSignal;
}

export function useCreatePopup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ input, signal }: CreateVars) => createPopup(input, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: popupKeys.lists() });
    },
  });
}

interface UpdateVars {
  readonly id: string;
  readonly input: PopupInput;
  readonly signal: AbortSignal;
}

export function useUpdatePopup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, signal }: UpdateVars) => updatePopup(id, input, signal),
    onSuccess: (_result, { id }) => {
      void client.invalidateQueries({ queryKey: popupKeys.lists() });
      void client.invalidateQueries({ queryKey: popupKeys.detail(id) });
    },
  });
}

interface DeleteVars {
  readonly id: string;
  readonly signal: AbortSignal;
}

export function useDeletePopup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signal }: DeleteVars) => deletePopup(id, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: popupKeys.lists() });
    },
  });
}

interface BulkDeleteVars {
  readonly ids: readonly string[];
  readonly signal: AbortSignal;
}

/** 일괄 삭제 — 선택된 팝업 전원. 부분 실패도 건수(반환값)로 알린다 */
export function useBulkDeletePopups() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, signal }: BulkDeleteVars) =>
      settleAll(ids, (id) => deletePopup(id, signal)),
    onSuccess: (failed, { signal }) => {
      if (signal.aborted) return;
      if (failed === 0) void client.invalidateQueries({ queryKey: popupKeys.lists() });
    },
  });
}
