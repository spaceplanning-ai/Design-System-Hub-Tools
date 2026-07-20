// 목록 → 상세, 그리고 **저장이 실제로 되는가** · apps/admin/src/pages/settings/api-keys/**
//
// ─────────────────────────────────────────────────────────────────────────────
// [무엇을 지키나 — 이 파일의 존재 이유]
// 이 화면의 이전 결함은 '저장 경로가 없다' 였고, 그보다 나쁜 결함은 이 코드베이스가 이미 한 번
// 겪은 것이다: **저장되지 않는데 성공처럼 보이는 화면**(삭제된 renameApiKey — 없는 id 를 조용히
// 지나치고 성공 토스트를 띄웠다).
//
// 그래서 여기서는 '토스트가 떴다' 로 단언하지 않는다 — 그것은 그 결함에서도 참이었다.
// **저장 뒤에 저장소가 실제로 무엇을 들고 있는지**를 본다.
//
// [비밀은 왕복하지 않는다] 입력한 API 키가 저장 후 폼·DOM·저장 문서 어디에도 남지 않는지 본다.
// [검증은 시늉하지 않는다] 저장이 성공해도 lastVerifiedAt 은 null 이다.
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { ToastProvider } from '../../../shared/ui';
import {
  enabledAiProviders,
  hasEnabledAiProvider,
  registerAiProviderLookup,
  resetAiProviderLookup,
} from '../../../shared/fixtures/ai-providers';
import ApiKeysPage from './ApiKeysPage';
import AiConnectionPage from './AiConnectionPage';
import { AI_CONNECTION_LIST_PATH, aiConnectionPath } from './paths';
import {
  aiConnectionsStore,
  aiProviderStatuses,
  applyCredentials,
  connectionSavePayload,
  emptyConnectionRecord,
  findAiConnectionRecord,
  formToRecord,
  listAiConnections,
  recordToForm,
} from './data-source';
import { connectionIsUsable, storedFieldsOf } from './ai-connections';
import { integrationCatalogue } from './integrations';
import { credentialIssues, EMPTY_CONNECTION_FORM } from './validation';
import type { AiConnectionFormValues } from './validation';

/** 지금 주소를 화면에 내놓는다 — 단언이 'UI 가 바뀌었다' 가 아니라 **URL** 을 볼 수 있게 */
function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="pathname">{pathname}</span>;
}

