// 발송 템플릿 미리보기 (발송 템플릿 화면 전용 — apps/admin/src/pages/marketing/templates/**)
//
// 채널을 고르면 수신자가 실제로 보게 될 모습을 목업으로 보여준다. 치환변수(#{이름})는 표본값으로
// 치환해 '완성된 메시지' 처럼 보이게 한다(applyVariableSamples).
//
// [발송 폼의 미리보기와 왜 다른 컴포넌트인가] SMS/이메일 발송 폼의 미리보기(PhoneMessagePreview·
// EmailPreview)는 발신번호·수신거부 링크 등 '발송 시점' 정보를 요구한다. 템플릿은 재사용 문구라
// 그런 값이 없다 — 채널·제목·본문만으로 그린다. 그래서 발송용 미리보기를 억지로 끌어오지 않고,
// 템플릿이 가진 것만으로 그리는 전용 미리보기를 둔다(세 채널을 한 곳에서 전환한다).
import type { CSSProperties, ReactNode } from 'react';

import { sanitizeRichText } from '@tds/ui';

import { StatusBadge } from '../../../../shared/ui';
import {
  applyVariableSamples,
  byteLengthOf,
  classifySms,
  countVariables,
  isHtmlBodyEmpty,
  messageChannelLabel,
  smsByteLimit,
  smsKindLabel,
  TEMPLATE_VARIABLE_MAX,
} from '../../_shared/messaging';
import type { MessageChannel } from '../../_shared/messaging';

const EMPTY_BODY = '(본문 미입력)';
const EMPTY_TITLE = '(제목 미입력)';

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-3)',
};

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-2)',
  flexWrap: 'wrap',
};

const headerLabelStyle: CSSProperties = {
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-sm-font-size)',
  fontWeight: 'var(--tds-typography-label-md-font-weight)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

/* ── 휴대폰(SMS) ─────────────────────────────────────────────────────────────── */

const phoneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-3)',
  maxWidth: 'calc(var(--tds-space-6) * 9)',
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  paddingTop: 'var(--tds-space-5)',
  paddingBottom: 'var(--tds-space-5)',
  paddingLeft: 'var(--tds-space-3)',
  paddingRight: 'var(--tds-space-3)',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thick)',
  borderColor: 'var(--tds-color-border-default)',
  borderRadius: 'var(--tds-radius-xl)',
  background: 'var(--tds-color-surface-raised)',
};

const notchStyle: CSSProperties = {
  alignSelf: 'center',
  width: 'calc(var(--tds-space-6) * 2)',
  height: 'var(--tds-space-1)',
  borderRadius: 'var(--tds-radius-full)',
  background: 'var(--tds-color-border-default)',
};

const smsBubbleStyle: CSSProperties = {
  alignSelf: 'flex-start',
  maxWidth: '92%',
  paddingTop: 'var(--tds-space-3)',
  paddingBottom: 'var(--tds-space-3)',
  paddingLeft: 'var(--tds-space-4)',
  paddingRight: 'var(--tds-space-4)',
  borderRadius: 'var(--tds-radius-lg)',
  background: 'var(--tds-color-surface-default)',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
  color: 'var(--tds-color-text-default)',
  fontSize: 'var(--tds-typography-body-md-font-size)',
  lineHeight: 'var(--tds-typography-body-md-line-height)',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};

/* ── 이메일 ──────────────────────────────────────────────────────────────────── */

const emailFrameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
  borderRadius: 'var(--tds-radius-md)',
  background: 'var(--tds-color-surface-default)',
  overflow: 'hidden',
};

const emailHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-1)',
  paddingTop: 'var(--tds-space-3)',
  paddingBottom: 'var(--tds-space-3)',
  paddingLeft: 'var(--tds-space-4)',
  paddingRight: 'var(--tds-space-4)',
  borderBottomStyle: 'solid',
  borderBottomWidth: 'var(--tds-border-width-thin)',
  borderBottomColor: 'var(--tds-color-border-default)',
  background: 'var(--tds-color-surface-raised)',
};

const emailSubjectStyle: CSSProperties = {
  color: 'var(--tds-color-text-default)',
  fontFamily: 'var(--tds-typography-title-md-font-family)',
  fontSize: 'var(--tds-typography-title-md-font-size)',
  fontWeight: 'var(--tds-typography-title-md-font-weight)',
  lineHeight: 'var(--tds-typography-title-md-line-height)',
  overflowWrap: 'anywhere',
};

