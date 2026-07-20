// 메시지 템플릿 상세 — 화면이 그리는 글자의 계약
//
// ─────────────────────────────────────────────────────────────────────────────
// [무엇을 지키나 — 둘이다]
//
// 1) **상세에는 편집기 전용 크롬이 새어 나오지 않는다.** 두 화면은 카드를 공유하므로(발신 프로필·
//    미리보기) 편집기가 그리는 입력용 크롬('내용 입력', '이미지 첨부', '초안 저장' …)이 읽기 전용
//    화면에 딸려 오기 쉽다. 새어 나와도 아무것도 깨지지 않고 화면만 조용히 이상해진다.
//
//    [예전에는 이 단언이 영문 목록이었다] 편집기가 영문이던 시절에는 같은 규칙을 '영문이 보이면
//    안 된다' 로 적었다. 편집기 문구가 한글로 넘어오면서 그 목록은 **언제나 통과하는 단언**이 됐다
//    (한글 화면에서 목업 원문 `Save as draft` 를 찾으면 당연히 없다 — 지금 그 버튼은 '초안 저장'
//    이다). 잡으려던 회귀는 언어가 아니라 '편집기 크롬이 상세로 샌다' 였으므로, 목록을 지금의
//    한글 라벨로 바꿔 그 회귀를 다시 잡게 했다.
//    라벨은 copy.ts 에서 **가져다 쓴다** — 손으로 베끼면 문구를 고칠 때 이 단언만 옛 글자를 찾는다.
//
// 2) **이메일에는 발신번호가 없다.** 카드가 언제나 번호 칸을 그리던 시절, 이메일 상세는 전화번호
//    줄을 띄웠다. senderPhone 은 TextTemplateContent 의 것이고 이메일은 senderEmail 을 갖는다
//    (types.ts). 이 회귀는 타입 검사에 걸리지 않는다 — 호출부가 빈 문자열을 넘기면 그만이기
//    때문이다. 그래서 '그려서는 안 되는 것' 을 단언으로 남긴다.
//
// [왜 카드가 아니라 페이지를 렌더하나] 버그의 자리는 카드였지만 **틀린 값을 고른 것은 페이지**였다
// (`content.kind === 'text' ? senderPhone : ''`). 카드만 단위로 세우면 그 배선을 아무도 보지 않는다.
// 픽스처·어댑터·store 는 전부 진짜를 쓴다 — 이 화면이 실제로 무엇을 그리는지가 질문이다.
// ─────────────────────────────────────────────────────────────────────────────
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ToastProvider } from '../../../shared/ui';
import {
  ACTION_PUBLISH,
  ACTION_SAVE_DRAFT,
  LABEL_ATTACH_IMAGE,
  LABEL_CHOOSE_IMAGE,
  LABEL_CONTENT_INPUT,
  LABEL_FILE_NAME,
  LABEL_SUBJECT,
  PREVIEW_TITLE,
  SENDER_CARD_COPY,
} from './copy';
import MessageTemplateDetailPage from './MessageTemplateDetailPage';
import { getMessageTemplate } from './store';
import { TEMPLATE_STATUS_LABEL } from './types';

/** 픽스처의 이메일·문자 템플릿 (store.ts) */
const EMAIL_ID = 'mt-email-active';
const TEXT_ID = 'mt-text-active';

