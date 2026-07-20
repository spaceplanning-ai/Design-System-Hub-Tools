// AI 모델 연동 마켓스토어 회귀 테스트 (시스템 설정 섹션)
//
// 이 테스트가 지키는 것 셋:
//   ① **연동 상태를 지어내지 않는다** — 저장된 자격증명이 없으면 어떤 것도 '연동 완료' 가 아니다.
//   ② **자격증명 요구가 타입에 드러난다** — 키 하나로 되지 않는 프로바이더가 실제로 그렇게 적혀 있다.
//   ③ **로고를 지어내지 않는다** — 확보하지 못한 마크는 그리지 않는다.
import { describe, expect, it } from 'vitest';

import {
  countIntegrations,
  filterIntegrations,
  integrationCatalogue,
  integrationTabItems,
  INTEGRATION_TABS,
  isIntegrationTabId,
  resolveIntegrations,
} from './integrations';
// 저장소를 **읽는** 표면은 data-source 가 갖는다 — integrations.ts 가 읽으면 순환이 된다
// (data-source 는 연동 성립 판정에 카탈로그의 required 를 써야 한다).
import { aiProviderStatuses, currentIntegrations, listAiConnections } from './data-source';
import { connectionIsUsable } from './ai-connections';
import type { AiConnection } from './ai-connections';
import { isBrandMarkId } from '../../../shared/ui';

describe('resolveIntegrations — 상태는 지어내지 않고 저장된 자격증명에서 해소한다', () => {
  it('저장된 연동이 없으면 어떤 프로바이더도 완료라고 말하지 않는다', () => {
    expect(resolveIntegrations([]).every((item) => item.status === 'disconnected')).toBe(true);
  });

  it('오늘의 화면은 전부 연동 해제다 — 저장 경로가 아직 없다', () => {
    // 픽스처로 '연동된 척' 채우면 AI 화면의 응답 모드가 열리고, 열린 모드가 아무 일도 하지 않는다
    expect(listAiConnections()).toHaveLength(0);
    expect(currentIntegrations().every((item) => item.status === 'disconnected')).toBe(true);
  });

  it('켜져 있고 필수 자격증명이 다 저장돼야 연동 완료다', () => {
    const connection: AiConnection = {
      providerId: 'openai',
      enabled: true,
      storedFields: ['apiKey'],
      lastVerifiedAt: null,
      connectedAt: '2026-07-01T00:00:00.000Z',
    };

    const list = resolveIntegrations([connection]);
    expect(list.find((item) => item.id === 'openai')?.status).toBe('connected');
    // 다른 프로바이더까지 덩달아 켜지지 않는다
    expect(list.find((item) => item.id === 'claude')?.status).toBe('disconnected');
  });

  it('꺼져 있으면 키가 저장돼 있어도 연동 완료가 아니다 — 운영자가 쓰지 않겠다고 정한 것이다', () => {
    const connection: AiConnection = {
      providerId: 'openai',
      enabled: false,
      storedFields: ['apiKey'],
      lastVerifiedAt: null,
      connectedAt: null,
    };

    expect(resolveIntegrations([connection]).find((item) => item.id === 'openai')?.status).toBe(
      'disconnected',
    );
  });

  it('필수 칸이 하나라도 비면 연동 완료가 아니다 — 저장은 됐는데 호출이 실패하는 상태를 막는다', () => {
    // Azure OpenAI 는 키만으로 부족하다(엔드포인트·배포명이 필수다)
    const halfDone: AiConnection = {
      providerId: 'azure-openai',
      enabled: true,
      storedFields: ['apiKey'],
      lastVerifiedAt: null,
      connectedAt: null,
    };

    expect(resolveIntegrations([halfDone]).find((item) => item.id === 'azure-openai')?.status).toBe(
      'disconnected',
    );
  });

  it('연동 시작일을 지어내지 않는다 — 기록이 없으면 null 이다', () => {
    expect(currentIntegrations().every((item) => item.connectedAt === null)).toBe(true);
  });

  it('설정 화면이 없는 연동은 왜 없는지를 반드시 말한다', () => {
    for (const item of currentIntegrations()) {
      if (item.settingsPath === null) {
        expect(item.settingsUnavailableReason).not.toBeNull();
      } else {
        // 갈 곳이 있으면 이유는 필요 없다 — 둘 다 있으면 화면이 무엇을 믿을지 모른다
        expect(item.settingsUnavailableReason).toBeNull();
      }
    }
  });

  it('검증 시각을 지어내지 않는다 — 실제로 불러 본 적이 없으면 null 이다', () => {
    for (const connection of listAiConnections()) {
      expect(connection.lastVerifiedAt).toBeNull();
    }
  });
});

