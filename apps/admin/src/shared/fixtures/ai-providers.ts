// AI 모델 프로바이더 연동 상태 — 조회기의 **자리**
//
// [왜 공통 층에 있나] 연동 상태의 정본은 시스템 설정 화면(pages/settings/api-keys)이 갖는다.
// 그런데 그 상태를 읽어야 하는 곳은 AI 에이전트 화면(pages/ai)이다 — 응답 모드가 열리는지가
// 연동 여부에 달려 있기 때문이다. AI 화면이 설정 화면을 직접 import 하면
// pages/ai → pages/settings 결합이 되고 code-quality 축1 이 blocker 로 잡는다.
//
// 그래서 여기(공통 층)는 **자리만** 만들고, 구현을 꽂는 일은 두 도메인을 모두 아는 배선 지점
// (src/wiring.ts)이 한다. shared/fixtures/admin-groups.ts 의 registerSenderUsageLookup 과
// 같은 모양이다 — 화면끼리는 끝까지 서로를 모른다.
//
// [fail-closed] 조회기가 꽂히지 않았으면 '연동 없음'으로 읽는다. 미배선을 '전부 사용 가능'으로
// 읽으면 연동이 없는 상태에서 모드가 열려 버리고, 고른 모드가 아무 일도 하지 않는다 —
// 없는 기능을 있는 것처럼 보이게 하는 바로 그 실패다(FEEDBACK-03).

/** 카탈로그에 있는 프로바이더 — 설정 화면이 연동을 제공하는 대상 */
export type AiProviderId = 'openai' | 'claude' | 'gemini' | 'grok';

export interface AiProviderStatus {
  readonly id: AiProviderId;
  /** 표시명 — '어떤 것을 연동해야 열리는지' 를 사람이 읽는 말로 적을 때 쓴다 */
  readonly label: string;
  /** 키가 등록되고 사용 설정이 켜져 있는가 */
  readonly enabled: boolean;
}

/**
 * 프로바이더 표시명 카탈로그.
 *
 * [왜 여기가 갖나] 잠금 사유 문구("OpenAI · Claude … 중 하나를 연동하면 열립니다")는 연동이
 * **하나도 없을 때** 보여야 한다. 그때 조회기는 빈 값을 돌려주므로 이름을 알 길이 없다 —
 * 이름은 상태가 아니라 카탈로그의 사실이라 상태 조회기와 분리해 여기 둔다.
 */
export const AI_PROVIDER_CATALOG: readonly { readonly id: AiProviderId; readonly label: string }[] =
  [
    { id: 'openai', label: 'OpenAI' },
    { id: 'claude', label: 'Claude' },
    { id: 'gemini', label: 'Gemini' },
    { id: 'grok', label: 'Grok' },
  ];

/** 설정 화면의 연동 카탈로그 경로 — 잠금 안내가 이 경로로 보낸다 */
export const AI_PROVIDER_SETTINGS_PATH = '/settings/api-keys';

type AiProviderLookup = () => readonly AiProviderStatus[];

/** 미배선 상태 — null 이면 '연동 없음'으로 읽는다(fail-closed) */
let lookup: AiProviderLookup | null = null;

/** 조회기를 꽂는다 — 여러 번 불러도 결과가 같다(멱등). 배선 지점은 src/wiring.ts */
export function registerAiProviderLookup(next: AiProviderLookup): void {
  lookup = next;
}

/** 테스트가 미배선 상태로 되돌린다 */
export function resetAiProviderLookup(): void {
  lookup = null;
}

/**
 * 지금 **사용 가능한** 프로바이더 — 미배선이거나 하나도 켜져 있지 않으면 빈 배열.
 *
 * 던지지 않는다. 조회기가 실패하면 '연동 없음'으로 수렴한다 — 설정 화면의 사고가
 * AI 화면을 깨뜨리지 않아야 하고, 애매하면 잠그는 쪽이 안전하다.
 */
export function enabledAiProviders(): readonly AiProviderStatus[] {
  if (lookup === null) return [];
  try {
    return lookup().filter((provider) => provider.enabled);
  } catch {
    return [];
  }
}

/** 연동된 프로바이더가 하나라도 있는가 */
export function hasEnabledAiProvider(): boolean {
  return enabledAiProviders().length > 0;
}
