// 블록 → 발송 HTML — 메일 클라이언트에서 실제로 살아남는 모양인가
//
// [이 파일이 지키는 것] 캔버스에서 맞춘 것이 수신함에서도 같은가. 눈으로 볼 수 없는 부분이라
// (Outlook 을 열어 보지 않는 한) 단위 테스트가 유일한 방어선이다. 특히 세 가지를 못박는다:
//   1. 여백이 <td> 에 실린다 — Word 엔진은 div/p 의 padding 을 무시한다.
//   2. 버튼에 VML 대체가 붙는다 — 없으면 Outlook 수신자는 색도 모양도 없는 맨 링크를 본다.
//   3. 다단이 유령 표(ghost table)를 갖는다 — 없으면 Outlook 에서 칸이 세로로 쏟아진다.
//
// [왜 문자열을 직접 본나] 이 변환은 DOM 없이 도는 순수 함수다(render-html.ts 머리말). 파서를
// 끼우면 '조건부 주석' 처럼 **파서가 버리는 것**을 검사할 수 없게 된다 — 정작 중요한 부분이다.
import { describe, expect, it } from 'vitest';

import { createBlock, createLeafBlock, DEFAULT_CANVAS } from './blocks';
import { parseInlineMarkdown, renderBlocksToHtml, renderBlocksToPlainText } from '../render-html';
import type { ButtonBlock, ColumnsBlock, EmailBlock, EmailLeafBlock } from '../types';

const canvas = DEFAULT_CANVAS;

/**
 * 단언용 px 문자열.
 *
 * [왜 `'300px'` 라고 그냥 적지 않나] 린트의 no-restricted-syntax 는 소스의 하드코딩 px 를 막는다
 * (토큰 파이프라인 강제). 그런데 여기서 px 는 **스타일이 아니라 검사 대상 문자열**이다 — 발송
 * HTML 은 토큰을 해석할 수 없어 반드시 px 로 나가야 하고(render-html.ts 머리말), 이 파일은
 * 그 사실을 확인한다. 방어선을 끄는 대신 단위를 코드로 붙여 '이것은 스타일이 아니다' 를 드러낸다.
 */
const PX_UNIT = 'px';
function cssPx(value: number): string {
  return `${String(value)}${PX_UNIT}`;
}

/** 종류별 기본 블록에 필요한 값만 덮어쓴다 — 기본값의 주인은 blocks.ts 하나다 */
function leaf<K extends EmailLeafBlock['blockKind']>(
  kind: K,
  patch: Partial<Extract<EmailLeafBlock, { blockKind: K }>>,
): EmailLeafBlock {
  const base = createLeafBlock(kind, `${kind}-1`);
  return { ...base, ...patch };
}

function render(blocks: readonly EmailBlock[]): string {
  return renderBlocksToHtml(blocks, canvas);
}

/* ── 표 기반 레이아웃 ────────────────────────────────────────────────────── */

describe('표 기반 레이아웃 — Word 엔진이 존중하는 유일한 형태', () => {
  it('바깥이 레이아웃 표이고 role="presentation" 을 갖는다', () => {
    const html = render([leaf('text', { content: '안녕' })]);

    expect(html).toContain('<table role="presentation"');
    // 자료표로 읽히면 스크린리더가 '몇 행 몇 열' 을 낭독한다
    expect(html).toContain('cellpadding="0"');
    expect(html).toContain('border="0"');
  });

  it('블록의 여백은 <td> 에 실린다 — div/p 의 padding 은 Outlook 에서 사라진다', () => {
    const html = render([
      leaf('text', { content: '본문', padding: { top: 10, right: 20, bottom: 30, left: 40 } }),
    ]);

    // 네 변이 td 의 style 로 나가야 한다
    expect(html).toMatch(
      new RegExp(`<td[^>]*padding:${cssPx(10)} ${cssPx(20)} ${cssPx(30)} ${cssPx(40)}`),
    );
  });

  it('블록이 없으면 빈 문자열 — 빈 껍데기를 만들어 내용이 있는 척하지 않는다', () => {
    expect(render([])).toBe('');
  });
});

/* ── 버튼 (bulletproof) ──────────────────────────────────────────────────── */

