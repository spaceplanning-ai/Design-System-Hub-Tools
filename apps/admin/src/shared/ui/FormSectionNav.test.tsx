// FormSectionNav — 긴 폼의 구획 내비게이션
//
// [무엇을 못 박는가] 이 레일이 필터가 아니라 **내비게이션**이라는 사실 하나가 나머지를 전부 결정한다:
//  · 상태는 aria-current 로 말한다(aria-pressed 가 아니다 — A11Y-12 의 반대편)
//  · 누르면 좁히는 게 아니라 **이동**한다(스크롤 + 포커스). 포커스가 따라오지 않으면 키보드
//    사용자는 화면만 옮기고 제자리에 남는다.
//  · 오류는 색(붉은 점)만으로 말하지 않는다(WCAG 1.4.1) — 숨은 텍스트가 함께 나간다.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FormSectionAnchor,
  FormSectionNav,
  scrollToSection,
  useActiveSection,
} from './FormSectionNav';
import type { FormSectionItem } from './FormSectionNav';

const ITEMS: readonly FormSectionItem[] = [
  { id: 'sec-a', label: '기본 정보' },
  { id: 'sec-b', label: '가격', invalid: true },
  { id: 'sec-c', label: '배송' },
];

describe('FormSectionNav — 현재 위치 표기 (A11Y-12)', () => {
  it('활성 항목만 aria-current="true" 를 갖는다', () => {
    render(
      <FormSectionNav
        navLabel="구획 이동"
        heading="구획"
        items={ITEMS}
        activeId="sec-b"
        onJump={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /가격/ }).getAttribute('aria-current')).toBe('true');
    expect(
      screen.getByRole('button', { name: /기본 정보/ }).getAttribute('aria-current'),
    ).toBeNull();
    expect(screen.getByRole('button', { name: /배송/ }).getAttribute('aria-current')).toBeNull();
  });

  it('어떤 항목도 aria-pressed 를 갖지 않는다 — 토글 필터가 아니다', () => {
    render(
      <FormSectionNav
        navLabel="구획 이동"
        heading="구획"
        items={ITEMS}
        activeId="sec-a"
        onJump={vi.fn()}
      />,
    );

    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('aria-pressed')).toBeNull();
    }
  });

  it('nav 는 이름을 갖고, 항목은 차례가 있는 목록(list)이다', () => {
    render(
      <FormSectionNav
        navLabel="상품 폼 구획 이동"
        heading="구획"
        items={ITEMS}
        activeId="sec-a"
        onJump={vi.fn()}
      />,
    );

    expect(screen.getByRole('navigation', { name: '상품 폼 구획 이동' })).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(ITEMS.length);
  });
});

describe('FormSectionNav — 오류 구획', () => {
  it('오류가 있는 구획은 색이 아니라 텍스트로도 말한다', () => {
    render(
      <FormSectionNav
        navLabel="구획 이동"
        heading="구획"
        items={ITEMS}
        activeId="sec-a"
        onJump={vi.fn()}
      />,
    );

    // 붉은 점은 aria-hidden 이라 이름에 섞이지 않는다 — '확인 필요' 는 숨은 텍스트가 낸다
    expect(screen.getByRole('button', { name: '가격 확인 필요' })).not.toBeNull();
    expect(screen.getByRole('button', { name: '배송' })).not.toBeNull();
  });
});

describe('FormSectionNav — 이동', () => {
  it('항목을 누르면 그 구획 id 로 onJump 를 부른다', async () => {
    const onJump = vi.fn();
    render(
      <FormSectionNav
        navLabel="구획 이동"
        heading="구획"
        items={ITEMS}
        activeId="sec-a"
        onJump={onJump}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '배송' }));

    expect(onJump).toHaveBeenCalledWith('sec-c');
  });

  it('키보드(Tab → Enter)로도 닿는다 — 포커스를 가두지 않는다', async () => {
    const onJump = vi.fn();
    render(
      <FormSectionNav
        navLabel="구획 이동"
        heading="구획"
        items={ITEMS}
        activeId="sec-a"
        onJump={onJump}
      />,
    );

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '기본 정보' }));

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '가격 확인 필요' }));

    await userEvent.keyboard('{Enter}');
    expect(onJump).toHaveBeenCalledWith('sec-b');
  });
});

