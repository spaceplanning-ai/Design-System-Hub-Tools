// EmailBuilder — 블록 편집·이력·변수 삽입의 동작 계약
//
// [왜 제어 컴포넌트를 하네스로 감싸나] 빌더는 값을 소유하지 않는다(value/onChange). onChange 를
// vi.fn() 으로만 받으면 **한 번의 변경까지만** 검증할 수 있다 — 되돌리기처럼 여러 번의 변경이
// 이어지는 흐름은 값이 실제로 되돌아오는 것을 보여야 하므로, 값을 들고 되돌려주는 부모를 세운다.
// 이것이 실제 셸이 하는 일이고, 그래서 이 테스트는 실제 배선을 검증한다.
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { wireDomains } from '../../../../wiring';
import { EmailBuilder } from './EmailBuilder';
import { BLOCK_KIND_LABEL, createBlock, emptyEmailContent, hexColor } from './blocks';
import { INCOMPLETE_MESSAGE } from './BlockView';
import { IMAGE_WIDTH_ERROR } from './InspectPanel';
import type { EmailBlock, EmailBlockKind, EmailTemplateContent, SenderProfile } from '../types';

/**
 * 본문 입력의 접근 가능한 이름.
 * FormField 는 필수 마커(*)를 <label> **안**에 그리므로 이름이 '본문 *' 가 된다 — 정확일치
 * 셀렉터가 깨지지 않게 여기 한 번만 적어 둔다(마커 표기가 바뀌면 이 상수만 고친다).
 */
const CONTENT_LABEL = '본문 *';

const PROFILES: readonly SenderProfile[] = [
  { id: 'brand', name: 'Default brand sender', phoneNumbers: [], emails: ['abc@gmail.com'] },
];

/** 값을 들고 되돌려주는 부모 — 실제 셸의 역할 */
function Harness({
  initial,
  disabled,
}: {
  readonly initial: EmailTemplateContent;
  readonly disabled?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <EmailBuilder
      value={value}
      onChange={setValue}
      senderProfiles={PROFILES}
      senderProfileId="brand"
      {...(disabled === undefined ? {} : { disabled })}
    />
  );
}

function contentWith(blocks: readonly EmailBlock[]): EmailTemplateContent {
  return { ...emptyEmailContent(), blocks };
}

function renderBuilder(blocks: readonly EmailBlock[] = [], disabled?: boolean) {
  return render(
    <Harness initial={contentWith(blocks)} {...(disabled === undefined ? {} : { disabled })} />,
  );
}

/** 캔버스에서 블록을 골라 INSPECT 를 연다 */
async function selectBlock(user: ReturnType<typeof userEvent.setup>, kind: EmailBlockKind) {
  await user.click(screen.getByRole('button', { name: `${BLOCK_KIND_LABEL[kind]} 블록 선택` }));
}

/* ── 블록 추가 · 선택 · 삭제 ─────────────────────────────────────────────── */

