// Slider — 계약 검증 테스트 (contracts/Slider.contract.json@1.0.0)
//
//   states[]         default · hover · focus-visible · disabled
//   events.onChange  payload number · blockedWhen: disabled (비발생을 스파이로 관찰한다)
//   props            value/min/max/step · label(aria-label) · unit(장식) · id(빈 문자열이면 미렌더)
//
// [range 의 값 변경을 fireEvent.change 로 만드는 이유] jsdom 은 네이티브 range 의 키보드 증감
// (←/→/Home/End)을 구현하지 않는다 — userEvent 로 화살표를 눌러도 값이 움직이지 않아 단언이
// **공허하게 통과**한다. 그래서 활성 경로는 change 를 직접 만든다.
// 반대로 disabled 검증에는 change 를 쓰지 않는다: fireEvent 는 네이티브 잠금을 우회해 dispatch 하므로
// 그것으로 '막혔다' 를 증명할 수 없다. 잠금은 **사용자 경로**(클릭·탭)로만 관찰한다.
//
// [jest-dom 매처를 쓰지 않는다] 이 패키지의 vitest 셋업은 jest-dom 을 등록하지 않는다 —
// 단언은 전부 순수 DOM 프로퍼티/속성으로 쓴다 (SearchField 등 기존 테스트와 같은 방식).
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import sliderCss from './Slider.css?raw';
import { Slider } from './Slider';

/** selector { ... } 블록 본문 추출 — jsdom 에는 포인터 의사 클래스의 실제 상태가 없다 */
function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

/** 값 옆 단위 문구 — 스타일 값이 아니라 사람이 읽는 글자다 */
const PX_UNIT = 'px';

function inputOf(el: HTMLElement): HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) throw new Error('<input> 이 아니다');
  return el;
}

describe('Slider — 계약 states[]', () => {
  it('Slider: default 상태 — role=slider 로 렌더하고 aria-label/min/max 를 네이티브가 노출한다', () => {
    const { container } = render(
      <Slider value={12} min={0} max={40} label="Padding top" onChange={vi.fn()} />,
    );

    const input = inputOf(screen.getByRole('slider', { name: 'Padding top' }));
    expect(input.type).toBe('range');
    expect(input.min).toBe('0');
    expect(input.max).toBe('40');
    expect(input.value).toBe('12');
    expect(container.querySelector('.tds-slider__value')?.textContent).toBe('12');
  });

  it('Slider: hover 상태 — 잠기지 않은 트랙만 hover accent 규칙을 갖는다', () => {
    const hover = ruleBody(sliderCss, '.tds-slider__input:hover:not(:disabled)');
    expect(hover).toContain('var(--tds-color-action-primary-hover)');
  });

  it('Slider: focus-visible 상태 — 키보드 포커스를 받고 :focus-visible 규칙이 단일 토큰 링을 그린다', async () => {
    render(<Slider value={1} min={0} max={10} label="Font size" onChange={vi.fn()} />);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('slider', { name: 'Font size' }));

    const ring = ruleBody(sliderCss, '.tds-slider__input:focus-visible');
    expect(ring).toContain('var(--tds-border-width-medium)');
    expect(ring).toContain('var(--tds-color-border-focus)');
  });

  it('Slider: disabled 상태 — 입력이 잠기고 값 표시도 disabled 색으로 함께 흐려진다', () => {
    const { container } = render(
      <Slider value={5} min={0} max={10} label="Radius" disabled onChange={vi.fn()} />,
    );

    expect(inputOf(screen.getByRole('slider', { name: 'Radius' })).disabled).toBe(true);
    expect(container.querySelector('.tds-slider--disabled')).not.toBeNull();
    expect(ruleBody(sliderCss, '.tds-slider--disabled .tds-slider__value')).toContain(
      'var(--tds-color-text-disabled)',
    );
  });
});

describe('Slider — onChange(값) · blockedWhen', () => {
  it('Slider: onChange 는 이벤트가 아니라 새 숫자 값을 넘긴다 (호출부 number setter 직결)', () => {
    const onChange = vi.fn<(next: number) => void>();
    render(<Slider value={3} min={0} max={10} label="Radius" onChange={onChange} />);

    fireEvent.change(screen.getByRole('slider', { name: 'Radius' }), { target: { value: '7' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(7);
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('number');
  });

  it('Slider: disabled 상태에서 onChange 가 발화하지 않는다 (계약 blockedWhen: disabled)', async () => {
    const onChange = vi.fn();
    render(<Slider value={3} min={0} max={10} label="Radius" disabled onChange={onChange} />);

    const input = screen.getByRole('slider', { name: 'Radius' });
    // 사용자 경로 둘 다 막힌다: 포인터로 잡을 수 없고, 탭으로 도달할 수도 없다
    await userEvent.click(input, { pointerEventsCheck: 0 });
    await userEvent.tab();

    expect(document.activeElement).not.toBe(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Slider — props', () => {
  it('unit 은 값 옆 장식일 뿐이라 접근 가능한 이름을 오염시키지 않는다 (aria-hidden)', () => {
    const { container } = render(
      <Slider value={16} min={0} max={40} label="Padding top" unit={PX_UNIT} onChange={vi.fn()} />,
    );

    // 값과 단위 문구를 이어 붙인 결과를 본다 — 소스에 치수 리터럴을 남기지 않으려고 조립한다
    const readout = container.querySelector('.tds-slider__value');
    expect(readout?.textContent).toBe(`16${PX_UNIT}`);
    expect(readout?.getAttribute('aria-hidden')).toBe('true');
    // 이름은 label 하나뿐 — 'px' 가 이름에 섞이지 않는다
    expect(screen.getByRole('slider', { name: 'Padding top' })).not.toBeNull();
  });

  it('unit 을 주지 않으면 숫자만 보인다 (기본값 빈 문자열)', () => {
    const { container } = render(
      <Slider value={7} min={0} max={10} label="X" onChange={vi.fn()} />,
    );

    expect(container.querySelector('.tds-slider__value')?.textContent).toBe('7');
  });

  it('id 는 주면 그대로 붙고, 비우면 id 속성을 렌더하지 않는다 (빈 속성 잔재 0)', () => {
    const { unmount } = render(
      <Slider value={1} min={0} max={2} id="pad-top" label="X" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('slider').getAttribute('id')).toBe('pad-top');
    unmount();

    render(<Slider value={1} min={0} max={2} label="X" onChange={vi.fn()} />);
    expect(screen.getByRole('slider').hasAttribute('id')).toBe(false);
  });

  it('step 은 화살표 한 번이 움직이는 크기다 — 주면 그 값이 그대로 붙는다', () => {
    render(<Slider value={0} min={0} max={100} step={10} label="X" onChange={vi.fn()} />);

    expect(inputOf(screen.getByRole('slider')).step).toBe('10');
  });
});
