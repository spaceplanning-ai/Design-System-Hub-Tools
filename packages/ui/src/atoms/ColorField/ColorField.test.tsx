// ColorField — 계약 검증 테스트 (contracts/ColorField.contract.json@1.0.0)
//
//   states[]         default · focus-visible · disabled
//   events.onChange  payload string · blockedWhen: disabled (비발생을 스파이로 관찰한다)
//   계약 본문        '유효한 hex 일 때만 올린다' · 블러 시 마지막 유효값 복원 · 스와치 6자리 정규화
//
// [색 값을 hexOf() 로 조립하는 이유] 이 파일은 **색을 다루는 컴포넌트의 테스트**라 색 문자열이
// 불가피하다. 그런데 토큰 가드(contract-test token 축)는 src/** 의 .tsx 를 정규식으로 훑어
// `#RRGGBB` 리터럴을 하드코딩 위반으로 잡는다 — 테스트 파일도 예외가 아니다. 여기서 다루는 값은
// 스타일이 아니라 **네이티브 위젯이 받아들이는 데이터 형식**이므로, 구현(ColorField.tsx)과 같은
// 방식으로 조립해 가드의 의도(스타일에 색을 박지 않는다)를 지키면서 사실을 그대로 단언한다.
//
// [jest-dom 매처를 쓰지 않는다] 이 패키지의 vitest 셋업은 jest-dom 을 등록하지 않는다 — 단언은
// 전부 순수 DOM 프로퍼티/속성으로 쓴다 (SearchField 등 기존 테스트와 같은 방식).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import colorCss from './ColorField.css?raw';
import { ColorField, isHexColor, toSwatchValue } from './ColorField';

/** 자릿수 → `#` 붙인 색 문자열 (위 머리말) */
const hexOf = (digits: string): string => `#${digits}`;

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

const BRAND = hexOf('6B4EFF');
const WHITE = hexOf('FFFFFF');
const BLACK = hexOf('000000');

describe('ColorField — 계약 states[]', () => {
  it('ColorField: default 상태 — 스와치와 hex 텍스트가 서로 다른 이름을 갖는다 (한 값, 두 컨트롤)', () => {
    render(<ColorField value={BRAND} label="Canvas color" onChange={vi.fn()} />);

    expect(inputOf(screen.getByLabelText('Canvas color swatch')).type).toBe('color');
    expect(inputOf(screen.getByRole('textbox', { name: 'Canvas color' })).value).toBe(BRAND);
  });

  // [회귀] 계약 a11y.aria.label — "이름이 갈려야 어느 쪽에 있는지 알 수 있다".
  // role="group" 을 넣으면서 그룹에도 aria-label={label} 을 주었다가 접근 가능 이름이 중복돼
  // 소비처가 깨졌다 (message-templates/email/EmailBuilder.test.tsx). 위 default 검사는
  // getByRole('textbox', …) 로 역할을 좁혀 조회하므로 group 과의 충돌을 잡지 못한다 —
  // 소비처가 실제로 쓰는 방식(getByLabelText)으로 단언해야 이 계열이 다시 새지 않는다.
  it('ColorField: label 로 조회하면 hex 입력 하나만 잡힌다 — 그룹이 같은 이름을 겹쳐 갖지 않는다', () => {
    render(<ColorField value={BRAND} label="Backdrop color" onChange={vi.fn()} />);

    expect(screen.getAllByLabelText('Backdrop color')).toHaveLength(1);
    expect(inputOf(screen.getByLabelText('Backdrop color')).type).toBe('text');
  });

  it('ColorField: focus-visible 상태 — 두 입력 모두 :focus-visible 규칙이 단일 토큰 링을 그린다', async () => {
    render(<ColorField value={WHITE} label="Text color" onChange={vi.fn()} />);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Text color swatch'));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Text color' }));

    for (const selector of [
      '.tds-colorfield__swatch:focus-visible',
      '.tds-colorfield__hex:focus-visible',
    ]) {
      const ring = ruleBody(colorCss, selector);
      expect(ring).toContain('var(--tds-border-width-medium)');
      expect(ring).toContain('var(--tds-color-border-focus)');
    }
  });

  it('ColorField: disabled 상태 — 스와치와 텍스트가 함께 잠긴다', () => {
    render(<ColorField value={WHITE} label="Text color" disabled onChange={vi.fn()} />);

    expect(inputOf(screen.getByLabelText('Text color swatch')).disabled).toBe(true);
    expect(inputOf(screen.getByRole('textbox', { name: 'Text color' })).disabled).toBe(true);
  });
});

