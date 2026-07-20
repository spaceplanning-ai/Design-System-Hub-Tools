// OAuth 설정 회귀 테스트 (시스템 설정 섹션)
//
// 지키는 것 여섯:
//   ① **Redirect URI 를 저장 시점에 막는다** — 안 막으면 실패는 로그인 순간 사용자 앞에서 난다
//   ② **저장 후 평문 시크릿이 화면에 남지 않는다**
//   ③ **iOS URL 스키마는 파생값이다** — Client ID 와 어긋날 수 없다
//   ④ **형식으로 막지 않는다** — 문서화되지 않은 키 형식을 근거로 멀쩡한 값을 거절하지 않는다
//   ⑤ **Apple 은 갈래가 다르다** — 시크릿 한 칸이 아니라 서명 재료 넷이고, localhost 를 못 쓴다
//   ⑥ **비밀은 어느 갈래에서도 돌아오지 않는다** — client secret 도, `.p8` 도
import { describe, expect, it } from 'vitest';

import { normalizeAfterSave } from './data-source';
import {
  iosUrlScheme,
  isAppleProvider,
  isClientSecretProvider,
  oauthSettingsSchema,
  providerIsUsable,
  redirectUriError,
} from './validation';
import type {
  AppleProviderValues,
  ClientSecretProviderValues,
  OAuthProviderValues,
  OAuthSettingsValues,
} from './validation';

/** 형식이 유효한 더미 구글 Client ID — 접미어 규약만 지킨다 */
const GOOGLE_CLIENT_ID = '000000000000-dummyadminhub.apps.googleusercontent.com';

function providerOf(
  overrides: Partial<ClientSecretProviderValues> = {},
): ClientSecretProviderValues {
  return {
    provider: 'google',
    enabled: false,
    clientId: '',
    secret: '',
    hasSecret: false,
    nativeAppKey: '',
    redirectUri: 'https://example.com/auth/google/callback',
    ...overrides,
  };
}

/** Apple 은 갈래가 다르다 — 픽스처도 따로 둔다(억지로 한 헬퍼에 합치면 그게 곧 납작한 타입이다) */
function appleOf(overrides: Partial<AppleProviderValues> = {}): AppleProviderValues {
  return {
    provider: 'apple',
    enabled: false,
    servicesId: '',
    teamId: '',
    keyId: '',
    privateKeyFileName: '',
    hasPrivateKey: false,
    redirectUri: 'https://example.com/auth/apple/callback',
    ...overrides,
  };
}

/** 모든 재료가 갖춰진 Apple — '켜도 통과' 를 기준선으로 쓴다 */
function appleReady(overrides: Partial<AppleProviderValues> = {}): AppleProviderValues {
  return appleOf({
    enabled: true,
    servicesId: 'com.example.web',
    teamId: 'ABCDE12345',
    keyId: 'VWXYZ67890',
    hasPrivateKey: true,
    ...overrides,
  });
}

function valuesOf(providers: readonly OAuthProviderValues[]): OAuthSettingsValues {
  return { providers: [...providers], display: { kakaoTalkInAppLoginOnly: false } };
}

/** 첫 제공자를 client-secret 갈래로 좁혀 꺼낸다 — 아니면 undefined(테스트가 조용히 통과하지 않게) */
function firstClientSecret(values: OAuthSettingsValues): ClientSecretProviderValues | undefined {
  const first = values.providers[0];
  return first !== undefined && isClientSecretProvider(first) ? first : undefined;
}

/** 첫 제공자를 apple 갈래로 좁혀 꺼낸다 */
function firstApple(values: OAuthSettingsValues): AppleProviderValues | undefined {
  const first = values.providers[0];
  return first !== undefined && isAppleProvider(first) ? first : undefined;
}

