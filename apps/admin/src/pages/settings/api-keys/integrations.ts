// AI 모델 연동 카탈로그 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/**)
//
// ┌ 이 파일이 존재하는 이유: **화면이 아니라 파이프라인을 만든다** ────────────────┐
// │ 목록을 JSX 로 손으로 나열하면 상태 판정도, 탭 집계도, '앱 설정' 이 어디로       │
// │ 가는지도 전부 마크업 속에 흩어진다.                                          │
// │                                                                          │
// │ 그래서 연동을 **데이터로** 모델링한다(Integration). 새 프로바이더가 붙는 일은    │
// │ 카탈로그에 항목을 한 줄 더하는 일이 된다 — 화면은 손대지 않는다.                │
// │ ✔ 자격증명 저장 화면(`/settings/api-keys/:providerId`)이 그 예다: 13종이 **같은 │
// │ 화면 하나**를 쓰고, 각자 요구하는 칸은 아래 `credentials` 에서 나온다.          │
// └──────────────────────────────────────────────────────────────────────────┘
//
// ┌ 자격증명은 '키 하나' 가 아니다 ────────────────────────────────────────────┐
// │ 각 항목이 **자기가 요구하는 자격증명의 모양**을 타입으로 들고 다닌다             │
// │ (credentials: readonly AiCredentialField[]).                              │
// │                                                                          │
// │ 'API 키 한 칸이면 되겠지' 로 폼을 만들면 Azure OpenAI(엔드포인트 + 배포명 +      │
// │ api-version)나 Amazon Bedrock(토큰 + 리전)에서 **저장은 되는데 호출이 실패하는** │
// │ 가장 진단하기 어려운 고장이 난다. 요구가 타입에 드러나 있으면 그 폼을 만들 수    │
// │ 없다 — 그것이 이 필드가 여기 있는 이유다.                                    │
// └──────────────────────────────────────────────────────────────────────────┘
//
// ┌ 가짜 성공을 만들지 않는다 ─────────────────────────────────────────────────┐
// │ 상태(status)는 **지어내지 않고 해소한다**(resolveIntegrations) — 저장된        │
// │ 자격증명(./data-source.ts)에서만 나온다. 픽스처로 연동된 척 채우지 않는다:      │
// │ 아무것도 저장하지 않은 상태에서는 13/13 이 '연동 해제' 이고, **운영자가 실제로   │
// │ 저장해야** 완료가 된다.                                                     │
// │                                                                          │
// │ 같은 이유로 '앱 설정' 은 갈 곳이 있을 때만 활성이고, 없으면 **왜 못 가는지**를    │
// │ 말한 채 비활성이다 (settingsPath === null → settingsUnavailableReason).       │
// │ 지금은 13종 모두 갈 곳이 있으므로 전부 활성이다.                              │
// └──────────────────────────────────────────────────────────────────────────┘
import type { BrandMarkId } from '../../../shared/ui';
import { connectionIsUsable } from './ai-connections';
import type { AiConnection, AiCredentialField } from './ai-connections';
import { aiConnectionPath } from './paths';

export const INTEGRATION_CATEGORIES = ['model', 'cloud', 'gateway'] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  model: '모델',
  cloud: '클라우드',
  gateway: '게이트웨이',
};

export function integrationCategoryLabel(category: IntegrationCategory): string {
  return CATEGORY_LABEL[category];
}

/** 연동은 붙어 있거나 아니거나 둘 중 하나다 — '연동 중' 같은 중간 상태를 만들지 않는다 */
export type IntegrationStatus = 'connected' | 'disconnected';

/* ── 자격증명 조각 ───────────────────────────────────────────────────────────
 *
 * 여러 프로바이더가 같은 모양의 칸을 요구한다. 조각을 공유해 라벨과 힌트가 갈라지지 않게 한다
 * (한쪽만 고쳐지는 날이 오면 같은 칸이 두 이름으로 불린다). */

const API_KEY_FIELD: AiCredentialField = {
  key: 'apiKey',
  label: 'API 키',
  required: true,
  secret: true,
  hint: '프로바이더 콘솔에서 발급한 키입니다. 저장하면 다시 볼 수 없습니다.',
};

