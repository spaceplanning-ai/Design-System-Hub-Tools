// EmailBuilder — 새로 들어온 블록 종류들의 동작 계약
//
// [왜 EmailBuilder.test.tsx 와 파일을 나눴나] 그쪽은 '빌더라는 기계' 의 계약(값 소유·이력·변수
// 삽입)을 검증한다. 여기는 **블록 종류가 늘어난 것**을 검증한다 — 종류가 또 늘면 이 파일만
// 커지고 저쪽은 그대로다. 한 파일에 합치면 무엇이 무엇을 지키는지 읽어낼 수 없게 된다.
//
// [왜 종류마다 '없는 필드' 까지 단언하나] INSPECT 는 blockKind 로 전수 분기한다. 분기를 잘못
// 이어 붙이면 **다른 종류의 폼이 그려지는데도 화면은 그럴듯해 보인다** — 있는 필드만 확인하면
// 그 사고를 잡지 못한다. 그래서 각 종류마다 '이웃 종류의 대표 필드가 없다' 를 함께 단언한다.
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { EmailBuilder } from './EmailBuilder';
import { BLOCK_KIND_LABEL, createBlock, emptyEmailContent } from './blocks';
import { INCOMPLETE_MESSAGE } from './BlockView';
import type { EmailBlock, EmailBlockKind, EmailTemplateContent, SenderProfile } from '../types';

const CONTENT_LABEL = '본문 *';

const PROFILES: readonly SenderProfile[] = [
  { id: 'brand', name: 'Default brand sender', phoneNumbers: [], emails: ['abc@gmail.com'] },
];

function Harness({ initial }: { readonly initial: EmailTemplateContent }) {
  const [value, setValue] = useState(initial);
  return (
    <EmailBuilder
      value={value}
      onChange={setValue}
      senderProfiles={PROFILES}
      senderProfileId="brand"
    />
  );
}

function renderBuilder(blocks: readonly EmailBlock[] = []) {
  return render(<Harness initial={{ ...emptyEmailContent(), blocks }} />);
}

/** 캔버스에서 블록을 골라 INSPECT 를 연다 */
async function selectBlock(user: ReturnType<typeof userEvent.setup>, kind: EmailBlockKind) {
  await user.click(screen.getByRole('button', { name: `${BLOCK_KIND_LABEL[kind]} 블록 선택` }));
}

/** 피커를 열어 한 종류를 넣는다 */
async function addBlock(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('button', { name: '블록 추가' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: label }));
}

const NEW_KINDS = [
  { label: '다단', kind: 'columns', heading: '다단 블록' },
  { label: '여백', kind: 'spacer', heading: '여백 블록' },
  { label: '소셜 링크', kind: 'social', heading: '소셜 링크 블록' },
  { label: '메뉴', kind: 'menu', heading: '메뉴 블록' },
  { label: '비디오', kind: 'video', heading: '비디오 블록' },
  { label: '목록', kind: 'list', heading: '목록 블록' },
] as const;

/* ── 넣기·고르기·지우기·되돌리기 ────────────────────────────────────────── */

describe('새 블록 종류 — 넣기·고르기·지우기·되돌리기', () => {
  it('피커가 새 종류를 전부 내준다', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('button', { name: '블록 추가' }));
    const dialog = screen.getByRole('dialog');
    const labels = ['다단', '여백', '소셜 링크', '메뉴', '비디오', '목록', '법적 푸터'];
    for (const label of labels) {
      expect(within(dialog).getByRole('button', { name: label })).toBeTruthy();
    }
  });

  for (const { label, kind, heading } of NEW_KINDS) {
    it(`${label} — 넣으면 선택되고, 지우면 사라지고, 되돌리면 돌아온다`, async () => {
      const user = userEvent.setup();
      renderBuilder();

      await addBlock(user, label);
      const shell = screen.getByRole('button', { name: `${BLOCK_KIND_LABEL[kind]} 블록 선택` });
      expect(shell.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('heading', { name: heading })).toBeTruthy();

      await user.click(screen.getByRole('button', { name: '삭제' }));
      expect(
        screen.queryByRole('button', { name: `${BLOCK_KIND_LABEL[kind]} 블록 선택` }),
      ).toBeNull();

      await user.click(screen.getByRole('button', { name: '되돌리기' }));
      expect(
        screen.getByRole('button', { name: `${BLOCK_KIND_LABEL[kind]} 블록 선택` }),
      ).toBeTruthy();

      await user.click(screen.getByRole('button', { name: '다시하기' }));
      expect(
        screen.queryByRole('button', { name: `${BLOCK_KIND_LABEL[kind]} 블록 선택` }),
      ).toBeNull();
    });
  }
});

