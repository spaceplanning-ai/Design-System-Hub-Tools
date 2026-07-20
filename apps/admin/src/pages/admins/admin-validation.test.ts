// 운영자 등록/수정 폼 검증 규칙 — 무엇을 요구하고 무엇을 요구하지 않는가
//
// [왜 스키마를 직접 태우나] 이 규칙들은 화면이 아니라 스키마가 소유한다(validation.ts). 폼을
// 렌더해 확인하면 '필수 표시(*)를 붙였는가' 를 보는 것이지 '빈 값으로 저장이 되는가' 를 보는 게
// 아니다. 저장을 막는 것은 스키마이므로 스키마에 묻는다.
import { describe, expect, it } from 'vitest';

import { adminSchema } from './validation';
import type { AdminFormValues } from './validation';

const VALID: AdminFormValues = {
  nickname: '김운영',
  account: 'operator@tds.local',
  groupId: 'admin',
  roleId: 'role-operator',
  department: '',
  position: '',
  phone: '',
  memo: '',
};

/** 실패한 이슈들의 경로 — 어떤 칸이 거절됐는지로 확인한다 */
function failedFields(values: AdminFormValues): readonly string[] {
  const result = adminSchema.safeParse(values);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('adminSchema — 필수 항목', () => {
  it('닉네임·계정·그룹·역할만 채우면 통과한다 — 나머지는 있으면 좋은 정보라 요구하지 않는다', () => {
    expect(adminSchema.safeParse(VALID).success).toBe(true);
  });

  it('닉네임이 비어 있으면 거절한다', () => {
    expect(failedFields({ ...VALID, nickname: '   ' })).toContain('nickname');
  });

  it('계정이 비어 있으면 거절한다', () => {
    expect(failedFields({ ...VALID, account: '' })).toContain('account');
  });

  it('계정이 이메일 형식이 아니면 거절한다 — 로그인 아이디이자 이 사람을 식별하는 값이다', () => {
    expect(failedFields({ ...VALID, account: 'operator' })).toContain('account');
  });

  it('소속 그룹을 고르지 않으면 거절한다', () => {
    expect(failedFields({ ...VALID, groupId: '' })).toContain('groupId');
  });

  it('역할을 고르지 않으면 거절한다 — 역할 없는 운영자는 아무것도 할 수 없는 계정이다', () => {
    expect(failedFields({ ...VALID, roleId: '' })).toContain('roleId');
  });
});

describe('adminSchema — 선택 항목', () => {
  it('부서·직급·연락처·메모는 비어 있어도 통과한다', () => {
    expect(
      adminSchema.safeParse({ ...VALID, department: '', position: '', phone: '', memo: '' })
        .success,
    ).toBe(true);
  });

  it('연락처를 적었다면 형식을 본다 — 저장은 되고 발송만 실패하는 값을 통과시키지 않는다', () => {
    expect(failedFields({ ...VALID, phone: '전화없음' })).toContain('phone');
    expect(adminSchema.safeParse({ ...VALID, phone: '010-1234-5678' }).success).toBe(true);
  });

  it('닉네임이 상한을 넘으면 거절한다', () => {
    expect(failedFields({ ...VALID, nickname: '가'.repeat(31) })).toContain('nickname');
  });

  it('메모가 상한을 넘으면 거절한다', () => {
    expect(failedFields({ ...VALID, memo: '가'.repeat(501) })).toContain('memo');
  });
});

describe('adminSchema — 계정 중복은 여기서 판정하지 않는다', () => {
  it('이미 존재하는 계정이라도 스키마는 통과시킨다 — 명부를 쥔 어댑터가 409/422 로 거절한다', () => {
    // 스키마는 명부를 모른다. 화면이 든 목록으로 판정하면 다른 탭에서 방금 만들어진 계정을
    // 통과시키게 되고, 그 판정은 언제나 한 박자 늦는다 (validation.ts 머리말).
    expect(adminSchema.safeParse({ ...VALID, account: 'admin@tds.local' }).success).toBe(true);
  });
});
