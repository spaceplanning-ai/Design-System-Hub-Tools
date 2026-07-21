// DetailCellLink — 목록 행의 키보드 경로가 실제로 키보드로 닿는지 못 박는다.
//
// 이 컴포넌트의 존재 이유가 회귀 방지이므로(머리말의 2026-07-21 사고), 테스트도 그 사고가
// 다시 나면 빨개지도록 쓴다: 링크가 실재하고, Tab 으로 포커스를 받고, 상세로 가리켜야 한다.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { DetailCellLink } from './DetailCellLink';

function renderLink(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('DetailCellLink — 행 클릭(마우스)의 키보드 짝', () => {
  it('상세를 가리키는 링크를 낸다', () => {
    renderLink(<DetailCellLink to="/products/returns/7">R-7</DetailCellLink>);
    const link = screen.getByRole('link', { name: 'R-7' });

    expect(link.getAttribute('href')).toBe('/products/returns/7');
  });

  it('Tab 으로 포커스를 받는다 — 키보드 사용자가 상세에 닿는 경로가 실재한다', async () => {
    renderLink(<DetailCellLink to="/sales/inquiries/3">문의 제목</DetailCellLink>);

    await userEvent.tab();
    // toHaveFocus 는 이 패키지 test 설정에 타입이 없다 — 활성 요소를 직접 본다(같은 사실)
    expect(document.activeElement).toBe(screen.getByRole('link', { name: '문의 제목' }));
  });

  it('텍스트가 무엇의 상세인지 못 말할 때 ariaLabel 이 접근 이름이 된다', () => {
    // 순번·주문번호처럼 짧은 식별자는 그 자체로 '상세' 를 뜻하지 못한다 — 이름을 보강한다
    renderLink(
      <DetailCellLink to="/products/returns/7" ariaLabel="R-2026-07 상세">
        R-2026-07
      </DetailCellLink>,
    );

    expect(screen.getByRole('link', { name: 'R-2026-07 상세' })).not.toBeNull();
  });

  it('포커스 링 클래스를 달아 키보드 포커스가 보인다 (tds-ui-focusable)', () => {
    renderLink(<DetailCellLink to="/x/1">x</DetailCellLink>);

    expect(screen.getByRole('link', { name: 'x' }).className).toContain('tds-ui-focusable');
  });
});
