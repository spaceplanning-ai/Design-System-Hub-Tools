// 운영자(관리자) 도메인 훅 (ADR-0008 §7.1 집행)
//
// 화면은 useQuery 를 직접 부르지 않는다 — 여기 도메인 훅만 부른다.
// 조회 대상은 data-source.ts 의 fixture 어댑터다 (실제 HTTP 호출 0건).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import type { AdminGroupDraft } from '../../shared/domain/admin-group';
import {
  createAdminGroup,
  deleteAdmin,
  deleteAdminGroup,
  fetchAdmin,
  fetchAdminRoster,
  fetchAdminGroups,
  fetchAdminGroupUsage,
  fetchAdmins,
  fetchRegisteredSenderPhones,
} from './data-source';
import type { AdminQuery } from './data-source';
import type { AdminGroup, AdminGroupUsage, AdminListResult, AdminUser } from './types';

/**
 * [키 모양을 프레임워크와 맞춰 둔다]
 * 운영자 등록/수정 폼은 공용 CRUD 프레임워크(useCrudForm)를 쓰고, 그 훅은 저장 뒤
 * `[resource,'list']` 와 `[resource,'detail',id]` 를 무효화한다(shared/crud/crud.ts). resource 를
 * 'admins' 로 두면 그 두 키가 아래 `lists()`·`detail()` 과 **정확히 같은 배열**이 된다 — 그래서
 * 폼이 저장하면 이 파일의 훅이 든 목록·상세가 별도 배선 없이 함께 낡는다. 모양이 어긋나면
 * 저장은 됐는데 목록만 옛날 값을 보여 주는, 원인을 찾기 가장 어려운 종류의 버그가 된다.
 */
const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (query: AdminQuery) => [...adminKeys.lists(), query] as const,
  /** 운영자 1명 — useCrudForm 의 detailKey('admins', id) 와 같은 배열이어야 한다 */
  detail: (id: string) => [...adminKeys.all, 'detail', id] as const,
  /**
   * 가드 판정용 전체 명부.
   *
   * `lists()` **아래**에 둔 것이 요점이다: 무효화는 접두사로 걸리므로(react-query), 폼이 저장하며
   * `['admins','list']` 를 무효화하면 이 명부도 함께 낡는다. 형제 키로 뒀다면 방금 만든 운영자가
   * 명부에 없는 채로 '마지막 시스템 관리자인가' 를 세게 된다.
   */
  roster: () => [...adminKeys.lists(), 'roster'] as const,
  groups: () => [...adminKeys.all, 'groups'] as const,
  /** 그룹 하나의 참조 현황 — 삭제 다이얼로그를 열 때만 산다 */
  groupUsage: (id: string) => [...adminKeys.groups(), 'usage', id] as const,
  senderPhones: () => [...adminKeys.all, 'sender-phones'] as const,
} as const;

export function useAdminsQuery(query: AdminQuery): UseQueryResult<AdminListResult, Error> {
  return useQuery({
    queryKey: adminKeys.list(query),
    queryFn: ({ signal }) => fetchAdmins(query, signal),
    // 필터/페이지 전환 중에도 이전 목록을 유지한다 — useAsyncData 는 재조회 중 data 를 비우지 않았다
    placeholderData: (previous) => previous,
  });
}

/**
 * 운영자 1명 (상세 화면).
 *
 * `enabled` 로 id 가 없을 때는 아예 조회하지 않는다 — 라우트 파라미터가 없는 상태로 빈 문자열을
 * 조회하면 '찾을 수 없습니다' 404 를 스스로 만들어 내고, 화면은 그것을 진짜 404 와 구분할 수 없다.
 */
export function useAdminQuery(id: string): UseQueryResult<AdminUser, Error> {
  return useQuery({
    queryKey: adminKeys.detail(id),
    queryFn: ({ signal }) => fetchAdmin(id, signal),
    enabled: id !== '',
  });
}

/**
 * 삭제·역할 변경 가드가 읽는 전체 명부 (fetchAdminRoster 머리말).
 *
 * 상세·폼 화면이 자기 조회와 **함께** 띄운다. 명부가 아직 없으면 화면은 가드를 '통과' 로 읽지
 * 않고 판정을 유보한다 — 모르는 것을 '막을 이유 없음' 으로 읽으면 마지막 시스템 관리자가
 * 조용히 지워진다(같은 판단이 admin-groups 의 UNKNOWN_SENDER_USAGE 에 적혀 있다).
 */