describe('redirectUriError — Redirect URI 규칙', () => {
  it('https 를 통과시킨다', () => {
    expect(redirectUriError('https://example.com/auth/callback')).toBeNull();
  });

  it('http 운영 주소를 막는다 — 인가 코드가 평문으로 흐른다', () => {
    expect(redirectUriError('http://example.com/auth/callback')).not.toBeNull();
  });

  it('로컬 개발용 http 는 허용한다 — 제공자들도 이 예외만 허용한다', () => {
    expect(redirectUriError('http://localhost:5173/auth/callback')).toBeNull();
    expect(redirectUriError('http://127.0.0.1:5173/auth/callback')).toBeNull();
    expect(redirectUriError('http://[::1]:5173/auth/callback')).toBeNull();
  });

  it('상대 경로를 막는다 — 제공자는 전체 주소를 요구한다', () => {
    expect(redirectUriError('/auth/callback')).not.toBeNull();
  });

  it('fragment(#)를 막는다 — 인가 코드가 붙을 자리를 차지한다', () => {
    expect(redirectUriError('https://example.com/auth#section')).not.toBeNull();
  });

  it('비면 막는다', () => {
    expect(redirectUriError('   ')).not.toBeNull();
  });

  it('oob(복사·붙여넣기) 흐름을 막는다 — 2023-01-31 로 완전히 종료됐다', () => {
    expect(redirectUriError('urn:ietf:wg:oauth:2.0:oob')).not.toBeNull();
    expect(redirectUriError('urn:ietf:wg:oauth:2.0:oob:auto')).not.toBeNull();
    // 대소문자를 바꿔도 같은 값이다
    expect(redirectUriError('URN:IETF:WG:OAUTH:2.0:OOB')).not.toBeNull();
  });

  it('와일드카드(*)를 막는다 — 매칭은 패턴이 아니라 문자열 일치다', () => {
    expect(redirectUriError('https://*.example.com/cb')).not.toBeNull();
    expect(redirectUriError('https://example.com/*')).not.toBeNull();
  });

  it('userinfo(user:pass@)를 막는다', () => {
    expect(redirectUriError('https://user:pass@example.com/cb')).not.toBeNull();
    expect(redirectUriError('https://user@example.com/cb')).not.toBeNull();
  });

  it("경로 이동('/..')을 막는다 — URL 파싱이 정규화해 버리기 전에 원문에서 잡는다", () => {
    expect(redirectUriError('https://example.com/a/../b')).not.toBeNull();
    expect(redirectUriError('https://example.com/..')).not.toBeNull();
    // 퍼센트 인코딩된 점도 같은 이유로 막는다 — 양쪽 정규화가 갈리면 '정확히 일치' 가 깨진다
    expect(redirectUriError('https://example.com/a/%2e%2e/b')).not.toBeNull();
  });

  it('정상 경로의 점은 막지 않는다 — 과잉 차단은 멀쩡한 주소를 거절한다', () => {
    expect(redirectUriError('https://example.com/v1.2/callback')).toBeNull();
  });

  it('날 IP 주소를 막는다 — localhost 만 예외다', () => {
    expect(redirectUriError('https://203.0.113.10/cb')).not.toBeNull();
    expect(redirectUriError('https://[2001:db8::1]/cb')).not.toBeNull();
  });

  it('정규화하지 않는다 — 끝 슬래시가 있든 없든 둘 다 그대로 통과시킨다', () => {
    // 제공자의 매칭은 정확한 문자열 일치다. 우리가 '고쳐 주면' 콘솔 등록값과 어긋난다.
    expect(redirectUriError('https://example.com/cb')).toBeNull();
    expect(redirectUriError('https://example.com/cb/')).toBeNull();
    expect(redirectUriError('https://Example.com/CB')).toBeNull();
  });

  /* ── Apple 만의 예외 없음 ────────────────────────────────────────────────
     "The URI must use the HTTPS protocol, include a domain name, and can't contain
      an IP address or localhost, and must not contain a fragment identifer (#)."
     https://developer.apple.com/documentation/signinwithapplerestapi/generate_and_validate_tokens */
  describe('allowLocalhost:false (Apple) — 로컬 예외가 없다', () => {
    it('localhost 를 https 로 적어도 막는다 — 프로토콜 문제가 아니라 호스트 문제다', () => {
      expect(
        redirectUriError('https://localhost:5173/cb', { allowLocalhost: false }),
      ).not.toBeNull();
      expect(
        redirectUriError('http://localhost:5173/cb', { allowLocalhost: false }),
      ).not.toBeNull();
      expect(redirectUriError('https://127.0.0.1/cb', { allowLocalhost: false })).not.toBeNull();
    });

    it('도메인이 있는 https 는 그대로 통과한다', () => {
      expect(
        redirectUriError('https://example.com/auth/apple/callback', { allowLocalhost: false }),
      ).toBeNull();
    });

    it('기본값은 로컬을 허용한다 — 옵션을 넘기지 않은 호출의 뜻이 바뀌지 않는다', () => {
      expect(redirectUriError('http://localhost:5173/cb')).toBeNull();
    });
  });
});