describe('scrollToSection — 스크롤만이 아니라 포커스도 옮긴다', () => {
  beforeEach(() => {
    // jsdom 은 scrollIntoView 를 구현하지 않는다 — 호출 여부만 관찰한다
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('앵커로 스크롤하고 포커스를 함께 옮긴다', () => {
    render(
      <FormSectionAnchor id="sec-a" label="기본 정보">
        <p>본문</p>
      </FormSectionAnchor>,
    );

    scrollToSection('sec-a');

    const anchor = screen.getByRole('region', { name: '기본 정보' });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(anchor);
  });

  it('없는 id 에는 조용히 아무것도 하지 않는다 (던지지 않는다)', () => {
    expect(() => {
      scrollToSection('없는-구획');
    }).not.toThrow();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});

/** 테스트가 조종하는 가짜 관측자 — 관측 중인 앵커와 콜백을 붙잡아 둔다 */
interface FakeObserver {
  readonly callback: IntersectionObserverCallback;
  readonly targets: Element[];
  disconnected: boolean;
}

describe('useActiveSection — 활성 구획 추적', () => {
  const IDS: readonly string[] = ['sec-a', 'sec-b', 'sec-c'];
  let observers: FakeObserver[] = [];

  function Probe() {
    const activeId = useActiveSection(IDS);
    return (
      <>
        <p data-testid="active">{activeId}</p>
        {IDS.map((id) => (
          <FormSectionAnchor key={id} id={id} label={id}>
            <p>{id}</p>
          </FormSectionAnchor>
        ))}
      </>
    );
  }

  /** 특정 앵커들이 판정선 안으로 들어왔다고 관측자에게 알린다 */
  function reportVisible(visibleIds: readonly string[]): void {
    const observer = observers.at(-1);
    if (observer === undefined) throw new Error('관측자가 붙지 않았다');
    const entries = observer.targets.map((target) => ({
      target,
      isIntersecting: visibleIds.includes(target.id),
    }));
    // 실제 IntersectionObserverEntry 의 나머지 필드는 훅이 읽지 않는다.
    // act — 관측자 콜백은 React 밖에서 오는 이벤트라 상태 반영을 감싸 줘야 한다
    act(() => {
      observer.callback(
        entries as unknown as IntersectionObserverEntry[],
        {
          disconnect: () => undefined,
        } as unknown as IntersectionObserver,
      );
    });
  }

  beforeEach(() => {
    observers = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        private readonly self: FakeObserver;
        constructor(callback: IntersectionObserverCallback) {
          this.self = { callback, targets: [], disconnected: false };
          observers.push(this.self);
        }
        observe(target: Element): void {
          this.self.targets.push(target);
        }
        disconnect(): void {
          this.self.disconnected = true;
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('처음에는 첫 구획이 활성이다', () => {
    render(<Probe />);
    expect(screen.getByTestId('active').textContent).toBe('sec-a');
  });

  it('모든 앵커를 관측한다', () => {
    render(<Probe />);
    expect(observers.at(-1)?.targets.map((t) => t.id)).toEqual(['sec-a', 'sec-b', 'sec-c']);
  });

  it('판정 띠에 걸친 구획 중 문서 순서상 마지막이 활성이 된다', () => {
    render(<Probe />);

    reportVisible(['sec-a']);
    expect(screen.getByTestId('active').textContent).toBe('sec-a');

    // 앞 구획의 꼬리와 뒤 구획의 머리가 함께 걸리면 **막 들어선 뒤쪽**이 활성이다 —
    // 앞을 집으면 목차가 한 칸 뒤처져 따라온다
    reportVisible(['sec-a', 'sec-b']);
    expect(screen.getByTestId('active').textContent).toBe('sec-b');

    reportVisible(['sec-b', 'sec-c']);
    expect(screen.getByTestId('active').textContent).toBe('sec-c');
  });

  it('걸친 구획이 하나도 없으면 직전 값을 유지한다 — 레일이 깜빡이지 않는다', () => {
    render(<Probe />);

    reportVisible(['sec-c']);
    expect(screen.getByTestId('active').textContent).toBe('sec-c');

    reportVisible([]);
    expect(screen.getByTestId('active').textContent).toBe('sec-c');
  });

  it('언마운트되면 관측을 끊는다', () => {
    const view = render(<Probe />);
    view.unmount();
    expect(observers.at(-1)?.disconnected).toBe(true);
  });

  it('IntersectionObserver 가 없는 환경에서는 첫 구획을 유지하고 던지지 않는다', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    expect(() => render(<Probe />)).not.toThrow();
    expect(screen.getByTestId('active').textContent).toBe('sec-a');
  });
});
