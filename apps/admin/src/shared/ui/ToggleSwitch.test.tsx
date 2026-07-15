// ToggleSwitch 접근성·동작 단언 (A41)
//
// 이진 상태를 목록에서 바로 켜고 끄는 스위치다 — role/aria-checked, 클릭·키보드 토글, 잠금(disabled/busy)을 단언한다.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ToggleSwitch } from './ToggleSwitch';

describe('ToggleSwitch', () => {
  it('role=switch 이며 aria-checked 로 상태를 전달한다', () => {
    render(<ToggleSwitch checked label="FAQ 노출" onChange={vi.fn()} />);
    expect(screen.getByRole('switch', { name: 'FAQ 노출' }).getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('클릭하면 반대 상태로 onChange 를 부른다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} label="FAQ 노출" onChange={onChange} />);
    await user.click(screen.getByRole('switch', { name: 'FAQ 노출' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('Space 키로 토글된다(버튼 기본 동작)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked label="FAQ 노출" onChange={onChange} />);
    screen.getByRole('switch').focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('disabled 면 클릭해도 onChange 하지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} label="FAQ 노출" onChange={onChange} disabled />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('busy 면 잠기고 aria-busy 로 진행을 알린다', () => {
    render(<ToggleSwitch checked label="FAQ 노출" onChange={vi.fn()} busy />);
    const sw = screen.getByRole('switch');
    expect((sw as HTMLButtonElement).disabled).toBe(true);
    expect(sw.getAttribute('aria-busy')).toBe('true');
  });

  it('ON/OFF 문구를 상태에 따라 보여준다', () => {
    const { rerender } = render(<ToggleSwitch checked label="FAQ 노출" onChange={vi.fn()} />);
    expect(screen.getByText('ON')).not.toBeNull();
    rerender(<ToggleSwitch checked={false} label="FAQ 노출" onChange={vi.fn()} />);
    expect(screen.getByText('OFF')).not.toBeNull();
  });
});
