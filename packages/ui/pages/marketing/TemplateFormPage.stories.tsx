/**
 * Design System/Templates/Marketing/Alimtalk Template Form — 알림톡(발송) 템플릿 등록/수정
 * (조립 전용 · 게이트 G5).
 *
 * 카테고리는 영문 메뉴명이다: `/marketing/templates/alimtalk/new` → 메뉴 en = "Marketing"(마케팅 관리),
 * 화면 en = "Templates" (packages/ui/pages/_data/pages.ts 의 Marketing 그룹
 * `['/marketing/templates', '발송 템플릿 관리', 'Templates']`).
 *
 * 대응 실화면: apps/admin/src/pages/marketing/templates/TemplateFormPage.tsx
 * (라우트 /marketing/templates/alimtalk/new · /marketing/templates/alimtalk/:id/edit).
 * 입력 카드(기본 정보 · 본문 작성 · 카카오 심사) + 우측 sticky 미리보기 2단이다.
 *
 * [채널이 필드를 가른다] 채널(SMS/이메일/알림톡)을 고르면 화면의 구성이 갈린다 — 이메일·알림톡은
 * 제목이 생기고(이메일은 '이메일 제목', 알림톡은 '강조표기'), 이메일 본문만 서식(HTML)이며, SMS 는
 * 바이트·등급 안내가 붙고, 알림톡에만 '카카오 심사' 카드가 나타난다. 채널을 바꿀 때 본문 표현도 함께
 * 옮긴다 — 그러지 않으면 `<p>…</p>` 가 그대로 저장돼 수신자에게 태그가 문자로 발송된다.
 *
 * [승인·검수중이면 내용이 잠긴다] 카카오에 심사를 넣은 뒤로 문구는 우리 것이 아니다. 승인은 '이
 * 문구' 에 대한 승인이라 본문을 고치면 승인이 무효가 된다. 그래서 잠그고, 고치는 유일한 길인
 * **복제해서 새로 만들기**를 배너 안에 함께 준다. 잠기지 않는 것은 템플릿명뿐이다 — 운영자가 목록에서
 * 찾으려고 붙인 내부 라벨이라 심사 대상이 아니다.
 *
 * [조립 원칙] `../../src` public DS 컴포넌트만 조합한다 — 신규 DS 컴포넌트를 만들지 않고 apps/admin 을
 * import 하지 않는다. 실화면의 앱 조각을 DS 표면으로 갈음한다:
 *   목록으로(FormPageShell)      → Button(ghost) + Icon(chevron-left)
 *   카드 제목(CardTitle)          → Card + 토큰만 쓴 <h2>
 *   치환변수 삽입(VariableInsertBar) → Button(secondary·sm) 칩 줄
 *   미리보기(TemplatePreview)     → 채널별 토큰 프레임(휴대폰 · 메일 · 카카오)
 *
 * 실화면 ↔ DS 컴포넌트 매핑:
 *   템플릿명                   → TextField
 *   채널 · 승인상태             → FormField + SelectField
 *   제목(이메일 제목 / 강조표기) → TextField
 *   본문(평문 / 서식)           → TextareaField / RichTextField
 *   바이트·등급 안내(SMS)       → 토큰 <p>(hint)
 *   반려 안내 · 반려 사유        → StatusBadge(danger) + TextareaField
 *   심사 잠금 배너 + 복제        → Alert(info) + Button(secondary)
 *   상세 조회 스켈레톤          → Card + Skeleton
 *   취소 / 등록 · 저장          → Button(secondary/primary)
 *
 * 하드코딩 색상(hex)/px 리터럴 0건 — 시각 값은 토큰 CSS 변수(cssVar/typography)와 rem·calc·% 만 참조한다.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties, ReactNode } from 'react';
import { useId, useState } from 'react';

import {
  Alert,
  Button,
  Card,
  FormField,
  Icon,
  RichTextField,
  SelectField,
  Skeleton,
  StatusBadge,
  TextField,
  TextareaField,
  cssVar,
  typography,
} from '../../src';

const meta: Meta = {
  title: 'Design System/Templates/Marketing/Alimtalk Template Form',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/* ── 상수 · 선택지(실화면 _shared/messaging 미러) ───────────────────────────────────────────── */