/* ── 자격증명 요구 ────────────────────────────────────────────────────────────
 *
 * 여기서 지키는 것: **키 하나로 되지 않는 곳이 그렇게 적혀 있다.** 이 단언이 깨지면
 * 저장 폼이 'API 키' 한 칸으로 만들어지고, Azure·Bedrock 은 저장은 되는데 호출이 실패한다 —
 * 가장 진단하기 어려운 형태의 고장이다. */

describe('자격증명 — 요구가 타입에 드러난다', () => {
  const catalogue = integrationCatalogue();
  const entryOf = (id: string) => catalogue.find((item) => item.id === id);

  it('모든 프로바이더는 최소한 하나의 필수 자격증명을 요구한다', () => {
    for (const entry of catalogue) {
      expect(entry.credentials.some((field) => field.required)).toBe(true);
    }
  });

  it('API 키는 언제나 시크릿이다 — 저장 후 다시 보여줄 수 없다', () => {
    for (const entry of catalogue) {
      const apiKey = entry.credentials.find((field) => field.key === 'apiKey');
      if (apiKey === undefined) continue;
      expect(apiKey.secret).toBe(true);
    }
  });

  it('시크릿이 아닌 칸(엔드포인트·리전·배포명)은 마스킹 대상이 아니다', () => {
    for (const entry of catalogue) {
      for (const field of entry.credentials) {
        if (field.key === 'apiKey' || field.key === 'secretAccessKey') continue;
        expect(field.secret).toBe(false);
      }
    }
  });

  it('Azure OpenAI 는 키만으로 되지 않는다 — 엔드포인트와 배포명이 필수다', () => {
    const required = (entryOf('azure-openai')?.credentials ?? [])
      .filter((field) => field.required)
      .map((field) => field.key);

    expect(required).toContain('apiKey');
    expect(required).toContain('endpoint');
    expect(required).toContain('deployment');
  });

  it('Azure 의 api-version 은 선택이다 — v1 엔드포인트에서는 요구되지 않는다', () => {
    const apiVersion = entryOf('azure-openai')?.credentials.find(
      (field) => field.key === 'apiVersion',
    );

    expect(apiVersion).toBeDefined();
    expect(apiVersion?.required).toBe(false);
  });

  it('Amazon Bedrock 은 리전을 함께 요구한다 — 자격증명이 리전에 묶여 있다', () => {
    const required = (entryOf('amazon-bedrock')?.credentials ?? [])
      .filter((field) => field.required)
      .map((field) => field.key);

    expect(required).toContain('apiKey');
    expect(required).toContain('region');
  });

  it('키 하나로 끝나는 프로바이더는 실제로 한 칸이다 — 없는 입력을 요구하지 않는다', () => {
    for (const id of ['openai', 'claude', 'gemini', 'grok']) {
      expect(entryOf(id)?.credentials).toHaveLength(1);
      expect(entryOf(id)?.credentials[0]?.key).toBe('apiKey');
    }
  });

  it('connectionIsUsable 은 필수 칸만 본다 — 선택 칸이 비어도 연동은 성립한다', () => {
    const azure = entryOf('azure-openai')?.credentials ?? [];
    const withoutApiVersion: AiConnection = {
      providerId: 'azure-openai',
      enabled: true,
      storedFields: ['apiKey', 'endpoint', 'deployment'],
      lastVerifiedAt: null,
      connectedAt: null,
    };

    expect(connectionIsUsable(azure, withoutApiVersion)).toBe(true);
  });
});

/* ── 탭 ──────────────────────────────────────────────────────────────────────
 *
 * 탭이 두 축(분류·상태)을 섞어 쓰므로, 집계가 한 필터를 지나는지가 더 중요해졌다. */