describe('iosUrlScheme — 입력이 아니라 파생값이다', () => {
  it('클라이언트 ID 를 뒤집어 만든다', () => {
    expect(iosUrlScheme(GOOGLE_CLIENT_ID)).toBe(
      'com.googleusercontent.apps.000000000000-dummyadminhub',
    );
  });

  it('대시 세그먼트가 없는 ID 도 파생한다 — Google 자신의 Playground ID 가 그 모양이다', () => {
    expect(iosUrlScheme('407408718192.apps.googleusercontent.com')).toBe(
      'com.googleusercontent.apps.407408718192',
    );
  });

  it('앞뒤 공백을 흡수한다 — 붙여넣기는 대개 공백을 데려온다', () => {
    expect(iosUrlScheme(`  ${GOOGLE_CLIENT_ID}  `)).toBe(
      'com.googleusercontent.apps.000000000000-dummyadminhub',
    );
  });

  it('접미어가 없으면 파생하지 않는다(null) — 지어내지 않는다', () => {
    expect(iosUrlScheme('')).toBeNull();
    expect(iosUrlScheme('not-a-google-client-id')).toBeNull();
    // 접미어만 있고 본체가 없는 값도 근거가 없다
    expect(iosUrlScheme('.apps.googleusercontent.com')).toBeNull();
  });
});

describe('oauthSettingsSchema — 켜진 제공자만 검증한다', () => {
  it('꺼진 제공자는 값이 비어도 통과한다 — 쓰지 않을 값을 요구하지 않는다', () => {
    expect(
      oauthSettingsSchema.safeParse(valuesOf([providerOf({ enabled: false, clientId: '' })]))
        .success,
    ).toBe(true);
  });

  it('켜면 Client ID 를 요구한다', () => {
    const result = oauthSettingsSchema.safeParse(
      valuesOf([providerOf({ enabled: true, clientId: '', secret: 'dummy-secret' })]),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path.includes('clientId'))).toBe(true);
  });

  it('구글 Client ID 는 접미어만 본다 — 대시 세그먼트를 요구하지 않는다', () => {
    const playground = oauthSettingsSchema.safeParse(
      valuesOf([
        providerOf({
          enabled: true,
          clientId: '407408718192.apps.googleusercontent.com',
          hasSecret: true,
        }),
      ]),
    );

    expect(playground.success).toBe(true);
  });

  it('구글 Client ID 에 접미어가 없으면 막는다 — 문서화된 규약이다', () => {
    const result = oauthSettingsSchema.safeParse(
      valuesOf([providerOf({ enabled: true, clientId: 'dummy-client-id', hasSecret: true })]),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path.includes('clientId'))).toBe(true);
  });

  it('켜는데 저장된 시크릿도 새 시크릿도 없으면 막는다', () => {
    const result = oauthSettingsSchema.safeParse(
      valuesOf([
        providerOf({ enabled: true, clientId: GOOGLE_CLIENT_ID, hasSecret: false, secret: '' }),
      ]),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path.includes('secret'))).toBe(true);
  });

  it('저장된 시크릿이 있으면 새로 넣지 않아도 통과한다 — 비워 두면 유지한다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({ enabled: true, clientId: GOOGLE_CLIENT_ID, hasSecret: true, secret: '' }),
        ]),
      ).success,
    ).toBe(true);
  });

  it('시크릿의 접두어·문자셋을 검사하지 않는다 — GOCSPX- 는 보장된 규약이 아니다', () => {
    // 2021 이전에 발급된 시크릿에는 그 접두어가 없다. 요구하면 멀쩡한 값이 거절된다.
    for (const secret of ['GOCSPX-dummy_value_here', 'legacy-2019-style-secret', '한글이섞인값']) {
      const result = oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({ enabled: true, clientId: GOOGLE_CLIENT_ID, hasSecret: false, secret }),
        ]),
      );
      expect(result.success).toBe(true);
    }
  });

  it('카카오 네이티브 앱 키는 선택이다 — 웹만 쓰는 사이트는 필요하지 않다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({
            provider: 'kakao',
            enabled: true,
            clientId: 'dummy-kakao-rest-api-key',
            hasSecret: true,
            nativeAppKey: '',
            redirectUri: 'https://example.com/auth/kakao/callback',
          }),
        ]),
      ).success,
    ).toBe(true);
  });

  it('켜면 Redirect URI 규칙을 강제한다', () => {
    const result = oauthSettingsSchema.safeParse(
      valuesOf([
        providerOf({
          enabled: true,
          clientId: GOOGLE_CLIENT_ID,
          hasSecret: true,
          redirectUri: 'http://example.com/cb',
        }),
      ]),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path.includes('redirectUri'))).toBe(true);
  });
});