const TEMPLATE_NAME_MAX = 60;
const TEMPLATE_TITLE_MAX = 100;
const TEMPLATE_BODY_MAX = 2000;
const REJECT_REASON_MAX = 200;
const SMS_PROMOTION_THRESHOLD = 90;
const LMS_MAX_BYTES = 2000;
/** 카카오 알림톡 변수 개수 상한 — 초과 시 반려(심사 가이드) */
const TEMPLATE_VARIABLE_MAX = 40;

type MessageChannel = 'sms' | 'email' | 'alimtalk';
type ApprovalStatus = 'draft' | 'inspecting' | 'approved' | 'rejected';
type SmsKind = 'sms' | 'lms' | 'mms';

const MESSAGE_CHANNEL_OPTIONS: readonly { readonly id: MessageChannel; readonly label: string }[] =
  [
    { id: 'sms', label: 'SMS/문자' },
    { id: 'email', label: '이메일' },
    { id: 'alimtalk', label: '카카오 알림톡' },
  ];

const APPROVAL_STATUS_OPTIONS: readonly { readonly id: ApprovalStatus; readonly label: string }[] =
  [
    { id: 'draft', label: '초안' },
    { id: 'inspecting', label: '검수중' },
    { id: 'approved', label: '승인' },
    { id: 'rejected', label: '반려' },
  ];

const SMS_KIND_LABEL: Record<SmsKind, string> = { sms: 'SMS', lms: 'LMS', mms: 'MMS' };

const VARIABLE_TOKENS: readonly string[] = ['#{이름}', '#{주문번호}', '#{쿠폰명}', '#{적립금}'];

/** 알림톡만 사전 승인 대상 */
const requiresApproval = (channel: MessageChannel): boolean => channel === 'alimtalk';

/** 제목을 쓰는 채널 — 이메일 제목·알림톡 강조표기. SMS 는 제목이 없다 */
const usesTitle = (channel: MessageChannel): boolean => channel !== 'sms';

/** 심사에 걸린 내용을 잠가야 하는가 — 판단은 **서버가 돌려준 원본**으로 한다(폼 값이 아니다) */
const isTemplateContentLocked = (channel: MessageChannel, status: ApprovalStatus): boolean => {
  if (!requiresApproval(channel)) return false;
  return status === 'approved' || status === 'inspecting';
};

const byteLengthOf = (text: string): number =>
  [...text].reduce((sum, char) => sum + ((char.codePointAt(0) ?? 0) > 0x7f ? 2 : 1), 0);

const classifySms = (bytes: number): SmsKind => (bytes <= SMS_PROMOTION_THRESHOLD ? 'sms' : 'lms');

const smsByteLimit = (kind: SmsKind): number =>
  kind === 'sms' ? SMS_PROMOTION_THRESHOLD : LMS_MAX_BYTES;

