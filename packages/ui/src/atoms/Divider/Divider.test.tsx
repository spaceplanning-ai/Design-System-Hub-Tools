// Divider — 계약 검증 테스트 (contracts/Divider.contract.json@1.0.0)
//
//   states[]   default
//   events     없음 (비대화형)
//   a11y.role  none — 항상 aria-hidden 이라 접근성 트리에 나타나지 않는다
//
// 이 파일이 못 박는 핵심은 **aria-hidden 이 항상 붙는다**는 것이다. 승계 원본 두 벌 중
// 이메일 빌더 쪽(email/styles.ts 의 toolbarDividerStyle 을 쓰던 <div>)에 이것이 없었다.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from './Divider';

describe('Divider — 계약 states[]', () => {
  it('Divider: default 상태 — orientation 기본값 horizontal 로 렌더한다', () => {
    const { container } = render(<Divider />);
    const divider = container.querySelector('.tds-divider');

    expect(divider).not.toBeNull();
    expect(divider?.className).toContain('tds-divider--horizontal');
  });

  it.each([
    ['horizontal', 'tds-divider--horizontal'],
    ['vertical', 'tds-divider--vertical'],
  ] as const)('Divider: orientation=%s 는 %s 를 낸다 (계약 enum 전수)', (orientation, expected) => {
    const { container } = render(<Divider orientation={orientation} />);

    expect(container.querySelector('.tds-divider')?.className).toContain(expected);
  });
});

describe('Divider — 계약 a11y (장식이 정의다)', () => {
  it('Divider: 항상 aria-hidden="true" 다 — 두 방향 모두', () => {
    const { container } = render(
      <>
        <Divider orientation="horizontal" />
        <Divider orientation="vertical" />
      </>,
    );
    const dividers = container.querySelectorAll('.tds-divider');

    expect(dividers.length).toBe(2);
    for (const divider of dividers) {
      expect(divider.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('Divider: role 속성을 갖지 않는다 — separator 로 낭독되지 않는다', () => {
    const { container } = render(<Divider />);

    expect(container.querySelector('.tds-divider')?.hasAttribute('role')).toBe(false);
    expect(screen.queryByRole('separator')).toBeNull();
  });

  it('Divider: 앞뒤 내용 사이에 접근성 노드를 끼워 넣지 않는다', () => {
    // aria-hidden 이 빠지면 이 단언이 아니라 위 단언이 먼저 깨진다. 여기서는 소비자 관점 —
    // 스크린리더가 두 덩이를 이어서 읽는지를 role 조회로 확인한다.
    render(
      <div>
        <button type="button">앞</button>
        <Divider orientation="vertical" />
        <button type="button">뒤</button>
      </div>,
    );

    expect(screen.getAllByRole('button').map((el) => el.textContent)).toEqual(['앞', '뒤']);
  });

  it('Divider: <span> 이라 인라인 문맥(버튼 줄) 안에서도 유효한 마크업이다', () => {
    const { container } = render(<Divider />);

    expect(container.querySelector('.tds-divider')?.tagName).toBe('SPAN');
  });
});