describe('연동 목록 탭 — 건수와 행이 같은 필터에서 나온다', () => {
  const list = currentIntegrations();

  it('분류 탭이 상태 탭보다 앞에 온다 — 먼저 하는 일이 고르는 일이다', () => {
    expect(INTEGRATION_TABS[0]).toBe('model');
    expect(INTEGRATION_TABS.indexOf('gateway')).toBeLessThan(INTEGRATION_TABS.indexOf('connected'));
  });

  it("'전체' 가 마지막이고 그 건수가 실제 항목 수와 같다", () => {
    expect(INTEGRATION_TABS[INTEGRATION_TABS.length - 1]).toBe('all');
    expect(countIntegrations(list).all).toBe(list.length);
  });

  it('분류 세 탭이 목록을 남김없이 나눈다', () => {
    const counts = countIntegrations(list);
    expect(counts.model + counts.cloud + counts.gateway).toBe(counts.all);
  });

  it('상태 두 탭도 목록을 남김없이 나눈다', () => {
    const counts = countIntegrations(list);
    expect(counts.connected + counts.disconnected).toBe(counts.all);
  });

  it('탭 라벨의 건수가 그 탭의 행 수와 일치한다', () => {
    for (const item of integrationTabItems(list)) {
      const rows = filterIntegrations(list, item.id).length;
      expect(item.label).toContain(`(${String(rows)})`);
    }
  });

  it('필터는 자기 축으로만 나눈다 — 모델 탭에 게이트웨이가 섞이지 않는다', () => {
    expect(filterIntegrations(list, 'model').every((i) => i.category === 'model')).toBe(true);
    expect(filterIntegrations(list, 'gateway').every((i) => i.category === 'gateway')).toBe(true);
    expect(filterIntegrations(list, 'disconnected').every((i) => i.status === 'disconnected')).toBe(
      true,
    );
  });

  it('알 수 없는 탭 id 를 좁혀 낸다 — Tabs 는 string 을 준다', () => {
    expect(isIntegrationTabId('model')).toBe(true);
    expect(isIntegrationTabId('connected')).toBe(true);
    expect(isIntegrationTabId('전체')).toBe(false);
    expect(isIntegrationTabId('')).toBe(false);
  });
});

/* ── 카탈로그의 정직함 ───────────────────────────────────────────────────────── */

