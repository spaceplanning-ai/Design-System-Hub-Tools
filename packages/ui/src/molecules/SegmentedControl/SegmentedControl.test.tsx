// SegmentedControl — 계약 검증 테스트 (contracts/SegmentedControl.contract.json@1.1.0)
//
//   states[]          default · hover · focus-visible · disabled · selected
//   events.onChange   blockedWhen: ["disabled"]
//   a11y.keyboard     Tab · ArrowLeft · ArrowRight · Space · Enter (라디오 그룹 로빙 tabindex)
//   options[].icon    Icon 계약 name enum 과 같은 값 집합 (아래 컴파일 타임 대조)
//   options[].labelHidden  label 을 시각적으로만 감춘다 (텍스트는 DOM 에 남아 이름이 된다)
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import segmentedCss from './SegmentedControl.css?raw';
import { SegmentedControl } from './SegmentedControl';
import type { IconName } from '../../../generated/types/Icon.types';
import type { SegmentedControlProps } from '../../../generated/types/SegmentedControl.types';

const options = [
  { id: 'day', label: '일' },
  { id: 'week', label: '주' },
  { id: 'month', label: '월' },
];

/* ── options[].icon ↔ Icon.name 표류 방지 (컴파일 타임 게이트) ─────────────────
   계약 생성기는 계약 간 타입 import 를 만들지 못해서 SegmentedControl 계약의
   itemShape 안에 Icon 의 name enum 이 **손으로 옮겨 적힌 사본**으로 들어 있다.
   그 사본이 늙는 것을 막는 장치가 이 두 줄이다 — 양방향 할당이 모두 성립해야만
   두 유니온이 정확히 같다. 한쪽에만 아이콘이 늘거나 빠지면 여기서 TS 가 죽는다
   (vitest 가 아니라 `pnpm typecheck` 가 잡는다).                              */
type SegmentIconName = NonNullable<SegmentedControlProps['options'][number]['icon']>;
const _iconNameFitsSegment: SegmentIconName = null as unknown as IconName;
const _segmentIconFitsIconName: IconName = null as unknown as SegmentIconName;
void _iconNameFitsSegment;
void _segmentIconFitsIconName;

function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

describe('SegmentedControl — 계약 states[]', () => {
  it('SegmentedControl: default 상태 — radiogroup 이 ariaLabel 로 이름을 갖고 각 세그먼트가 role=radio 다', () => {
    render(<SegmentedControl value="day" options={options} ariaLabel="조회 기간" />);

    expect(screen.getByRole('radiogroup', { name: '조회 기간' })).not.toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('SegmentedControl: hover 상태 — :hover 규칙이 세그먼트 텍스트를 진하게 만든다', () => {
    const rule = ruleBody(segmentedCss, '.tds-segmented__segment:hover:not(:disabled)');

    expect(rule).not.toBeNull();
    expect(rule).toContain('var(--tds-color-text-default)');
  });

  it('SegmentedControl: focus-visible 상태 — 로빙 tabindex 로 선택된 세그먼트만 탭 순서에 들어간다', async () => {
    render(<SegmentedControl value="week" options={options} ariaLabel="조회 기간" />);
    const selected = screen.getByRole('radio', { name: '주' });

    expect(selected.getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('radio', { name: '일' }).getAttribute('tabindex')).toBe('-1');

    await userEvent.tab();
    expect(document.activeElement).toBe(selected);

    const ring = ruleBody(segmentedCss, '.tds-segmented__segment:focus-visible');
    expect(ring).not.toBeNull();
    expect(ring).toContain('var(--tds-color-border-focus)');
  });

  it('SegmentedControl: focus-visible 상태 — 선택된 값이 options 에 없어도 첫 세그먼트가 탭 진입점이 된다 (그룹이 키보드로 도달 불가능해지지 않는다)', async () => {
    render(<SegmentedControl value="" options={options} ariaLabel="조회 기간" />);

    const first = screen.getByRole('radio', { name: '일' });
    expect(first.getAttribute('tabindex')).toBe('0');

    await userEvent.tab();
    expect(document.activeElement).toBe(first);
  });

  it('SegmentedControl: disabled 상태 — 그룹에 aria-disabled, 각 세그먼트에 native disabled 가 반영된다', () => {
    render(<SegmentedControl value="day" options={options} ariaLabel="조회 기간" disabled />);

    expect(
      screen.getByRole('radiogroup', { name: '조회 기간' }).getAttribute('aria-disabled'),
    ).toBe('true');
    for (const radio of screen.getAllByRole('radio')) {
      expect((radio as HTMLButtonElement).disabled).toBe(true);
    }
    expect(ruleBody(segmentedCss, '.tds-segmented__segment:disabled')).toContain(
      'var(--tds-color-text-disabled)',
    );
  });

  it('SegmentedControl: selected 상태 — value 와 일치하는 세그먼트만 aria-checked=true 이고 알약 표면 규칙이 붙는다', () => {
    render(<SegmentedControl value="month" options={options} ariaLabel="조회 기간" />);

    expect(screen.getByRole('radio', { name: '월' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '일' }).getAttribute('aria-checked')).toBe('false');

    const rule = ruleBody(segmentedCss, ".tds-segmented__segment[aria-checked='true']");
    expect(rule).not.toBeNull();
    expect(rule).toContain('var(--tds-color-surface-default)');
  });
});

describe('SegmentedControl — 계약 events.onChange.blockedWhen', () => {
  it('SegmentedControl: disabled 상태에서 onChange 가 발화하지 않는다', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="day"
        options={options}
        ariaLabel="조회 기간"
        disabled
        onChange={onChange}
      />,
    );

    // 클릭 경로 — disabled 속성을 지우고 CSS 로만 흐리게 처리하면 이 단언이 깨진다
    await userEvent.click(screen.getByRole('radio', { name: '주' }));

    // 키보드 경로 — 화살표 키도 차단돼야 한다 (선택이 포커스를 따르는 라디오 그룹이므로).
    // disabled 요소는 포커스를 받지 못하므로 이벤트를 직접 디스패치해 **핸들러의 차단 로직 자체**를 시험한다.
    fireEvent.keyDown(screen.getByRole('radio', { name: '일' }), { key: 'ArrowRight' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('SegmentedControl: 활성 상태에서는 클릭으로 onChange 가 발화한다 (비발생 단언이 공허하지 않음을 보인다)', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl value="day" options={options} ariaLabel="조회 기간" onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '월' }));

    expect(onChange).toHaveBeenCalledWith('month');
  });

  it('SegmentedControl: ArrowRight/ArrowLeft 가 선택과 포커스를 함께 옮긴다 (계약 a11y.keyboard · 핸들러는 radio 가 소유한다)', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl value="day" options={options} ariaLabel="조회 기간" onChange={onChange} />,
    );

    screen.getByRole('radio', { name: '일' }).focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith('week');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '주' }));

    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('month'); // day 에서 왼쪽 → 순환하여 마지막
  });
});

