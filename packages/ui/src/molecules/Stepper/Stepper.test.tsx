// Stepper — 계약 검증 테스트 (contracts/Stepper.contract.json@1.0.0)
//
//   states[]   default(미도달) · checked(완료) · selected(현재)
//   a11y       <ol> + aria-label · 현재 단계에 aria-current="step" · 번호/연결선은 aria-hidden
//
// 이 컴포넌트는 이벤트가 없다 — 비대화형이라 events 블록 자체가 계약에 없다.
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import stepperCss from './Stepper.css?raw';
import { Stepper } from './Stepper';

const RETURN_FLOW = [
  { id: 'received', label: '접수' },
  { id: 'collecting', label: '수거중' },
  { id: 'inspecting', label: '검수중' },
  { id: 'done', label: '완료' },
];

function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

describe('Stepper — 계약 states[]', () => {
  it('Stepper: default 상태 — <ol> 이 ariaLabel 로 이름을 갖고 단계 수만큼 항목을 그린다', () => {
    render(<Stepper steps={RETURN_FLOW} current="received" ariaLabel="처리 진행 단계" />);

    const list = screen.getByRole('list', { name: '처리 진행 단계' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('Stepper: checked(완료) — 현재 단계까지 data-done=true 이고 그 이후는 false 다', () => {
    render(<Stepper steps={RETURN_FLOW} current="inspecting" ariaLabel="처리 진행 단계" />);

    const steps = screen.getAllByRole('listitem');
    expect(steps.map((li) => li.getAttribute('data-done'))).toEqual([
      'true',
      'true',
      'true',
      'false',
    ]);

    const rule = ruleBody(stepperCss, ".tds-stepper__step[data-done='true'] .tds-stepper__dot");
    expect(rule).not.toBeNull();
    expect(rule).toContain('var(--tds-color-action-primary-default)');
  });

  it('Stepper: selected(현재) — 현재 단계 하나만 data-current=true 이고 테두리가 굵어진다', () => {
    render(<Stepper steps={RETURN_FLOW} current="collecting" ariaLabel="처리 진행 단계" />);

    const steps = screen.getAllByRole('listitem');
    expect(steps.map((li) => li.getAttribute('data-current'))).toEqual([
      'false',
      'true',
      'false',
      'false',
    ]);

    const rule = ruleBody(stepperCss, ".tds-stepper__step[data-current='true'] .tds-stepper__dot");
    expect(rule).not.toBeNull();
    expect(rule).toContain('var(--tds-border-width-medium)');
  });
});

describe('Stepper — 계약 a11y', () => {
  it('Stepper: 현재 단계에만 aria-current="step" 이 붙는다 (진행 상태의 유일한 비시각 신호)', () => {
    render(<Stepper steps={RETURN_FLOW} current="inspecting" ariaLabel="처리 진행 단계" />);

    const steps = screen.getAllByRole('listitem');
    expect(steps.map((li) => li.getAttribute('aria-current'))).toEqual([null, null, 'step', null]);
  });

  it('Stepper: 번호 점과 연결선은 aria-hidden — 스크린 리더에는 라벨만 읽힌다', () => {
    const { container } = render(
      <Stepper steps={RETURN_FLOW} current="collecting" ariaLabel="처리 진행 단계" />,
    );

    for (const dot of container.querySelectorAll('.tds-stepper__dot')) {
      expect(dot.getAttribute('aria-hidden')).toBe('true');
    }
    for (const line of container.querySelectorAll('.tds-stepper__connector')) {
      expect(line.getAttribute('aria-hidden')).toBe('true');
    }

    // 순서는 <ol> 이 전달한다 — 접근 가능한 이름에 번호가 섞이지 않는다
    expect(screen.getByRole('list', { name: '처리 진행 단계' }).textContent).toContain('접수');
  });

  it('Stepper: 비대화형이다 — 단계에 버튼/링크가 없다', () => {
    render(<Stepper steps={RETURN_FLOW} current="done" ariaLabel="처리 진행 단계" />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

describe('Stepper — 흐름 밖 종료 (계약 description)', () => {
  it('Stepper: steps 에 없는 current(반려·실주)가 오면 아무 단계도 채우지 않는다', () => {
    render(<Stepper steps={RETURN_FLOW} current="rejected" ariaLabel="처리 진행 단계" />);

    const steps = screen.getAllByRole('listitem');
    expect(steps.every((li) => li.getAttribute('data-done') === 'false')).toBe(true);
    expect(steps.every((li) => li.getAttribute('aria-current') === null)).toBe(true);
    // 흐름 자체는 계속 보여 준다 — 어디로 갈 수 있었는지가 사라지면 안 된다
    expect(steps).toHaveLength(4);
  });

  it('Stepper: 첫 단계가 current 면 그 하나만 채워진다', () => {
    render(<Stepper steps={RETURN_FLOW} current="received" ariaLabel="처리 진행 단계" />);

    const steps = screen.getAllByRole('listitem');
    expect(steps.map((li) => li.getAttribute('data-done'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
  });

  it('Stepper: 마지막 단계가 current 면 전부 채워진다', () => {
    render(<Stepper steps={RETURN_FLOW} current="done" ariaLabel="처리 진행 단계" />);

    expect(
      screen.getAllByRole('listitem').every((li) => li.getAttribute('data-done') === 'true'),
    ).toBe(true);
  });
});