describe('블록 스택 — 추가·선택·삭제', () => {
  it('비어 있으면 가운데 + 버튼 하나만 있고, 누르면 종류 피커가 열린다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '블록 추가' }));

    const dialog = screen.getByRole('dialog');
    // 7종이 전부 있어야 한다 — 하나라도 빠지면 만들 수 없는 블록이 생긴다
    for (const label of ['제목', '본문', '버튼', '이미지', '로고', '프로필 이미지', '구분선']) {
      expect(within(dialog).getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('종류를 고르면 블록이 스택에 들어가고 곧바로 선택된다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '제목' }));

    const shell = screen.getByRole('button', { name: '제목 블록 선택' });
    expect(shell.getAttribute('aria-pressed')).toBe('true');
    // 넣자마자 그 블록의 INSPECT 가 열린다
    expect(screen.getByRole('heading', { name: '제목 블록' })).toBeTruthy();
  });

  it('블록을 누르면 선택이 그 블록으로 옮겨간다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a'), createBlock('divider', 'b')]);

    await selectBlock(user, 'heading');
    expect(screen.getByRole('heading', { name: '제목 블록' })).toBeTruthy();

    await selectBlock(user, 'divider');
    expect(screen.getByRole('heading', { name: '구분선 블록' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '제목 블록' })).toBeNull();
  });

  it('선택된 블록의 + 는 그 블록 **뒤에** 새 블록을 넣는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a'), createBlock('divider', 'b')]);

    await selectBlock(user, 'heading');
    await user.click(screen.getByRole('button', { name: '제목 블록 뒤에 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '본문' }));

    const shells = screen
      .getAllByRole('button', { name: /블록 선택$/ })
      .map((node) => node.getAttribute('aria-label'));
    expect(shells).toEqual(['제목 블록 선택', '본문 블록 선택', '구분선 블록 선택']);
  });

  it('Delete 는 선택된 블록을 지우고 선택을 놓는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a'), createBlock('divider', 'b')]);

    await selectBlock(user, 'heading');
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(screen.queryByRole('button', { name: '제목 블록 선택' })).toBeNull();
    expect(screen.getByRole('button', { name: '구분선 블록 선택' })).toBeTruthy();
    // 사라진 블록을 계속 가리키지 않는다
    expect(screen.queryByRole('heading', { name: '제목 블록' })).toBeNull();
  });
});

/* ── INSPECT — 종류마다 다른 필드 ────────────────────────────────────────── */

describe('INSPECT — 블록 종류가 필드를 정한다', () => {
  it('HEADING 은 Level 을 갖고 Font size 를 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a')]);
    await selectBlock(user, 'heading');

    expect(screen.getByRole('radiogroup', { name: '제목 단계' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: '굵기' })).toBeTruthy();
    expect(screen.getByRole('group', { name: '정렬' })).toBeTruthy();
    // 제목의 크기는 Level 이 정한다 — 따로 글자 크기를 두지 않는다
    expect(screen.queryByRole('slider', { name: '글자 크기' })).toBeNull();
  });

  it('TEXT 는 Markdown 스위치와 Font size 슬라이더를 갖는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('text', 'a')]);
    await selectBlock(user, 'text');

    const markdown = screen.getByRole('switch', { name: '마크다운' });
    expect(markdown.getAttribute('aria-checked')).toBe('false');
    await user.click(markdown);
    expect(screen.getByRole('switch', { name: '마크다운' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    expect(screen.getByRole('slider', { name: '글자 크기' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup', { name: '제목 단계' })).toBeNull();
  });

  it('BUTTON 은 URL·Width·Size·Style 을 갖는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('button', 'a')]);
    await selectBlock(user, 'button');

    expect(screen.getByLabelText('연결 주소')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: '너비' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: '크기' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: '모양' })).toBeTruthy();
  });

  it('IMAGE 는 Width/Height 와 두 방향 정렬을 갖는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('image', 'a')]);
    await selectBlock(user, 'image');

    expect(screen.getByLabelText('너비 (px)')).toBeTruthy();
    expect(screen.getByLabelText('높이 (px)')).toBeTruthy();
    expect(screen.getByRole('group', { name: '세로 정렬' })).toBeTruthy();
    expect(screen.getByRole('group', { name: '가로 정렬' })).toBeTruthy();
  });

  it('LOGO 와 AVATAR 는 같은 필드를 갖는다 (Size·Shape·Align)', async () => {
    const user = userEvent.setup();
    const view = renderBuilder([createBlock('logo', 'a')]);
    await selectBlock(user, 'logo');
    expect(screen.getByRole('heading', { name: '로고 블록' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: '크기' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: '모양' })).toBeTruthy();
    view.unmount();

    renderBuilder([createBlock('avatar', 'a')]);
    await selectBlock(user, 'avatar');
    expect(screen.getByRole('heading', { name: '프로필 이미지 블록' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: '크기' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: '모양' })).toBeTruthy();
  });

  it('DIVIDER 는 Height 슬라이더를 갖고 본문 입력을 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('divider', 'a')]);
    await selectBlock(user, 'divider');

    expect(screen.getByRole('slider', { name: '높이' })).toBeTruthy();
    expect(screen.queryByLabelText(CONTENT_LABEL)).toBeNull();
  });

  it('본문 카운터가 입력 길이를 따라간다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a')]);
    await selectBlock(user, 'heading');

    await user.type(screen.getByLabelText(CONTENT_LABEL), 'Welcome');
    expect(screen.getByText('(7 / 10 000자)')).toBeTruthy();
  });
});