/** 설명만 다른 키 칸 — 라벨·비밀 여부는 공유하고 힌트만 갈아 끼운다 */
function apiKeyField(hint: string): AiCredentialField {
  return { ...API_KEY_FIELD, hint };
}

/**
 * 카탈로그 항목 — **상태가 없는** 정적 메타데이터.
 *
 * 상태와 연동 시각은 여기 적지 않는다: 적는 순간 그것이 '사실' 처럼 보이고,
 * 아무도 확인하지 않은 채 화면에 나간다. 상태는 resolveIntegrations 가 근거에서 만든다.
 */
export interface IntegrationCatalogueEntry {
  readonly id: string;
  readonly name: string;
  /**
   * 마크가 없을 때 배지에 그리는 **짧은 표기**. 카탈로그 안에서 **유일해야 한다**.
   *
   * ┌ 왜 이름에서 자동으로 따지 않는가 ────────────────────────────────────┐
   * │ 첫 글자만 따면 13종이 8종으로 뭉갠다:                                  │
   * │   G × 3 (Gemini · Grok · Groq) · A × 3 (Anthropic · Azure · Amazon)   │
   * │   O × 2 (OpenAI · OpenRouter)                                        │
   * │ 기본 '모델' 탭에서 똑같은 G 배지 셋이 나란히 놓였다. 특히 Grok/Groq 는   │
   * │ 이름이 한 글자 차이라 배지까지 같으면 **구분 수단이 아예 없다**.        │
   * │                                                                     │
   * │ 앞 두 글자로 늘려도 'Gr'/'Gr' 로 여전히 같다 — 그래서 규칙을 짜내는 대신 │
   * │ **항목마다 사람이 정한다**. 필드가 필수라 프로바이더를 더할 때 결정을    │
   * │ 건너뛸 수 없고, 유일성은 테스트가 고정한다.                            │
   * └─────────────────────────────────────────────────────────────────────┘
   *
   * 장식이므로 접근성 대상이 아니다(ServiceGlyph 가 aria-hidden 으로 그린다) —
   * 이름은 옆의 텍스트가 전한다. 순수하게 **눈으로 갈리게** 하는 것이 목적이다.
   */
  readonly glyph: string;
  readonly category: IntegrationCategory;
  readonly description: string;
  /**
   * 이 프로바이더를 쓰려면 무엇이 필요한가 — **키 하나로 끝나지 않는 곳이 있다.**
   * 저장 폼은 이 목록에서 만들어져야 한다(손으로 칸을 나열하면 요구와 폼이 갈라진다).
   */
  readonly credentials: readonly AiCredentialField[];
  /**
   * 자격증명 화면에 붙는 **이 프로바이더만의 주의사항**. 없으면 null.
   *
   * ┌ 왜 카탈로그가 갖는가 ────────────────────────────────────────────────┐
   * │ 여기 적히는 것은 대개 '**입력칸으로 만들지 않은 이유**' 다 — Anthropic 의 │
   * │ `anthropic-version`, OpenAI 의 조직 헤더, OpenRouter 의 랭킹 헤더처럼.   │
   * │ 그 결정의 근거는 이미 이 파일의 각 항목 주석에 있고, 운영자가 읽어야 할   │
   * │ 문장은 그 주석의 요약이다. 화면에 흩어 두면 주석과 문구가 갈라진다.       │
   * │                                                                     │
   * │ **필수 필드다** — 프로바이더를 더할 때 '이 곳만의 함정이 있는가' 를 한 번  │
   * │ 은 묻게 만든다. 없으면 명시적으로 null 을 적는다(빠뜨림과 구분된다).      │
   * └─────────────────────────────────────────────────────────────────────┘
   */
  readonly connectionNotice: string | null;
  /**
   * '앱 설정' 이 갈 곳. 설정 화면이 아직 없으면 null 이고, 그때는 reason 이 왜인지 말한다.
   * (버튼을 지우지 않고 비활성으로 남기는 이유: 없는 게 아니라 '아직' 이라는 사실도 정보다.)
   */
  readonly settingsPath: string | null;
  /** settingsPath 가 null 일 때 버튼 옆에 붙는 이유. 경로가 있으면 null */
  readonly settingsUnavailableReason: string | null;
  /**
   * '연동 방법 안내' 가 여는 외부 문서. **1차 문서 주소를 실제로 확인한 것만 적는다.**
   * 확인하지 못했으면 null 이고, 그때 메뉴 항목은 지워지지 않고 비활성 + 이유로 남는다.
   *
   * [그럴듯한 주소를 지어 쓰지 않는다] 링크는 눌러 봐야 죽은 줄 안다. 죽은 '연동 방법 안내' 는
   * 없는 것보다 나쁘다 — 운영자는 우리가 확인했다고 믿고 눌렀다가 404 를 본다.
   */
  readonly guideUrl: string | null;
  /**
   * 목록에 그릴 **타사 브랜드 마크**. 브랜드가 없거나 **공식 자산을 확보하지 못했으면** null 이고,
   * 그때 화면은 머리글자 배지를 쓴다(ServiceGlyph).
   *
   * [지금 AI 프로바이더는 전부 null 이다 — 마크 미확보]
   * OpenAI(6겹 회전대칭 매듭)·Claude(방사형 햇살)·Gemini(4각 스파크)·Grok(각진 슬래시)는
   * 서로 전혀 다른 도형인데, 넘겨받은 두 SVG 는 **path 데이터가 동일**했다 — 적어도 하나는
   * 잘못된 라벨이다. 공식 브랜드 페이지에서 자산을 직접 받아 대조하기 전에는 그리지 않는다.
   * **비슷하게 그린 로고는 상표 문제이자 '이게 진짜 로고' 라는 거짓 정보다**
   * (shared/ui/brand-marks.tsx 머리말의 '없는 로고를 지어내지 않는다').
   */
  readonly brand: BrandMarkId | null;
}

