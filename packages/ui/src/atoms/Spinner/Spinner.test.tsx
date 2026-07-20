// Spinner — 계약 검증 테스트 (contracts/Spinner.contract.json@1.0.0)
//
//   states[]   default
//   events     없음 → blockedWhen 없음 (비대화형)
//   a11y.role  status — label 이 있을 때만. 비면 장식(aria-hidden)이다
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner — 계약 states[]', () => {
  it('Spinner: default 상태 — size 기본값 inherit 으로 렌더한다', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.tds-spinner');

    expect(spinner).not.toBeNull();
    expect(spinner?.className).toContain('tds-spinner--inherit');
  });

  it.each([
    ['inherit', 'tds-spinner--inherit'],
    ['sm', 'tds-spinner--sm'],
    ['md', 'tds-spinner--md'],
    ['lg', 'tds-spinner--lg'],
  ] as const)('Spinner: size=%s 는 %s 를 낸다 (계약 enum 전수)', (size, expected) => {
    const { container } = render(<Spinner size={size} />);

    expect(container.querySelector('.tds-spinner')?.className).toContain(expected);
  });
});

describe('Spinner — 계약 a11y', () => {
  // 계약 a11y.aria — 기본이 '장식' 인 것이 핵심이다. Button 안에서 버튼의 aria-busy 가 이미
  // 로딩을 알리므로, 여기서 또 알리면 버튼 하나가 로딩 상태에서 두 번 낭독된다.
  it('Spinner: label 이 비면(기본) aria-hidden 장식이고 role 이 없다', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.tds-spinner');

    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(spinner?.hasAttribute('role')).toBe(false);
    expect(spinner?.hasAttribute('aria-label')).toBe(false);
  });

  it('Spinner: label 이 있으면 role=status + aria-label 로 승격되고 aria-hidden 이 사라진다', () => {
    render(<Spinner label="불러오는 중" />);
    const spinner = screen.getByRole('status', { name: '불러오는 중' });

    expect(spinner.hasAttribute('aria-hidden')).toBe(false);
    expect(spinner.className).toContain('tds-spinner');
  });
});

describe('Spinner — Button 승계', () => {
  // Button.tsx 의 비공개 Spinner 를 꺼낸 것이므로, Button 이 쓰는 조합(기본값)이
  // 승계 전과 같은 DOM 형태를 내는지 못박는다.
  it('Spinner: Button 이 쓰는 기본 조합은 장식 + 1em(inherit) 이다', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.tds-spinner');

    expect(spinner?.tagName).toBe('SPAN');
    expect(spinner?.className).toBe('tds-spinner tds-spinner--inherit');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
  });
});