/* ── 새로 붙인 세 제공자 ───────────────────────────────────────────────── */

describe('Facebook — 앱 ID + 앱 시크릿 짝이다', () => {
  const base = {
    provider: 'facebook',
    redirectUri: 'https://example.com/auth/facebook/callback',
  } as const;

  it('켜면 앱 ID 와 시크릿을 둘 다 요구한다', () => {
    const result = oauthSettingsSchema.safeParse(
      valuesOf([providerOf({ ...base, enabled: true, clientId: '', hasSecret: false })]),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join('.'));
    expect(paths).toContain('providers.0.clientId');
    expect(paths).toContain('providers.0.secret');
  });

  it('둘 다 있으면 통과한다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({ ...base, enabled: true, clientId: '000000000000000', hasSecret: true }),
        ]),
      ).success,
    ).toBe(true);
  });

  it('앱 ID 의 자릿수·문자셋을 검사하지 않는다 — Meta 가 문서화한 적 없다', () => {
    for (const clientId of ['1', '000000000000000', 'not-numeric-at-all']) {
      expect(
        oauthSettingsSchema.safeParse(
          valuesOf([providerOf({ ...base, enabled: true, clientId, hasSecret: true })]),
        ).success,
      ).toBe(true);
    }
  });

  it('구글 접미어 규칙을 넘겨받지 않는다 — 그것은 구글만의 규약이다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({ ...base, enabled: true, clientId: 'plain-app-id', hasSecret: true }),
        ]),
      ).success,
    ).toBe(true);
  });
});

describe('LINE — Channel ID + Channel secret 짝이다', () => {
  const base = {
    provider: 'line',
    redirectUri: 'https://example.com/auth/line/callback',
  } as const;

  it('켜면 Channel ID 와 Channel secret 을 둘 다 요구한다', () => {
    const result = oauthSettingsSchema.safeParse(
      valuesOf([providerOf({ ...base, enabled: true, clientId: '', hasSecret: false })]),
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join('.'));
    expect(paths).toContain('providers.0.clientId');
    expect(paths).toContain('providers.0.secret');
  });

  it('둘 다 있으면 통과한다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([providerOf({ ...base, enabled: true, clientId: '2000000000', hasSecret: true })]),
      ).success,
    ).toBe(true);
  });

  it('Channel ID 의 자릿수를 검사하지 않는다 — LINE 이 문서화한 적 없다', () => {
    for (const clientId of ['2000000000', '1', 'channel-id-like-string']) {
      expect(
        oauthSettingsSchema.safeParse(
          valuesOf([providerOf({ ...base, enabled: true, clientId, hasSecret: true })]),
        ).success,
      ).toBe(true);
    }
  });

  it('로컬 개발 주소를 막지 않는다 — Apple 과 달리 금지 문구가 없다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({
            ...base,
            enabled: true,
            clientId: '2000000000',
            hasSecret: true,
            redirectUri: 'http://localhost:5173/auth/line/callback',
          }),
        ]),
      ).success,
    ).toBe(true);
  });
});

