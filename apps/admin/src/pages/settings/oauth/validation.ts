// OAuth 설정 검증 규칙 (시스템 설정 섹션 소유 — 검증의 정본은 이 zod 스키마다)
//
// ┌ client secret 을 폼에서 어떻게 다루는가 ───────────────────────────────────┐
// │ 폼의 `secret` 필드는 **저장된 시크릿이 아니라 "새로 넣을 값"** 이다.            │
// │   빈 문자열  = 그대로 둔다(기존 시크릿 유지)                                  │
// │   값이 있음  = 이 값으로 교체한다                                            │
// │                                                                          │
// │ 그래서 저장된 시크릿은 폼에 **채워지지 않는다** — 채우면 DOM 에 평문이 살고,     │
// │ 그 순간 '마스킹' 은 눈속임이 된다. 화면은 `hasSecret` 불리언만 알고,           │
// │ 저장 여부는 `••••••••••••` 로 표시한다 (_shared/secret.ts).                   │
// └──────────────────────────────────────────────────────────────────────────┘
import * as z from 'zod/mini';

const OAUTH_PROVIDERS = ['google', 'kakao', 'naver'] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number];

interface ProviderMeta {
  readonly label: string;
  /**
   * Client ID 를 제공자 콘솔이 부르는 이름 — 화면 라벨을 콘솔 용어에 맞춘다.
   * 카카오는 같은 값을 'REST API 키' 라 부른다. 'Client ID' 라고만 적으면 운영자가 콘솔에서
   * 그 이름을 못 찾아 헤맨다.
   */
  readonly clientIdLabel: string;
  /** Redirect URI 를 제공자 콘솔이 부르는 이름 (네이버는 'Callback URL') */
  readonly redirectLabel: string;
  /** 콘솔에서 이 값들을 어디서 발급받는지 — 운영자가 두 화면을 오가며 헤매지 않게 */
  readonly consoleHint: string;
}

// Record 로 두면 (OAuthProviderId 키) 조회가 총함수라 undefined 갈래가 없다.
const OAUTH_PROVIDER_META: Record<OAuthProviderId, ProviderMeta> = {
  google: {
    label: 'Google',
    clientIdLabel: 'Client ID',
    redirectLabel: '승인된 리디렉션 URI',
    consoleHint: 'Google Cloud Console → API 및 서비스 → 사용자 인증 정보',
  },
  kakao: {
    label: '카카오',
    clientIdLabel: 'REST API 키',
    redirectLabel: 'Redirect URI',
    consoleHint: 'Kakao Developers → 내 애플리케이션 → 카카오 로그인',
  },
  naver: {
    label: '네이버',
    clientIdLabel: 'Client ID',
    redirectLabel: 'Callback URL',
    consoleHint: 'NAVER Developers → 내 애플리케이션 → API 설정',
  },
};

function providerMeta(id: OAuthProviderId): ProviderMeta {
  return OAUTH_PROVIDER_META[id];
}

export function providerLabel(id: OAuthProviderId): string {
  return providerMeta(id).label;
}

/** Client ID 필드에 붙일, 제공자 콘솔이 쓰는 이름 */
export function providerClientIdLabel(id: OAuthProviderId): string {
  return providerMeta(id).clientIdLabel;
}

/** Redirect URI 필드에 붙일, 제공자 콘솔이 쓰는 이름 */
export function providerRedirectLabel(id: OAuthProviderId): string {
  return providerMeta(id).redirectLabel;
}

/** 이 제공자의 자격증명을 어디서 발급받는지 (콘솔 경로) */
export function providerConsoleHint(id: OAuthProviderId): string {
  return providerMeta(id).consoleHint;
}

export const CLIENT_ID_MAX = 200;
export const CLIENT_SECRET_MAX = 200;

/**
 * Redirect URI 검증 — OAuth 제공자가 실제로 요구하는 규칙을 그대로 건다.
 *
 * - **절대 URL** 이어야 한다(상대 경로는 제공자가 거절한다)
 * - **https** 여야 한다. 예외는 로컬 개발(http://localhost · 127.0.0.1) 뿐이다 —
 *   제공자들도 이 예외만 허용한다. http 운영 주소는 인가 코드가 평문으로 흐른다.
 * - **fragment(#) 금지** — 인가 코드가 fragment 뒤에 붙는데 그 자리를 차지하면 콜백이 깨진다.
 *
 * 이걸 저장 시점에 막지 않으면 실패는 로그인 순간에, 사용자 앞에서 난다.
 */
export function redirectUriError(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === '') return 'Redirect URI를 입력하세요.';

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return 'Redirect URI는 https:// 로 시작하는 전체 주소여야 합니다.';
  }

  if (url.hash !== '') return 'Redirect URI에는 # 이후 값을 넣을 수 없습니다.';

  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol === 'https:') return null;
  if (url.protocol === 'http:' && isLocal) return null;

  return 'Redirect URI는 https:// 여야 합니다. (http는 localhost에서만 허용됩니다)';
}

const providerSchema = z.object({
  provider: z.enum(OAUTH_PROVIDERS),
  enabled: z.boolean(),
  clientId: z.string(),
  /** 새로 넣을 시크릿. 빈 문자열 = 기존 유지 */
  secret: z.string(),
  /** 저장된 시크릿이 있는가 — 서버가 알려준 사실이지 입력이 아니다 */
  hasSecret: z.boolean(),
  redirectUri: z.string(),
});

export const oauthSettingsSchema = z.object({ providers: z.array(providerSchema) }).check((ctx) => {
  ctx.value.providers.forEach((provider, index) => {
    // 꺼져 있는 제공자는 검증하지 않는다 — 쓰지 않을 값을 채우라고 요구하지 않는다
    if (!provider.enabled) return;

    const label = providerLabel(provider.provider);

    if (provider.clientId.trim() === '') {
      ctx.issues.push({
        code: 'custom',
        input: provider.clientId,
        path: ['providers', index, 'clientId'],
        message: `${label} Client ID를 입력하세요.`,
      });
    } else if (provider.clientId.trim().length > CLIENT_ID_MAX) {
      ctx.issues.push({
        code: 'custom',
        input: provider.clientId,
        path: ['providers', index, 'clientId'],
        message: `Client ID는 ${String(CLIENT_ID_MAX)}자를 넘을 수 없습니다.`,
      });
    }

    // 켜는데 시크릿이 아예 없으면(저장된 것도, 새로 넣은 것도) 인증이 성립하지 않는다
    if (!provider.hasSecret && provider.secret.trim() === '') {
      ctx.issues.push({
        code: 'custom',
        input: provider.secret,
        path: ['providers', index, 'secret'],
        message: `${label} Client Secret을 입력하세요.`,
      });
    } else if (provider.secret.trim().length > CLIENT_SECRET_MAX) {
      ctx.issues.push({
        code: 'custom',
        input: provider.secret,
        path: ['providers', index, 'secret'],
        message: `Client Secret은 ${String(CLIENT_SECRET_MAX)}자를 넘을 수 없습니다.`,
      });
    }

    const uriError = redirectUriError(provider.redirectUri);
    if (uriError !== null) {
      ctx.issues.push({
        code: 'custom',
        input: provider.redirectUri,
        path: ['providers', index, 'redirectUri'],
        message: uriError,
      });
    }
  });
});

export type OAuthSettingsValues = z.infer<typeof oauthSettingsSchema>;
export type OAuthProviderValues = OAuthSettingsValues['providers'][number];
