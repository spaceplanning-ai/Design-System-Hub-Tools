// 관리자 관리 — 그룹 만들기·지우기의 **화면 쪽 계약**
//
// [무엇을 지키나 — admin-groups.test.ts 와 나누는 기준]
// 그쪽은 저장소·어댑터의 계약(정본이 하나인가, 가드가 거절하는가)을 본다. 여기는 그 계약을
// **화면이 제대로 소비하는가**를 본다: 만든 그룹이 좌측 배지와 함께 나타나는가(무효화 키),
// 고른 그룹을 지우면 필터가 '전체 운영자' 로 돌아오는가, 실패했을 때 다시 시도할 길이 남는가.
// 이 셋은 전부 '어댑터는 옳은데 화면이 틀린' 형태로 깨질 수 있어 저장소 테스트로는 잡히지 않는다.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ToastProvider } from '../../shared/ui';
import { listSenderCapableAdminGroups } from '../../shared/fixtures/admin-groups';
import AdminsPage from './AdminsPage';
import { wireDomains } from '../../wiring';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MemoryRouter initialEntries={['/users/admins']}>
            <AdminsPage />
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>,
    ),
  };
}

/**
 * '운영팀 admin' 항목을 집는 정규식.
 *
 * 필터 항목의 접근 가능한 이름에는 **건수 배지까지** 들어간다('운영 - 운영팀 admin 3').
 * 그래서 `admin$` 으로는 잡히지 않고, 앵커 없이 쓰면 '운영팀 admin_2' 에도 걸린다 —
 * 이름 뒤에 곧바로 숫자가 오는 것으로 둘을 가른다.
 */
const OPS_ADMIN_FILTER = /^운영 - 운영팀 admin [0-9]/;

/** 좌측 그룹 필터의 항목들 — 라벨은 '운영 - {그룹명}' 이다 */
function groupFilter(): HTMLElement {
  return screen.getByRole('navigation', { name: '운영진 그룹 필터' });
}

/** 지금 눌려 있는 그룹 필터 항목의 이름 (A11Y-12 — 선택은 aria-pressed 로 말한다) */
function pressedFilterName(): string {
  const pressed = within(groupFilter())
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-pressed') === 'true');
  return pressed?.textContent ?? '';
}

/** 모달의 '그룹 만들기' 를 눌러 폼을 제출하고, 겹쳐 뜬 확인 다이얼로그까지 확인한다 */
async function submitAndConfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '그룹 만들기' }));
  const dialog = await screen.findByRole('dialog', { name: '운영진 그룹 만들기' });
  await user.click(within(dialog).getByRole('button', { name: '그룹 만들기' }));
}

beforeEach(() => {
  window.history.replaceState({}, '', '/users/admins');
});

afterEach(() => {
  window.history.replaceState({}, '', '/users/admins');
});

// 삭제 가드는 발신 사용처 조회기를 요구한다 — 제품과 같은 배선을 건다(wiring.ts)
wireDomains();

describe('그룹 만들기', () => {
  it('만든 그룹이 좌측 목록에 **건수 배지와 함께** 나타나고 발신 프로필로도 고를 수 있다', async () => {
    const { user } = renderPage();
    await screen.findByRole('button', { name: OPS_ADMIN_FILTER }, { timeout: 5000 });

    await user.click(screen.getByRole('button', { name: '+ 새 그룹 만들기' }));

    await user.type(screen.getByLabelText('그룹명'), '테스트 발송센터');
    // 사전등록 풀은 별도 조회다 — 도착하기 전에는 고를 항목 자체가 없다
    const phoneSelect = screen.getByLabelText('대표 발신번호');
    await waitFor(() => {
      expect(within(phoneSelect).queryByRole('option', { name: '1588-1234' })).not.toBeNull();
    });
    await user.selectOptions(phoneSelect, '1588-1234');
    await user.type(screen.getByLabelText('대표 발신 이메일'), 'qa@spaceplanning.ai');
    // 발신 자격은 기본으로 켜져 있다 — 여기서는 손대지 않는다(끄는 축은 아래 테스트가 본다)
    expect(screen.getByLabelText('발신 프로필로 사용')).toHaveProperty('checked', true);

    await submitAndConfirm(user);

    const created = await screen.findByRole(
      'button',
      { name: /운영 - 테스트 발송센터/ },
      { timeout: 5000 },
    );

    /**
     * [건수 배지가 '—' 로 남지 않는다]
     * 그룹 목록만 무효화하고 목록 조회(groupCounts 를 싣는다)를 두면, 새 항목의 배지가 조회되지
     * 않은 값으로 남는다. 배지가 '0' 이라는 것은 두 쿼리가 함께 갱신됐다는 뜻이다.
     */
    expect(created.textContent).toContain('0');

    // 같은 실체다 — 마케팅 쪽 소비자에게도 보여야 한다
    expect(listSenderCapableAdminGroups().map((profile) => profile.name)).toContain(
      '테스트 발송센터',
    );
  });

  it('발신 자격을 끈 그룹은 좌측에만 생기고 발신 프로필 목록에는 오지 않는다', async () => {
    const { user } = renderPage();
    await screen.findByRole('button', { name: OPS_ADMIN_FILTER }, { timeout: 5000 });

    await user.click(screen.getByRole('button', { name: '+ 새 그룹 만들기' }));
    await user.type(screen.getByLabelText('그룹명'), '권한 필터 전용');
    // 기본값이 켜져 있으므로 한 번 눌러 끈다 — 번호·이메일이 필수가 아니게 된다
    await user.click(screen.getByLabelText('발신 프로필로 사용'));
    await submitAndConfirm(user);

    await screen.findByRole('button', { name: /운영 - 권한 필터 전용/ }, { timeout: 5000 });
    expect(listSenderCapableAdminGroups().map((profile) => profile.name)).not.toContain(
      '권한 필터 전용',
    );
  });

  it('생성이 실패하면 폼으로 돌아오고 다시 시도할 수 있다 (?fail=createGroup)', async () => {
    window.history.replaceState({}, '', '/users/admins?fail=createGroup');

    const { user } = renderPage();
    await screen.findByRole('button', { name: '+ 새 그룹 만들기' }, { timeout: 5000 });

    await user.click(screen.getByRole('button', { name: '+ 새 그룹 만들기' }));
    await user.type(screen.getByLabelText('그룹명'), '실패할 그룹');
    await user.click(screen.getByLabelText('발신 프로필로 사용'));
    await submitAndConfirm(user);

    // 확인 다이얼로그는 닫히고 폼이 살아 있다 — 값을 고쳐 다시 낼 수 있다(모달이 잠기지 않는다)
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveProperty(
      'textContent',
      '요청을 처리하지 못했습니다.',
    );
    expect(screen.getByLabelText('그룹명')).toHaveProperty('value', '실패할 그룹');
    expect(screen.getByRole('button', { name: '그룹 만들기' })).toHaveProperty('disabled', false);
  });
});