/** 화면이 그리는 것 — 카탈로그(정적) + 해소된 상태(동적) */
export interface Integration extends IntegrationCatalogueEntry {
  readonly status: IntegrationStatus;
  /**
   * 연동을 **시작한** 시각. 한 번도 연결된 적 없으면 null 이고 표는 `-` 를 그린다.
   *
   * 설정을 마지막으로 고친 시각으로 대신하지 않는다 — 그것은 다른 사실이고,
   * 옆에 '연동 시작일' 이라 적어 두면 거짓말이 된다.
   */
  readonly connectedAt: string | null;
}

/**
 * ✔ **자격증명 저장 화면이 생겼다** — 13종 전부가 `/settings/api-keys/:providerId` 로 간다
 * (BE-069 §7.5 #1 해소). 그래서 이 카탈로그에는 `settingsUnavailableReason` 이 하나도 없다.
 *
 * 필드는 남겨 둔다: 새 프로바이더가 화면 없이 먼저 카탈로그에 올라오는 날이 다시 올 수 있고,
 * 그때 **버튼을 지우지 않고 이유를 말한 채 비활성으로 남기는** 규약이 여기 그대로 있어야 한다.
 */
const HAS_SETTINGS = null;

/** 1차 문서 주소를 확인하지 못한 항목의 사유 — '문서가 없다' 가 아니라 '확인하지 못했다' 다 */
const GUIDE_UNVERIFIED = null;

