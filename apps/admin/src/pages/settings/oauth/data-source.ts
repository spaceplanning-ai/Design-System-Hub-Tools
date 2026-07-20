// OAuth 설정 데이터 소스 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/**)
//
// [시크릿] 저장소는 **평문 시크릿을 갖지 않는다** — `hasSecret` 불리언만 안다.
// 조회 응답에도 시크릿은 실리지 않는다(서버가 준다 해도 화면이 쓸 일이 없다).
// 저장은 '새로 넣은 값' 만 보내고, 빈 문자열이면 서버가 기존 값을 유지한다.
//
// [픽스처의 Client ID 는 명백한 더미다] 실제 제공자 콘솔에서 받은 값처럼 보이면 안 된다.
//
// [실패/충돌 재현] /settings/oauth?fail=load · ?fail=save · ?fail=conflict
import { createRevisionedStore } from '../_shared/store';
import { isAppleProvider } from './validation';
import type { OAuthSettingsValues } from './validation';

export const oauthSettingsKey = ['settings', 'oauth'] as const;

/** client_id/client_secret 갈래의 빈 자격증명 — 다섯 제공자가 같은 모양이라 한 군데서 만든다 */
function emptyClientSecretProvider(
  provider: 'google' | 'kakao' | 'naver' | 'facebook' | 'line',
): OAuthSettingsValues['providers'][number] {
  return {
    provider,
    enabled: false,
    clientId: '',
    secret: '',
    hasSecret: false,
    nativeAppKey: '',
    redirectUri: `https://example.com/auth/${provider}/callback`,
  };
}

/**
 * 현재 값 — 여섯 제공자 모두 꺼져 있고 자격증명이 없다.
 * (켜져 있는 척하면 '왜 로그인이 안 되지' 로 돌아온다 — 백엔드가 없으니 실제로 동작하지 않는다.)
 *
 * **배열 순서가 곧 로그인 버튼 순서다**(OAuthPage 머리말) — 여기 순서가 화면 초기 순서가 된다.
 */
const DEFAULT_OAUTH_SETTINGS: OAuthSettingsValues = {
  providers: [
    emptyClientSecretProvider('google'),
    emptyClientSecretProvider('kakao'),
    emptyClientSecretProvider('naver'),
    emptyClientSecretProvider('facebook'),
    {
      // Apple 은 갈래가 다르다 — 정적 시크릿이 없고 서명 재료 넷을 받는다(./validation.ts)
      provider: 'apple',
      enabled: false,
      servicesId: '',
      teamId: '',
      keyId: '',
      privateKeyFileName: '',
      hasPrivateKey: false,
      redirectUri: 'https://example.com/auth/apple/callback',
    },
    emptyClientSecretProvider('line'),
  ],
  // 표시 정책의 기본값 — 켜 두면 카카오톡 인앱 브라우저에서 다른 소셜 버튼이 사라진다.
  // 기본은 끔: 화면에서 무언가를 **숨기는** 동작은 운영자가 명시적으로 켜야 한다.
  display: { kakaoTalkInAppLoginOnly: false },
};