describe('버튼 — Outlook 에서도 색과 모양이 남는다', () => {
  /** 버튼 하나 — 모양만 갈아 끼울 수 있게 좁혀진 타입으로 만든다 */
  function buttonBlock(shape: ButtonBlock['shape']): ButtonBlock {
    const base = createLeafBlock('button', 'b1');
    if (base.blockKind !== 'button') throw new Error('button factory');
    return { ...base, content: 'Get started', url: 'https://example.com/start', shape };
  }
  const button = buttonBlock('pill');

  it('VML 대체가 조건부 주석 안에 붙는다', () => {
    const html = render([button]);

    expect(html).toContain('<!--[if mso]>');
    expect(html).toContain('v:roundrect');
    // anchorlock 이 없으면 글자가 링크가 아니라 편집 가능 텍스트가 된다
    expect(html).toContain('<w:anchorlock/>');
    expect(html).toContain('</v:roundrect>');
  });

  it('알약 모양은 arcsize 50% 로 나간다 — border-radius 는 Word 가 그리지 않는다', () => {
    expect(render([button])).toContain('arcsize="50%"');
    expect(render([buttonBlock('rectangle')])).toContain('arcsize="0%"');
  });

  it('Outlook 이 아닌 곳에는 평범한 <a> 가 간다 — 둘이 동시에 보이지 않는다', () => {
    const html = render([button]);

    expect(html).toContain('<!--[if !mso]><!-->');
    expect(html).toContain('<!--<![endif]-->');
    expect(html).toContain('<a href="https://example.com/start"');
  });

  it('VML 의 채움색이 운영자가 고른 버튼색이다', () => {
    const html = render([button]);
    expect(html).toContain(`fillcolor="${button.buttonColor}"`);
  });
});

/* ── 다단 ────────────────────────────────────────────────────────────────── */

describe('다단 — 유령 표로 Outlook 에서도 나란히 놓인다', () => {
  function columnsWith(patch: Partial<ColumnsBlock>): EmailBlock {
    const base = createBlock('columns', 'c');
    if (base.blockKind !== 'columns') return base;
    const filled: ColumnsBlock = {
      ...base,
      columns: base.columns.map((column, index) => ({
        ...column,
        blocks: [leaf('text', { content: `칸 ${String(index + 1)}` })],
      })),
    };
    return { ...filled, ...patch };
  }

  it('조건부 주석 안에 유령 표와 칸이 세워진다', () => {
    const html = render([columnsWith({})]);

    expect(html).toContain('<!--[if mso]><table role="presentation"');
    expect(html).toContain('<!--[if mso]><td width=');
    expect(html).toContain('<!--[if mso]></tr></table><![endif]-->');
  });

  /* 칸 폭의 기준은 600 이 아니라 **600 에서 바깥 표의 테두리(좌우 1px)를 뺀 598** 이다 —
   * 그 1px 을 빼지 않으면 칸의 합이 쓸 수 있는 폭보다 넓어져 마지막 칸이 다음 줄로 내려간다
   * (render-html.ts renderColumnsRow 의 innerWidth 머리말). 여백이 0 인 기본값 기준이다. */
  it('1:1 은 본문 폭(테두리 제외)을 반씩 나눈다', () => {
    const html = render([columnsWith({})]);
    expect(html).toContain('width="299"');
  });

  it('2:1 은 폭이 2배 차이로 나뉜다', () => {
    const html = render([columnsWith({ ratio: '2:1' })]);

    expect(html).toContain('width="398"');
    expect(html).toContain('width="199"');
  });

  it('쌓임을 켜면 max-width 로, 끄면 백분율로 나간다 — 미디어 쿼리를 쓰지 않는다', () => {
    const stacking = render([columnsWith({ stackOnMobile: true })]);
    expect(stacking).toContain('width:100%');
    expect(stacking).toContain(`max-width:${cssPx(299)}`);

    const fixed = render([columnsWith({ stackOnMobile: false })]);
    expect(fixed).toContain('width:50.0000%');
    // 쌓지 않는 칸에 max-width 가 남으면 좁은 화면에서 의도와 달리 쌓인다
    expect(fixed).not.toContain(`max-width:${cssPx(299)}`);

    // 어느 쪽도 미디어 쿼리에 기대지 않는다(<style> 을 걷어내는 클라이언트가 있다)
    expect(stacking).not.toContain('@media');
    expect(fixed).not.toContain('@media');
  });

  it('칸 사이에 공백 문자가 없다 — inline-block 사이의 공백은 틈이 된다', () => {
    const html = render([columnsWith({})]);
    expect(html).not.toMatch(/<\/div>\s+<!--\[if mso\]><\/td>/);
    expect(html).not.toMatch(/<!\[endif\]-->\s+<div/);
  });

  it('칸 안의 블록도 자기 여백을 <td> 로 갖는다', () => {
    const html = render([columnsWith({})]);
    expect(html).toContain('칸 1');
    expect(html).toContain('칸 2');
    // 칸 안에도 표가 한 겹 더 선다
    expect((html.match(/<table role="presentation"/g) ?? []).length).toBeGreaterThan(1);
  });
});

/* ── 여백·구분선 ─────────────────────────────────────────────────────────── */