/* ── 이미지 폭 검증 ──────────────────────────────────────────────────────── */

describe('IMAGE — Max 800 px', () => {
  it('800 을 넘으면 붉은 안내가 뜨고 입력이 aria-invalid 로 이유를 잇는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('image', 'a')]);
    await selectBlock(user, 'image');

    const width = screen.getByLabelText('너비 (px)');
    expect(width.getAttribute('aria-invalid')).toBe('false');

    await user.clear(width);
    await user.type(width, '900');

    const invalid = screen.getByLabelText('너비 (px)');
    expect(invalid.getAttribute('aria-invalid')).toBe('true');

    // 안내가 실제로 그 입력에 연결돼 있어야 한다 — 짝 없는 설명을 남기지 않는다
    const describedBy = invalid.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    const note = document.getElementById(describedBy ?? '');
    expect(note?.textContent).toBe(IMAGE_WIDTH_ERROR);
  });

  it('800 이하로 되돌리면 안내가 사라진다 (경계값 800 은 유효하다)', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('image', 'a')]);
    await selectBlock(user, 'image');

    const width = screen.getByLabelText('너비 (px)');
    await user.clear(width);
    await user.type(width, '800');

    expect(screen.getByLabelText('너비 (px)').getAttribute('aria-invalid')).toBe('false');
    expect(screen.queryByText(IMAGE_WIDTH_ERROR)).toBeNull();
  });
});

/* ── 되돌리기 / 다시하기 ─────────────────────────────────────────────────── */

describe('undo · redo', () => {
  it('처음에는 둘 다 잠겨 있다', () => {
    renderBuilder();
    expect(screen.getByRole('button', { name: '되돌리기' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: '다시하기' }).hasAttribute('disabled')).toBe(true);
  });

  it('블록을 넣고 되돌리면 사라지고, 다시하면 돌아온다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '구분선' }));
    expect(screen.getByRole('button', { name: '구분선 블록 선택' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.queryByRole('button', { name: '구분선 블록 선택' })).toBeNull();

    await user.click(screen.getByRole('button', { name: '다시하기' }));
    expect(screen.getByRole('button', { name: '구분선 블록 선택' })).toBeTruthy();
  });

  it('되돌린 뒤 새로 바꾸면 다시하기 갈래가 버려진다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '구분선' }));
    await user.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.getByRole('button', { name: '다시하기' }).hasAttribute('disabled')).toBe(false);

    // 새 갈래 — 이제 '다시할' 미래는 유효하지 않다
    await user.click(screen.getByRole('button', { name: '블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '제목' }));
    expect(screen.getByRole('button', { name: '다시하기' }).hasAttribute('disabled')).toBe(true);
  });

  it('선택만 바꾼 것은 이력에 쌓이지 않는다 — 되돌리기가 커서만 움직이면 고장이다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a'), createBlock('divider', 'b')]);

    await selectBlock(user, 'heading');
    await selectBlock(user, 'divider');

    expect(screen.getByRole('button', { name: '되돌리기' }).hasAttribute('disabled')).toBe(true);
  });
});

/* ── 변수 삽입 ───────────────────────────────────────────────────────────── */