function renderAt(initialPath: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <LocationProbe />
          <Routes>
            <Route path={AI_CONNECTION_LIST_PATH} element={<ApiKeysPage />} />
            <Route path={`${AI_CONNECTION_LIST_PATH}/:providerId`} element={<AiConnectionPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function currentPath(): string {
  return screen.getByTestId('pathname').textContent ?? '';
}

const catalogue = integrationCatalogue();
const entryOf = (id: string) => {
  const entry = catalogue.find((item) => item.id === id);
  if (entry === undefined) throw new Error(`카탈로그에 ${id} 가 없다`);
  return entry;
};

/** 저장소를 초기 상태로 되돌린다 — 테스트끼리 저장 결과가 새지 않게 */
async function resetStore(): Promise<void> {
  const current = aiConnectionsStore.peek();
  await aiConnectionsStore.save({
    value: { connections: [] },
    expectedRevision: current.revision,
    force: true,
  });
}

beforeEach(async () => {
  await resetStore();
  resetAiProviderLookup();
});

/** 폼 값 한 벌을 만든다 — 순수 함수 단언용. 안 적은 칸은 빈 문자열로 남는다 */
interface FormPatch {
  readonly enabled?: boolean;
  readonly credentials?: Partial<AiConnectionFormValues['credentials']>;
  readonly storedSecrets?: AiConnectionFormValues['storedSecrets'];
}

function formOf(providerId: string, patch: FormPatch): AiConnectionFormValues {
  return {
    ...EMPTY_CONNECTION_FORM,
    providerId,
    enabled: patch.enabled ?? false,
    storedSecrets: patch.storedSecrets ?? [],
    credentials: { ...EMPTY_CONNECTION_FORM.credentials, ...patch.credentials },
  };
}

/* ── 목록 → 상세 ─────────────────────────────────────────────────────────── */

describe('연동 목록 — 행은 상세로 가는 링크다', () => {
  it("'앱 설정' 이 더 이상 비활성이 아니다 — 갈 곳이 생겼다", async () => {
    renderAt(AI_CONNECTION_LIST_PATH);

    const link = await screen.findByRole('link', { name: 'OpenAI 앱 설정' });
    expect(link.getAttribute('href')).toBe('/settings/api-keys/openai');
  });

  it("'자격증명 저장 경로가 아직 없습니다' 배너가 사라졌다", async () => {
    renderAt(AI_CONNECTION_LIST_PATH);

    await screen.findByRole('link', { name: 'OpenAI 앱 설정' });
    expect(screen.queryByText(/자격증명 저장 경로가 아직 없습니다/)).toBeNull();
  });

  it('이름을 누르면 **URL 이 상세 라우트로 바뀐다**', async () => {
    const user = userEvent.setup();
    renderAt(AI_CONNECTION_LIST_PATH);

    const name = await screen.findByRole('link', { name: 'Anthropic Claude' });
    expect(currentPath()).toBe('/settings/api-keys');

    await user.click(name);

    await waitFor(() => {
      expect(currentPath()).toBe('/settings/api-keys/claude');
    });
  });

  it('카탈로그의 13종이 모두 상세 경로를 갖는다 — 갈 수 없는 행이 없다', () => {
    for (const entry of catalogue) {
      expect(entry.settingsPath).toBe(aiConnectionPath(entry.id));
      expect(entry.settingsUnavailableReason).toBeNull();
    }
  });
});

/* ── 카테고리별 폼 ───────────────────────────────────────────────────────── */

describe('상세 화면 — 프로바이더가 **실제로 요구하는 칸만** 그린다', () => {
  it('모델(OpenAI)은 API 키 한 칸이다 — 안 쓰는 칸을 늘어놓지 않는다', async () => {
    renderAt(aiConnectionPath('openai'));

    // 조회가 끝나야 폼이 그려진다 — 그전에는 스켈레톤이다
    await screen.findByLabelText(/API 키/);
    expect(document.querySelector('#ai-credential-apiKey')).not.toBeNull();
    expect(document.querySelector('#ai-credential-endpoint')).toBeNull();
    expect(document.querySelector('#ai-credential-deployment')).toBeNull();
    expect(document.querySelector('#ai-credential-region')).toBeNull();
  });

  it('클라우드(Azure)는 네 칸이다 — 키 하나로 되지 않는다', async () => {
    renderAt(aiConnectionPath('azure-openai'));

    await screen.findByLabelText(/API 키/);
    for (const key of ['apiKey', 'endpoint', 'deployment', 'apiVersion']) {
      expect(document.querySelector(`#ai-credential-${key}`)).not.toBeNull();
    }
  });

  it('클라우드(Bedrock)는 리전을 함께 받는다 — 자격증명이 리전에 묶여 있다', async () => {
    renderAt(aiConnectionPath('amazon-bedrock'));

    await screen.findByLabelText(/API 키/);
    expect(document.querySelector('#ai-credential-region')).not.toBeNull();
    expect(document.querySelector('#ai-credential-deployment')).toBeNull();
  });

  it('게이트웨이(OpenRouter)는 키 한 칸이다 — 확인 못 한 랭킹 헤더를 요구하지 않는다', async () => {
    renderAt(aiConnectionPath('openrouter'));

    await screen.findByRole('heading', { name: 'OpenRouter' });
    expect(entryOf('openrouter').credentials).toHaveLength(1);
    // 확인하지 못한 사실을 **화면이 스스로 말한다** — 없는 칸을 조용히 빠뜨리지 않는다
    expect(await screen.findByText(/헤더 이름을 1차 출처에서 확인하지 못해/)).not.toBeNull();
  });

  it('Anthropic 은 공통 폼에 삼켜지지 않는다 — 인증 방식이 다르다고 화면이 말한다', async () => {
    renderAt(aiConnectionPath('claude'));

    await screen.findByRole('heading', { name: 'Anthropic Claude' });
    const notice = await screen.findByText(/x-api-key/);
    expect(notice.textContent).toContain('anthropic-version');
    // 그래도 **입력칸으로 만들지 않는다** — 클라이언트 상수이지 운영자가 정할 값이 아니다
    expect(screen.queryByLabelText(/anthropic-version/)).toBeNull();
    expect(entryOf('claude').credentials).toHaveLength(1);
  });

  it('Gemini 는 Vertex 와 뭉쳐지지 않는다 — 별개 연동이라고 말하고 리전 칸이 없다', async () => {
    renderAt(aiConnectionPath('gemini'));

    await screen.findByRole('heading', { name: 'Google Gemini' });
    expect(
      await screen.findByText(/Vertex AI 는 서비스 계정·프로젝트·리전을 요구하는/),
    ).not.toBeNull();
    expect(document.querySelector('#ai-credential-region')).toBeNull();
  });

  it('알 수 없는 프로바이더는 빈 화면이 아니라 이유와 돌아갈 길을 준다', async () => {
    renderAt(aiConnectionPath('not-a-provider'));

    expect(await screen.findByText(/이 화면이 아는 AI 프로바이더가 아닙니다/)).not.toBeNull();
    expect(screen.getByRole('link', { name: '연동 목록으로 돌아가기' })).not.toBeNull();
    // 폼을 그리지 않는다 — 어디로도 저장되지 않을 입력칸을 내놓지 않는다
    expect(document.querySelector('#ai-credential-apiKey')).toBeNull();
  });
});

/* ── 저장 — 이 파일의 중심 ───────────────────────────────────────────────── */

describe('저장 — 실제로 저장되거나, 안 되면 안 된다고 말한다', () => {
  it('키를 넣고 켜서 저장하면 **저장소가 실제로 그 연동을 들고 있다**', async () => {
    const user = userEvent.setup();
    renderAt(aiConnectionPath('openai'));

    await screen.findByLabelText(/API 키/);

    await user.click(screen.getByRole('switch', { name: 'OpenAI 사용' }));
    await user.type(screen.getByLabelText(/API 키/), 'sk-test-not-a-real-key');
    await user.click(screen.getByRole('button', { name: '저장' }));

    // 확인 다이얼로그를 지나야 저장된다 — 클릭 한 번으로 바뀌지 않는다
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /저장/ }));

    await waitFor(() => {
      expect(findAiConnectionRecord('openai')?.enabled).toBe(true);
    });

    const record = findAiConnectionRecord('openai');
    expect(record?.storedSecrets).toEqual(['apiKey']);
    expect(connectionIsUsable(entryOf('openai').credentials, listAiConnections()[0])).toBe(true);
  });

  it('저장된 문서에 **평문이 없다** — 저장 여부만 남는다', async () => {
    const record = applyCredentials(emptyConnectionRecord('openai'), ['apiKey'], {
      apiKey: 'sk-plaintext-must-not-persist',
    });

    expect(JSON.stringify(record)).not.toContain('sk-plaintext-must-not-persist');
    expect(record.storedSecrets).toEqual(['apiKey']);
    expect(record.publicValues.apiKey).toBeUndefined();
  });

  it('저장된 키는 폼으로 되돌아오지 않는다 — 마스크만 그린다', () => {
    const record = applyCredentials(emptyConnectionRecord('openai'), ['apiKey'], {
      apiKey: 'sk-secret',
    });

    expect(recordToForm(record).credentials.apiKey).toBe('');
    expect(recordToForm(record).storedSecrets).toEqual(['apiKey']);
  });

  it('비밀이 아닌 칸은 되읽는다 — 배포명을 매번 다시 입력하게 하지 않는다', () => {
    const record = applyCredentials(emptyConnectionRecord('azure-openai'), ['apiKey'], {
      apiKey: 'k',
      endpoint: 'https://r.openai.azure.com',
      deployment: 'gpt-main',
    });

    expect(recordToForm(record).credentials.deployment).toBe('gpt-main');
    expect(recordToForm(record).credentials.endpoint).toBe('https://r.openai.azure.com');
  });

  it('빈 선택 칸은 아예 저장되지 않는다 — 빈 값을 보내면 401 이 난다', () => {
    const record = applyCredentials(emptyConnectionRecord('azure-openai'), ['apiKey'], {
      apiKey: 'k',
      endpoint: 'https://r.openai.azure.com',
      deployment: 'd',
      apiVersion: '   ',
    });

    expect(Object.keys(record.publicValues)).not.toContain('apiVersion');
    expect(storedFieldsOf(record)).not.toContain('apiVersion');
    // 그래도 연동은 성립한다 — 선택 칸은 판정에 넣지 않는다
    expect(
      connectionIsUsable(entryOf('azure-openai').credentials, {
        providerId: 'azure-openai',
        enabled: true,
        storedFields: storedFieldsOf(record),
        lastVerifiedAt: null,
        connectedAt: null,
      }),
    ).toBe(true);
  });

  it('비밀 칸을 비워 두면 기존 키가 유지된다 — 저장할 때마다 재발급하게 하지 않는다', () => {
    const first = applyCredentials(emptyConnectionRecord('openai'), ['apiKey'], { apiKey: 'k1' });
    const second = applyCredentials(first, ['apiKey'], { apiKey: '' });

    expect(second.storedSecrets).toEqual(['apiKey']);
  });

  it('켜려는데 필수 칸이 비면 저장을 막는다 — 켰는데 안 되는 상태를 만들지 않는다', () => {
    const issues = credentialIssues(
      entryOf('azure-openai').credentials,
      formOf('azure-openai', { enabled: true, credentials: { apiKey: 'k' } }),
    );

    expect(issues.map((issue) => issue.field)).toContain('endpoint');
    expect(issues.map((issue) => issue.field)).toContain('deployment');
    // 선택 칸은 막지 않는다
    expect(issues.map((issue) => issue.field)).not.toContain('apiVersion');
  });

  it('끄는 것은 언제나 허용한다 — 반쯤 채워져 있어도 끌 수 있다', () => {
    const issues = credentialIssues(
      entryOf('azure-openai').credentials,
      formOf('azure-openai', { enabled: false, credentials: { apiKey: '' } }),
    );

    expect(issues).toHaveLength(0);
  });

  it('이미 저장된 키가 있으면 다시 입력하지 않아도 켤 수 있다', () => {
    const issues = credentialIssues(
      entryOf('openai').credentials,
      formOf('openai', { enabled: true, storedSecrets: ['apiKey'] }),
    );

    expect(issues).toHaveLength(0);
  });

  it('저장은 **이 프로바이더 자리만** 쓴다 — 보이지 않는 연동을 덮어쓰지 않는다', () => {
    const other = applyCredentials(emptyConnectionRecord('claude'), ['apiKey'], { apiKey: 'k' });
    const server = { connections: [other] };

    const next = connectionSavePayload(
      server,
      'openai',
      formToRecord(emptyConnectionRecord('openai'), formOf('openai', { enabled: true })),
    );

    expect(next.connections.find((item) => item.providerId === 'claude')).toBe(other);
    expect(next.connections).toHaveLength(2);
  });

  it('검증 시각을 지어내지 않는다 — 저장이 성공해도 lastVerifiedAt 은 null 이다', () => {
    const saved = connectionSavePayload(
      { connections: [] },
      'openai',
      formToRecord(
        emptyConnectionRecord('openai'),
        formOf('openai', { enabled: true, credentials: { apiKey: 'k' } }),
      ),
    );

    expect(saved.connections[0]?.lastVerifiedAt).toBeNull();
    // 반면 연동 시작일은 **성립한 순간**에 찍힌다 — 저장 시각이 아니라 상태 전이 시점이다
    expect(saved.connections[0]?.connectedAt).not.toBeNull();
  });

  it('연동 시작일은 재연동해도 최초 값을 유지한다', () => {
    const first = connectionSavePayload(
      { connections: [] },
      'openai',
      formToRecord(
        emptyConnectionRecord('openai'),
        formOf('openai', { enabled: true, credentials: { apiKey: 'k' } }),
      ),
    );
    const firstAt = first.connections[0]?.connectedAt;
    const base = first.connections[0];
    if (base === undefined) throw new Error('저장된 연동이 없다');

    // 껐다가 다시 켠다
    const off = connectionSavePayload(first, 'openai', { ...base, enabled: false });
    const back = connectionSavePayload(off, 'openai', { ...base, enabled: true });

    expect(back.connections[0]?.connectedAt).toBe(firstAt);
  });

  it('필수 칸이 안 찬 채로는 연동 시작일도 찍히지 않는다 — 성립한 적이 없다', () => {
    const half = connectionSavePayload(
      { connections: [] },
      'azure-openai',
      formToRecord(
        emptyConnectionRecord('azure-openai'),
        formOf('azure-openai', { enabled: true, credentials: { apiKey: 'k' } }),
      ),
    );

    expect(half.connections[0]?.connectedAt).toBeNull();
  });
});