// TODO(backend): GET /api/settings/integrations
//   서버가 연동별 { id, status, connectedAt } 을 돌려주면 아래 해소기의 갈래가 하나로 준다 —
//   카탈로그(이름·설명·자격증명 요구)는 그대로 프론트가 소유한다(문구는 화면의 것이다).
const INTEGRATION_CATALOGUE: readonly IntegrationCatalogueEntry[] = [
  /* ── 모델 제공자 — 우리가 직접 부르는 곳 ───────────────────────────────── */
  {
    id: 'openai',
    name: 'OpenAI',
    glyph: 'OA',
    category: 'model',
    description: 'GPT 계열 모델을 부릅니다. 글 생성·요약·분류 전반에 씁니다. 키 하나로 연동됩니다.',
    // 조직·프로젝트 헤더는 **선택**이다(다중 조직 계정에서만 쓴다) — 필수 칸으로 만들지 않는다.
    credentials: [apiKeyField('OpenAI 대시보드의 API keys 에서 발급합니다. `sk-` 로 시작합니다.')],
    connectionNotice:
      '조직·프로젝트 헤더는 다중 조직 계정에서만 쓰는 선택 값이라 이 화면에 칸을 두지 않습니다. 빈 값을 보내면 오히려 401 이 나므로, 비어 있으면 헤더 자체를 보내지 않습니다.',
    settingsPath: aiConnectionPath('openai'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    // 제품명 Claude 에서 딴다 — 회사(Anthropic)로 따면 Azure·Amazon 과 'A' 로 겹친다
    glyph: 'Cl',
    category: 'model',
    description:
      'Claude 모델을 부릅니다. 긴 문서 이해와 도구 사용에 강합니다. 키와 함께 API 버전을 보냅니다.',
    // [확인된 사실] Anthropic 만 인증 방식이 다르다 — `Authorization: Bearer` 가 아니라
    // `x-api-key` 헤더이고, **`anthropic-version` 헤더가 필수**다. 이 둘을 모르고 만든
    // 범용 클라이언트는 Anthropic 에서만 조용히 실패한다.
    //
    // 그래도 `anthropic-version` 을 **입력 칸으로 만들지 않는다**: 그것은 클라이언트가 고정으로
    // 보내는 상수지 운영자가 정할 값이 아니다. 없는 입력을 요구하면 폼이 거짓말을 한다 —
    // 운영자는 무엇을 넣어야 할지 모르고, 넣은 값이 틀리면 우리 잘못을 그가 뒤집어쓴다.
    credentials: [
      apiKeyField('Anthropic Console 의 API keys 에서 발급합니다. `sk-ant-` 로 시작합니다.'),
    ],
    connectionNotice:
      'Anthropic 만 인증 방식이 다릅니다 — `Authorization: Bearer` 가 아니라 `x-api-key` 헤더를 쓰고 `anthropic-version` 헤더를 함께 보내야 합니다. 둘 다 입력칸이 없는 것이 맞습니다: 헤더 이름도 버전도 우리 클라이언트가 고정으로 보내는 상수이지 운영자가 정할 값이 아닙니다.',
    settingsPath: aiConnectionPath('claude'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    glyph: 'Gm',
    category: 'model',
    description:
      'Gemini 모델을 부릅니다. 이미지·문서를 함께 다룰 때 씁니다. Vertex AI 와는 다른 연동입니다.',
    // [Vertex AI 와 혼동하지 않는다] Vertex 는 프로젝트 id · 리전 · OAuth 를 요구하는 **다른 제품**이다.
    // 여기서 말하는 것은 Gemini Developer API 이고 키 한 칸이면 된다.
    credentials: [apiKeyField('Google AI Studio 에서 발급한 Gemini API 키입니다.')],
    connectionNotice:
      'Google AI Studio 에서 발급한 키입니다. Vertex AI 는 서비스 계정·프로젝트·리전을 요구하는 별개 연동이라 이 항목으로는 붙지 않습니다 — 여기에 리전을 더해 대신할 수 없습니다.',
    settingsPath: aiConnectionPath('gemini'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'grok',
    // [회사명이 아니라 제품명을 쓴다] xAI 는 2026-02 SpaceX 에 인수돼 2026-07-06 SpaceXAI 로
    // 리브랜딩을 마쳤다. 회사명을 적으면 낡은 이름이 화면에 박히고, 새 이름이 맞는지도 아직
    // 확인되지 않았다 — 제품명 'Grok' 은 그 변화와 무관하게 참이다.
    name: 'Grok',
    // Groq(Gq)와 갈리도록 **끝 글자**를 쓴다 — 'Gr' 로 따면 두 항목이 똑같아진다
    glyph: 'Gk',
    category: 'model',
    description: 'Grok 모델을 부릅니다. OpenAI 호환 형식이라 기존 호출부를 그대로 씁니다.',
    credentials: [apiKeyField('Grok API 콘솔에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('grok'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    glyph: 'Mi',
    category: 'model',
    description: '유럽에서 운영하는 모델입니다. 데이터 처리 위치가 중요할 때 후보가 됩니다.',
    credentials: [apiKeyField('Mistral 콘솔에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('mistral'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    glyph: 'Px',
    category: 'model',
    description: '웹 검색에 근거해 답합니다. 최신 정보가 필요한 질문에 씁니다.',
    credentials: [apiKeyField('Perplexity 설정에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('perplexity'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    glyph: 'Co',
    category: 'model',
    description: '검색용 임베딩과 재순위(rerank)에 강합니다. 사내 문서 검색에 씁니다.',
    credentials: [apiKeyField('Cohere 대시보드에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('cohere'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    glyph: 'DS',
    category: 'model',
    description: '추론에 특화된 모델을 낮은 단가로 제공합니다. OpenAI 호환 형식입니다.',
    credentials: [apiKeyField('DeepSeek 플랫폼에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('deepseek'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'groq',
    name: 'Groq',
    // Grok(Gk)과 갈리도록 **끝 글자**를 쓴다
    glyph: 'Gq',
    category: 'model',
    description:
      '공개 모델을 자체 하드웨어에서 매우 빠르게 돌립니다. 응답 속도가 중요할 때 씁니다.',
    credentials: [apiKeyField('GroqCloud 콘솔에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('groq'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },

  /* ── 클라우드 — 키 하나로 되지 않는 곳 ─────────────────────────────────────
   *
   * 이 둘이 이 카탈로그에 자격증명 타입이 필요한 이유다. 자격증명이 '프로바이더' 가 아니라
   * **계정 안의 특정 리소스/리전**에 매여 있어, 키만 받아 두면 어디로 보낼지를 모른다. */
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    glyph: 'Az',
    category: 'cloud',
    description:
      '우리 Azure 구독 안에서 OpenAI 모델을 돌립니다. 키 외에 리소스 주소와 배포명이 필요합니다.',
    // 확인한 사실(learn.microsoft.com/azure/foundry/openai/api-version-lifecycle):
    //   · 호출 경로에 **모델명이 아니라 배포명**이 들어간다 — 여기서 틀리면 404 가 난다
    //   · 기존(dated) 표면은 api-version 질의 파라미터가 **필수**다
    //   · 2025-08 부터 여는 v1 표면은 api-version 을 요구하지 않고 배포명이 본문 model 로 옮겨간다
    //     (다만 일부 기능만 올라와 있어 기존 표면이 여전히 필요하다)
    // 그래서 api-version 을 **필수가 아닌 칸**으로 둔다 — v1 을 쓰면 비우고, 기존 표면이면 채운다.
    credentials: [
      apiKeyField('Azure 포털의 해당 OpenAI 리소스 > 키 및 엔드포인트에서 복사합니다.'),
      {
        key: 'endpoint',
        label: '리소스 엔드포인트',
        required: true,
        secret: false,
        hint: '예: https://내리소스이름.openai.azure.com',
      },
      {
        key: 'deployment',
        label: '배포명',
        required: true,
        secret: false,
        hint: '모델명이 아니라 배포에 붙인 이름입니다. 다르면 호출이 404가 납니다.',
      },
      {
        key: 'apiVersion',
        label: 'API 버전',
        required: false,
        secret: false,
        hint: '기존(dated) 엔드포인트를 쓸 때만 채웁니다. 예: 2024-06-01. v1 엔드포인트는 비웁니다.',
      },
    ],
    connectionNotice:
      'API 버전을 비우면 v1 엔드포인트로, 채우면 기존(dated) 엔드포인트로 부릅니다. 선택이지만 아무래도 좋은 칸은 아닙니다 — 이 칸의 유무가 어느 표면을 부를지를 가릅니다.',
    settingsPath: aiConnectionPath('azure-openai'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: 'https://learn.microsoft.com/en-us/azure/foundry/openai/api-version-lifecycle',
    brand: null,
  },
  {
    id: 'amazon-bedrock',
    name: 'Amazon Bedrock',
    // Bedrock 에서 딴다 — Amazon 으로 따면 Azure 와 'A' 로 겹친다
    glyph: 'Br',
    category: 'cloud',
    description:
      '여러 회사의 모델을 AWS 계정 안에서 부릅니다. 자격증명이 리전에 묶여 있어 리전을 함께 지정합니다.',
    // 확인한 사실(docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html):
    //   · 이제 베어러 토큰('Bedrock API key')이 SigV4 와 **함께** 제공된다(단기/장기 두 종류)
    //   · **리전은 여전히 별도로 필요하다** — 엔드포인트 호스트명에 박힌다
    //     (bedrock-runtime.<region>.amazonaws.com). 단기 키는 발급한 리전에서만 쓰인다
    //   · AWS 는 운영에 단기 키를, 탐색에만 장기 키를 권한다
    // 그래서 베어러 경로 기준으로도 **최소 두 칸**이다 — 키 한 칸짜리 폼으로는 못 만든다.
    credentials: [
      apiKeyField('Bedrock API 키(베어러 토큰)입니다. 발급한 리전에서만 쓸 수 있습니다.'),
      {
        key: 'region',
        label: '리전',
        required: true,
        secret: false,
        hint: '예: us-east-1. 엔드포인트 주소에 들어가므로 키와 같은 리전이어야 합니다.',
      },
    ],
    connectionNotice:
      '지금은 Bedrock API 키(베어러 토큰) 경로만 지원합니다. SigV4(액세스 키·시크릿) 경로는 아직 없습니다 — 자리는 있으나 이 화면이 받지 않습니다.',
    settingsPath: aiConnectionPath('amazon-bedrock'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: 'https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html',
    brand: null,
  },

  /* ── 게이트웨이 — 여러 모델을 한 키로 ─────────────────────────────────────── */
  {
    id: 'openrouter',
    name: 'OpenRouter',
    glyph: 'OR',
    category: 'gateway',
    description: '키 하나로 여러 회사의 모델을 골라 부릅니다. 모델을 바꿔 가며 비교할 때 편합니다.',
    credentials: [apiKeyField('OpenRouter 계정에서 발급한 키입니다.')],
    connectionNotice:
      '순위 페이지에 쓰이는 선택 헤더(사이트 주소·앱 이름)가 있다고 알려져 있으나 헤더 이름을 1차 출처에서 확인하지 못해 받지 않습니다. 연동 자체에는 필요하지 않습니다.',
    settingsPath: aiConnectionPath('openrouter'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
  {
    id: 'together',
    name: 'Together AI',
    glyph: 'Tg',
    category: 'gateway',
    description: '공개 모델을 호스팅해 제공합니다. 직접 서버를 두지 않고 오픈 모델을 쓸 때 씁니다.',
    credentials: [apiKeyField('Together AI 콘솔에서 발급한 키입니다.')],
    connectionNotice: null,
    settingsPath: aiConnectionPath('together'),
    settingsUnavailableReason: HAS_SETTINGS,
    guideUrl: GUIDE_UNVERIFIED,
    brand: null,
  },
];

/** 카탈로그 전체 — 프로바이더 id 로 요구 자격증명을 찾을 때 쓴다 */
export function integrationCatalogue(): readonly IntegrationCatalogueEntry[] {
  return INTEGRATION_CATALOGUE;
}

/**
 * 카탈로그 + 저장된 자격증명 → 화면이 그릴 목록.
 *
 * 저장된 것이 없으면(오늘) 전 항목이 '연동 해제' 다 — **모르는 것과 아닌 것을 같게 취급하되,
 * 두 경우 모두 '된다' 고 말하지 않는다**는 점이 중요하다.
 */
export function resolveIntegrations(
  connections: readonly AiConnection[] = [],
): readonly Integration[] {
  return INTEGRATION_CATALOGUE.map((entry) => {
    const connection = connections.find((item) => item.providerId === entry.id);
    const connected = connectionIsUsable(entry.credentials, connection);

    return {
      ...entry,
      status: connected ? 'connected' : 'disconnected',
      // 연동 시작일은 저장된 연동이 들고 있다 — 없으면 null 이고 표는 '-' 를 그린다.
      connectedAt: connection?.connectedAt ?? null,
    };
  });
}

/* ── 탭 ──────────────────────────────────────────────────────────────────── */

/**
 * 탭은 **한 축이 아니다** — 앞의 셋은 분류, 뒤의 둘은 상태, 마지막이 전체다.
 *
 * 분류를 왼쪽에 두는 이유: 이 화면에서 운영자가 먼저 하는 일은 '어떤 종류를 붙일까' 이지
 * '무엇이 이미 붙어 있나' 가 아니다(오늘은 붙어 있는 것이 0이라 더욱 그렇다).
 *
 * 축이 섞여 있어도 **집계는 한 함수를 지난다**(filterIntegrations) — 탭마다 세는 규칙을
 * 따로 두면 '모델 (9)' 인데 행이 8개인 날이 온다.
 */
export const INTEGRATION_TABS = [
  'model',
  'cloud',
  'gateway',
  'connected',
  'disconnected',
  'all',
] as const;

export type IntegrationTabId = (typeof INTEGRATION_TABS)[number];

const TAB_LABEL: Record<IntegrationTabId, string> = {
  model: '모델',
  cloud: '클라우드',
  gateway: '게이트웨이',
  connected: '연동 완료',
  disconnected: '연동 해제',
  all: '전체',
};

/** @tds/ui Tabs 는 도메인을 모른다 — onChange 로 `string` 을 준다. 여기서 좁힌다 */
export function isIntegrationTabId(value: string): value is IntegrationTabId {
  return INTEGRATION_TABS.some((tab) => tab === value);
}

export function filterIntegrations(
  list: readonly Integration[],
  tab: IntegrationTabId,
): readonly Integration[] {
  switch (tab) {
    case 'all':
      return list;
    case 'connected':
    case 'disconnected':
      return list.filter((item) => item.status === tab);
    default:
      // 분류 탭 — 유니온이 분류 id 와 같은 문자열을 쓰므로 그대로 비교한다
      return list.filter((item) => item.category === tab);
  }
}

/**
 * 탭별 건수 — 라벨에 그대로 박힌다('모델 (9)').
 *
 * 각 탭의 건수를 따로 세면 필터와 집계가 어긋날 자리가 생긴다. 그래서 같은 필터를 통해 센다.
 * (분류 탭의 합은 전체와 같고, 상태 탭의 합도 전체와 같다 — 두 축이 각각 목록을 남김없이 나눈다.)
 */
export function countIntegrations(
  list: readonly Integration[],
): Readonly<Record<IntegrationTabId, number>> {
  const countOf = (tab: IntegrationTabId): number => filterIntegrations(list, tab).length;

  return {
    model: countOf('model'),
    cloud: countOf('cloud'),
    gateway: countOf('gateway'),
    connected: countOf('connected'),
    disconnected: countOf('disconnected'),
    all: countOf('all'),
  };
}

export interface IntegrationTabItem {
  readonly id: IntegrationTabId;
  readonly label: string;
}

/** Tabs 에 넘길 항목 — 라벨에 건수를 붙여 '모델 (9)' 로 만든다 */
export function integrationTabItems(list: readonly Integration[]): readonly IntegrationTabItem[] {
  const counts = countIntegrations(list);
  return INTEGRATION_TABS.map((tab) => ({
    id: tab,
    label: `${TAB_LABEL[tab]} (${String(counts[tab])})`,
  }));
}

/* ── AI 화면이 읽는 연동 상태는 ./data-source.ts 가 만든다 ────────────────────
 *
 * AI 에이전트 화면(pages/ai)은 응답 모드가 열리는지를 연동 상태에서 파생시킨다. 그 화면이
 * 설정 화면을 직접 import 하면 pages/ai → pages/settings 결합이 되고 축1 이 blocker 로 잡는다 —
 * 그래서 공통 층(shared/fixtures/ai-providers.ts)이 자리를 만들고 배선(src/wiring-ai.ts)이
 * 구현(`aiProviderStatuses`)을 꽂는다. 화면끼리는 끝까지 서로를 모른다.
 *
 * 그 구현이 **저장소를 읽어야** 하므로 이 파일이 아니라 ./data-source.ts 에 있다 —
 * 여기 두면 data-source ↔ integrations 순환이 된다(data-source.ts 의 해소 절 머리말). */
