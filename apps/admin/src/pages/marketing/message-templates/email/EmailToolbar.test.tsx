// EmailToolbar — DS 이관이 지킨 것을 못 박는 검사
//
// [이 파일이 왜 새로 생겼나] IconButton · Divider 로 이관하기 전에 되돌림 실험을 했다:
// 패널 접기 버튼의 `pressed` 를 `unset` 으로 바꿔 **aria-pressed 를 통째로 없앴는데**
// message-templates 아래 245건이 전부 통과했다. 즉 이 툴바의 접근성 표면은 검사가 0이었다.
// 시각 회귀도 접근성 회귀도 잡히지 않는 상태에서 이관하면 '초록인데 망가짐' 이 된다.
//
// 그래서 이관과 같은 커밋에서 그 구멍을 메운다. 여기서 재는 것은 빌더의 동작이 아니라
// **툴바가 AT 에 무엇으로 보이는가** 다 — 동작은 EmailBuilder.test.tsx 가 이미 덮는다.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmailToolbar } from './EmailToolbar';

/** 기본 props — 각 검사가 관심 있는 것만 덮어쓴다 */
function renderToolbar(overrides: Partial<Parameters<typeof EmailToolbar>[0]> = {}) {
  const props = {
    tab: 'edit' as const,
    device: 'desktop' as const,
    leftOpen: true,
    rightOpen: true,
    canUndo: true,
    canRedo: true,
    onTabChange: vi.fn(),
    onDeviceChange: vi.fn(),
    onToggleLeft: vi.fn(),
    onToggleRight: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onInsertVariable: vi.fn(),
    ...overrides,
  };
  return render(<EmailToolbar {...props} />);
}

describe('EmailToolbar — 토글과 일반 액션을 가른다 (IconButton pressed 3값)', () => {
  it('패널 접기 버튼은 토글이다 — aria-pressed 를 갖는다', () => {
    renderToolbar({ leftOpen: true, rightOpen: true });

    // 펼쳐져 있으면 '접기' 가 눌리지 않은 상태다
    expect(
      screen.getByRole('button', { name: '템플릿 설정 접기' }).getAttribute('aria-pressed'),
    ).toBe('false');
    expect(
      screen.getByRole('button', { name: '속성 패널 접기' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('패널이 접히면 aria-pressed 가 true 로 뒤집힌다', () => {
    renderToolbar({ leftOpen: false, rightOpen: false });

    expect(
      screen.getByRole('button', { name: '템플릿 설정 접기' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: '속성 패널 접기' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('되돌리기·다시하기·내려받기는 일반 액션이라 aria-pressed 를 **갖지 않는다**', () => {
    // 여기에 aria-pressed="false" 가 붙으면 스크린리더가 '토글 버튼, 안 눌림' 이라고 읽어
    // 사용자가 누르면 무언가 켜질 것이라 기대하게 된다 — 거짓 시맨틱이다.
    renderToolbar();

    for (const name of ['되돌리기', '다시하기', 'HTML 내려받기']) {
      expect(screen.getByRole('button', { name }).hasAttribute('aria-pressed')).toBe(false);
    }
  });
});

describe('EmailToolbar — 아이콘 버튼의 이름이 두 경로로 전달된다', () => {
  it('아이콘 버튼은 aria-label 과 title 을 같은 값으로 갖는다', () => {
    // 이관 전 이 화면에는 title 이 없어 마우스 사용자가 아이콘의 뜻을 알 길이 없었다.
    // 문자·알림톡 편집기 쪽에는 이미 있었고, 컴포넌트가 없어 규칙이 갈라져 있었다.
    renderToolbar();
    const undo = screen.getByRole('button', { name: '되돌리기' });

    expect(undo.getAttribute('title')).toBe('되돌리기');
    expect(undo.getAttribute('aria-label')).toBe('되돌리기');
  });

  it('되돌릴 이력이 없으면 네이티브 disabled 로 막는다 (포커스 순서에서도 빠진다)', () => {
    renderToolbar({ canUndo: false, canRedo: false });

    expect(screen.getByRole('button', { name: '되돌리기' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: '다시하기' }).hasAttribute('disabled')).toBe(true);
  });

  it('disabled 를 주면 툴바의 액션이 통째로 잠긴다', () => {
    renderToolbar({ disabled: true });

    expect(screen.getByRole('button', { name: 'HTML 내려받기' }).hasAttribute('disabled')).toBe(
      true,
    );
  });
});

describe('EmailToolbar — 구획선은 접근성 트리 밖이다 (Divider)', () => {
  it('구획선 3개가 전부 aria-hidden 이다', () => {
    // 이관 전에는 aria-hidden 없는 <div> 였다 — 문자·알림톡 편집기의 <span aria-hidden> 과
    // 갈라져 있던 지점이고, 이 이관이 실제로 고친 결함이다.
    const { container } = renderToolbar();
    const dividers = container.querySelectorAll('.tds-divider');

    expect(dividers.length).toBe(3);
    for (const divider of dividers) {
      expect(divider.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('구획선이 separator 로 낭독되지 않는다', () => {
    renderToolbar();

    expect(screen.queryByRole('separator')).toBeNull();
  });
});