/* ── INSPECT 필드 묶음 ───────────────────────────────────────────────────── */

describe('INSPECT — 새 블록의 필드 묶음', () => {
  it('SPACER 는 Height 만 갖고 글자 관련 필드를 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('spacer', 'a')]);
    await selectBlock(user, 'spacer');

    expect(screen.getByRole('slider', { name: '높이' })).toBeTruthy();
    expect(screen.getByLabelText('배경색')).toBeTruthy();
    // 여백에는 글자가 없다
    expect(screen.queryByRole('slider', { name: '글자 크기' })).toBeNull();
    expect(screen.queryByRole('group', { name: '정렬' })).toBeNull();
  });

  it('SOCIAL 은 링크 줄과 채널 선택을 갖고, HEADING 의 Level 을 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('social', 'a')]);
    await selectBlock(user, 'social');

    expect(screen.getByLabelText('링크 1 채널')).toBeTruthy();
    expect(screen.getByLabelText('링크 1 주소')).toBeTruthy();
    expect(screen.getByRole('button', { name: '소셜 링크 추가' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup', { name: '제목 단계' })).toBeNull();
  });

  it('SOCIAL — 링크를 더하고 지울 수 있다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('social', 'a')]);
    await selectBlock(user, 'social');

    await user.click(screen.getByRole('button', { name: '소셜 링크 추가' }));
    expect(screen.getByLabelText('링크 3 주소')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '링크 3 삭제' }));
    expect(screen.queryByLabelText('링크 3 주소')).toBeNull();
  });

  it('MENU 는 Separator 를 갖고, SOCIAL 의 채널 선택을 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('menu', 'a')]);
    await selectBlock(user, 'menu');

    expect(screen.getByLabelText('구분 문자')).toBeTruthy();
    expect(screen.getByLabelText('항목 1 이름')).toBeTruthy();
    expect(screen.queryByLabelText('링크 1 채널')).toBeNull();
  });

  it('VIDEO 는 Video URL 과 Alt text 를 갖고, TEXT 의 Markdown 스위치를 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('video', 'a')]);
    await selectBlock(user, 'video');

    expect(screen.getByLabelText('영상 주소')).toBeTruthy();
    expect(screen.getByLabelText('대체 텍스트')).toBeTruthy();
    expect(screen.queryByRole('switch', { name: '마크다운' })).toBeNull();
  });

  it('LIST 는 List style 세그먼트와 항목을 갖고, Video URL 을 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('list', 'a')]);
    await selectBlock(user, 'list');

    expect(screen.getByRole('radiogroup', { name: '목록 스타일' })).toBeTruthy();
    expect(screen.getByLabelText('항목 1')).toBeTruthy();
    expect(screen.queryByLabelText('영상 주소')).toBeNull();
  });

  it('COLUMNS 는 Layout·Stack on mobile·Gap 을 갖고, 글자 필드를 갖지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'a')]);
    await selectBlock(user, 'columns');

    expect(screen.getByRole('radiogroup', { name: '배치' })).toBeTruthy();
    // 쌓임은 '켜고 끄는 것' 이라 switch 다
    expect(screen.getByRole('switch', { name: '좁은 화면에서 쌓기' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: '칸 간격' })).toBeTruthy();
    // 행 자체에는 글자가 없다 — 글자는 칸 안의 블록이 갖는다
    expect(screen.queryByRole('slider', { name: '글자 크기' })).toBeNull();
    expect(screen.queryByLabelText('글자색')).toBeNull();
  });

  it('IMAGE 는 Alt text 를 갖고, 장식용으로 표시하면 묻지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('image', 'a')]);
    await selectBlock(user, 'image');

    expect(screen.getByLabelText('대체 텍스트')).toBeTruthy();

    await user.click(screen.getByRole('switch', { name: '장식용 이미지' }));
    // 장식용은 빈 alt 가 정답이다 — 채우라고 요구하지 않는다
    expect(screen.queryByLabelText('대체 텍스트')).toBeNull();
  });
});

/* ── 법적 푸터 ───────────────────────────────────────────────────────────── */

