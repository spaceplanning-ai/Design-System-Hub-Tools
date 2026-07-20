// 운영자 삭제·역할 변경 가드 — 규칙을 문장으로 못박는 테스트
//
// ─────────────────────────────────────────────────────────────────────────────
// [왜 이 파일이 화면 테스트가 아닌가]
// 이 세 규칙이 지키는 것은 픽셀이 아니라 **앱이 스스로를 잠그지 않는다**는 사실이다. 화면을 태워
// 확인하면 화면이 가드를 우회했을 때도(버튼을 안 잠갔을 때도) 어댑터가 막아 주므로 초록이 되고,
// 반대로 어댑터가 뚫려도 버튼이 잠겨 있으면 초록이 된다 — 어느 쪽이 지키고 있는지 알 수 없다.
// 규칙 자체는 순수 함수 한 곳에 있고(guards.ts), 화면과 어댑터는 **그 함수를 부를 뿐**이다.
// 그러니 규칙은 규칙이 사는 곳에서 본다 (admin-groups.test.ts 머리말과 같은 판단이다).
// ─────────────────────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import {
  adminDeletionBlock,
  adminRoleChangeBlock,
  isCurrentOperator,
  SELF_ROLE_CHANGE_REASON,
} from './guards';
import type { AdminGuardContext } from './guards';
import type { AdminUser } from './types';

const SYSTEM_ROLE = 'role-super-admin';
const PLAIN_ROLE = 'role-operator';
const OTHER_SYSTEM_ROLE = 'role-second-system';

function admin(overrides: Partial<AdminUser> & { readonly id: string }): AdminUser {
  return {
    nickname: `운영자-${overrides.id}`,
    account: `${overrides.id}@example.com`,
    groupId: 'admin',
    group: '운영팀',
    roleId: PLAIN_ROLE,
    joinedAt: '2026-01-02',
    department: '',
    position: '',
    phone: '',
    memo: '',
    ...overrides,
  };
}

function context(
  admins: readonly AdminUser[],
  currentAccount: string | null = null,
): AdminGuardContext {
  return {
    admins,
    systemRoleIds: new Set([SYSTEM_ROLE, OTHER_SYSTEM_ROLE]),
    currentAccount,
  };
}

describe('isCurrentOperator', () => {
  it('세션의 이메일과 계정이 같으면 지금 로그인한 본인으로 본다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local' });
    expect(isCurrentOperator(me, 'admin@tds.local')).toBe(true);
  });

  it('대소문자와 앞뒤 공백이 달라도 같은 사람으로 본다 — 그렇지 않으면 가드를 표기법 하나로 빠져나간다', () => {
    const me = admin({ id: 'A-1', account: ' Admin@TDS.local ' });
    expect(isCurrentOperator(me, 'admin@tds.local')).toBe(true);
  });

  it('세션을 알 수 없으면(null) 누구도 본인으로 보지 않는다 — 모르는 것을 참으로 읽지 않는다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local' });
    expect(isCurrentOperator(me, null)).toBe(false);
  });
});

describe('adminDeletionBlock — 자기 자신 삭제 금지', () => {
  it('지금 로그인한 본인 계정은 삭제할 수 없다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local', roleId: PLAIN_ROLE });
    const other = admin({ id: 'A-2', roleId: SYSTEM_ROLE });

    const blocked = adminDeletionBlock(me, context([me, other], 'admin@tds.local'));

    expect(blocked).not.toBeNull();
    expect(blocked).toContain('본인 계정');
  });

  it('본인이 아닌 운영자는 막지 않는다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local', roleId: SYSTEM_ROLE });
    const other = admin({ id: 'A-2', roleId: PLAIN_ROLE });

    expect(adminDeletionBlock(other, context([me, other], 'admin@tds.local'))).toBeNull();
  });
});