describe('그룹 지우기', () => {
  it('고른 그룹을 지우면 필터가 전체 운영자로 돌아온다', async () => {
    const { user } = renderPage();
    await screen.findByRole('button', { name: OPS_ADMIN_FILTER }, { timeout: 5000 });

    // 지울 수 있는 그룹을 하나 만든다 — 픽스처 그룹은 전부 가드에 걸린다(그것이 가드의 목적이다)
    await user.click(screen.getByRole('button', { name: '+ 새 그룹 만들기' }));
    await user.type(screen.getByLabelText('그룹명'), '지울 그룹');
    await user.click(screen.getByLabelText('발신 프로필로 사용'));
    await submitAndConfirm(user);

    const created = await screen.findByRole(
      'button',
      { name: /운영 - 지울 그룹/ },
      { timeout: 5000 },
    );

    // 그 그룹으로 필터를 건다
    await user.click(created);
    await waitFor(() => {
      expect(pressedFilterName()).toContain('지울 그룹');
    });

    await user.click(await screen.findByRole('button', { name: /'지울 그룹' 그룹 삭제/ }));

    const dialog = await screen.findByRole(
      'dialog',
      { name: '운영진 그룹 삭제' },
      { timeout: 5000 },
    );
    await user.click(within(dialog).getByRole('button', { name: '그룹 삭제' }));

    /**
     * [먼저 다이얼로그가 닫히기를 기다린다]
     * 다이얼로그가 떠 있는 동안 뒤쪽 화면은 aria-hidden 이라 role 질의에 잡히지 않는다 —
     * 그 상태에서 '항목이 없다' 를 단언하면 삭제가 끝나지 않았어도 초록이 된다.
     */
    await waitFor(
      () => {
        expect(screen.queryByRole('dialog', { name: '운영진 그룹 삭제' })).toBeNull();
      },
      { timeout: 5000 },
    );
    // 목록 재조회가 한 왕복 걸린다 — 다이얼로그가 닫힌 직후에는 아직 이전 목록이 남아 있다
    await waitFor(
      () => {
        expect(screen.queryByRole('button', { name: /운영 - 지울 그룹/ })).toBeNull();
      },
      { timeout: 5000 },
    );

    // [핵심] 지운 그룹이 필터에 걸린 채 남으면 목록이 영원히 0건이다
    expect(pressedFilterName()).toContain('전체 운영자');
  });

  it('운영자가 남아 있는 그룹은 다이얼로그를 열지 않고 인원수와 해결 방법을 말한다', async () => {
    const { user } = renderPage();
    const group = await screen.findByRole('button', { name: OPS_ADMIN_FILTER }, { timeout: 5000 });

    await user.click(group);
    await user.click(await screen.findByRole('button', { name: /'운영팀 admin' 그룹 삭제/ }));

    // 눌러도 매번 같은 오류만 나오는 확인 버튼을 보여 주지 않는다 — 다이얼로그 자체가 열리지 않는다
    const banner = await screen.findByText(
      /운영자 3명이 속해 있어 삭제할 수 없습니다/,
      {},
      { timeout: 5000 },
    );
    expect(banner).not.toBeNull();
    expect(screen.queryByRole('dialog', { name: '운영진 그룹 삭제' })).toBeNull();
  });

  it('발신 프로필로 쓰이는 그룹은 걸린 템플릿 이름을 대며 막는다', async () => {
    const { user } = renderPage();
    const group = await screen.findByRole(
      'button',
      { name: /운영 - 스페이스플래닝 대표/ },
      { timeout: 5000 },
    );

    await user.click(group);
    await user.click(
      await screen.findByRole('button', { name: /'스페이스플래닝 대표' 그룹 삭제/ }),
    );

    const banner = await screen.findByText(/'주문 완료 안내'/, {}, { timeout: 5000 });
    expect(banner.textContent).toContain('발신 프로필을 먼저 바꾼 뒤');
    expect(screen.queryByRole('dialog', { name: '운영진 그룹 삭제' })).toBeNull();
  });
});