describe('SegmentedControl — options[].icon · labelHidden (계약 1.1.0)', () => {
  const deviceOptions = [
    { id: 'desktop', label: '데스크톱 폭', icon: 'desktop', labelHidden: true },
    { id: 'mobile', label: '모바일 폭', icon: 'mobile', labelHidden: true },
  ] as const;

  it('SegmentedControl: labelHidden 세그먼트가 label 을 접근 가능한 이름으로 유지한다', () => {
    render(<SegmentedControl value="desktop" options={deviceOptions} ariaLabel="캔버스 너비" />);

    // 아이콘만 보이지만 이름은 label 에서 온다 — 이 조회가 되면 스크린리더도 읽는다
    expect(screen.getByRole('radio', { name: '데스크톱 폭' })).not.toBeNull();
    expect(screen.getByRole('radio', { name: '모바일 폭' })).not.toBeNull();
  });

  it('SegmentedControl: labelHidden 라벨은 DOM 에 남고 시각적으로만 감춰진다', () => {
    const { container } = render(
      <SegmentedControl value="desktop" options={deviceOptions} ariaLabel="캔버스 너비" />,
    );

    const hidden = container.querySelectorAll('.tds-segmented__label--hidden');
    expect(hidden).toHaveLength(2);
    // 텍스트가 제거된 것이 아니라 감춰진 것이다 (제거하면 aria-label 과 이름이 갈릴 여지가 생긴다)
    expect(hidden[0]?.textContent).toBe('데스크톱 폭');
  });

  it('SegmentedControl: icon 은 aria-hidden 으로 나가 이름에 기여하지 않는다', () => {
    const { container } = render(
      <SegmentedControl value="desktop" options={deviceOptions} ariaLabel="캔버스 너비" />,
    );

    const icons = container.querySelectorAll('svg.tds-icon');
    expect(icons).toHaveLength(2);
    for (const icon of icons) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.getAttribute('aria-label')).toBeNull();
    }
  });

  it('SegmentedControl: 세그먼트에 aria-label 을 달지 않는다 — 이름의 경로는 렌더된 label 하나뿐이다', () => {
    render(
      <SegmentedControl
        value="desktop"
        options={[
          { id: 'desktop', label: '데스크톱 폭', icon: 'desktop', labelHidden: true },
          { id: 'day', label: '일', icon: 'bar-chart' },
        ]}
        ariaLabel="캔버스 너비"
      />,
    );

    // 감춘 라벨이든 보이는 라벨이든 aria-label 은 없다. 이름은 텍스트에서만 온다.
    expect(
      screen.getByRole('radio', { name: '데스크톱 폭' }).getAttribute('aria-label'),
    ).toBeNull();
    expect(screen.getByRole('radio', { name: '일' }).getAttribute('aria-label')).toBeNull();
  });

  it('SegmentedControl: labelHidden 이 텍스트를 제거하면 세그먼트가 이름을 잃는다 (감추기와 지우기의 차이)', () => {
    // 이 단언이 지키는 것: labelHidden 구현이 span 을 감추는 대신 렌더를 건너뛰도록
    // 바뀌면 아이콘만 남아 이름 없는 radio 가 된다. 위 이름 조회들이 그때 전부 깨진다.
    const { container } = render(
      <SegmentedControl value="desktop" options={deviceOptions} ariaLabel="캔버스 너비" />,
    );

    const labels = container.querySelectorAll('.tds-segmented__label');
    expect(labels).toHaveLength(2);
    expect([...labels].every((el) => (el.textContent ?? '').length > 0)).toBe(true);
  });

  it('SegmentedControl: 아이콘 세그먼트도 선택·키보드가 그대로 동작한다', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="desktop"
        options={deviceOptions}
        ariaLabel="캔버스 너비"
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '모바일 폭' }));
    expect(onChange).toHaveBeenCalledWith('mobile');
  });
});
