// 가드가 판정에 쓸 사실들을 화면 쪽에서 모으는 훅
//
// [왜 화면에도 이게 필요한가 — 거절은 서버가 하지만, 안내는 미리 해야 한다]
// 삭제·역할 변경의 최종 거절은 어댑터(백엔드 자리)가 한다(data-source.ts). 그런데 그것만 두면
// 화면은 **누른 뒤에야** 안 되는 이유를 말하게 된다: 마지막 시스템 관리자 앞에서 '삭제' 버튼이
// 멀쩡히 열려 있다가 확인까지 누르고 나서야 거절된다. 되돌릴 수 없는 조작에서 그 순서는 나쁘다.
// 그래서 같은 판정을 화면도 미리 한 번 한다 — 문구는 양쪽 모두 guards.ts 가 갖는다.
//
// [모르면 통과가 아니다] 명부나 역할 목록이 아직 없으면 이 훅은 null 을 준다. 호출부는 그때
// '막을 이유 없음' 이 아니라 **'아직 판정할 수 없음'** 으로 다뤄야 한다 — 모르는 것을 '없음' 으로
// 읽으면 마지막 시스템 관리자가 조용히 지워진다(admin-groups 의 UNKNOWN_SENDER_USAGE 와 같은 판단).
import { useMemo } from 'react';

import { currentOperatorAccount } from '../../shared/auth/current-operator';
import { usePermissions } from '../../shared/permissions/PermissionProvider';
import type { AdminGuardContext } from './guards';
import { useAdminRosterQuery } from './queries';

interface AdminGuardState {
  /** 판정에 필요한 사실이 다 모였을 때만 값이 있다 — 아직이면 null */
  readonly context: AdminGuardContext | null;
  /** 명부 조회가 실패했다 — 판정 자체가 불가능하다는 사실을 화면이 말해야 한다 */
  readonly unavailable: boolean;
}

export function useAdminGuardContext(): AdminGuardState {
  // 역할 목록의 정본은 권한 스토어다 — 관리자 화면이 역할을 따로 들지 않는다(중복 목록 금지)
  const { roles } = usePermissions();
  const roster = useAdminRosterQuery();
  const admins = roster.data;

  const context = useMemo<AdminGuardContext | null>(() => {
    if (admins === undefined) return null;
    return {
      admins,
      systemRoleIds: new Set(roles.filter((role) => role.system).map((role) => role.id)),
      currentAccount: currentOperatorAccount(),
    };
  }, [admins, roles]);

  return { context, unavailable: roster.error !== null };
}