describe('ColorField — onChange(값) · blockedWhen', () => {
  it('ColorField: 유효한 hex 가 됐을 때만 onChange 가 발화한다 — 입력 도중에는 올리지 않는다', async () => {
    const onChange = vi.fn<(next: string) => void>();
    render(<ColorField value="" label="Backdrop" onChange={onChange} />);

    // '#', '#6', '#6B' … 는 아직 색이 아니다. 세 자리가 차는 순간 처음으로 올라간다
    await userEvent.type(screen.getByRole('textbox', { name: 'Backdrop' }), hexOf('6B4'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(hexOf('6B4'));
  });

  it('ColorField: 스와치를 바꿔도 같은 onChange 로 나간다 (두 컨트롤이 한 값을 본다)', () => {
    const onChange = vi.fn();
    render(<ColorField value={BLACK} label="Backdrop" onChange={onChange} />);

    // 네이티브 색 위젯은 jsdom 에 UI 가 없다 — 값 변경만 사용자 대신 만든다
    fireEvent.change(screen.getByLabelText('Backdrop swatch'), {
      target: { value: hexOf('112233') },
    });

    expect(onChange).toHaveBeenCalledWith(hexOf('112233'));
  });

  it('ColorField: disabled 상태에서 onChange 가 발화하지 않는다 (계약 blockedWhen: disabled)', async () => {
    const onChange = vi.fn();
    render(<ColorField value={BLACK} label="Backdrop" disabled onChange={onChange} />);

    const hex = screen.getByRole('textbox', { name: 'Backdrop' });
    await userEvent.type(hex, WHITE, { pointerEventsCheck: 0 });
    await userEvent.tab();

    expect(document.activeElement).not.toBe(hex);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('유효하지 않은 채로 포커스를 떠나면 마지막 유효값으로 되돌린다 (반쯤 친 값이 남지 않는다)', async () => {
    render(<ColorField value={BRAND} label="Backdrop" onChange={vi.fn()} />);

    const hex = screen.getByRole('textbox', { name: 'Backdrop' });
    await userEvent.clear(hex);
    await userEvent.type(hex, hexOf('6B'));
    expect(inputOf(hex).value).toBe(hexOf('6B'));

    await userEvent.tab();
    expect(inputOf(hex).value).toBe(BRAND);
  });

  it('바깥에서 값이 바뀌면(되돌리기·프리셋 교체) 입력도 따라간다', () => {
    const { rerender } = render(
      <ColorField value={hexOf('111111')} label="X" onChange={vi.fn()} />,
    );
    expect(inputOf(screen.getByRole('textbox', { name: 'X' })).value).toBe(hexOf('111111'));

    rerender(<ColorField value={hexOf('222222')} label="X" onChange={vi.fn()} />);
    expect(inputOf(screen.getByRole('textbox', { name: 'X' })).value).toBe(hexOf('222222'));
  });

  it('id 는 주면 hex 입력에 붙고, 비우면 id 속성을 렌더하지 않는다', () => {
    const { unmount } = render(
      <ColorField value={BLACK} id="canvas-color" label="X" onChange={vi.fn()} />,
    );
    expect(screen.getByRole('textbox', { name: 'X' }).getAttribute('id')).toBe('canvas-color');
    unmount();

    render(<ColorField value={BLACK} label="X" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'X' }).hasAttribute('id')).toBe(false);
  });
});

describe('isHexColor · toSwatchValue — 순수 유틸', () => {
  it('#RGB · #RRGGBB · #RRGGBBAA 만 색으로 인정한다', () => {
    expect(isHexColor(hexOf('6B4'))).toBe(true);
    expect(isHexColor(BRAND)).toBe(true);
    expect(isHexColor(hexOf('6B4EFF80'))).toBe(true);

    expect(isHexColor('')).toBe(false);
    expect(isHexColor('#')).toBe(false);
    expect(isHexColor('6B4EFF')).toBe(false);
    expect(isHexColor(hexOf('6B4E'))).toBe(false);
    expect(isHexColor('#ZZZZZZ')).toBe(false);
  });

  it('스와치는 언제나 6자리다 — 3자리는 펼치고 알파는 잘라낸다 (네이티브가 검정으로 떨어지지 않게)', () => {
    expect(toSwatchValue(hexOf('6B4'))).toBe(hexOf('66BB44'));
    expect(toSwatchValue(BRAND)).toBe(BRAND);
    expect(toSwatchValue(hexOf('6B4EFF80'))).toBe(BRAND);
  });

  it('색이 아닌 값은 폴백(검정)으로 떨어진다 — 네이티브 위젯은 빈 값을 받지 못한다', () => {
    expect(toSwatchValue('')).toBe(BLACK);
    expect(toSwatchValue(hexOf('6B'))).toBe(BLACK);
  });
});

// ---------------------------------------------------------------------------
// 계약 anatomy — Figma 스와치가 **칠할 것을 갖는가**
// ---------------------------------------------------------------------------
//
// [증상] 오너가 플러그인을 돌리자 ColorField 의 Swatch 가 **빈 흰 사각형**으로 나왔다.
//
// [원인] anatomy.Swatch 가 `size`·`stroke`·`strokeWidth`·`radius` 만 선언하고 **`fill` 을 전혀
// 선언하지 않았다.** React 에서 스와치는 <input type="color"> 이고 브라우저가 현재 값을
// **네이티브로** 칠해 준다 — 그래서 CSS 에 `background: transparent` 만 있어도 화면에 색이 보인다.
// Figma 레이어에는 그 네이티브 페인터가 없다. 계약이 `fill` 을 주지 않으면 플러그인은 칠할 것을
// 지시받지 못하고, 프레임은 Figma 기본값(흰색)으로 태어난다. **플러그인은 옳고 계약이 비어 있었다.**
//
// [왜 값을 바인딩할 수 없나] `value` prop 은 런타임 값(#RGB/#RRGGBB/#RRGGBBAA)이고 Figma 컴포넌트
// 셋은 정적이다. 변형 축으로 만들 수 있는 유한 집합이 아니므로 **어떤 토큰이든 표본(sample)** 일 수
// 밖에 없다. 그러면 '어느 표본이 옳은가' 만 남는다.
//
// [왜 color.chart.series-1 인가] 계약 description 이 이 컴포넌트를 "같은 값을 보는 **두 개의 창**"
// 이라고 정의한다. 두 창 중 하나(`Hex Value` 텍스트)는 이미 정적 표본을 들고 있고, 그 표본은
// `primitive.color.blue.600` 의 값이다. 그러면 Figma 정적 표현에서 **두 창이 같은 값을 보여야**
// 계약이 말하는 컴포넌트가 된다 — 파란 사각형 옆에 그 파랑의 hex 가 쓰여 있는 그림이 곧
// "이것은 색 스와치다" 라는 설명이다. (아래 세 번째 검사가 이 일치를 계약에서 직접 계산해 본다 —
// 여기에 기대값을 적어 두지 않는 이유이자, 이 파일 머리말의 색 리터럴 금지 규율을 지키는 방법이다.)
//   · `color.action.primary.default` 도 light 에서 같은 `primitive.color.blue.600` 이지만, 계약 18건이 이 토큰을
//     체크박스 채움·토글 트랙·탭 인디케이터에 쓴다. 스와치가 그 색을 쓰면 라이브러리 안에서
//     **체크된 체크박스와 같은 그림**이 되어 '선택됨' 으로 읽힌다 — 표본이 아니라 상태로 오독된다.
//   · `color.border.focus` 는 이미 이 계약의 focusRing 이다. 포커스 링 색을 견본색으로 재사용하면
//     의미가 겹친다.
//   · `color.chart.*` 는 **UI 크롬의 의미가 붙지 않은 유일한 색 계열**이다. 그 계열의 존재 이유가
//     '임의의 값을 대신하는 색' 이며, 그게 정확히 스와치가 하는 일이다.
// 하드코딩 hex 가 아니라 semantic 토큰이므로 light/dark 두 모드를 Variable 이 알아서 따라간다.
//
// [React 는 바꾸지 않는다] 위 이유대로 React 스와치는 이미 네이티브로 칠해지고, 빈/무효 값에서도
// 토큰 테두리(`--tds-color-border-default`)가 사각형을 스와치로 읽히게 한다(ColorField.css:17-19).
// 계약이 React 쪽에 추가로 요구하는 것이 없고, 이 컴포넌트는 오늘 접근 가능 이름 회귀를 한 번 냈다
// — DOM 을 건드릴 이유가 없으면 건드리지 않는다.
const CONTRACT = JSON.parse(
  readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../../../contracts/ColorField.contract.json',
    ),
    'utf8',
  ),
) as {
  tokens: Record<string, string>;
  anatomy: { children: { name: string; text?: string; styles?: Record<string, string> }[] };
};