describe('Apple — 시크릿 한 칸이 아니라 서명 재료 넷이다', () => {
  it('갈래가 다르다 — 타입 가드가 두 모양을 갈라낸다', () => {
    expect(isAppleProvider(appleOf())).toBe(true);
    expect(isClientSecretProvider(appleOf())).toBe(false);
    expect(isAppleProvider(providerOf())).toBe(false);
    expect(isClientSecretProvider(providerOf())).toBe(true);
  });

  it('꺼져 있으면 넷이 다 비어도 통과한다', () => {
    expect(oauthSettingsSchema.safeParse(valuesOf([appleOf({ enabled: false })])).success).toBe(
      true,
    );
  });

  it('켜면 Services ID · Team ID · Key ID · 개인키를 **모두** 요구한다', () => {
    const result = oauthSettingsSchema.safeParse(valuesOf([appleOf({ enabled: true })]));

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join('.'));
    // 넷 중 하나라도 빠지면 서버가 client_secret(JWT)을 서명할 수 없다
    expect(paths).toContain('providers.0.servicesId');
    expect(paths).toContain('providers.0.teamId');
    expect(paths).toContain('providers.0.keyId');
    expect(paths).toContain('providers.0.privateKeyFileName');
  });

  it('넷이 다 갖춰지면 통과한다', () => {
    expect(oauthSettingsSchema.safeParse(valuesOf([appleReady()])).success).toBe(true);
  });

  it('개인키는 저장돼 있거나 새로 고른 파일이 있으면 된다 — 둘 다 없을 때만 막는다', () => {
    // 저장돼 있다 → 새로 고르지 않아도 된다
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([appleReady({ hasPrivateKey: true, privateKeyFileName: '' })]),
      ).success,
    ).toBe(true);

    // 저장된 것은 없지만 방금 골랐다 → 통과
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          appleReady({ hasPrivateKey: false, privateKeyFileName: 'AuthKey_VWXYZ67890.p8' }),
        ]),
      ).success,
    ).toBe(true);

    // 둘 다 없다 → 막는다
    const result = oauthSettingsSchema.safeParse(
      valuesOf([appleReady({ hasPrivateKey: false, privateKeyFileName: '' })]),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.error.issues.some(
        (issue) => issue.path.join('.') === 'providers.0.privateKeyFileName',
      ),
    ).toBe(true);
  });

  it('Team ID · Key ID 의 자릿수로 막지 않는다 — 문서가 10자라 해도 경고까지다', () => {
    expect(
      oauthSettingsSchema.safeParse(valuesOf([appleReady({ teamId: 'SHORT', keyId: 'X' })]))
        .success,
    ).toBe(true);
  });

  it('Return URL 에 localhost 를 허용하지 않는다 — Apple 문서가 명시적으로 금지한다', () => {
    for (const redirectUri of [
      'https://localhost:5173/auth/apple/callback',
      'http://localhost:5173/auth/apple/callback',
      'https://127.0.0.1/auth/apple/callback',
    ]) {
      const result = oauthSettingsSchema.safeParse(valuesOf([appleReady({ redirectUri })]));
      expect(result.success).toBe(false);
      if (result.success) continue;
      expect(
        result.error.issues.some((issue) => issue.path.join('.') === 'providers.0.redirectUri'),
      ).toBe(true);
    }
  });

  it('다른 제공자의 localhost 는 여전히 허용된다 — Apple 규칙이 전역으로 번지지 않는다', () => {
    expect(
      oauthSettingsSchema.safeParse(
        valuesOf([
          providerOf({
            enabled: true,
            clientId: GOOGLE_CLIENT_ID,
            hasSecret: true,
            redirectUri: 'http://localhost:5173/auth/google/callback',
          }),
        ]),
      ).success,
    ).toBe(true);
  });

  it('client-secret 갈래의 필드를 요구하지 않는다 — Apple 에는 client_secret 이 없다', () => {
    const result = oauthSettingsSchema.safeParse(valuesOf([appleReady()]));
    expect(result.success).toBe(true);
    if (!result.success) return;
    // 스키마가 통과시킨 값에 secret/clientId 자리가 아예 없다(선택 필드로 남지 않는다)
    const parsed = firstApple(result.data);
    expect(parsed).toBeDefined();
    expect(Object.keys(parsed ?? {})).not.toContain('secret');
    expect(Object.keys(parsed ?? {})).not.toContain('clientId');
  });
});

