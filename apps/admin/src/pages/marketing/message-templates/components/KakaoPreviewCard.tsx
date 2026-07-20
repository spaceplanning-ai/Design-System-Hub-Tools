// 카카오 템플릿 미리보기 카드 — 알림톡 · 브랜드 메시지 (편집기 우측 · 상세 우측이 공유)
//
// [프레임은 만들지 않는다] 옐로 채널 띠·대화방 배경·말풍선·버튼 영역은 marketing/_shared/preview 의
// KakaoFrame 이 이미 갖고 있고 발송 템플릿 화면이 같은 것을 쓴다. 여기서 두 번째 카카오 목업을
// 그리면 같은 매체의 목업이 앱에 두 벌 생긴다 (TextPreviewCard 가 PhoneFrame 에 대해 그런 것과 같다).
//
// [치환변수를 치환하지 않는다] 이 화면의 규칙이다 — `#{이름}` 을 '홍길동' 으로 덮으면 '변수명 오타'
// 와 '정상' 이 미리보기에서 똑같아 보인다(VariableText 머리말). 카카오 템플릿은 변수 예시값을 따로
// 들고 있지만 그것은 **심사 제출용**이지 이 미리보기의 용도가 아니다.
//
// [두 채널을 한 카드가 그린다] 다른 것은 띠의 태그 글자와 말풍선 머리(강조표기 / 이미지)뿐이다.
// 카드를 포크하면 버튼 영역·스크롤 상한 같은 공통이 두 벌이 된다 — `kind` 로 갈리는 곳만 가른다.
import type { CSSProperties } from 'react';

import { Card, CardTitle } from '../../../../shared/ui';
import { KakaoFrame } from '../../_shared/preview/KakaoFrame';
import { PREVIEW_TITLE } from '../copy';
import {
  AC_BUTTON_NAME,
  ALIMTALK_CHANNEL_ADD_GUIDE,
  hasChannelAddGuide,
  hasExtraInfo,
  requiresImage,
} from '../kakao';
import type { KakaoButton, KakaoTemplateContent } from '../kakao';
import { accentTitleStyle } from '../styles';
import { VariableText } from './VariableText';

/** 긴 본문이 페이지를 끝없이 늘리지 않게 한다 — TextPreviewCard 와 같은 상한(같은 자리에 걸린다) */
const scrollStyle: CSSProperties = {
  maxHeight: 'calc(var(--tds-space-10) * 9)',
  overflowY: 'auto',
  overflowX: 'hidden',
  minWidth: 0,
};

/**
 * 버튼이 수신자에게 어떤 글자로 보이는가.
 * 채널추가(AC)는 이름이 카카오 고정이라 우리가 든 값이 무엇이든 이 글자로 나간다 — 미리보기가
 * 편집기의 값을 그대로 비추면 '고칠 수 있는 것' 처럼 보인다(kakao.ts AC_BUTTON_NAME).
 */
function buttonLabelOf(button: KakaoButton): string {
  return button.type === 'AC' ? AC_BUTTON_NAME : button.name;
}

interface KakaoPreviewCardProps {
  readonly content: KakaoTemplateContent;
  /** 옐로 띠에 뜰 채널명 — id 를 이름으로 푸는 것은 호출부(store)의 일이다 */
  readonly channelName: string;
}

export function KakaoPreviewCard({ content, channelName }: KakaoPreviewCardProps) {
  const buttons = content.buttons.map(buttonLabelOf);

  return (
    <Card>
      <CardTitle>
        <span style={accentTitleStyle}>{PREVIEW_TITLE}</span>
      </CardTitle>
      <div style={scrollStyle}>
        {content.kind === 'alimtalk' ? (
          <KakaoFrame
            tag="알림톡"
            channelName={channelName}
            /* ── 강조 유형이 머리를 정한다 ──────────────────────────────────
               유형이 쓰지 않는 값은 **넘기지 않는다**. 편집기는 유형을 되돌려도 값을 지우지 않으므로
               (값은 남기고 표시만 유형이 정한다), 여기서 유형을 보지 않으면 이미지형 미리보기에
               예전 강조 제목이 함께 뜬다 — 저장될 모습과 어긋난 미리보기가 된다. */
            {...(content.emphasisType === 'title' &&
              content.emphasisTitle.trim() !== '' && {
                emphasis: <VariableText body={content.emphasisTitle} />,
              })}
            {...(content.emphasisType === 'title' &&
              content.emphasisSubtitle.trim() !== '' && {
                subtitle: <VariableText body={content.emphasisSubtitle} />,
              })}
            {...(content.emphasisType === 'image' &&
              content.emphasisImageFileName.trim() !== '' && {
                imageFileName: content.emphasisImageFileName,
              })}
            {...(content.emphasisType === 'item-list' && {
              itemHeader: content.itemHeader,
              items: content.items.map((item) => ({
                name: item.name,
                description: <VariableText body={item.description} />,
              })),
              ...(content.itemHighlightTitle.trim() !== '' && {
                highlightTitle: <VariableText body={content.itemHighlightTitle} />,
              }),
              ...(content.itemHighlightDescription.trim() !== '' && {
                highlightDescription: <VariableText body={content.itemHighlightDescription} />,
              }),
            })}
            /* 부가정보·채널추가 안내도 **메시지 유형이 정한다** — 유형을 되돌리면 영역이 사라져야
               한다. 채널추가 안내는 문구가 카카오 고정이라 값이 아니라 상수를 그린다. */
            {...(hasExtraInfo(content.messageType) && { extraInfo: content.extraInfo })}
            {...(hasChannelAddGuide(content.messageType) && {
              channelAddGuide: ALIMTALK_CHANNEL_ADD_GUIDE,
            })}
            body={<VariableText body={content.body} />}
            buttons={buttons}
          />
        ) : (
          <KakaoFrame
            tag="브랜드 메시지"
            channelName={channelName}
            /* 이미지는 **유형이 요구할 때만** 그린다 — 카드형에서는 이미지가 항목·카드마다 딸려
               있어서 말풍선 머리에는 붙지 않는다(kakao.ts requiresImage 머리말). */
            {...(requiresImage(content.bodyType) &&
              content.imageFileName.trim() !== '' && {
                imageFileName: content.imageFileName,
              })}
            {...(content.bodyType === 'wide-image' && { wideImage: true })}
            {...(content.bodyType === 'wide-list' && {
              listItems: content.listItems.map((item) => ({
                title: <VariableText body={item.title} />,
                imageFileName: item.imageFileName,
              })),
            })}
            {...(content.bodyType === 'carousel' && {
              cards: content.cards.map((card) => ({
                id: card.id,
                header: card.header,
                body: <VariableText body={card.body} />,
                imageFileName: card.imageFileName,
                buttons: card.buttons.map(buttonLabelOf),
              })),
            })}
            body={<VariableText body={content.body} />}
            buttons={buttons}
          />
        )}
      </div>
    </Card>
  );
}
