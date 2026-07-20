// RadioCardGroup — 계약 검증 테스트 (contracts/RadioCardGroup.contract.json@1.0.0)
//
//   states[]         default · hover · focus-visible · disabled · selected
//   events.onChange  payload string · blockedWhen: disabled (비발생을 스파이로 관찰한다)
//   계약 본문        이름(label)과 설명(description)이 분리된다 · 네이티브 라디오가 단일 선택을 소유한다
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import radioCss from './RadioCardGroup.css?raw';
import { RadioCardGroup } from './RadioCardGroup';

function ruleBody(css: string, selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return close < 0 ? null : css.slice(open + 1, close);
}

function inputOf(el: HTMLElement): HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) throw new Error('<input> 이 아니다');
  return el;
}

const OPTIONS = [
  { value: 'public', label: '전체 공개', description: '누구나 내 사이트에 접속할 수 있어요' },
  { value: 'private', label: '비공개', description: '관리자만 접근할 수 있어요' },
] as const;

describe('RadioCardGroup — 계약 states[]', () => {
  it('RadioCardGroup: default 상태 — radiogroup 이 legend 로 이름을 갖고 선택지마다 라디오가 선다', () => {
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: '사이트 접근 범위' })).not.toBeNull();
    expect(screen.getAllByRole('radio').length).toBe(2);
  });

  it('RadioCardGroup: selected 상태 — 고른 카드만 aria-checked 이고 테두리/배경이 함께 바뀐다', () => {
    const { container } = render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="private"
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );

    expect(inputOf(screen.getByRole('radio', { name: '비공개' })).checked).toBe(true);
    expect(inputOf(screen.getByRole('radio', { name: '전체 공개' })).checked).toBe(false);

    // 색만으로 말하지 않는다 — 라디오 점(aria-checked)과 카드 테두리가 함께 켜진다
    expect(container.querySelectorAll('[data-selected="true"]').length).toBe(1);
    expect(ruleBody(radioCss, ".tds-radiocard__option[data-selected='true']")).toContain(
      'var(--tds-color-action-primary-default)',
    );
  });

  it('RadioCardGroup: hover 상태 — 잠기지 않은 카드만 hover 테두리 규칙을 갖는다', () => {
    const hover = ruleBody(radioCss, ".tds-radiocard__option[data-disabled='false']:hover");
    expect(hover).toContain('var(--tds-color-action-primary-hover)');
  });

  it('RadioCardGroup: focus-visible 상태 — 라디오가 키보드 포커스를 받고 단일 토큰 링을 그린다', async () => {
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '전체 공개' }));

    const ring = ruleBody(radioCss, '.tds-radiocard__radio:focus-visible');
    expect(ring).toContain('var(--tds-border-width-medium)');
    expect(ring).toContain('var(--tds-color-border-focus)');
  });

  it('RadioCardGroup: disabled 상태 — 모든 라디오가 잠기고 라벨이 disabled 색으로 흐려진다', () => {
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        disabled
        onChange={vi.fn()}
      />,
    );

    for (const radio of screen.getAllByRole('radio')) {
      expect(inputOf(radio).disabled).toBe(true);
    }
    expect(
      ruleBody(radioCss, ".tds-radiocard__option[data-disabled='true'] .tds-radiocard__label"),
    ).toContain('var(--tds-color-text-disabled)');
  });
});

describe('RadioCardGroup — onChange · blockedWhen', () => {
  it('RadioCardGroup: 카드를 고르면 그 value 를 문자열로 발화한다', async () => {
    const onChange = vi.fn<(next: string) => void>();
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '비공개' }));

    expect(onChange).toHaveBeenCalledWith('private');
  });

  it('라벨을 눌러도 같은 라디오가 켜진다 (htmlFor 배선 — 클릭 영역이 제목까지 넓다)', async () => {
    const onChange = vi.fn();
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByText('비공개'));

    expect(onChange).toHaveBeenCalledWith('private');
  });

  it('RadioCardGroup: disabled 상태에서 onChange 가 발화하지 않는다 (계약 blockedWhen: disabled)', async () => {
    const onChange = vi.fn();
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        disabled
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '비공개' }), { pointerEventsCheck: 0 });

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RadioCardGroup — 이름과 설명의 분리', () => {
  it('접근 가능한 이름은 제목뿐이고 설명은 aria-describedby 로 따로 이어진다', () => {
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value="public"
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );

    // 이름이 '전체 공개 누구나 내 사이트에 접속할 수 있어요' 한 덩어리로 읽히면 안 된다
    const radio = screen.getByRole('radio', { name: '전체 공개' });
    expect(radio.getAttribute('aria-describedby')).toBe('visibility-public-description');
    expect(document.getElementById('visibility-public-description')?.textContent).toBe(
      '누구나 내 사이트에 접속할 수 있어요',
    );
  });

  it('name 이 다르면 그룹도 id 도 갈린다 — 한 화면에 그룹이 둘 이상 설 수 있다', () => {
    render(
      <>
        <RadioCardGroup
          name="visibility"
          legend="접근 범위"
          value="public"
          options={OPTIONS}
          onChange={vi.fn()}
        />
        <RadioCardGroup
          name="indexing"
          legend="검색 노출"
          value="private"
          options={OPTIONS}
          onChange={vi.fn()}
        />
      </>,
    );

    expect(screen.getAllByRole('radiogroup').length).toBe(2);
    expect(document.getElementById('visibility-public')).not.toBeNull();
    expect(document.getElementById('indexing-public')).not.toBeNull();
  });

  it('options 가 비면 라디오 없이 legend 만 남는다 — 빈 그룹을 지어내지 않는다', () => {
    render(
      <RadioCardGroup
        name="visibility"
        legend="사이트 접근 범위"
        value=""
        options={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: '사이트 접근 범위' })).not.toBeNull();
    expect(screen.queryAllByRole('radio').length).toBe(0);
  });
});