describe('여백과 구분선', () => {
  it('SPACER 는 높이를 가진 빈 칸이다 — font-size 0 이 없으면 클라이언트가 더 벌린다', () => {
    const html = render([leaf('spacer', { height: 40 })]);

    expect(html).toContain('height="40"');
    expect(html).toContain('font-size:0');
    expect(html).toContain('line-height:0');
  });

  it('DIVIDER 는 <hr> 이 아니라 높이를 가진 칸이다 — hr 은 클라이언트마다 다르게 그려진다', () => {
    const html = render([leaf('divider', { height: 2 })]);

    expect(html).not.toContain('<hr');
    expect(html).toContain(`height:${cssPx(2)}`);
  });
});

/* ── 목록·메뉴·소셜·푸터 ─────────────────────────────────────────────────── */

describe('목록·메뉴·소셜·푸터', () => {
  it('LIST 는 ul/ol 로 나가고 들여쓰기를 px 로 못박는다', () => {
    const bulleted = render([
      leaf('list', { items: [{ id: 'i1', text: '첫째' }], ordered: false }),
    ]);
    expect(bulleted).toContain('<ul');
    expect(bulleted).toContain(`padding-left:${cssPx(24)}`);
    expect(bulleted).toContain('첫째');

    const numbered = render([leaf('list', { items: [{ id: 'i1', text: '첫째' }], ordered: true })]);
    expect(numbered).toContain('<ol');
  });

  it('MENU 의 구분자는 aria-hidden 이다 — 스크린리더가 막대기를 읽지 않는다', () => {
    const html = render([
      leaf('menu', {
        items: [
          { id: 'a', label: '홈', url: 'https://example.com' },
          { id: 'b', label: '문의', url: 'https://example.com/contact' },
        ],
        separator: '|',
      }),
    ]);

    expect(html).toContain('<nav');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('홈');
  });

  it('SOCIAL 은 글자 링크로 나간다 — 아이콘 이미지는 차단되면 아무것도 남지 않는다', () => {
    const html = render([
      leaf('social', { links: [{ id: 'l1', platform: 'instagram', url: 'https://ig.example' }] }),
    ]);

    expect(html).toContain('Instagram');
    expect(html).toContain('https://ig.example');
  });

  it('FOOTER 는 전송자 명칭이 먼저, 무료수신거부가 끝이다 (정보통신망법 제50조)', () => {
    const html = render([
      leaf('footer', {
        companyName: '스페이스플래닝',
        unsubscribeUrl: 'https://example.com/u',
      }),
    ]);

    expect(html).toContain('스페이스플래닝');
    // 한글·영문 병기이고 '무료' 임이 드러나야 한다
    expect(html).toContain('무료수신거부');
    expect(html).toContain('Unsubscribe');
    expect(html.indexOf('스페이스플래닝')).toBeLessThan(html.indexOf('무료수신거부'));
  });
});

/* ── 대체 텍스트 ─────────────────────────────────────────────────────────── */

describe('이미지 대체 텍스트', () => {
  it('alt 가 본문에 실린다 — 이미지를 차단하는 수신함에서 이것만 남는다', () => {
    const html = render([leaf('image', { fileName: 'hero.png', alt: '가을 신상 컬렉션' })]);
    expect(html).toContain('가을 신상 컬렉션');
  });

  it('장식용이면 alt 를 싣지 않는다 — 빈 alt 가 정답인 경우다', () => {
    const html = render([leaf('image', { fileName: 'line.png', alt: '무시됨', decorative: true })]);
    expect(html).not.toContain('무시됨');
  });
});

/* ── 인라인 마크다운 ─────────────────────────────────────────────────────── */