/* ── 저장이 AI 화면의 잠금을 푼다 ────────────────────────────────────────────
 *
 * [왜 pages/ai 를 import 하지 않는가] 그러면 이 테스트가 축1(page-coupling)이 금지하는 결합을
 * 그대로 만든다. 두 화면은 **공통 층의 조회기 계약**으로만 만나므로, 여기서도 그 계약을 겨눈다:
 * 저장이 끝나면 `enabledAiProviders()` 가 이 프로바이더를 돌려준다는 사실 하나면 충분하다.
 * (그 값이 '빠른·전문가·헤비' 를 여는 것은 pages/ai/_shared/modes.ts 가 보장한다.) */

describe('저장이 AI 응답 모드의 잠금을 푼다', () => {
  it('저장 전에는 조회기가 아무 프로바이더도 돌려주지 않는다 — fail-closed', () => {
    registerAiProviderLookup(aiProviderStatuses);
    expect(enabledAiProviders()).toHaveLength(0);
    expect(hasEnabledAiProvider()).toBe(false);
  });

  it('키를 저장하고 켜면 조회기가 그 프로바이더를 돌려준다', async () => {
    registerAiProviderLookup(aiProviderStatuses);

    const current = aiConnectionsStore.peek();
    await aiConnectionsStore.save({
      value: connectionSavePayload(
        current.value,
        'openai',
        formToRecord(
          emptyConnectionRecord('openai'),
          formOf('openai', { enabled: true, credentials: { apiKey: 'sk-test' } }),
        ),
      ),
      expectedRevision: current.revision,
    });

    expect(hasEnabledAiProvider()).toBe(true);
    expect(enabledAiProviders().map((provider) => provider.id)).toEqual(['openai']);
  });

  it('꺼 두면 키가 저장돼 있어도 열리지 않는다 — 운영자가 쓰지 않겠다고 정한 것이다', async () => {
    registerAiProviderLookup(aiProviderStatuses);

    const current = aiConnectionsStore.peek();
    await aiConnectionsStore.save({
      value: connectionSavePayload(
        current.value,
        'openai',
        formToRecord(
          emptyConnectionRecord('openai'),
          formOf('openai', { enabled: false, credentials: { apiKey: 'sk-test' } }),
        ),
      ),
      expectedRevision: current.revision,
    });

    expect(hasEnabledAiProvider()).toBe(false);
  });
});

/* ── 연결 검증과 자격증명 충족은 다른 사실이다 ───────────────────────────── */

describe('연결 상태 — 검증됨과 채워짐을 가른다', () => {
  it('자격증명이 채워져도 검증은 여전히 확인한 적 없음이다', async () => {
    const user = userEvent.setup();
    renderAt(aiConnectionPath('openai'));

    await screen.findByLabelText(/API 키/);
    await user.click(screen.getByRole('switch', { name: 'OpenAI 사용' }));
    await user.type(screen.getByLabelText(/API 키/), 'sk-test');
    await user.click(screen.getByRole('button', { name: '저장' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /저장/ }));

    await waitFor(() => {
      expect(screen.getByText('채워짐')).not.toBeNull();
    });
    expect(screen.getByText('확인한 적 없음')).not.toBeNull();
    // 부를 곳이 없는 '검증' 버튼을 그리지 않는다 — 누르면 성공을 지어내게 된다
    expect(screen.queryByRole('button', { name: /연결 검증|연결 테스트/ })).toBeNull();
  });
});