const emailFromStyle: CSSProperties = {
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-sm-font-size)',
};

const emailBodyStyle: CSSProperties = {
  paddingTop: 'var(--tds-space-4)',
  paddingBottom: 'var(--tds-space-4)',
  paddingLeft: 'var(--tds-space-4)',
  paddingRight: 'var(--tds-space-4)',
  color: 'var(--tds-color-text-default)',
  fontSize: 'var(--tds-typography-body-md-font-size)',
  lineHeight: 'var(--tds-typography-body-md-line-height)',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  minHeight: 'calc(var(--tds-space-6) * 3)',
};

/** HTML 본문 — pre-wrap 을 쓰지 않는다(태그 사이 공백이 그대로 보이지 않게). 서식은 마크업이 만든다 */
const emailHtmlBodyStyle: CSSProperties = {
  paddingTop: 'var(--tds-space-4)',
  paddingBottom: 'var(--tds-space-4)',
  paddingLeft: 'var(--tds-space-4)',
  paddingRight: 'var(--tds-space-4)',
  color: 'var(--tds-color-text-default)',
  fontSize: 'var(--tds-typography-body-md-font-size)',
  lineHeight: 'var(--tds-typography-body-md-line-height)',
  overflowWrap: 'anywhere',
  minHeight: 'calc(var(--tds-space-6) * 3)',
};

/* ── 카카오 알림톡 ───────────────────────────────────────────────────────────── */

const kakaoFrameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'calc(var(--tds-space-6) * 9)',
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
  borderRadius: 'var(--tds-radius-lg)',
  background: 'var(--tds-color-surface-raised)',
  overflow: 'hidden',
};

const kakaoBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
  paddingTop: 'var(--tds-space-2)',
  paddingBottom: 'var(--tds-space-2)',
  paddingLeft: 'var(--tds-space-3)',
  paddingRight: 'var(--tds-space-3)',
  borderBottomStyle: 'solid',
  borderBottomWidth: 'var(--tds-border-width-thin)',
  borderBottomColor: 'var(--tds-color-border-default)',
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-sm-font-size)',
};

const kakaoBodyStyle: CSSProperties = {
  paddingTop: 'var(--tds-space-4)',
  paddingBottom: 'var(--tds-space-4)',
  paddingLeft: 'var(--tds-space-3)',
  paddingRight: 'var(--tds-space-3)',
};

const kakaoBubbleStyle: CSSProperties = {
  maxWidth: '92%',
  paddingTop: 'var(--tds-space-3)',
  paddingBottom: 'var(--tds-space-3)',
  paddingLeft: 'var(--tds-space-4)',
  paddingRight: 'var(--tds-space-4)',
  borderRadius: 'var(--tds-radius-lg)',
  background: 'var(--tds-color-surface-default)',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
};

const kakaoEmphasisStyle: CSSProperties = {
  margin: 0,
  marginBottom: 'var(--tds-space-2)',
  color: 'var(--tds-color-text-default)',
  fontFamily: 'var(--tds-typography-title-md-font-family)',
  fontSize: 'var(--tds-typography-title-md-font-size)',
  fontWeight: 'var(--tds-typography-title-md-font-weight)',
  lineHeight: 'var(--tds-typography-title-md-line-height)',
  overflowWrap: 'anywhere',
};

const kakaoTextStyle: CSSProperties = {
  color: 'var(--tds-color-text-default)',
  fontSize: 'var(--tds-typography-body-md-font-size)',
  lineHeight: 'var(--tds-typography-body-md-line-height)',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};

const emptyStyle: CSSProperties = {
  color: 'var(--tds-color-text-muted)',
};

/** 본문/제목이 비었으면 회색 안내 문구로, 아니면 표본 치환한 값으로 */
function renderText(raw: string, emptyLabel: string): ReactNode {
  const applied = applyVariableSamples(raw);
  if (applied.trim() === '') return <span style={emptyStyle}>{emptyLabel}</span>;
  return applied;
}

interface TemplatePreviewProps {
  readonly channel: MessageChannel;
  readonly title: string;
  readonly body: string;
}