/* ── 변수 삽입 ────────────────────────────────────────────────────────────────
 *
 * [무엇이 달라졌나] 예전 목록은 이 화면이 자기 파일(`./variables.ts`)에 들고 있던 목업 예시
 * (City/Gender/Name … · `#{FIRST_NAME}`)였다. 지금 정본은 6개 도메인 카탈로그
 * (`shared/domain/template-variable-catalog.ts`)이고, **그룹은 한국어 도메인 이름**이며 토큰은
 * `#{namespace.field}` 영문 점 표기다. 고르는 층(한국어)과 꽂히는 층(영문)이 갈렸다.
 *
 * [왜 wireDomains() 를 부르는가] 카탈로그는 `wiring.ts` 가 꽂는다. 페이지 단위 테스트는 App 을
 * 렌더하지 않으므로 배선이 걸리지 않고, 그 상태에서는 조회기가 '모른다(null)' 를 준다 —
 * 목록 대신 안내 문구가 그려진다. 배선을 걸어야 이 테스트가 미배선 상태가 아니라 제품을 본다
 * (wiring.ts 머리말의 '테스트가 그 경로를 밟을 때도 필요하다' 와 같은 이유). */
describe('변수 삽입 — 한국어로 고르고 영문 토큰이 꽂힌다', () => {
  beforeEach(() => {
    wireDomains();
  });

  it('도메인 그룹을 펼쳐 항목을 누르면 선택된 블록 본문에 토큰이 꽂힌다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a')]);
    await selectBlock(user, 'heading');
    await user.type(screen.getByLabelText(CONTENT_LABEL), 'Hi ');

    await user.click(screen.getByRole('button', { name: '변수' }));
    // '회원' 은 도메인 그룹이라 눌러도 삽입되지 않고 펼쳐진다
    await user.click(screen.getByRole('button', { name: /^회원 변수 그룹/ }));
    // 항목의 접근 가능한 이름은 '도메인 라벨 삽입 — 예시 값' 이다(TemplateVariablePicker)
    await user.click(screen.getByRole('button', { name: /회원 이름 삽입/ }));

    // 커서는 타이핑 직후 'Hi ' 끝에 있으므로 그 자리에 꽂힌다
    expect(screen.getByLabelText(CONTENT_LABEL)).toHaveProperty('value', 'Hi #{member.name}');
  });

  it('커서 자리에 꽂는다 — 끝에 붙이지 않는다', async () => {
    // 변수는 대개 문장 가운데에 들어간다('#{member.name} 님'). 끝에만 붙이면 운영자가 매번
    // 잘라내어 옮겨야 한다(_shared/caret.ts 머리말).
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a')]);
    await selectBlock(user, 'heading');

    const field = screen.getByLabelText(CONTENT_LABEL);
    await user.type(field, '님 안녕하세요');
    // 커서를 맨 앞으로 옮긴다
    if (!(field instanceof HTMLTextAreaElement)) throw new Error('본문은 textarea 다');
    field.setSelectionRange(0, 0);

    await user.click(screen.getByRole('button', { name: '변수' }));
    await user.click(screen.getByRole('button', { name: /^회원 변수 그룹/ }));
    await user.click(screen.getByRole('button', { name: /회원 이름 삽입/ }));

    expect(field).toHaveProperty('value', '#{member.name}님 안녕하세요');
  });

  it('검색은 한국어 라벨로도 영문 토큰으로도 걸러낸다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('text', 'a')]);
    await selectBlock(user, 'text');

    await user.click(screen.getByRole('button', { name: '변수' }));
    const search = screen.getByLabelText('변수 검색');

    // 한국어로 — 고르는 사람은 낱말로 찾는다
    await user.type(search, '쿠폰 코드');
    expect(screen.getByRole('button', { name: /쿠폰 코드 삽입/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /이름 삽입/ })).toBeNull();

    // 영문 토큰으로 — 본문을 검수하는 사람은 토큰을 보고 온다
    await user.clear(search);
    await user.type(search, 'quote.totalAmount');
    expect(screen.getByRole('button', { name: /견적 합계금액 삽입/ })).toBeTruthy();
  });

  it('본문이 없는 블록(구분선)에서는 아무 일도 일어나지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('divider', 'a')]);
    await selectBlock(user, 'divider');

    await user.click(screen.getByRole('button', { name: '변수' }));
    await user.click(screen.getByRole('button', { name: /^회원 변수 그룹/ }));
    await user.click(screen.getByRole('button', { name: /회원 이름 삽입/ }));

    // 값이 바뀌지 않았으므로 되돌릴 것도 없다
    expect(screen.getByRole('button', { name: '되돌리기' }).hasAttribute('disabled')).toBe(true);
  });
});