async function renderDetail(id: string): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/marketing/templates/${id}`]}>
          <Routes>
            <Route path="/marketing/templates/:id" element={<MessageTemplateDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );

  // 도착 전에는 화면이 비어 있다 — 이름이 뜨는 것이 '그려졌다' 의 신호다
  await screen.findByRole('heading', { name: getMessageTemplate(id).name });
}

describe('상세는 한글로 그린다', () => {
  it('상태 이력 표의 라벨이 전부 한글이다', async () => {
    await renderDetail(TEXT_ID);

    for (const label of [
      '상태 이력',
      '템플릿 상태',
      '템플릿 종류',
      '문자 발송사',
      '등록자',
      '등록일시',
      '최종 수정자',
      '최종 수정일시',
    ]) {
      expect(screen.getByText(label)).not.toBeNull();
    }
  });

  it('편집기 전용 크롬은 상세로 새어 나오지 않는다', async () => {
    await renderDetail(TEXT_ID);

    // 입력을 전제로 하는 라벨들 — 읽기 전용 화면에는 설 자리가 없다
    for (const chrome of [
      LABEL_CONTENT_INPUT,
      LABEL_SUBJECT,
      LABEL_ATTACH_IMAGE,
      LABEL_FILE_NAME,
      LABEL_CHOOSE_IMAGE,
      ACTION_SAVE_DRAFT,
      ACTION_PUBLISH,
    ]) {
      expect(screen.queryByText(chrome)).toBeNull();
    }
  });

  it('공유 카드는 상세에서도 같은 한글 라벨을 그린다', async () => {
    await renderDetail(TEXT_ID);

    // 편집기와 상세가 같은 컴포넌트를 쓰고 이제 글자도 한 벌이다(copy.ts) — 그 한 벌이 실제로
    // 상세에 그려지는지 본다. 위 단언이 '없음' 만 보므로, 카드가 통째로 사라져도 통과할 수 있다.
    expect(screen.getByText(PREVIEW_TITLE)).not.toBeNull();
    // 카드 제목과 첫 칸의 라벨이 같은 낱말이라 두 번 뜬다 — 개수가 아니라 '그려졌다' 가 질문이다
    expect(screen.getAllByText(SENDER_CARD_COPY.title).length).toBeGreaterThan(0);
  });

  /*
   * [이 단언이 지키는 것은 언어가 아니라 '상태가 글자로 보인다' 는 것이다]
   *
   * 예전 이름은 '상태 배지의 값은 영문으로 남는다' 였고 `getByText('Active')` 를 세웠다. 그 '영문'
   * 은 지킬 값이 아니라 그때 라벨이 마침 영문이었다는 사실일 뿐이다 — 배지가 지켜야 하는 것은
   * **`status` 가 색으로만 전달되지 않는다**는 것이다(색만으로 전달하면 색각 이상 사용자에게는
   * 세 상태가 같아 보인다. StatusBadge 가 tone 과 label 을 함께 받는 이유다).
   *
   * 그래서 글자를 박지 않고 `TEMPLATE_STATUS_LABEL` 에서 읽는다 — 라벨을 또 바꿔도 이 단언은
   * 따라온다. 픽스처의 상태도 하드코딩하지 않는다: 'active 픽스처' 라는 전제가 조용히 틀리면
   * 엉뚱한 라벨을 찾으며 실패하는 대신, 지금 그 템플릿의 상태를 그대로 물어본다.
   */
  it('상태 배지는 그 템플릿의 상태를 글자로 그린다 (색으로만 전달하지 않는다)', async () => {
    await renderDetail(TEXT_ID);

    const { status } = getMessageTemplate(TEXT_ID);
    expect(screen.getByText(TEMPLATE_STATUS_LABEL[status])).not.toBeNull();
  });

  it('제목 위 눈썹은 `이메일 템플릿` 이다', async () => {
    await renderDetail(EMAIL_ID);

    expect(screen.getByText('이메일 템플릿')).not.toBeNull();
  });
});

/** 라벨로 찾은 select 의 현재 값 — `as` 없이 좁힌다 */
function selectValueOf(label: RegExp): string {
  const node = screen.getByLabelText(label);
  if (!(node instanceof HTMLSelectElement)) throw new Error('select 가 아니다');
  return node.value;
}

describe('발신 프로필 카드는 종류에 맞는 칸을 그린다', () => {
  it('이메일 상세는 발신 이메일을 그리고 발신번호를 그리지 않는다', async () => {
    await renderDetail(EMAIL_ID);

    // 라벨은 FormField 가 필수 마커(*)를 <label> 안에 그리므로 부분일치로 찾는다
    expect(screen.getByLabelText(/발신 이메일/u)).not.toBeNull();
    expect(screen.queryByLabelText(/발신번호/u)).toBeNull();
    expect(screen.queryByText(/발신번호/u)).toBeNull();

    // 그리고 값은 이메일 템플릿이 실제로 들고 있는 주소다 (지어낸 필드가 아니다)
    const content = getMessageTemplate(EMAIL_ID).content;
    if (content.kind !== 'email') throw new Error('픽스처가 이메일이 아니다');
    expect(selectValueOf(/발신 이메일/u)).toBe(content.senderEmail);
  });

  it('문자 상세는 발신번호를 그리고 발신 이메일을 그리지 않는다', async () => {
    await renderDetail(TEXT_ID);

    expect(screen.getByLabelText(/발신번호/u)).not.toBeNull();
    expect(screen.queryByLabelText(/발신 이메일/u)).toBeNull();

    const content = getMessageTemplate(TEXT_ID).content;
    if (content.kind !== 'text') throw new Error('픽스처가 문자가 아니다');
    expect(selectValueOf(/발신번호/u)).toBe(content.senderPhone);
  });
});