/**
 * 채널별 목업. 세 채널이 각자 다른 매체라 프레임이 다르다:
 *   sms      → 휴대폰 문자 말풍선 + 바이트/유형 배지(SMS↔LMS 자동 승격을 눈으로 확인)
 *   email    → 메일 클라이언트(제목·본문)
 *   alimtalk → 카카오톡 대화 + 강조표기(제목)·본문, 변수 개수 상한 안내
 */
export function TemplatePreview({ channel, title, body }: TemplatePreviewProps) {
  return (
    <div style={wrapStyle}>
      <div style={headerRowStyle}>
        <span style={headerLabelStyle}>{messageChannelLabel(channel)}</span>
        <StatusBadge tone="neutral" label="치환변수는 표본값" />
      </div>
      {channel === 'sms' && <SmsMock body={body} />}
      {channel === 'email' && <EmailMock title={title} body={body} />}
      {channel === 'alimtalk' && <KakaoMock title={title} body={body} />}
    </div>
  );
}

function SmsMock({ body }: { readonly body: string }) {
  const bytes = byteLengthOf(body);
  const kind = classifySms(bytes, false);
  const limit = smsByteLimit(kind);
  const over = bytes > limit;

  return (
    <div style={phoneStyle} aria-label="휴대폰 문자 미리보기">
      <span style={notchStyle} aria-hidden="true" />
      <div style={smsBubbleStyle}>{renderText(body, EMPTY_BODY)}</div>
      <div style={headerRowStyle}>
        <StatusBadge tone={over ? 'danger' : 'info'} label={smsKindLabel(kind)} />
        <span style={emailFromStyle}>{`${String(bytes)} / ${String(limit)} byte`}</span>
      </div>
    </div>
  );
}

function EmailMock({ title, body }: { readonly title: string; readonly body: string }) {
  // 본문은 HTML(리치 텍스트). 표본 치환 후 다시 sanitize 한 뒤에만 그린다 —
  // 저장 값이 이 앱의 sanitize 를 거쳤다고 가정하지 않는다(RichTextField 와 같은 원칙).
  const html = sanitizeRichText(applyVariableSamples(body));
  const empty = isHtmlBodyEmpty(html);

  return (
    <div style={emailFrameStyle} aria-label="이메일 미리보기">
      <div style={emailHeaderStyle}>
        <span style={emailSubjectStyle}>{renderText(title, EMPTY_TITLE)}</span>
        <span style={emailFromStyle}>보낸사람: 스페이스플래닝 &lt;no-reply@example.com&gt;</span>
      </div>
      {empty ? (
        <div style={emailBodyStyle}>
          <span style={emptyStyle}>{EMPTY_BODY}</span>
        </div>
      ) : (
        // sanitizeRichText 허용목록(script/style/on* 제거)을 지난 값만 들어온다
        <div style={emailHtmlBodyStyle} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}

function KakaoMock({ title, body }: { readonly title: string; readonly body: string }) {
  const variableCount = countVariables(body) + countVariables(title);
  const overVariableLimit = variableCount > TEMPLATE_VARIABLE_MAX;

  return (
    <div style={wrapStyle}>
      <div style={kakaoFrameStyle} aria-label="카카오 알림톡 미리보기">
        <div style={kakaoBarStyle}>
          <StatusBadge tone="warning" label="알림톡" />
          <span>스페이스플래닝</span>
        </div>
        <div style={kakaoBodyStyle}>
          <div style={kakaoBubbleStyle}>
            {applyVariableSamples(title).trim() !== '' && (
              <p style={kakaoEmphasisStyle}>{applyVariableSamples(title)}</p>
            )}
            <div style={kakaoTextStyle}>{renderText(body, EMPTY_BODY)}</div>
          </div>
        </div>
      </div>
      <div style={headerRowStyle}>
        <StatusBadge
          tone={overVariableLimit ? 'danger' : 'neutral'}
          label={`치환변수 ${String(variableCount)} / ${String(TEMPLATE_VARIABLE_MAX)}`}
        />
        {overVariableLimit && <span style={emptyStyle}>변수 상한 초과 — 심사에서 반려됩니다.</span>}
      </div>
    </div>
  );
}
