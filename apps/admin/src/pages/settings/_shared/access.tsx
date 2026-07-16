// 시스템 설정 권한 게이트 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/**)
//
// [왜 이 화면들이 게이트를 갖는가] 시스템 설정은 **최상위 권한**이다. 사이트를 통째로 내리는
// 유지보수 모드, 서버를 호출할 수 있는 API Key, 로그인을 위임하는 OAuth 자격증명이 여기 있다.
// 조회 권한이 없는 역할이 URL 을 직접 입력해 들어오면 화면을 그려서는 안 되고(EXC-03 read),
// 수정 권한이 없는 역할에게는 쓰기 컨트롤을 **보여주지도 않는다**(EXC-03 write).
//
// [리소스 id 의 출처] 하드코딩하지 않는다. 메뉴 트리(shared/layout/nav-config.ts)가 SSOT 이고
// shared/permissions/resources.ts 가 거기서 `page:{to}` 리소스를 파생한다 — 이 파일은 그 파생 id 를
// 읽기만 한다. 메뉴 경로가 바뀌면 리소스 id 도 함께 따라오므로 두 곳을 고칠 일이 없다.
//
// [강등 reconcile] usePermissions() 는 Zustand 스토어 구독이다 — 다른 탭에서 권한이 내려가면
// 이 훅이 재평가되어 쓰기 컨트롤이 그 자리에서 사라진다(EXC-03 강등 reconcile).
import type { ReactNode } from 'react';

import { usePermissions } from '../../../shared/permissions/PermissionProvider';
import { navPageResourceId } from '../../../shared/permissions/resources';
import { Alert, Card } from '../../../shared/ui';

/** 시스템 설정 4화면의 라우트 — nav-config 의 잎 경로와 1:1 이다 */
export const SETTINGS_ROUTES = {
  site: '/settings/site',
  languages: '/settings/languages',
  apiKeys: '/settings/api-keys',
  oauth: '/settings/oauth',
} as const;

type SettingsRoute = (typeof SETTINGS_ROUTES)[keyof typeof SETTINGS_ROUTES];

interface SettingsAccess {
  /** 화면을 그려도 되는가 — false 면 403 을 그린다 */
  readonly canRead: boolean;
  /** 기존 설정을 바꿔도 되는가 — false 면 저장/토글을 렌더하지 않는다 */
  readonly canUpdate: boolean;
  /** 새로 만들어도 되는가 (API Key 발급) */
  readonly canCreate: boolean;
  /** 지워도 되는가 (API Key 폐기) */
  readonly canRemove: boolean;
}

/**
 * 이 설정 화면에 대한 현재 역할의 권한.
 *
 * 판정은 **활성 역할**(적용 중인 역할) 기준이다 — 권한 관리 화면에서 '보고 있는' 역할이 아니다.
 */
export function useSettingsAccess(route: SettingsRoute): SettingsAccess {
  const { can } = usePermissions();
  const resourceId = navPageResourceId(route);

  return {
    canRead: can(resourceId, 'read'),
    canUpdate: can(resourceId, 'update'),
    canCreate: can(resourceId, 'create'),
    canRemove: can(resourceId, 'remove'),
  };
}

/**
 * 403 — 조회 권한이 없는 역할이 URL 로 직접 들어왔을 때.
 *
 * '다시 시도' 를 주지 않는다: 실패한 요청이 아니라 **허용되지 않은 접근**이라 재시도로 풀리지 않는다
 * (EXC-06 의 403 = retry 없는 권한 메시지). 사이드바는 그대로 남으므로 다른 메뉴로 갈 수 있다.
 */
function ForbiddenNotice({ description }: { readonly description: string }) {
  return (
    <Card>
      <Alert tone="danger">접근 권한이 없습니다.</Alert>
      <p style={forbiddenTextStyle}>{description}</p>
    </Card>
  );
}

const forbiddenTextStyle = {
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-md-font-size)',
  lineHeight: 'var(--tds-typography-label-md-line-height)',
} as const;

/**
 * 조회 권한이 있을 때만 children 을 그린다 — 없으면 403.
 * 화면마다 `if (!canRead) return <ForbiddenNotice/>` 를 반복하지 않게 한다.
 */
export function SettingsGate({
  route,
  description,
  children,
}: {
  readonly route: SettingsRoute;
  readonly description: string;
  readonly children: ReactNode;
}) {
  const { canRead } = useSettingsAccess(route);
  if (!canRead) return <ForbiddenNotice description={description} />;
  return <>{children}</>;
}
