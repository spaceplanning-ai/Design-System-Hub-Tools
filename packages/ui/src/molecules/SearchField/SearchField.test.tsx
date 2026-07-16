// SearchField — 계약 검증 테스트 (contracts/SearchField.contract.json@1.0.0)
//
//   states[]         default · focus-visible
//   events.onChange  payload string (네이티브 이벤트가 아니라 값)
//   props            label(숨김 라벨) · placeholder · native passthrough(name/aria-*)
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import searchCss from './SearchField.css?raw';
import { SearchField } from './SearchField';

function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

describe('SearchField — 계약 states[]', () => {
  it('SearchField: default 상태 — searchbox 로 렌더하고 숨김 라벨로 접근 가능한 이름을 준다', () => {
    render(<SearchField value="" label="공지 제목 검색" onChange={vi.fn()} />);

    const input = screen.getByRole('searchbox', { name: '공지 제목 검색' });
    expect(input.tagName).toBe('INPUT');
    expect((input as HTMLInputElement).type).toBe('search');
  });

  it('SearchField: default 상태 — placeholder 는 미지정 시 "검색" 이다', () => {
    render(<SearchField value="" label="검색" onChange={vi.fn()} />);

    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe('검색');
  });

  it('SearchField: focus-visible 상태 — 키보드 포커스를 받고 :focus-visible 규칙이 포커스 링을 그린다', async () => {
    render(<SearchField value="" label="검색" onChange={vi.fn()} />);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: '검색' }));

    const ring = ruleBody(searchCss, '.tds-search__control:focus-visible');
    expect(ring).toContain('var(--tds-color-border-focus)');
  });
});

describe('SearchField — onChange(값) · 네이티브 패스스루', () => {
  it('SearchField: onChange 는 새 문자열(값)을 넘긴다 — 이벤트가 아니다 (호출부 string setter 직결)', async () => {
    let received = '';
    const onChange = vi.fn((v: string) => {
      received = v;
    });
    render(<SearchField value="" label="검색" onChange={onChange} />);

    await userEvent.type(screen.getByRole('searchbox', { name: '검색' }), 'a');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(received).toBe('a');
  });

  it('SearchField: name/aria-* 등 표준 input 속성을 그대로 흘려보낸다 (native passthrough)', () => {
    render(
      <SearchField value="" label="검색" name="q" aria-describedby="hint" onChange={vi.fn()} />,
    );

    const input = screen.getByRole('searchbox', { name: '검색' });
    expect(input.getAttribute('name')).toBe('q');
    expect(input.getAttribute('aria-describedby')).toBe('hint');
  });
});
