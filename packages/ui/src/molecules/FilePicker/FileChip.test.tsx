// FileChip — 계약 검증 테스트 (contracts/FileChip.contract.json@1.0.0)
//
//   states[]         default · hover · focus-visible · disabled
//   events.onRemove  blockedWhen: disabled (비발생을 스파이로 관찰한다)
//   순수 유틸        formatFileSize (B/KB/MB 경계 · 음수/NaN)
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import pickerCss from './FilePicker.css?raw';
import { FileChip, formatFileSize } from './FileChip';

function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

describe('FileChip — 계약 states[]', () => {
  it('FileChip: default 상태 — 파일명·용량·썸네일을 그리고 onRemove 가 없으면 제거 버튼도 없다', () => {
    render(<FileChip src="/favicon.ico" name="favicon.ico" size={13_000} />);

    expect(screen.getByText('favicon.ico')).not.toBeNull();
    expect(screen.getByText('13KB')).not.toBeNull();
    expect(screen.getByAltText('favicon.ico 썸네일')).not.toBeNull();
    // 지울 수 없는 자리에 죽은 버튼을 두지 않는다
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('FileChip: hover 상태 — 잠기지 않은 제거 버튼만 hover 표면 규칙을 갖는다', () => {
    const hover = ruleBody(pickerCss, '.tds-filechip__remove:hover:not(:disabled)');
    expect(hover).toContain('var(--tds-color-surface-raised)');
  });

  it('FileChip: focus-visible 상태 — 제거 버튼이 키보드 포커스를 받고 단일 토큰 링을 그린다', async () => {
    render(<FileChip src="" name="logo.png" size={2048} onRemove={vi.fn()} />);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'logo.png 제거' }));

    const ring = ruleBody(pickerCss, '.tds-filechip__remove:focus-visible');
    expect(ring).toContain('var(--tds-border-width-medium)');
    expect(ring).toContain('var(--tds-color-border-focus)');
  });

  it('FileChip: disabled 상태 — 제거 버튼이 잠긴다 (칩 자체는 계속 읽힌다)', () => {
    render(<FileChip src="" name="logo.png" size={2048} disabled onRemove={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'logo.png 제거' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.getByText('logo.png')).not.toBeNull();
  });
});

describe('FileChip — onRemove · blockedWhen', () => {
  it('FileChip: 제거 버튼을 누르면 onRemove 가 발화한다 (비발생 단언이 공허하지 않음을 보인다)', async () => {
    const onRemove = vi.fn();
    render(<FileChip src="" name="logo.png" size={2048} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'logo.png 제거' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('FileChip: disabled 상태에서 onRemove 가 발화하지 않는다 (계약 blockedWhen: disabled)', async () => {
    const onRemove = vi.fn();
    render(<FileChip src="" name="logo.png" size={2048} disabled onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'logo.png 제거' }), {
      pointerEventsCheck: 0,
    });

    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe('formatFileSize — 용량 표기', () => {
  it('1KB 미만은 바이트, 1MB 미만은 KB — 소수점은 MB 부터만 붙는다', () => {
    expect(formatFileSize(0)).toBe('0B');
    expect(formatFileSize(999)).toBe('999B');
    expect(formatFileSize(1024)).toBe('1KB');
    expect(formatFileSize(13_000)).toBe('13KB');
    // 12.7KB 는 정보가 아니라 소음이다 — 반올림한다
    expect(formatFileSize(13_004)).toBe('13KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0MB');
    expect(formatFileSize(1024 * 1024 * 1.25)).toBe('1.3MB');
  });

  it('음수·NaN·무한대는 숫자로 그리지 않는다 — 없는 사실을 지어내지 않는다', () => {
    expect(formatFileSize(-1)).toBe('-');
    expect(formatFileSize(Number.NaN)).toBe('-');
    expect(formatFileSize(Number.POSITIVE_INFINITY)).toBe('-');
  });
});
