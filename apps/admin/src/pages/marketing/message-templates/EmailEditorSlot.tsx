// 이메일 편집기 자리 — 셸과 EmailBuilder(email/) 사이의 얇은 이음매
//
// ─────────────────────────────────────────────────────────────────────────────
// [경계가 어디인가]
//   · EmailBuilder(email/) 는 **순수 제어 컴포넌트**다. 서버 상태도 라우팅도 갖지 않고
//     value/onChange 만 본다 — 블록을 어떻게 그리고 무엇을 편집하는지가 그쪽의 전부다.
//   · 저장·발행·조회·이탈 가드는 **셸**(EmailTemplateEditor)의 것이다. 그래서 폼 값
//     EmailTemplateContent 를 들고 있는 쪽도 셸이고, 여기로는 값과 콜백만 내려온다.
//
// [이 파일이 계속 남는 이유] 두 화면(편집기·상세)이 이메일 본문을 그리는 유일한 통로다.
// EmailBuilder 의 props 가 바뀌면 고칠 곳이 여기 하나뿐이고, 상세 화면은 자기가 무엇을
// 감싸고 있는지 알 필요가 없다.
//
// [exactOptionalPropertyTypes] 선택 prop 은 조건부 spread 로만 넘긴다 — 명시적 undefined 를
// 넘기면 '주지 않음' 이 아니라 '값이 undefined 임' 이 되어 타입이 거절한다.
// ─────────────────────────────────────────────────────────────────────────────
import { EmailBuilder } from './email/EmailBuilder';
import type { EmailTemplateContent, SenderProfile } from './types';

interface EmailEditorSlotProps {
  readonly value: EmailTemplateContent;
  readonly onChange: (next: EmailTemplateContent) => void;
  /** 읽기 전용(상세) — 상세는 같은 편집기를 잠근 모습으로 본문을 보여 준다 */
  readonly disabled?: boolean;
  readonly senderProfiles?: readonly SenderProfile[];
  readonly senderProfileId?: string;
  readonly onSenderProfileChange?: (id: string) => void;
}

export function EmailEditorSlot({
  value,
  onChange,
  disabled,
  senderProfiles,
  senderProfileId,
  onSenderProfileChange,
}: EmailEditorSlotProps) {
  return (
    <EmailBuilder
      value={value}
      onChange={onChange}
      {...(disabled !== undefined && { disabled })}
      {...(senderProfiles !== undefined && { senderProfiles })}
      {...(senderProfileId !== undefined && { senderProfileId })}
      {...(onSenderProfileChange !== undefined && { onSenderProfileChange })}
    />
  );
}