describe('AI 카탈로그 — 지어내지 않는다', () => {
  const catalogue = integrationCatalogue();

  it('사용자가 지정한 네 프로바이더를 반드시 담는다', () => {
    for (const id of ['openai', 'claude', 'gemini', 'grok']) {
      expect(catalogue.some((item) => item.id === id)).toBe(true);
    }
  });

  it('클라우드와 게이트웨이를 모델과 구분한다 — 자격증명의 성격이 다르다', () => {
    expect(catalogue.find((item) => item.id === 'azure-openai')?.category).toBe('cloud');
    expect(catalogue.find((item) => item.id === 'amazon-bedrock')?.category).toBe('cloud');
    expect(catalogue.find((item) => item.id === 'openrouter')?.category).toBe('gateway');
  });

  it('브랜드 마크를 하나도 지어내지 않았다 — 공식 자산을 확보하지 못했다', () => {
    // 넘겨받은 두 SVG 는 path 데이터가 같았다(적어도 하나가 잘못된 라벨이다).
    // 확보하기 전까지는 머리글자 배지로 남긴다 — 비슷하게 그린 로고는 상표 문제다.
    for (const entry of catalogue) {
      expect(entry.brand).toBeNull();
    }
  });

  it('카탈로그가 말하는 브랜드는 실제로 마크가 있는 것뿐이다 — 오타는 빈 칸이 된다', () => {
    for (const entry of catalogue) {
      if (entry.brand === null) continue;
      expect(isBrandMarkId(entry.brand)).toBe(true);
    }
  });

  it('연동 방법 안내는 **확인한 주소만** 싣는다 — 그럴듯한 주소를 지어내지 않는다', () => {
    // 이번 기준에서 1차 문서를 실제로 확인한 것은 Azure·Bedrock 둘뿐이다.
    // 나머지는 null 이고, 메뉴 항목은 지워지지 않고 '비활성 + 이유' 로 남는다.
    for (const entry of catalogue) {
      if (entry.guideUrl === null) continue;
      expect(entry.guideUrl.startsWith('https://')).toBe(true);
    }

    expect(catalogue.find((item) => item.id === 'azure-openai')?.guideUrl).toContain(
      'learn.microsoft.com',
    );
    expect(catalogue.find((item) => item.id === 'amazon-bedrock')?.guideUrl).toContain(
      'docs.aws.amazon.com',
    );
  });

  it('id 가 중복되지 않는다 — 상태 해소가 첫 항목만 보고 끝난다', () => {
    const ids = catalogue.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ── 배지 표기의 유일성 ───────────────────────────────────────────────────────
 *
 * 브랜드 마크를 하나도 확보하지 못해(위 describe) **13종 전부가 배지로 그려진다.** 그래서
 * 배지가 갈리지 않으면 목록에서 항목을 구분할 시각적 수단이 아예 없다.
 *
 * 한때 ServiceGlyph 가 이름의 첫 글자를 잘랐고, 그 결과 13종이 8종으로 뭉갰다
 * (G×3 Gemini·Grok·Groq · A×3 Anthropic·Azure·Amazon · O×2 OpenAI·OpenRouter).
 * **아래 단언 한 줄이면 잡혔을 결함이다** — 프로바이더가 늘 때 같은 일이 반복되지 않게 고정한다. */

describe('배지 표기(glyph) — 카탈로그 안에서 유일하다', () => {
  const catalogue = integrationCatalogue();

  it('13종의 표기가 서로 다르다', () => {
    const glyphs = catalogue.map((item) => item.glyph);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('첫 글자만으로는 갈리지 않는다는 사실을 기록해 둔다 — 그래서 표기를 따로 둔다', () => {
    // 이 단언이 깨진다면(=첫 글자가 전부 유일해졌다면) glyph 필드의 존재 이유가 사라진 것이다.
    // 그때는 필드를 지워도 되지만, 지우기 전에 이 테스트가 먼저 알려 준다.
    const initials = catalogue.map((item) => Array.from(item.name.trim())[0]);
    expect(new Set(initials).size).toBeLessThan(initials.length);
  });

  it('이름이 한 글자 차이인 쌍도 배지가 갈린다 — Grok / Groq', () => {
    const glyphOf = (id: string): string | undefined =>
      catalogue.find((item) => item.id === id)?.glyph;

    expect(glyphOf('grok')).not.toBe(glyphOf('groq'));
    // 앞 두 글자로 따는 규칙('Gr')으로는 갈리지 않는다 — 그래서 규칙이 아니라 사람이 정한다
    expect(glyphOf('grok')).not.toBe('Gr');
    expect(glyphOf('groq')).not.toBe('Gr');
  });

  it('표기는 배지에 들어갈 길이다 — 1~2글자', () => {
    for (const item of catalogue) {
      expect(Array.from(item.glyph).length).toBeGreaterThanOrEqual(1);
      expect(Array.from(item.glyph).length).toBeLessThanOrEqual(2);
    }
  });

  it('표기가 비어 있지 않다 — 빈 배지는 고장으로 읽힌다', () => {
    for (const item of catalogue) {
      expect(item.glyph.trim()).not.toBe('');
    }
  });
});

/* ── AI 화면이 읽는 상태 ────────────────────────────────────────────────────── */

describe('aiProviderStatuses — AI 화면에 넘기는 좁힌 계약', () => {
  it('핵심 4종만 넘긴다 — 게이트웨이·클라우드까지 알 이유가 없다', () => {
    expect(aiProviderStatuses().map((item) => item.id)).toEqual([
      'openai',
      'claude',
      'gemini',
      'grok',
    ]);
  });

  it('표시명을 함께 넘긴다 — 잠금 사유가 어느 것을 붙이라고 말할 수 있어야 한다', () => {
    expect(aiProviderStatuses().find((item) => item.id === 'claude')?.label).toBe(
      'Anthropic Claude',
    );
  });

  it('저장된 연동이 없으므로 전부 꺼져 있다 — fail-closed 다', () => {
    expect(aiProviderStatuses().every((item) => !item.enabled)).toBe(true);
  });
});

describe('커머스 잔재가 남지 않았다', () => {
  it('카탈로그에 쇼핑몰·결제·소셜 로그인 항목이 하나도 없다', () => {
    // 이 화면은 한때 커머스 연동 진열대였다. 카탈로그를 AI 로 갈아 끼우면서
    // 옛 항목이 한 건이라도 남으면 화면이 무엇에 관한 것인지 흐려진다.
    const gone = [
      'simple-identity',
      'google-login',
      'naver-login',
      'kakao-sync',
      'social-share',
      'domestic-pg',
      'naver-analytics',
      'sms-alimtalk',
      'domain',
      'ssl',
    ];

    for (const id of gone) {
      expect(integrationCatalogue().some((item) => item.id === id)).toBe(false);
    }
  });

  it('분류가 AI 세 갈래뿐이다 — 결제·메시지·인프라 같은 커머스 분류가 없다', () => {
    const categories = new Set(integrationCatalogue().map((item) => item.category));
    expect([...categories].sort()).toEqual(['cloud', 'gateway', 'model']);
  });
});
