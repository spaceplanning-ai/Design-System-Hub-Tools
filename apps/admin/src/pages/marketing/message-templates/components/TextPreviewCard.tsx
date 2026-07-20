// 문자 템플릿 미리보기 카드 — 휴대폰 목업 (편집기 우측 · 상세 우측이 공유)
//
// [프레임은 만들지 않는다] 노치·말풍선·MMS 이미지 자리·유형 배지는 marketing/_shared/preview 의
// PhoneFrame 이 이미 갖고 있고 SMS 발송 화면이 같은 것을 쓴다. 여기서 두 번째 휴대폰을 그리면
// 같은 매체의 목업이 앱에 두 벌 생긴다.
//
// [PhoneFrame 에 무엇을 얹는가] body 슬롯에 VariableText 를 넣는다 — 그것이 이 화면과 발송 화면의
// 유일한 차이다(치환하지 않고 토큰을 보여 준다. VariableText 머리말 참고).
import type { CSSProperties } from 'react';

import { Card, CardTitle } from '../../../../shared/ui';
import { PhoneFrame } from '../../_shared/preview/PhoneFrame';
import { byteLengthOf, classifySms } from '../../_shared/messaging';
import { PREVIEW_TITLE } from '../copy';
import { accentTitleStyle } from '../styles';
import { VariableText } from './VariableText';

/**
 * 메시지가 길어지면 카드가 페이지를 끝없이 늘린다 — 목업의 휴대폰처럼 화면 안에서 스크롤시킨다.
 * 상한은 space.10 의 배수(파생 치수는 space 토큰의 calc 배수로만 표현한다).
 */
const scrollStyle: CSSProperties = {
  maxHeight: 'calc(var(--tds-space-10) * 9)',
  overflowY: 'auto',
  overflowX: 'hidden',
  minWidth: 0,
};

interface TextPreviewCardProps {
  /** 문자 제목 — LMS/MMS 만 수신자에게 보인다. 등급 판정에도 들어간다(types.ts subject 머리말) */
  readonly subject: string;
  readonly body: string;
  readonly imageFileName: string;
  /** 상단 발신번호 줄 — 아직 고르지 않았으면 넘기지 않는다(빈 줄을 그리지 않는다) */
  readonly senderPhone: string;
}

export function TextPreviewCard({
  subject,
  body,
  imageFileName,
  senderPhone,
}: TextPreviewCardProps) {
  // 등급 판정은 **글자 수가 아니라 EUC-KR 바이트**다 — 한글 45자면 이미 90byte 라 LMS 로 승격된다.
  // 카운터(글자)와 배지(바이트)가 다른 것을 세는 것은 규격이 그렇게 생겼기 때문이다.
  const bytes = byteLengthOf(body);
  // 제목도 승격 사유다 — 90byte 안이어도 제목이 있으면 LMS 다(_shared/messaging classifySms 머리말)
  const kind = classifySms(bytes, imageFileName.trim() !== '', subject.trim() !== '');

  return (
    <Card>
      <CardTitle>
        <span style={accentTitleStyle}>{PREVIEW_TITLE}</span>
      </CardTitle>
      <div style={scrollStyle}>
        <PhoneFrame
          {...(senderPhone.trim() !== '' && { sender: senderPhone })}
          subject={subject}
          body={<VariableText body={body} />}
          kind={kind}
          bytes={bytes}
        />
      </div>
    </Card>
  );
}