describe('providerIsUsable — 연동 목록이 쓰는 판정', () => {
  it('켜짐 + Client ID + 저장된 시크릿이 모두 있어야 쓸 수 있다', () => {
    expect(
      providerIsUsable(providerOf({ enabled: true, clientId: GOOGLE_CLIENT_ID, hasSecret: true })),
    ).toBe(true);
  });

  it('하나라도 빠지면 쓸 수 없다 — 켜 놓기만 한 제공자를 연동 완료라 부르지 않는다', () => {
    expect(
      providerIsUsable(providerOf({ enabled: false, clientId: GOOGLE_CLIENT_ID, hasSecret: true })),
    ).toBe(false);
    expect(providerIsUsable(providerOf({ enabled: true, clientId: '', hasSecret: true }))).toBe(
      false,
    );
    expect(
      providerIsUsable(providerOf({ enabled: true, clientId: GOOGLE_CLIENT_ID, hasSecret: false })),
    ).toBe(false);
  });

  it('Apple 은 네 재료가 모두 있어야 한다 — 하나라도 빠지면 서명할 수 없다', () => {
    expect(providerIsUsable(appleReady())).toBe(true);

    expect(providerIsUsable(appleReady({ enabled: false }))).toBe(false);
    expect(providerIsUsable(appleReady({ servicesId: '' }))).toBe(false);
    expect(providerIsUsable(appleReady({ teamId: '' }))).toBe(false);
    expect(providerIsUsable(appleReady({ keyId: '' }))).toBe(false);
    expect(providerIsUsable(appleReady({ hasPrivateKey: false }))).toBe(false);
  });

  it('방금 고른 파일은 아직 서버에 없다 — 저장되기 전에는 쓸 수 있다고 하지 않는다', () => {
    expect(
      providerIsUsable(
        appleReady({ hasPrivateKey: false, privateKeyFileName: 'AuthKey_VWXYZ67890.p8' }),
      ),
    ).toBe(false);
  });
});