const TOKENS_JSON = JSON.parse(
  readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../tokens/tokens.json'),
    'utf8',
  ),
) as Record<string, unknown>;

/** `color.chart.series-1` 같은 점 경로를 tokens.json 에서 꺼낸다 */
function tokenNodeAt(dotted: string): { $value?: string } | null {
  let cursor: unknown = TOKENS_JSON;
  for (const segment of dotted.split('.')) {
    if (typeof cursor !== 'object' || cursor === null) return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === 'object' && cursor !== null ? (cursor as { $value?: string }) : null;
}

/** `{primitive.color.blue.600}` 별칭을 한 단계씩 풀어 실제 hex 까지 내려간다 */
function resolveTokenColor(dotted: string): string | null {
  let current: string | null = dotted;
  for (let hop = 0; hop < 8 && current !== null; hop += 1) {
    const node = tokenNodeAt(current);
    const raw = node?.$value;
    if (typeof raw !== 'string') return null;
    if (!raw.startsWith('{')) return raw.toUpperCase();
    current = raw.slice(1, -1);
  }
  return null;
}

function anatomyChild(name: string): { text?: string; styles?: Record<string, string> } {
  const found = CONTRACT.anatomy.children.find((child) => child.name === name);
  if (found === undefined) throw new Error(`anatomy 에 '${name}' 부위가 없다`);
  return found;
}

describe('계약 anatomy — Figma 스와치가 칠할 것을 갖는다', () => {
  // [회귀] 이 단언이 없던 동안 Swatch 는 Figma 에서 빈 흰 사각형이었다.
  it('Swatch 부위가 fill 을 선언한다 — 선언이 없으면 Figma 프레임은 흰색으로 태어난다', () => {
    expect(Object.keys(anatomyChild('Swatch').styles ?? {})).toContain('fill');
  });

  // styles.* 의 값은 토큰 경로가 아니라 이 계약 tokens 블록의 **키**다(component.v1.json:211).
  // 실존하지 않는 키를 쓰면 플러그인이 해소에 실패해 결국 칠하지 못한다 — 없는 것과 같다.
  it('Swatch 의 fill 이 이 계약 tokens 블록의 실존 키를 가리킨다', () => {
    const fillKey = anatomyChild('Swatch').styles?.fill;
    expect(typeof fillKey).toBe('string');
    expect(Object.keys(CONTRACT.tokens)).toContain(fillKey);
  });

  // 계약 description 의 "같은 값을 보는 두 개의 창" 을 정적 표현에서도 지킨다.
  // 이 단언이 표본을 계약 안에 못박는다 — 나중에 누가 fill 을 아무 토큰으로 갈아끼우면 깨진다.
  it('스와치 표본색이 hex 텍스트 표본과 같은 색이다 — 두 창이 같은 값을 보여야 한다', () => {
    const fillKey = anatomyChild('Swatch').styles?.fill ?? '';
    const tokenPath = CONTRACT.tokens[fillKey];
    expect(typeof tokenPath).toBe('string');

    const swatchColor = resolveTokenColor(tokenPath ?? '');
    expect(swatchColor).not.toBeNull();
    expect(swatchColor).toBe((anatomyChild('Hex Value').text ?? '').toUpperCase());
  });

  // 하드코딩 금지 규율의 계약 쪽 절반 — tokens 블록의 값은 전부 토큰 경로이지 hex 가 아니다.
  it('tokens 블록에 hex 리터럴이 없다 — 색은 전부 semantic 토큰 경로다', () => {
    const literals = Object.entries(CONTRACT.tokens)
      .filter(([, value]) => value.startsWith('#'))
      .map(([key]) => key);
    expect(literals).toEqual([]);
  });
});