/* ── 미완성 블록 ─────────────────────────────────────────────────────────── */

describe('미완성 블록 — 빈 칸으로 두지 않는다', () => {
  it('파일이 없는 아바타는 자리표시 도형과 붉은 안내를 함께 그린다', () => {
    renderBuilder([createBlock('avatar', 'a')]);
    expect(screen.getByText(INCOMPLETE_MESSAGE)).toBeTruthy();
  });

  it('파일명을 채우면 안내가 사라진다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('logo', 'a')]);
    await selectBlock(user, 'logo');

    await user.type(screen.getByLabelText('파일명'), 'logo.png');
    expect(screen.queryByText(INCOMPLETE_MESSAGE)).toBeNull();
  });
});

/* ── 프리셋 ──────────────────────────────────────────────────────────────── */

describe('프리셋 레일', () => {
  it('프리셋을 고르면 블록 스택이 통째로 갈린다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(screen.getAllByRole('button', { name: /블록 선택$/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '회원가입' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });

  it('Blank 를 고르면 스택이 빈다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '회원가입' }));
    await user.click(screen.getByRole('button', { name: '빈 템플릿' }));

    expect(screen.queryAllByRole('button', { name: /블록 선택$/ })).toHaveLength(0);
    expect(screen.getByRole('button', { name: '블록 추가' })).toBeTruthy();
  });

  it('Blank 에서는 STYLE 첫 라벨이 Backdrop Color 다 (그 밖에는 Background Color)', async () => {
    const user = userEvent.setup();
    renderBuilder();

    expect(screen.getByLabelText('바깥 배경색')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByLabelText('배경색')).toBeTruthy();
    expect(screen.queryByLabelText('바깥 배경색')).toBeNull();
  });
});

/* ── 편집 / 미리보기 ─────────────────────────────────────────────────────── */

describe('edit · preview 탭', () => {
  it('미리보기에서는 발신 카드가 두 줄로 접히고 선택 윤곽이 사라진다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a')]);

    expect(screen.getByLabelText('제목')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: '미리보기' }));

    expect(screen.queryByLabelText('제목')).toBeNull();
    expect(screen.getByText('발신')).toBeTruthy();
    // 미리보기에서는 블록을 고를 수 없다
    expect(screen.queryByRole('button', { name: '제목 블록 선택' })).toBeNull();
  });
});

/* ── disabled ────────────────────────────────────────────────────────────── */

describe('disabled', () => {
  it('잠기면 캔버스와 툴바의 조작이 모두 막힌다', () => {
    renderBuilder([createBlock('heading', 'a')], true);

    expect(screen.getByRole('button', { name: '제목 블록 선택' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: '변수' }).hasAttribute('disabled')).toBe(true);
  });
});

/* ── STYLE 탭 ────────────────────────────────────────────────────────────── */

describe('STYLE — 캔버스 전역 스타일', () => {
  it('hex 를 고쳐 넣으면 값이 반영된다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const field = screen.getByLabelText('바깥 배경색');
    await user.clear(field);
    await user.type(field, hexColor('102030'));

    expect(field).toHaveProperty('value', hexColor('102030'));
    // 값이 바뀌었으므로 되돌릴 수 있다
    expect(screen.getByRole('button', { name: '되돌리기' }).hasAttribute('disabled')).toBe(false);
  });
});