describe('normalizeAfterSave — 저장은 비밀을 화면에서 지운다', () => {
  it('새로 넣은 평문을 비우고 저장됨(hasSecret)으로 바꾼다', () => {
    const next = normalizeAfterSave(
      valuesOf([providerOf({ enabled: true, secret: 'brand-new-dummy-secret', hasSecret: false })]),
    );

    const provider = firstClientSecret(next);
    expect(provider).toBeDefined();
    // 평문이 폼 상태에 남지 않는다 — 남으면 그것이 새 기준선이 되어 DOM 에 계속 산다
    expect(provider?.secret).toBe('');
    expect(provider?.hasSecret).toBe(true);
  });

  it('시크릿을 건드리지 않았으면 저장 여부가 그대로다', () => {
    const next = normalizeAfterSave(valuesOf([providerOf({ hasSecret: true, secret: '' })]));

    expect(firstClientSecret(next)?.hasSecret).toBe(true);
    expect(firstClientSecret(next)?.secret).toBe('');
  });

  it('저장된 적 없고 새로 넣지도 않았으면 여전히 없음이다', () => {
    const next = normalizeAfterSave(valuesOf([providerOf({ hasSecret: false, secret: '' })]));

    expect(firstClientSecret(next)?.hasSecret).toBe(false);
  });

  it('비밀이 아닌 값(네이티브 앱 키)과 표시 정책은 지우지 않는다', () => {
    const next = normalizeAfterSave({
      providers: [providerOf({ provider: 'kakao', nativeAppKey: 'dummy-native-app-key' })],
      display: { kakaoTalkInAppLoginOnly: true },
    });

    expect(firstClientSecret(next)?.nativeAppKey).toBe('dummy-native-app-key');
    expect(next.display.kakaoTalkInAppLoginOnly).toBe(true);
  });

  it('Apple 도 같다 — 고른 파일 이름을 비우고 저장됨(hasPrivateKey)으로 바꾼다', () => {
    const next = normalizeAfterSave(
      valuesOf([appleReady({ hasPrivateKey: false, privateKeyFileName: 'AuthKey_VWXYZ67890.p8' })]),
    );

    const provider = firstApple(next);
    expect(provider).toBeDefined();
    // 이름 칸은 '새로 넣을 값' 자리다 — 비우지 않으면 다음 저장이 '또 올린다' 는 뜻이 된다
    expect(provider?.privateKeyFileName).toBe('');
    expect(provider?.hasPrivateKey).toBe(true);
  });

  it('Apple 의 공개 식별자 셋은 지우지 않는다 — 비밀이 아니다', () => {
    const next = normalizeAfterSave(valuesOf([appleReady()]));
    const provider = firstApple(next);

    expect(provider?.servicesId).toBe('com.example.web');
    expect(provider?.teamId).toBe('ABCDE12345');
    expect(provider?.keyId).toBe('VWXYZ67890');
  });

  it('키를 건드리지 않았으면 저장 여부가 그대로다', () => {
    const next = normalizeAfterSave(
      valuesOf([appleReady({ hasPrivateKey: true, privateKeyFileName: '' })]),
    );

    expect(firstApple(next)?.hasPrivateKey).toBe(true);
    expect(firstApple(next)?.privateKeyFileName).toBe('');
  });

  it('저장 결과 어디에도 평문 비밀이 남지 않는다 — 두 갈래를 한꺼번에 본다', () => {
    const saved = normalizeAfterSave(
      valuesOf([
        providerOf({ provider: 'facebook', secret: 'facebook-plaintext-secret' }),
        providerOf({ provider: 'line', secret: 'line-plaintext-secret' }),
        appleReady({ hasPrivateKey: false, privateKeyFileName: 'AuthKey_VWXYZ67890.p8' }),
      ]),
    );

    const serialized = JSON.stringify(saved);
    expect(serialized).not.toContain('facebook-plaintext-secret');
    expect(serialized).not.toContain('line-plaintext-secret');
    // `.p8` 은 내용이 애초에 폼에 없고, 이름조차 저장과 함께 사라진다
    expect(serialized).not.toContain('AuthKey_VWXYZ67890.p8');
  });
});

describe('표시 정책 — 카카오가 꺼져 있으면 인앱 전용 정책을 켤 수 없다', () => {
  const KAKAO_OFF = [providerOf({ provider: 'kakao', enabled: false })];

  it('카카오가 꺼진 채 정책만 켜면 거절한다 — 인앱 방문자에게 로그인 수단이 남지 않는다', () => {
    const result = oauthSettingsSchema.safeParse({
      providers: KAKAO_OFF,
      display: { kakaoTalkInAppLoginOnly: true },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path.join('.') === 'display.kakaoTalkInAppLoginOnly',
        ),
      ).toBe(true);
    }
  });

  it('카카오가 켜져 있으면 통과한다', () => {
    const result = oauthSettingsSchema.safeParse({
      providers: [
        providerOf({
          provider: 'kakao',
          enabled: true,
          clientId: 'rest-api-key',
          secret: 'kakao-secret',
          redirectUri: 'https://example.com/auth/kakao/callback',
        }),
      ],
      display: { kakaoTalkInAppLoginOnly: true },
    });
    expect(result.success).toBe(true);
  });

  it('정책이 꺼져 있으면 카카오 상태와 무관하다', () => {
    expect(oauthSettingsSchema.safeParse(valuesOf(KAKAO_OFF)).success).toBe(true);
  });

  it('Apple 이 켜져 있어도 카카오 대신이 되지 않는다 — 정책이 보는 것은 카카오뿐이다', () => {
    const result = oauthSettingsSchema.safeParse({
      providers: [providerOf({ provider: 'kakao', enabled: false }), appleReady()],
      display: { kakaoTalkInAppLoginOnly: true },
    });
    expect(result.success).toBe(false);
  });
});
