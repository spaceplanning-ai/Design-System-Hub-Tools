// AI 에이전트 도메인 훅 — 화면은 useQuery/useMutation 을 직접 부르지 않는다 (ADR-0008 §7.1)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import {
  askAgent,
  deleteConversations,
  fetchConversation,
  fetchConversations,
} from './data-source';
import type { AskInput, AskResult } from './data-source';
import type { Conversation } from './_shared/conversations';

const aiKeys = {
  all: ['ai'] as const,
  conversations: () => [...aiKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...aiKeys.all, 'conversation', id] as const,
} as const;

export function useConversationsQuery(): UseQueryResult<readonly Conversation[], Error> {
  return useQuery({
    queryKey: aiKeys.conversations(),
    queryFn: ({ signal }) => fetchConversations(signal),
    placeholderData: (previous) => previous,
  });
}

export function useConversationQuery(
  id: string | null,
): UseQueryResult<Conversation | null, Error> {
  return useQuery({
    queryKey: aiKeys.conversation(id ?? ''),
    queryFn: ({ signal }) => (id === null ? Promise.resolve(null) : fetchConversation(id, signal)),
    enabled: id !== null,
  });
}

/**
 * 질문 1건.
 *
 * react-query 는 뮤테이션에 signal 을 주지 않으므로 호출부가 AbortController 를 넘긴다
 * (회원 화면의 쓰기 계열과 같은 관례).
 */
export function useAskAgent(): UseMutationResult<
  AskResult,
  Error,
  AskInput & { readonly signal: AbortSignal }
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ signal, ...input }) => askAgent(input, signal),
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: aiKeys.conversations() });
      void client.invalidateQueries({ queryKey: aiKeys.conversation(result.conversation.id) });
    },
  });
}

export function useDeleteConversations(): UseMutationResult<
  void,
  Error,
  { readonly ids: readonly string[]; readonly signal: AbortSignal }
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, signal }) => deleteConversations(ids, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: aiKeys.all });
    },
  });
}