describe('법적 푸터 — 지울 수 없다 (정보통신망법 제50조)', () => {
  it('선택해도 Delete 버튼이 나오지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('heading', 'a'), createBlock('footer', 'f')]);

    await selectBlock(user, 'footer');
    expect(screen.getByRole('heading', { name: '법적 푸터 블록' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull();

    // 다른 블록은 여전히 지울 수 있다 — 푸터만 예외라는 것을 대조로 보인다
    await selectBlock(user, 'heading');
    expect(screen.getByRole('button', { name: '삭제' })).toBeTruthy();
  });

  it('이미 푸터가 있으면 피커가 두 번째 푸터를 내주지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('footer', 'f')]);

    await selectBlock(user, 'footer');
    await user.click(screen.getByRole('button', { name: '법적 푸터 블록 뒤에 추가' }));
    expect(
      within(screen.getByRole('dialog')).queryByRole('button', { name: '법적 푸터' }),
    ).toBeNull();
  });

  it('회사명과 수신거부 URL 이 비면 미완성으로 표시된다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('footer', 'f')]);

    expect(screen.getByText(INCOMPLETE_MESSAGE)).toBeTruthy();

    await selectBlock(user, 'footer');
    await user.type(screen.getByLabelText('회사명'), '스페이스플래닝');
    await user.type(screen.getByLabelText('수신거부 주소'), 'https://example.com/u');

    expect(screen.queryByText(INCOMPLETE_MESSAGE)).toBeNull();
  });
});

/* ── 컬럼 — 중첩 선택 ────────────────────────────────────────────────────── */

describe('컬럼 — 칸 안의 블록을 따로 고른다', () => {
  it('빈 칸의 + 는 그 칸 안에 블록을 넣는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'c')]);

    await user.click(screen.getByRole('button', { name: '1번째 칸에 블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '본문' }));

    expect(screen.getByRole('button', { name: '본문 블록 선택' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '본문 블록' })).toBeTruthy();
  });

  it('칸 안의 블록을 고르면 행이 아니라 그 블록의 INSPECT 가 열린다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'c')]);

    await user.click(screen.getByRole('button', { name: '1번째 칸에 블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '제목' }));

    await selectBlock(user, 'columns');
    expect(screen.getByRole('heading', { name: '다단 블록' })).toBeTruthy();

    await selectBlock(user, 'heading');
    expect(screen.getByRole('heading', { name: '제목 블록' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '다단 블록' })).toBeNull();
  });

  it('칸 안의 블록을 고쳐도 되돌릴 수 있다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'c')]);

    await user.click(screen.getByRole('button', { name: '2번째 칸에 블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '본문' }));

    await user.type(screen.getByLabelText(CONTENT_LABEL), '안녕');
    expect(screen.getByLabelText(CONTENT_LABEL)).toHaveProperty('value', '안녕');

    await user.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.getByLabelText(CONTENT_LABEL)).toHaveProperty('value', '안');
  });

  it('칸 안에는 컬럼도 법적 푸터도 넣을 수 없다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'c')]);

    await user.click(screen.getByRole('button', { name: '1번째 칸에 블록 추가' }));
    const dialog = screen.getByRole('dialog');
    // 무한 중첩을 애초에 막는다
    expect(within(dialog).queryByRole('button', { name: '다단' })).toBeNull();
    // 법적 푸터는 한 칸 안에 숨으면 안 된다
    expect(within(dialog).queryByRole('button', { name: '법적 푸터' })).toBeNull();
  });

  it('선택 덮개는 버튼 안에 버튼을 만들지 않는다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'c')]);

    await user.click(screen.getByRole('button', { name: '1번째 칸에 블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '본문' }));

    // 중첩된 <button> 이 하나라도 있으면 브라우저가 파싱 단계에서 DOM 을 재구성해 선택이 어긋난다
    for (const node of Array.from(document.querySelectorAll('button'))) {
      expect(node.querySelector('button')).toBeNull();
    }
  });

  it('비율을 줄여도 내용을 잃지 않는다 — 넘친 칸은 마지막 칸으로 옮겨진다', async () => {
    const user = userEvent.setup();
    renderBuilder([createBlock('columns', 'c')]);

    await selectBlock(user, 'columns');
    await user.click(screen.getByRole('radio', { name: '1:1:1' }));

    // 3단이 됐으므로 세 번째 칸이 생긴다
    await user.click(screen.getByRole('button', { name: '3번째 칸에 블록 추가' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '본문' }));
    expect(screen.getByRole('button', { name: '본문 블록 선택' })).toBeTruthy();

    // 다시 2단으로 — 세 번째 칸의 블록이 사라지면 안 된다
    await selectBlock(user, 'columns');
    await user.click(screen.getByRole('radio', { name: '1:1' }));
    expect(screen.getByRole('button', { name: '본문 블록 선택' })).toBeTruthy();
  });
});