describe('마크다운 — 스위치가 실제로 결과를 바꾼다', () => {
  it('꺼져 있으면 별표가 글자 그대로 남는다', () => {
    const html = render([leaf('text', { content: '**굵게**', markdown: false })]);
    expect(html).toContain('**굵게**');
    expect(html).not.toContain('<strong>');
  });

  it('켜면 굵게·기울임·링크가 태그가 된다', () => {
    const html = render([
      leaf('text', { content: '**굵게** *기울임* [문의](https://example.com)', markdown: true }),
    ]);

    expect(html).toContain('<strong>굵게</strong>');
    expect(html).toContain('<em>기울임</em>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('문의');
  });

  it('줄바꿈은 어느 쪽이든 <br> 로 살아난다', () => {
    expect(render([leaf('text', { content: '첫 줄\n둘째 줄' })])).toContain('<br />');
  });

  it('토큰 파서는 캔버스와 렌더러가 함께 쓴다 — 해석이 갈리지 않게', () => {
    const tokens = parseInlineMarkdown('a **b**', true);
    expect(tokens.map((token) => token.kind)).toEqual(['text', 'bold']);
  });
});

/* ── 안전 ────────────────────────────────────────────────────────────────── */

describe('안전 — 본문이 마크업이나 스크립트로 살아나지 않는다', () => {
  it('사용자가 친 태그는 글자로 남는다', () => {
    const html = render([leaf('text', { content: '<img src=x onerror=alert(1)>주의' })]);

    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');
    expect(html).toContain('주의');
  });

  it('javascript: 주소는 링크가 되지 않는다', () => {
    const html = render([leaf('button', { content: '눌러', url: 'javascript:alert(1)' })]);
    expect(html).not.toContain('javascript:');
  });

  it('마크다운 링크의 주소도 같은 관문을 지난다', () => {
    const html = render([leaf('text', { content: '[눌러](javascript:alert(1))', markdown: true })]);
    expect(html).not.toContain('javascript:');
    // 주소가 막혀도 글자는 남는다(내용을 잃지 않는다)
    expect(html).toContain('눌러');
  });

  it('치환변수는 그대로 살아 남는다 — 발송 시점에 치환될 자리다', () => {
    expect(render([leaf('text', { content: '안녕하세요 #{FIRST_NAME}님' })])).toContain(
      '#{FIRST_NAME}',
    );
  });
});

/* ── 평문 변환 (발송 폼의 본문) ───────────────────────────────────────────── */

describe('renderBlocksToPlainText — 발송 폼의 textarea 가 쓴다', () => {
  it('마크업이 한 글자도 나가지 않는다 — 운영자에게 태그를 보이지 않는다', () => {
    const text = renderBlocksToPlainText([
      leaf('heading', { content: '이달의 소식' }),
      leaf('text', { content: '안녕하세요 #{FIRST_NAME}님' }),
      leaf('button', { content: '자세히', url: 'https://example.com' }),
      leaf('list', { items: [{ id: 'i1', text: '첫째' }] }),
      leaf('footer', { companyName: '스페이스플래닝', unsubscribeUrl: 'https://example.com/u' }),
    ]);

    expect(text).not.toContain('<');
    expect(text).not.toContain('>');
    expect(text).not.toContain('&lt;');
  });

  it('문단 경계가 남는다 — 태그만 지워 낱말이 붙어 버리지 않는다', () => {
    const text = renderBlocksToPlainText([
      leaf('heading', { content: '이달의 소식' }),
      leaf('text', { content: '안녕하세요' }),
    ]);

    expect(text).toBe('이달의 소식\n\n안녕하세요');
  });

  it('버튼과 링크는 주소를 살린다 — 평문에서는 그것이 유일한 단서다', () => {
    const text = renderBlocksToPlainText([
      leaf('button', { content: '주문 보기', url: 'https://example.com/orders' }),
    ]);
    expect(text).toBe('주문 보기 (https://example.com/orders)');
  });

  it('목록은 글머리표를, 번호 목록은 번호를 붙인다', () => {
    const items = [
      { id: 'i1', text: '첫째' },
      { id: 'i2', text: '둘째' },
    ];
    expect(renderBlocksToPlainText([leaf('list', { items, ordered: false })])).toBe(
      '- 첫째\n- 둘째',
    );
    expect(renderBlocksToPlainText([leaf('list', { items, ordered: true })])).toBe(
      '1. 첫째\n2. 둘째',
    );
  });

  it('다단은 왼쪽 칸부터 위아래로 편다 — 평문에는 나란함이 없다', () => {
    const base = createBlock('columns', 'c');
    if (base.blockKind !== 'columns') throw new Error('columns');
    const filled: ColumnsBlock = {
      ...base,
      columns: base.columns.map((column, index) => ({
        ...column,
        blocks: [leaf('text', { content: `칸 ${String(index + 1)}` })],
      })),
    };
    expect(renderBlocksToPlainText([filled])).toBe('칸 1\n\n칸 2');
  });

  it('마크다운 표시는 벗기고 글자만 남긴다', () => {
    const text = renderBlocksToPlainText([
      leaf('text', { content: '**굵게** 그리고 [문의](https://example.com)', markdown: true }),
    ]);
    expect(text).toBe('굵게 그리고 문의 (https://example.com)');
  });

  it('장식용 이미지와 여백은 본문에서 통째로 빠진다 — 읽을 것이 없다', () => {
    const text = renderBlocksToPlainText([
      leaf('image', { fileName: 'line.png', decorative: true }),
      leaf('spacer', { height: 40 }),
      leaf('text', { content: '본문' }),
    ]);
    expect(text).toBe('본문');
  });

  it('법적 푸터의 무료수신거부 문구와 주소가 함께 남는다', () => {
    const text = renderBlocksToPlainText([
      leaf('footer', { companyName: '스페이스플래닝', unsubscribeUrl: 'https://example.com/u' }),
    ]);
    expect(text).toContain('스페이스플래닝');
    expect(text).toContain('무료수신거부');
    expect(text).toContain('https://example.com/u');
  });

  it('블록이 없으면 빈 문자열', () => {
    expect(renderBlocksToPlainText([])).toBe('');
  });
});
