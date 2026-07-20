// FileDropzone — 계약 검증 테스트 (contracts/FileDropzone.contract.json@1.0.0)
//
//   states[]         default · hover · focus-visible · disabled · error
//   events.onSelect  payload File · blockedWhen: disabled (탐색기 경로와 드롭 경로 **둘 다** 막힌다)
//   계약 본문        숨은 input 은 AT 에 보이지 않는다 · 같은 파일 재선택 가능 · accept/describedBy 는 빈 값이면 미렌더
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import pickerCss from './FilePicker.css?raw';
import { FileDropzone } from './FileDropzone';

function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

const icoFile = (): File => new File(['x'], 'favicon.ico', { type: 'image/x-icon' });

/** 숨은 진짜 파일 입력 — AT 에 보이지 않으므로 role 로는 찾을 수 없다 */
function hiddenInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('.tds-dropzone__input');
  if (!(input instanceof HTMLInputElement)) throw new Error('숨은 file input 을 찾지 못했다');
  return input;
}

describe('FileDropzone — 계약 states[]', () => {
  it('FileDropzone: default 상태 — 두 조작 경로를 이름으로 알리는 버튼 하나만 AT 에 보인다', () => {
    const { container } = render(
      <FileDropzone
        label="파비콘"
        title="파일 선택 또는 끌어다 놓기"
        meta="최소 16x16 / ICO"
        accept="image/x-icon"
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: '파비콘 — 클릭하거나 파일을 끌어다 놓으세요' }),
    ).not.toBeNull();
    expect(screen.getByText('최소 16x16 / ICO')).not.toBeNull();

    // 숨은 입력은 탭 정지점이 아니고 AT 에도 보이지 않는다 (컨트롤이 둘로 읽히지 않는다)
    const input = hiddenInput(container);
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.getAttribute('tabindex')).toBe('-1');
    expect(input.getAttribute('accept')).toBe('image/x-icon');
  });

  it('FileDropzone: hover 상태 — 잠기지 않은 드롭존만 hover 테두리 규칙을 갖는다', () => {
    const hover = ruleBody(pickerCss, '.tds-dropzone:hover:not(:disabled)');
    expect(hover).toContain('var(--tds-color-action-primary-hover)');
  });

  it('FileDropzone: focus-visible 상태 — 버튼이 키보드 포커스를 받고 단일 토큰 링을 그린다', async () => {
    render(<FileDropzone label="파비콘" title="파일 선택" onSelect={vi.fn()} />);

    await userEvent.tab();
    expect(document.activeElement?.className).toContain('tds-dropzone');

    const ring = ruleBody(pickerCss, '.tds-dropzone:focus-visible');
    expect(ring).toContain('var(--tds-border-width-medium)');
    expect(ring).toContain('var(--tds-color-border-focus)');
  });

  it('FileDropzone: disabled 상태 — 버튼과 숨은 입력이 함께 잠긴다', () => {
    const { container } = render(
      <FileDropzone label="파비콘" title="파일 선택" disabled onSelect={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /파비콘/ }).hasAttribute('disabled')).toBe(true);
    expect(hiddenInput(container).hasAttribute('disabled')).toBe(true);
  });

  it('FileDropzone: error 상태 — isInvalid 는 테두리만 danger 로 바꾸고 문구는 그리지 않는다', () => {
    render(
      <FileDropzone
        label="파비콘"
        title="파일 선택"
        isInvalid
        describedBy="favicon-error"
        onSelect={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: /파비콘/ });
    expect(button.getAttribute('data-invalid')).toBe('true');
    // 문구는 호출부 소유다 — describedBy 로 잇기만 한다
    expect(button.getAttribute('aria-describedby')).toBe('favicon-error');
    expect(ruleBody(pickerCss, ".tds-dropzone[data-invalid='true']")).toContain(
      'var(--tds-color-feedback-danger-border)',
    );
  });
});

describe('FileDropzone — onSelect · blockedWhen', () => {
  it('FileDropzone: 탐색기에서 고른 파일 1건을 onSelect 로 넘긴다', () => {
    const onSelect = vi.fn<(file: File) => void>();
    const { container } = render(
      <FileDropzone label="파비콘" title="파일 선택" onSelect={onSelect} />,
    );

    // 숨은 입력은 pointer-events:none 이라 userEvent.upload 가 닿지 않는다 —
    // 탐색기가 값을 채우는 그 지점(change)을 직접 만든다
    fireEvent.change(hiddenInput(container), { target: { files: [icoFile()] } });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]?.name).toBe('favicon.ico');
  });

  it('같은 파일을 다시 골라도 onSelect 가 또 발화한다 (검증 실패 후 재시도가 막히지 않는다)', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <FileDropzone label="파비콘" title="파일 선택" onSelect={onSelect} />,
    );

    const input = hiddenInput(container);
    fireEvent.change(input, { target: { files: [icoFile()] } });
    // 첫 선택 후 입력 값이 비워졌으므로 같은 파일이 다시 change 를 낸다
    fireEvent.change(input, { target: { files: [icoFile()] } });

    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('끌어다 놓은 파일도 같은 onSelect 로 나간다 (두 경로가 한 출구를 쓴다)', () => {
    const onSelect = vi.fn();
    render(<FileDropzone label="파비콘" title="파일 선택" onSelect={onSelect} />);

    const button = screen.getByRole('button', { name: /파비콘/ });
    fireEvent.dragOver(button);
    expect(button.getAttribute('data-drag-active')).toBe('true');

    fireEvent.drop(button, { dataTransfer: { files: [icoFile()] } });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(button.getAttribute('data-drag-active')).toBe('false');
  });

  it('FileDropzone: disabled 상태에서 onSelect 가 발화하지 않는다 (계약 blockedWhen: disabled)', async () => {
    const onSelect = vi.fn();
    render(<FileDropzone label="파비콘" title="파일 선택" disabled onSelect={onSelect} />);

    const button = screen.getByRole('button', { name: /파비콘/ });
    await userEvent.click(button, { pointerEventsCheck: 0 });
    // 드래그 경로는 <button disabled> 가 막아주지 않는다 — 핸들러가 직접 막는지 본다
    fireEvent.drop(button, { dataTransfer: { files: [icoFile()] } });

    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('FileDropzone — 선택 props 의 빈 값', () => {
  it('meta·accept·describedBy 를 비우면 그 자리를 아예 렌더하지 않는다 (빈 속성 잔재 0)', () => {
    const { container } = render(
      <FileDropzone label="파비콘" title="파일 선택" onSelect={vi.fn()} />,
    );

    const button = screen.getByRole('button', { name: /파비콘/ });
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(hiddenInput(container).hasAttribute('accept')).toBe(false);
    expect(container.querySelector('.tds-dropzone__meta')).toBeNull();
  });
});
