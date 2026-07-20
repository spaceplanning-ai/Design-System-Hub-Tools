// Skeleton — 계약 검증 테스트 (contracts/Skeleton.contract.json@1.0.0)
//
//   states[]   default
//   events     없음 → blockedWhen 없음 (비대화형 장식)
//   a11y.role  none — 항상 aria-hidden 이라 AT 에 노출되지 않는다
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

describe('Skeleton — 계약 states[]', () => {
  it('Skeleton: default 상태 — shape 기본값 line 으로 렌더한다', () => {
    const { container } = render(<Skeleton />);
    const block = container.querySelector('.tds-skeleton');

    expect(block).not.toBeNull();
    expect(block?.className).toContain('tds-skeleton--line');
  });

  it.each([
    ['line', 'tds-skeleton--line'],
    ['circle', 'tds-skeleton--circle'],
    ['block', 'tds-skeleton--block'],
  ] as const)('Skeleton: shape=%s 는 %s 를 낸다 (계약 enum 전수)', (shape, expected) => {
    const { container } = render(<Skeleton shape={shape} />);

    expect(container.querySelector('.tds-skeleton')?.className).toContain(expected);
  });
});

describe('Skeleton — 계약 a11y', () => {
  // 계약 a11y.aria["aria-hidden"] — 스켈레톤은 내용의 부재를 그린 것이라 낭독할 것이 없다.
  // 표 한 장에 수십 장이 렌더되므로 이것이 깨지면 낭독이 통째로 무너진다.
  it('Skeleton: 항상 aria-hidden=true 다 (shape 와 무관)', () => {
    const { container } = render(
      <>
        <Skeleton shape="line" />
        <Skeleton shape="circle" />
        <Skeleton shape="block" />
      </>,
    );
    const blocks = container.querySelectorAll('.tds-skeleton');

    expect(blocks).toHaveLength(3);
    for (const block of blocks) {
      expect(block.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('Skeleton: role 속성을 갖지 않는다 (계약 a11y.role = none)', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('.tds-skeleton')?.hasAttribute('role')).toBe(false);
  });
});

describe('Skeleton — 계약 props.isAnimated', () => {
  it('Skeleton: isAnimated 기본값 true — 정지 클래스가 붙지 않는다', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('.tds-skeleton')?.className).not.toContain(
      'tds-skeleton--static',
    );
  });

  it('Skeleton: isAnimated=false 면 tds-skeleton--static 을 낸다', () => {
    const { container } = render(<Skeleton isAnimated={false} />);

    expect(container.querySelector('.tds-skeleton')?.className).toContain('tds-skeleton--static');
  });
});
