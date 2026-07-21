// 라우트 → 권한 리소스 매핑 (EXC-03)
//
// 이 매핑이 틀리면 **가드가 조용히 무력해진다** — 잘못된 리소스를 물으면 늘 통과하거나 늘 막는다.
// 특히 상세/폼 라우트(사이드바에 없는 경로)가 부모 잎의 권한을 상속하는지가 핵심이다: deep-link 가
// 실제로 열리는 곳이 바로 그 라우트들이다.
import { describe, expect, it } from 'vitest';

import { resourceIdForPath } from './route-resource';
import { normalizeMatrix } from './resources';

describe('resourceIdForPath', () => {
  it('사이드바 잎은 자기 리소스로 해석된다', () => {
    expect(resourceIdForPath('/users/members')).toBe('page:/users/members');
    expect(resourceIdForPath('/content/notices')).toBe('page:/content/notices');
  });

  /** 상세·폼은 사이드바에 없다 — 그래도 게이팅돼야 한다 */
  it('상세/폼 라우트는 자기를 감싸는 잎의 권한을 상속한다', () => {
    expect(resourceIdForPath('/users/members/M-00001')).toBe('page:/users/members');
    expect(resourceIdForPath('/content/notices/new')).toBe('page:/content/notices');
    expect(resourceIdForPath('/content/notices/12/edit')).toBe('page:/content/notices');
  });

  /**
   * '/products' 와 '/products/categories' 는 **둘 다 잎이다**. 더 긴 잎이 이기지 않으면
   * 카테고리 화면이 상품 권한으로 열린다 — 서로 다른 두 권한이 하나로 뭉개진다.
   */
  it('더 구체적인(긴) 잎이 이긴다', () => {
    expect(resourceIdForPath('/products/categories')).toBe('page:/products/categories');
    expect(resourceIdForPath('/products')).toBe('page:/products');
    expect(resourceIdForPath('/products/9/edit')).toBe('page:/products');
  });

  /**
   * 세그먼트 경계 검사가 없으면 startsWith 가 '/products' 로 '/products-archive' 를 삼킨다 —
   * 남남인 화면이 권한을 공유하게 된다.
   */
  it('세그먼트 경계에서만 매칭한다 — 접두사 문자열이 우연히 겹치는 경로를 삼키지 않는다', () => {
    expect(resourceIdForPath('/products-archive')).toBeNull();
    expect(resourceIdForPath('/users/membership')).toBeNull();
  });

  /**
   * null 은 '차단' 이 아니라 '권한 모델에 없음' 이다. 이것을 403 으로 처리하면 인덱스
   * 리다이렉트('/')가 막혀 앱이 스스로를 잠근다.
   */
  it('어떤 잎에도 속하지 않는 경로는 null 이다', () => {
    expect(resourceIdForPath('/')).toBeNull();
    expect(resourceIdForPath('/login')).toBeNull();
  });
});

describe('저장값에 없는 리소스 — 거절이 아니라 미정이다', () => {
  it('기능이 생기기 전에 저장된 역할도 새 기능을 볼 수 있다', () => {
    // 빈 저장값 = 그 역할이 만들어질 때 이 리소스들이 존재하지 않았다는 뜻이다.
    // GRANT_OFF 로 읽으면 새 화면이 기존 세션 전부에서 조용히 사라진다(AI 에이전트가 그랬다).
    const matrix = normalizeMatrix({});
    const grants = Object.values(matrix);
    expect(grants.length).toBeGreaterThan(0);
    expect(grants.every((grant) => grant.read)).toBe(true);
  });

  it('발견은 열되 힘은 열지 않는다 — 쓰기는 명시적 부여를 요구한다', () => {
    const matrix = normalizeMatrix({});
    for (const grant of Object.values(matrix)) {
      expect(grant.create).toBe(false);
      expect(grant.update).toBe(false);
      expect(grant.remove).toBe(false);
    }
  });

  it('명시적으로 false 로 저장된 read 는 그대로 거절이다', () => {
    const [firstId] = Object.keys(normalizeMatrix({}));
    if (firstId === undefined) throw new Error('리소스가 없다');
    const matrix = normalizeMatrix({ [firstId]: { read: false } });
    expect(matrix[firstId]?.read).toBe(false);
  });
});

/**
 * 읽기만 여는 것으로는 반쪽이었다 — 새 메뉴가 열린 다음 날 '등록 버튼이 없다' 로 돌아왔다.
 * 조용히 사라지는 지점이 메뉴에서 버튼으로 옮겨갔을 뿐 같은 종류의 거짓말이라, 이제는 그 역할이
 * 이미 보여 온 자세를 새 리소스에도 적용한다. 만장일치를 요구하므로 권한이 늘어나지는 않는다.
 */
describe('저장값에 없는 리소스 — 그 역할의 기존 자세를 따른다', () => {
  /** 아는 리소스 전부에 같은 권한을 준 저장값을 만든다(하나는 일부러 빼서 '새 리소스'로 둔다) */
  function storedExcept(omitted: string, grant: Record<string, boolean>): Record<string, unknown> {
    const stored: Record<string, unknown> = {};
    for (const id of Object.keys(normalizeMatrix({}))) {
      if (id === omitted) continue;
      stored[id] = grant;
    }
    return stored;
  }

  const ALL_ON = { read: true, create: true, update: true, remove: true, export: true };

  function anyResourceId(): string {
    const [id] = Object.keys(normalizeMatrix({}));
    if (id === undefined) throw new Error('리소스가 없다');
    return id;
  }

  it('전 권한 역할은 새로 생긴 화면에서도 등록·수정·삭제를 할 수 있다', () => {
    const newcomer = anyResourceId();
    const matrix = normalizeMatrix(storedExcept(newcomer, ALL_ON));
    expect(matrix[newcomer]?.read).toBe(true);
    expect(matrix[newcomer]?.create).toBe(true);
    expect(matrix[newcomer]?.update).toBe(true);
    expect(matrix[newcomer]?.remove).toBe(true);
  });

  it('한 곳이라도 막혀 있던 역할은 새 화면에서 권한을 얻지 않는다 — 만장일치만 승계한다', () => {
    const newcomer = anyResourceId();
    const stored = storedExcept(newcomer, ALL_ON);
    // 딱 한 리소스에서 create 를 거둔다 — 이 역할은 더 이상 '전 권한' 이 아니다
    const [blocked] = Object.keys(stored);
    if (blocked === undefined) throw new Error('리소스가 없다');
    stored[blocked] = { ...ALL_ON, create: false };

    const matrix = normalizeMatrix(stored);
    expect(matrix[newcomer]?.create).toBe(false);
    // 나머지 권한은 여전히 만장일치라 승계된다
    expect(matrix[newcomer]?.update).toBe(true);
    // 발견은 언제나 연다
    expect(matrix[newcomer]?.read).toBe(true);
  });

  it('읽기 전용 역할은 새 화면도 읽기 전용이다', () => {
    const newcomer = anyResourceId();
    const readOnly = { read: true, create: false, update: false, remove: false, export: false };
    const matrix = normalizeMatrix(storedExcept(newcomer, readOnly));
    expect(matrix[newcomer]?.read).toBe(true);
    expect(matrix[newcomer]?.create).toBe(false);
    expect(matrix[newcomer]?.remove).toBe(false);
  });
});