export function useAdminRosterQuery(): UseQueryResult<readonly AdminUser[], Error> {
  return useQuery({
    queryKey: adminKeys.roster(),
    queryFn: ({ signal }) => fetchAdminRoster(signal),
  });
}

export function useAdminGroupsQuery(): UseQueryResult<readonly AdminGroup[], Error> {
  return useQuery({
    queryKey: adminKeys.groups(),
    queryFn: ({ signal }) => fetchAdminGroups(signal),
  });
}

/** 그룹 생성 폼의 발신번호 후보 — 사전등록 풀(자유 입력이 아니다) */
export function useRegisteredSenderPhonesQuery(): UseQueryResult<readonly string[], Error> {
  return useQuery({
    queryKey: adminKeys.senderPhones(),
    queryFn: ({ signal }) => fetchRegisteredSenderPhones(signal),
  });
}

/**
 * 삭제 대상 그룹의 참조 현황 — `enabled` 로 다이얼로그가 열릴 때만 조회한다.
 * `staleTime: 0`(기본)이라 다시 열 때마다 새로 본다: 그 사이 운영자가 옮겨졌을 수 있다.
 */
export function useAdminGroupUsageQuery(
  groupId: string | null,
): UseQueryResult<AdminGroupUsage, Error> {
  return useQuery({
    queryKey: adminKeys.groupUsage(groupId ?? ''),
    queryFn: ({ signal }) => fetchAdminGroupUsage(groupId ?? '', signal),
    enabled: groupId !== null,
  });
}

/* ── 쓰기 ────────────────────────────────────────────────────────────────────
 *
 * react-query 는 뮤테이션에 signal 을 주지 않는다 — 모달/다이얼로그가 자기 AbortController 를
 * 만들어 variables 에 실어 보낸다(닫으면 취소되는 동작을 유지하기 위해서다. members/queries.ts 와 동일).
 */

interface CreateAdminGroupVars {
  readonly draft: AdminGroupDraft;
  readonly signal: AbortSignal;
}

/**
 * 그룹 생성.
 *
 * [무엇을 무효화하는가] 그룹 목록(좌측 항목)과 **목록 조회**(`lists()`) 둘 다다. 목록 응답이
 * `groupCounts` 를 함께 싣기 때문에(AdminListResult), 그룹만 무효화하면 새 그룹의 배지가
 * '0' 이 아니라 '—' 로 남거나 아예 키가 없는 채로 그려진다.
 */
export function useCreateAdminGroup(): UseMutationResult<AdminGroup, Error, CreateAdminGroupVars> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ draft, signal }: CreateAdminGroupVars) => createAdminGroup(draft, signal),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: adminKeys.groups() });
      void client.invalidateQueries({ queryKey: adminKeys.lists() });
    },
  });
}

interface DeleteAdminVars {
  readonly adminId: string;
  readonly signal: AbortSignal;
}

/**
 * 운영자 삭제.
 *
 * [무엇을 무효화하는가] 목록(`lists()`)만이다. 상세는 무효화하지 않는다 — 방금 지운 것을 다시
 * 조회하면 404 가 돌아오고, 그 404 는 화면이 이미 목록으로 떠난 뒤에 도착해 '찾을 수 없습니다'
 * 배너를 한 번 깜빡이게 할 뿐이다. 사라진 것에 대해서는 묻지 않는다.
 * 좌측 그룹 배지 수는 목록 응답(AdminListResult.groupCounts)에 함께 실려 오므로 목록 무효화로 족하다.
 */
export function useDeleteAdmin(): UseMutationResult<void, Error, DeleteAdminVars> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ adminId, signal }: DeleteAdminVars) => deleteAdmin(adminId, signal),
    onSuccess: (_result, { adminId }) => {
      void client.invalidateQueries({ queryKey: adminKeys.lists() });
      // 캐시에 남은 상세는 이제 존재하지 않는 사람이다 — 낡은 값을 되살리지 말고 버린다
      client.removeQueries({ queryKey: adminKeys.detail(adminId) });
    },
  });
}

interface DeleteAdminGroupVars {
  readonly groupId: string;
  readonly signal: AbortSignal;
}

export function useDeleteAdminGroup(): UseMutationResult<void, Error, DeleteAdminGroupVars> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, signal }: DeleteAdminGroupVars) => deleteAdminGroup(groupId, signal),
    onSuccess: () => {
      // 생성과 같은 이유로 둘 다 — 사라진 그룹의 배지 키가 집계에 남으면 안 된다
      void client.invalidateQueries({ queryKey: adminKeys.groups() });
      void client.invalidateQueries({ queryKey: adminKeys.lists() });
    },
  });
}
