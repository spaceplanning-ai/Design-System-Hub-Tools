// SelectField 동작 단언 (A41)
//
// SelectField 는 raw <select> 의 무손실 드롭인이어야 한다 — 네이티브 <select> 로 렌더되고,
// value/onChange/disabled/ref 를 그대로 흘려보내며, <option> children 을 그대로 그린다.
// (E2E 가 getByLabel(...).selectOption(...) 로 이 컨트롤을 조작하므로 네이티브 시맨틱 유지가 계약이다.)
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SelectField } from './SelectField';

function options() {
  return (
    <>
      <option value="grant">적립</option>
      <option value="deduct">차감</option>
    </>
  );
}

describe('SelectField', () => {
  it('네이티브 <select>(combobox)로 렌더하고 option 을 그대로 그린다', () => {
    render(
      <SelectField id="kind" aria-label="구분" defaultValue="grant">
        {options()}
      </SelectField>,
    );
    const select = screen.getByRole('combobox', { name: '구분' });
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByRole('option', { name: '적립' })).not.toBeNull();
    expect(screen.getByRole('option', { name: '차감' })).not.toBeNull();
  });

  it('네이티브 화살표를 지운다 (appearance:none) — 커스텀 chevron 을 얹기 위해', () => {
    render(
      <SelectField id="kind" aria-label="구분">
        {options()}
      </SelectField>,
    );
    const select = screen.getByRole('combobox', { name: '구분' });
    expect(select.style.appearance).toBe('none');
  });

  it('onChange 를 그대로 흘려보낸다 — 값을 고르면 선택 값과 함께 발화한다', async () => {
    const user = userEvent.setup();
    // 이벤트 발화 시점의 값을 그 자리에서 붙잡는다 — 제어형이면 렌더 후 target.value 가 되돌아가므로.
    let selectedAtFire = '';
    const onChange = vi.fn((event: { target: { value: string } }) => {
      selectedAtFire = event.target.value;
    });
    render(
      <SelectField id="kind" aria-label="구분" defaultValue="grant" onChange={onChange}>
        {options()}
      </SelectField>,
    );
    await user.selectOptions(screen.getByRole('combobox', { name: '구분' }), 'deduct');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(selectedAtFire).toBe('deduct');
  });

  it('disabled 를 그대로 흘려보낸다', () => {
    render(
      <SelectField id="kind" aria-label="구분" disabled>
        {options()}
      </SelectField>,
    );
    const select = screen.getByRole('combobox', { name: '구분' });
    expect((select as HTMLSelectElement).disabled).toBe(true);
  });

  it('ref 로 네이티브 <select> 에 닿는다 (RHF register 가 물릴 수 있게)', () => {
    const ref = createRef<HTMLSelectElement>();
    render(
      <SelectField id="kind" aria-label="구분" ref={ref}>
        {options()}
      </SelectField>,
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('SELECT');
  });
});