// TODO(backend): GET /api/settings/oauth · PUT /api/settings/oauth
//   GET 응답: providers[] + display{}. 갈래마다 실리는 것이 다르다:
//     · client-secret (google·kakao·naver·facebook·line)
//         clientId · redirectUri · enabled · hasSecret · nativeAppKey
//         **secret 은 실리지 않는다.** nativeAppKey 는 비밀이 아니므로 평문으로 실린다.
//     · apple-key (apple)
//         servicesId · teamId · keyId · redirectUri · enabled · hasPrivateKey
//         **`.p8` 내용은 실리지 않는다.** 세 식별자는 비밀이 아니므로 평문으로 실린다.
//   PUT 요청: If-Match: <revision> + providers[] + display { kakaoTalkInAppLoginOnly }
//     · client-secret : { provider, enabled, clientId, redirectUri, nativeAppKey, secret? }
//         secret 이 없거나 빈 문자열이면 서버는 **기존 시크릿을 유지**한다(덮어쓰지 않는다).
//     · apple-key     : { provider, enabled, servicesId, teamId, keyId, redirectUri }
//   응답: 200 → { value, revision, audit } / 409·412 → 동시 편집 충돌 / 422 → 검증 실패
//
// TODO(backend): POST /api/settings/oauth/apple/private-key — `.p8` **파일 업로드 전용 통로**.
//   ┌ 왜 PUT 본문에 싣지 않는가 ──────────────────────────────────────────────┐
//   │ 개인키를 설정 JSON 에 섞으면 그 값이 요청 로그·감사 로그·충돌 비교 대상에      │
//   │ 함께 실려 다니게 된다. 파일은 파일대로, multipart 로 **한 번만** 올린다.      │
//   └────────────────────────────────────────────────────────────────────────┘
//   요청: multipart/form-data — file(.p8)
//   응답: 200 → { hasPrivateKey: true } — **내용도, 내용의 해시도 돌려주지 않는다.**
//   화면은 지금 파일 **이름만** 폼 상태에 담는다(내용은 폼에 들어오지 않는다). 이 통로가 붙기
//   전까지 저장은 이름만 보내므로 실제 키는 서버에 도달하지 않는다 — 그래서 화면이 '연결 테스트'
//   처럼 되지 않도록, 업로드 칸의 안내가 이 사실을 감추지 않는다(OAuthProviderCard).
export const oauthSettingsStore = createRevisionedStore<OAuthSettingsValues>(
  'oauth',
  DEFAULT_OAUTH_SETTINGS,
  { updatedBy: '김운영', updatedAt: '2026-07-02T08:05:00.000Z' },
);

/**
 * 저장 직후의 정규화 — 새로 넣은 시크릿은 '저장됨' 이 되고, 폼의 평문 자리는 비운다.
 *
 * 이걸 하지 않으면 저장한 뒤에도 입력칸에 평문이 남아 있고, 그 상태가 곧 새 기준선이 되어
 * **DOM 에 평문이 계속 산다**. 저장은 시크릿을 화면에서 지우는 시점이기도 하다.
 *
 * Apple 도 같은 규칙이다 — 다만 여기서 비우는 것은 **새로 고른 `.p8` 파일 이름**이다.
 * 파일 내용은 애초에 폼 상태에 들어온 적이 없다(./validation.ts).
 * 이름 칸은 `secret` 과 같은 '새로 넣을 값' 자리이므로 저장과 함께 비운다 — 비우지 않으면
 * 다음 저장 때 '또 새 파일을 올린다' 는 뜻이 되어 버린다.
 */
export function normalizeAfterSave(values: OAuthSettingsValues): OAuthSettingsValues {
  return {
    providers: values.providers.map((provider) => {
      if (isAppleProvider(provider)) {
        return {
          ...provider,
          hasPrivateKey: provider.hasPrivateKey || provider.privateKeyFileName.trim() !== '',
          privateKeyFileName: '',
        };
      }

      return {
        ...provider,
        hasSecret: provider.hasSecret || provider.secret.trim() !== '',
        secret: '',
      };
    }),
    // 표시 정책에는 비밀이 없다 — 그대로 통과시킨다(지우면 저장 직후 화면이 되돌아간 것처럼 보인다)
    display: values.display,
  };
}

// [충돌 항목 라벨이 여기 없는 이유] 다른 설정 화면은 divergedLabels(필드 키 → 라벨)로 짚지만,
// 이 화면의 문서는 제공자 배열이라 필드 단위로 나열하면 'providers' 한 줄이 되어 아무것도 알려주지
// 못한다. 그래서 OAuthPage 가 제공자 이름으로 직접 짚는다 (Google · 카카오 …).