describe('adminDeletionBlock — 마지막 시스템 관리자 보호', () => {
  it('시스템 역할을 가진 마지막 운영자는 삭제할 수 없다', () => {
    const last = admin({ id: 'A-1', roleId: SYSTEM_ROLE });
    const plain = admin({ id: 'A-2', roleId: PLAIN_ROLE });

    const blocked = adminDeletionBlock(last, context([last, plain]));

    expect(blocked).not.toBeNull();
    expect(blocked).toContain('마지막 운영자');
  });

  it('시스템 관리자가 둘이면 그중 한 명은 삭제할 수 있다', () => {
    const first = admin({ id: 'A-1', roleId: SYSTEM_ROLE });
    const second = admin({ id: 'A-2', roleId: OTHER_SYSTEM_ROLE });

    expect(adminDeletionBlock(first, context([first, second]))).toBeNull();
  });

  it('시스템 역할이 아닌 운영자는 명부에 한 명뿐이어도 삭제를 막지 않는다', () => {
    const only = admin({ id: 'A-1', roleId: PLAIN_ROLE });

    expect(adminDeletionBlock(only, context([only]))).toBeNull();
  });

  it('본인이면서 마지막 시스템 관리자이면 본인 계정이라는 이유를 먼저 말한다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local', roleId: SYSTEM_ROLE });

    const blocked = adminDeletionBlock(me, context([me], 'admin@tds.local'));

    expect(blocked).toContain('본인 계정');
  });
});

describe('adminRoleChangeBlock — 자기 권한 박탈 금지', () => {
  it('본인 계정의 역할은 스스로 바꿀 수 없다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local', roleId: SYSTEM_ROLE });
    const other = admin({ id: 'A-2', roleId: OTHER_SYSTEM_ROLE });

    expect(adminRoleChangeBlock(me, PLAIN_ROLE, context([me, other], 'admin@tds.local'))).toBe(
      SELF_ROLE_CHANGE_REASON,
    );
  });

  it('본인 계정이라도 역할을 그대로 두는 저장은 막지 않는다 — 이름·연락처만 고칠 수 있어야 한다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local', roleId: SYSTEM_ROLE });
    const other = admin({ id: 'A-2', roleId: OTHER_SYSTEM_ROLE });

    expect(
      adminRoleChangeBlock(me, SYSTEM_ROLE, context([me, other], 'admin@tds.local')),
    ).toBeNull();
  });

  it('본인 계정은 역할을 올리는 것도 막는다 — 승격은 다른 시스템 관리자가 해 주면 되고, 그래야 규칙이 단순하다', () => {
    const me = admin({ id: 'A-1', account: 'admin@tds.local', roleId: PLAIN_ROLE });
    const keeper = admin({ id: 'A-2', roleId: SYSTEM_ROLE });

    expect(adminRoleChangeBlock(me, SYSTEM_ROLE, context([me, keeper], 'admin@tds.local'))).toBe(
      SELF_ROLE_CHANGE_REASON,
    );
  });
});

describe('adminRoleChangeBlock — 마지막 시스템 관리자 강등 금지', () => {
  it('시스템 역할을 가진 마지막 운영자를 일반 역할로 내릴 수 없다', () => {
    const last = admin({ id: 'A-1', roleId: SYSTEM_ROLE });
    const plain = admin({ id: 'A-2', roleId: PLAIN_ROLE });

    const blocked = adminRoleChangeBlock(last, PLAIN_ROLE, context([last, plain]));

    expect(blocked).not.toBeNull();
    expect(blocked).toContain('마지막 운영자');
  });

  it('마지막 시스템 관리자라도 다른 시스템 역할로 바꾸는 것은 강등이 아니라 막지 않는다', () => {
    const last = admin({ id: 'A-1', roleId: SYSTEM_ROLE });
    const plain = admin({ id: 'A-2', roleId: PLAIN_ROLE });

    expect(adminRoleChangeBlock(last, OTHER_SYSTEM_ROLE, context([last, plain]))).toBeNull();
  });

  it('시스템 관리자가 둘이면 그중 한 명은 일반 역할로 내릴 수 있다', () => {
    const first = admin({ id: 'A-1', roleId: SYSTEM_ROLE });
    const second = admin({ id: 'A-2', roleId: OTHER_SYSTEM_ROLE });

    expect(adminRoleChangeBlock(first, PLAIN_ROLE, context([first, second]))).toBeNull();
  });
});