/** 본문에 실제로 쓰인 `#{...}` 변수 개수 */
const countVariables = (text: string): number => text.match(/#\{[^}]+\}/g)?.length ?? 0;

/** 미리보기 표본 치환 — 템플릿에는 수신자가 없으므로 대표값으로 채운다 */
const VARIABLE_SAMPLES: Record<string, string> = {
  '#{이름}': '명재우',
  '#{주문번호}': '20260721-0031',
  '#{쿠폰명}': '여름맞이 15% 쿠폰',
  '#{적립금}': '12,400',
};

const applyVariableSamples = (text: string): string =>
  Object.entries(VARIABLE_SAMPLES).reduce(
    (acc, [token, sample]) => acc.split(token).join(sample),
    text,
  );

/** 리치 텍스트(HTML) → 줄바꿈을 살린 평문 — 미리보기는 저장 값을 믿지 않고 자기가 그릴 형태로 만든다 */
const richTextToPlainText = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const looksLikeRichText = (value: string): boolean => /<[a-z][^>]*>/i.test(value);

const toPlain = (raw: string): string => (looksLikeRichText(raw) ? richTextToPlainText(raw) : raw);

/* ── 데모 시드(실화면 marketing/_shared/store 의 템플릿 픽스처를 폼 값으로 되돌린 형태) ─────── */

interface SeedValues {
  readonly name: string;
  readonly channel: MessageChannel;
  readonly title: string;
  readonly body: string;
  readonly approvalStatus: ApprovalStatus;
  readonly rejectReason: string;
}

const EMPTY_SEED: SeedValues = {
  name: '',
  channel: 'sms',
  title: '',
  body: '',
  approvalStatus: 'draft',
  rejectReason: '',
};

/** 반려된 알림톡 — 사유를 확인하고 재편집해 다시 제출하는 상태(내용은 잠기지 않는다) */
const REJECTED_SEED: SeedValues = {
  name: '이벤트 참여 감사(알림톡)',
  channel: 'alimtalk',
  title: '이벤트 참여 감사',
  body: '#{이름} #{쿠폰명}',
  approvalStatus: 'rejected',
  rejectReason: '본문이 변수로만 구성되어 있습니다. 안내 문구를 추가해 주세요.',
};

/** 승인된 알림톡 — 내용이 잠기고 '복제해서 새로 만들기' 만 열려 있다 */
const APPROVED_SEED: SeedValues = {
  name: '배송 출발 알림(알림톡)',
  channel: 'alimtalk',
  title: '배송 출발 안내',
  body: '#{이름}님, 주문하신 상품(#{주문번호})이 출발했습니다.',
  approvalStatus: 'approved',
  rejectReason: '',
};

/** 검증 오류 데모 — 실화면 zod 스키마(templates/validation)의 문구를 대표값으로 미러 */
interface FieldErrors {
  readonly name?: string;
  readonly title?: string;
  readonly body?: string;
}

const DEMO_ERRORS: FieldErrors = {
  name: '템플릿명을 입력하세요.',
  title: '제목을 입력하세요.',
  body: '본문을 입력하세요.',
};

const ERROR_SEED: SeedValues = { ...EMPTY_SEED, channel: 'alimtalk' };

/* ── 스타일(토큰·rem·% 만) ────────────────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  padding: cssVar('space.6'),
  minBlockSize: '100vh',
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
};

const backRowStyle: CSSProperties = { alignSelf: 'flex-start' };

const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: cssVar('color.text.default'),
  ...typography('typography.title.xl'),
};

const descriptionStyle: CSSProperties = {
  marginTop: cssVar('space.1'),
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: cssVar('color.text.muted'),
  ...typography('typography.label.md'),
};

/** 입력(좌) · 미리보기(우) 2단 — 좁은 화면에서는 자동으로 한 단으로 접힌다 */
const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(calc(${cssVar('space.6')} * 13), 1fr))`,
  gap: cssVar('space.5'),
  alignItems: 'start',
};

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  minWidth: 0,
};

/** 우측 미리보기 카드 — 스크롤해도 따라오도록 sticky */
const previewColumnStyle: CSSProperties = {
  position: 'sticky',
  top: cssVar('space.4'),
  minWidth: 0,
};

const cardBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.4'),
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  ...typography('typography.title.md'),
  margin: 0,
  color: cssVar('color.text.default'),
};

const hintStyle: CSSProperties = {
  ...typography('typography.caption.md'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const chipRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
};

const alertRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: cssVar('space.2'),
};

const skeletonBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
};

/* ── 미리보기 프레임 스타일(_shared/preview 의 PhoneFrame·MailFrame·KakaoFrame 미러) ───────── */

const previewWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
};

const previewHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
};

const previewLabelStyle: CSSProperties = {
  ...typography('typography.label.sm'),
  color: cssVar('color.text.muted'),
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const frameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
  boxSizing: 'border-box',
  width: '100%',
  paddingTop: cssVar('space.5'),
  paddingBottom: cssVar('space.5'),
  paddingLeft: cssVar('space.3'),
  paddingRight: cssVar('space.3'),
  borderStyle: 'solid',
  borderWidth: cssVar('border-width.thick'),
  borderColor: cssVar('color.border.default'),
  borderRadius: cssVar('radius.xl'),
  background: cssVar('color.surface.raised'),
};

const notchStyle: CSSProperties = {
  alignSelf: 'center',
  width: `calc(${cssVar('space.6')} * 2)`,
  height: cssVar('space.1'),
  borderRadius: cssVar('radius.full'),
  background: cssVar('color.border.default'),
};

const bubbleStyle: CSSProperties = {
  alignSelf: 'flex-start',
  maxWidth: '92%',
  paddingTop: cssVar('space.3'),
  paddingBottom: cssVar('space.3'),
  paddingLeft: cssVar('space.4'),
  paddingRight: cssVar('space.4'),
  borderRadius: cssVar('radius.lg'),
  borderStyle: 'solid',
  borderWidth: cssVar('border-width.thin'),
  borderColor: cssVar('color.border.default'),
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
  ...typography('typography.body.md'),
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  margin: 0,
};

/** 카카오 말풍선 — 채널 색은 토큰이 갖고 있다(color.channel.kakao.*) */
const kakaoHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  paddingTop: cssVar('space.2'),
  paddingBottom: cssVar('space.2'),
  paddingLeft: cssVar('space.3'),
  paddingRight: cssVar('space.3'),
  borderRadius: cssVar('radius.md'),
  background: cssVar('color.channel.kakao.surface'),
  color: cssVar('color.channel.kakao.text'),
  ...typography('typography.label.sm'),
};

const kakaoBubbleStyle: CSSProperties = {
  ...bubbleStyle,
  background: cssVar('color.channel.kakao.chat-surface'),
};

const kakaoEmphasisStyle: CSSProperties = {
  display: 'block',
  marginBottom: cssVar('space.2'),
  ...typography('typography.title.md'),
  color: cssVar('color.text.default'),
};

const mailFrameStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  width: '100%',
  borderStyle: 'solid',
  borderWidth: cssVar('border-width.thin'),
  borderColor: cssVar('color.border.default'),
  borderRadius: cssVar('radius.lg'),
  background: cssVar('color.surface.default'),
  overflow: 'hidden',
};

const mailHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.1'),
  paddingTop: cssVar('space.4'),
  paddingBottom: cssVar('space.4'),
  paddingLeft: cssVar('space.4'),
  paddingRight: cssVar('space.4'),
  background: cssVar('color.surface.raised'),
};

const mailSubjectStyle: CSSProperties = {
  ...typography('typography.title.md'),
  color: cssVar('color.text.default'),
  margin: 0,
  overflowWrap: 'anywhere',
};

const mailFromStyle: CSSProperties = {
  ...typography('typography.caption.md'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const mailBodyStyle: CSSProperties = {
  paddingTop: cssVar('space.4'),
  paddingBottom: cssVar('space.4'),
  paddingLeft: cssVar('space.4'),
  paddingRight: cssVar('space.4'),
  ...typography('typography.body.md'),
  color: cssVar('color.text.default'),
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  margin: 0,
};

const emptyTextStyle: CSSProperties = {
  color: cssVar('color.text.muted'),
};

/* ── 카드 제목 조립(DS Card 는 표면만 소유 — 제목 <h2> 는 토큰으로 조립하고 aria 로 잇는다) ── */

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  const titleId = useId();
  return (
    <Card aria-labelledby={titleId}>
      <div style={cardBodyStyle}>
        <h2 id={titleId} style={cardTitleStyle}>
          {title}
        </h2>
        {children}
      </div>
    </Card>
  );
}

/* ── 채널별 미리보기(TemplatePreview 미러) ────────────────────────────────────────────────── */

function TemplatePreview({
  channel,
  title,
  body,
}: {
  readonly channel: MessageChannel;
  readonly title: string;
  readonly body: string;
}) {
  const plainBody = applyVariableSamples(toPlain(body));
  const plainTitle = applyVariableSamples(title);
  const bodyNode =
    plainBody.trim() === '' ? <span style={emptyTextStyle}>(본문 미입력)</span> : plainBody;
  const titleText = plainTitle.trim() === '' ? '(제목 미입력)' : plainTitle;

  if (channel === 'email') {
    return (
      <div style={previewWrapStyle}>
        <div style={previewHeaderStyle}>
          <span style={previewLabelStyle}>이메일</span>
        </div>
        <div style={mailFrameStyle}>
          <div style={mailHeaderStyle}>
            <p style={mailSubjectStyle}>{titleText}</p>
            <p style={mailFromStyle}>스페이스플래닝 &lt;no-reply@example.com&gt;</p>
          </div>
          <p style={mailBodyStyle}>{bodyNode}</p>
        </div>
      </div>
    );
  }

  if (channel === 'alimtalk') {
    const variables = countVariables(body);
    return (
      <div style={previewWrapStyle}>
        <div style={previewHeaderStyle}>
          <span style={previewLabelStyle}>카카오 알림톡</span>
          <span style={hintStyle}>
            {`치환변수 ${String(variables)} / ${String(TEMPLATE_VARIABLE_MAX)}개`}
          </span>
        </div>
        <div style={frameStyle}>
          <span style={notchStyle} />
          <span style={kakaoHeaderStyle}>
            <Icon name="megaphone" />
            스페이스플래닝
          </span>
          <div style={kakaoBubbleStyle}>
            <span style={kakaoEmphasisStyle}>{titleText}</span>
            {bodyNode}
          </div>
        </div>
      </div>
    );
  }

  const bytes = byteLengthOf(body);
  const kind = classifySms(bytes);
  return (
    <div style={previewWrapStyle}>
      <div style={previewHeaderStyle}>
        <span style={previewLabelStyle}>SMS/문자</span>
        <StatusBadge tone={kind === 'sms' ? 'info' : 'warning'} label={SMS_KIND_LABEL[kind]} />
      </div>
      <div style={frameStyle}>
        <span style={notchStyle} />
        <div style={bubbleStyle}>{bodyNode}</div>
      </div>
      <p style={hintStyle}>{`${String(bytes)} / ${String(smsByteLimit(kind))} byte`}</p>
    </div>
  );
}

/* ── 제어형 화면(rules-of-hooks: Capitalized 컴포넌트에서 useState) ───────────────────────── */

interface TemplateFormScreenProps {
  readonly isEdit?: boolean;
  readonly loadingDetail?: boolean;
  readonly errors?: FieldErrors;
  readonly seed?: SeedValues;
  /** 서버가 돌려준 원본의 승인상태 — 잠금 판단의 근거다(폼 값으로 판단하지 않는다) */
  readonly loadedApprovalStatus?: ApprovalStatus;
}

function TemplateFormScreen({
  isEdit = false,
  loadingDetail = false,
  errors = {},
  seed = EMPTY_SEED,
  loadedApprovalStatus,
}: TemplateFormScreenProps) {
  const [name, setName] = useState(seed.name);
  const [channel, setChannel] = useState<MessageChannel>(seed.channel);
  const [title, setTitle] = useState(seed.title);
  const [body, setBody] = useState(seed.body);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(seed.approvalStatus);
  const [rejectReason, setRejectReason] = useState(seed.rejectReason);

  const locked =
    loadedApprovalStatus !== undefined &&
    isTemplateContentLocked(seed.channel, loadedApprovalStatus);
  /** 내용 입력의 최종 비활성 — 로딩 중이거나, 심사에 걸려 잠긴 경우 */
  const contentDisabled = loadingDetail || locked;

  const bytes = byteLengthOf(body);
  const smsKind = classifySms(bytes);

  /** 채널 전환 — 채널만 바꾸는 게 아니라 본문 표현도 함께 옮긴다 */
  const changeChannel = (next: MessageChannel): void => {
    setChannel(next);
    if (next !== 'email' && looksLikeRichText(body)) setBody(richTextToPlainText(body));
  };

  return (
    <div style={pageStyle}>
      <span style={backRowStyle}>
        <Button variant="ghost" size="md" iconLeft={<Icon name="chevron-left" />}>
          목록으로
        </Button>
      </span>

      <div>
        <h1 style={pageTitleStyle}>{isEdit ? '발송 템플릿 수정' : '발송 템플릿 등록'}</h1>
        <p style={descriptionStyle}>
          채널을 고르면 필요한 항목이 달라집니다. 오른쪽 미리보기로 수신자가 볼 모습을 실시간으로
          확인할 수 있습니다.
        </p>
      </div>

      <form onSubmit={(event) => event.preventDefault()} noValidate>
        {locked && (
          // 막기만 하고 이유를 말하지 않으면 '고장' 으로 읽힌다 — 이유와 나갈 길을 함께 준다
          <Alert tone="info">
            <div style={alertRowStyle}>
              <span>
                {loadedApprovalStatus === 'approved'
                  ? '카카오 승인이 끝난 템플릿입니다. 승인은 이 문구에 대한 것이라 내용을 고치면 승인이 무효가 됩니다.'
                  : '카카오 검수가 진행 중입니다. 심사 대상과 어긋나므로 내용을 고칠 수 없습니다.'}
                {
                  ' 문구를 바꾸려면 복제해서 새 템플릿으로 다시 심사를 받으세요. 템플릿명은 그대로 수정할 수 있습니다.'
                }
              </span>
              <Button variant="secondary">복제해서 새로 만들기</Button>
            </div>
          </Alert>
        )}

        <div style={layoutStyle}>
          <div style={columnStyle}>
            {loadingDetail ? (
              <Card>
                <div style={skeletonBodyStyle} aria-busy="true">
                  {[0, 1, 2, 3, 4, 5].map((row) => (
                    <Skeleton key={`row-${String(row)}`} />
                  ))}
                </div>
              </Card>
            ) : (
              <>
                <FormCard title="기본 정보">
                  {/* 템플릿명은 심사 대상이 아니다 — 잠긴 템플릿에서도 고칠 수 있다 */}
                  <TextField
                    id="template-name"
                    label="템플릿명"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="예: 주문 완료 안내(SMS)"
                    maxLength={TEMPLATE_NAME_MAX}
                    error={errors.name ?? ''}
                  />

                  <FormField
                    htmlFor="template-channel"
                    label="채널"
                    required
                    hint="SMS 는 길이에 따라 LMS·MMS 로 자동 분류됩니다. 알림톡은 카카오 사전 심사가 필요합니다."
                  >
                    <SelectField
                      id="template-channel"
                      value={channel}
                      disabled={contentDisabled}
                      onChange={(event) => {
                        const raw = event.target.value;
                        changeChannel(
                          MESSAGE_CHANNEL_OPTIONS.find((option) => option.id === raw)?.id ?? 'sms',
                        );
                      }}
                    >
                      {MESSAGE_CHANNEL_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectField>
                  </FormField>
                </FormCard>

                <FormCard title="본문 작성">
                  {usesTitle(channel) && (
                    <TextField
                      id="template-title"
                      label={channel === 'email' ? '이메일 제목' : '강조표기(제목)'}
                      required
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      disabled={contentDisabled}
                      placeholder={
                        channel === 'email'
                          ? '예: [스페이스플래닝] 이달의 소식'
                          : '예: 배송 출발 안내'
                      }
                      maxLength={TEMPLATE_TITLE_MAX}
                      error={errors.title ?? ''}
                    />
                  )}

                  {channel === 'email' ? (
                    // 이메일 본문은 HTML — 서식(굵게·제목·목록·링크·이미지)을 그대로 담는다
                    <RichTextField
                      label="본문"
                      required
                      value={body}
                      onChange={setBody}
                      maxLength={TEMPLATE_BODY_MAX}
                      disabled={contentDisabled}
                      rows={12}
                      hint="굵게·제목·목록·링크·이미지를 넣을 수 있습니다. #{이름} 등 치환변수도 그대로 씁니다."
                      placeholder="이메일 본문을 작성하세요."
                      error={errors.body ?? ''}
                    />
                  ) : (
                    <TextareaField
                      label="본문"
                      required
                      value={body}
                      onChange={setBody}
                      maxLength={TEMPLATE_BODY_MAX}
                      disabled={contentDisabled}
                      rows={6}
                      placeholder="발송할 문구를 입력하세요. #{이름} 등 치환변수를 넣을 수 있습니다."
                      error={errors.body ?? ''}
                    />
                  )}

                  {channel === 'sms' && (
                    <p style={hintStyle}>
                      {`${String(bytes)} byte · ${SMS_KIND_LABEL[smsKind]} (한도 ${String(
                        smsByteLimit(smsKind),
                      )} byte)`}
                      {smsKind === 'lms' && ' — 90 byte 초과로 LMS 로 발송됩니다.'}
                    </p>
                  )}

                  <div style={chipRowStyle}>
                    <span style={hintStyle}>치환변수</span>
                    {VARIABLE_TOKENS.map((token) => (
                      <Button
                        key={token}
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={contentDisabled}
                        onClick={() => setBody((prev) => `${prev}${token}`)}
                      >
                        {token}
                      </Button>
                    ))}
                  </div>
                </FormCard>

                {requiresApproval(channel) && (
                  <FormCard title="카카오 심사">
                    <FormField
                      htmlFor="template-approval"
                      label="승인상태"
                      hint="알림톡은 카카오 사전 심사(검수중→승인/반려)를 거칩니다. 승인된 템플릿만 발송에 쓸 수 있습니다."
                    >
                      <SelectField
                        id="template-approval"
                        value={approvalStatus}
                        onChange={(event) => {
                          const raw = event.target.value;
                          setApprovalStatus(
                            APPROVAL_STATUS_OPTIONS.find((option) => option.id === raw)?.id ??
                              'draft',
                          );
                        }}
                      >
                        {APPROVAL_STATUS_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>

                    {approvalStatus === 'rejected' && (
                      <>
                        <StatusBadge
                          tone="danger"
                          label="반려됨 — 사유를 확인하고 재편집 후 다시 제출하세요."
                        />
                        <TextareaField
                          label="반려 사유"
                          value={rejectReason}
                          onChange={setRejectReason}
                          maxLength={REJECT_REASON_MAX}
                          rows={2}
                          placeholder="카카오 심사 반려 사유"
                        />
                      </>
                    )}
                  </FormCard>
                )}
              </>
            )}
          </div>

          <div style={previewColumnStyle}>
            <FormCard title="미리보기">
              <TemplatePreview channel={channel} title={title} body={body} />
            </FormCard>
          </div>
        </div>

        <div style={actionsStyle}>
          <Button type="button" variant="secondary" size="md">
            취소
          </Button>
          <Button type="submit" variant="primary" size="md">
            {isEdit ? '저장' : '등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** 정상(등록): 빈 폼 — 채널 기본값은 SMS 라 제목·심사 카드가 없고 바이트 안내만 붙는다 */
export const Default: Story = {
  render: () => <TemplateFormScreen />,
};

/**
 * 반려된 알림톡 수정: 강조표기 + 카카오 심사 카드 + 반려 배지·사유가 함께 보인다.
 * 반려는 내용을 잠그지 않는다 — 고쳐서 다시 제출하는 것이 유일한 길이기 때문이다.
 */
export const Rejected: Story = {
  render: () => <TemplateFormScreen isEdit seed={REJECTED_SEED} loadedApprovalStatus="rejected" />,
};

/** 승인 잠금: 내용 입력이 전부 잠기고 info 배너 + [복제해서 새로 만들기] 만 열려 있다 */
export const Locked: Story = {
  render: () => <TemplateFormScreen isEdit seed={APPROVED_SEED} loadedApprovalStatus="approved" />,
};

/** 로딩: 상세 조회 중 입력 열 스켈레톤(useCrudForm loadingDetail 미러) — 미리보기는 남는다 */
export const Loading: Story = {
  render: () => <TemplateFormScreen isEdit loadingDetail seed={APPROVED_SEED} />,
};

/** 검증 오류: 알림톡 채널에서 필수 항목을 비우고 제출 — 템플릿명·제목·본문 인라인 오류 */
export const ValidationError: Story = {
  render: () => <TemplateFormScreen errors={DEMO_ERRORS} seed={ERROR_SEED} />,
};
