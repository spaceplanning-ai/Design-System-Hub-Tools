// 마케팅/메시징 공용 도메인 타입 · 순수 규칙
//
// [왜 _shared 인가] SMS 발송·이메일 발송·뉴스레터·발송 템플릿 네 화면이 같은 도메인을 공유한다:
//   - 세그먼트(수신자 그룹)·발신번호/발신자는 SMS·이메일·뉴스레터가 함께 참조한다.
//   - 발송 템플릿은 템플릿 화면이 관리하고 SMS·이메일 발송 화면이 삽입한다.
//   - 바이트 판정·야간발송 차단·수신거부·치환변수는 전 채널이 같은 규칙을 쓴다.
//   네 data-source 가 서로를 import 하면 결합이 되므로 도메인 타입·순수 규칙을 이 잎 모듈에 모은다
//   (고객센터 _shared/domain·상품 _shared/store 와 같은 결 — pages/marketing 한 페이지 안이다).
//
// [국내 메시징/광고 규제 채택 — 조사 근거]
//   · 바이트: SMS 90byte(한글 45자), LMS 2,000byte, MMS(이미지 첨부). 한글=2byte·ASCII=1byte
//     (EUC-KR 기준 — 알리고/솔라피/쿨SMS 공통). 90byte 초과 시 SMS→LMS 자동 승격을 UI 가 미리 알린다.
//   · 야간 광고 전송 제한(정보통신망법 제50조 제3항): 광고성 정보를 21:00~익일 08:00 전송하려면
//     별도 수신동의가 필요하다 — 예약 시각이 야간이면 광고 발송을 막는다.
//   · (광고) 표기·수신거부 명시(제50조 제4항): 광고 메시지는 '(광고)' 표기 + 전송자 명칭 + 무료수신거부
//     방법(080 등)을 반드시 포함한다.
//   · 발신번호 사전등록제(전기통신사업법 제84조의2): 사전 등록·검증된 번호로만 발신한다.
//   · 치환변수 문법은 `#{변수}` (솔라피·카카오 공통).
import type { StatusTone } from '../../../shared/ui';

/* ── 채널 ──────────────────────────────────────────────────────────────────────
 *
 * 발송 템플릿이 다루는 채널. 유니온을 넓히면(친구톡·푸시 등) 옵션·라벨만 늘리면 되도록 열어 둔다. */
export type MessageChannel = 'sms' | 'email' | 'alimtalk';

interface Option<T extends string> {
  readonly id: T;
  readonly label: string;
}

export const MESSAGE_CHANNEL_OPTIONS: readonly Option<MessageChannel>[] = [
  { id: 'sms', label: 'SMS/문자' },
  { id: 'email', label: '이메일' },
  { id: 'alimtalk', label: '카카오 알림톡' },
] as const;

// [삭제됨] parseMessageChannel / isMessageChannel / CHANNEL_VALUES
//   목록 필터가 URL 문자열을 좁힐 때 쓰던 사본이다. IA-13 롤아웃으로 그 자리를 공용
//   `shared/crud/parseFilter` 가 가져갔고 — 허용 목록은 위 MESSAGE_CHANNEL_OPTIONS 의 id 에서
//   파생한다 — 마지막 소비자가 사라졌다. 소비자 없는 export 는 '나중에 쓸지도 모르는 것'이
//   아니라 죽은 코드다(클린코드 점검 축5 죽은 코드 0).

const optionLabel = <T extends string>(options: readonly Option<T>[], id: T): string =>
  options.find((option) => option.id === id)?.label ?? id;

export const messageChannelLabel = (v: MessageChannel): string =>
  optionLabel(MESSAGE_CHANNEL_OPTIONS, v);

/** 알림톡만 사전 승인 대상 — 정보통신망 채널(SMS/이메일)은 승인 개념이 없다 */
export function requiresApproval(channel: MessageChannel): boolean {
  return channel === 'alimtalk';
}

/** 제목을 쓰는 채널 — 이메일 제목·알림톡 강조표기. SMS 는 제목이 없다 */
export function usesTitle(channel: MessageChannel): boolean {
  return channel !== 'sms';
}

/* ── 알림톡 템플릿 승인 상태 ─────────────────────────────────────────────────────
 *
 * 카카오 템플릿 사전 심사 흐름: 등록(초안)→검수중→승인/반려. 승인만 발송 가능, 반려는 사유와 함께
 * 재편집·재요청한다. (조사: kakaobusiness 알림톡 심사 가이드) */
type ApprovalStatus = 'draft' | 'inspecting' | 'approved' | 'rejected';

export const APPROVAL_STATUS_OPTIONS: readonly Option<ApprovalStatus>[] = [
  { id: 'draft', label: '초안' },
  { id: 'inspecting', label: '검수중' },
  { id: 'approved', label: '승인' },
  { id: 'rejected', label: '반려' },
] as const;

export const approvalStatusLabel = (v: ApprovalStatus): string =>
  optionLabel(APPROVAL_STATUS_OPTIONS, v);

const APPROVAL_TONE: Record<ApprovalStatus, StatusTone> = {
  draft: 'neutral',
  inspecting: 'info',
  approved: 'success',
  rejected: 'danger',
};

export function approvalStatusTone(status: ApprovalStatus): StatusTone {
  return APPROVAL_TONE[status];
}

/** 발송 가능 여부 — 알림톡은 승인된 템플릿만, 그 외 채널은 항상 가능 */
export function isSendableTemplate(channel: MessageChannel, status: ApprovalStatus): boolean {
  if (!requiresApproval(channel)) return true;
  return status === 'approved';
}

/**
 * 심사에 걸린 내용을 잠가야 하는가 — **저장된** 채널·상태로 판단한다.
 *
 * [왜 잠그나] 카카오에 심사를 넣은 뒤로 템플릿 내용은 우리 것이 아니다. 승인은 '이 문구' 에 대한
 * 승인이라 본문을 고치면 승인이 무효가 되고, 검수중에 고치면 심사 대상과 제출본이 어긋난다.
 * 카카오 비즈니스도 같은 이유로 승인된 템플릿의 수정을 막고 신규 등록을 요구한다.
 * 그래서 고치고 싶으면 **복제해서 새 템플릿으로** 다시 심사를 받는다.
 *
 * [무엇이 잠기지 않나] 템플릿명은 운영자가 목록에서 찾으려고 붙인 **내부 라벨**이다 — 심사 대상이
 * 아니므로 잠그지 않는다. 규제 근거 없이 막으면 그냥 불편한 화면이 된다.
 *
 * [무엇으로 판단하나] 인자는 폼 값이 아니라 **서버가 돌려준 원본**이어야 한다. 폼 값으로 판단하면
 * 승인상태 select 를 '초안' 으로 되돌리는 것만으로 잠금이 풀린다 — 잠금이 잠금이 아니게 된다.
 */
export function isTemplateContentLocked(channel: MessageChannel, status: ApprovalStatus): boolean {
  if (!requiresApproval(channel)) return false;
  return status === 'approved' || status === 'inspecting';
}

/* ── 치환변수 (개인화) ──────────────────────────────────────────────────────────
 *
 * 문법은 `#{변수}`. 발송/템플릿 화면에서 본문에 삽입하고, 미리보기는 표본값으로 치환한다.
 *
 * [삭제됨] MESSAGE_VARIABLES — 다섯 개짜리 한글 토큰 목록(`#{이름}`·`#{주문번호}` …).
 *
 *   목록이 여기 있으면 안 되는 이유가 두 가지였다.
 *
 *   (1) **여기는 마케팅 도메인이다.** 치환 변수는 회원·영업·콘텐츠·상품·포트폴리오·고객센터
 *       여섯 도메인의 값이고, 그 목록의 주인은 마케팅이 아니다. 마케팅이 들고 있으면 상품에
 *       필드가 늘어날 때 아무도 이 파일을 고치러 오지 않는다 — 실제로 다섯 개에서 멈춰 있었다.
 *   (2) **토큰이 한글이었다.** 대행사·백엔드와 주고받는 키는 인코딩·정규화(NFC/NFD)에서 조용히
 *       어긋난다. 사람이 고르는 층(한국어 라벨)과 본문에 꽂히는 층(영문 토큰)은 별개여야 한다.
 *
 *   정본은 `shared/domain/template-variable-catalog.ts` 로 옮겼고, 배선은 `wiring.ts` 가 한다.
 *   아래 applyVariableSamples 는 **이름과 계약을 그대로 유지한 채** 그쪽에 위임한다 — 이
 *   함수를 부르는 미리보기 네 곳(EmailPreview·PhoneMessagePreview·TemplatePreview)은
 *   고치지 않아도 새 카탈로그로 치환된다. 치환 규칙은 데이터 층의 것이지 미리보기의 것이 아니다. */

/** 카카오 알림톡 변수 개수 상한 — 초과 시 반려(조사: 심사 가이드) */
export const TEMPLATE_VARIABLE_MAX = 40;

/** 본문에 실제로 쓰인 `#{...}` 변수 개수 */
export function countVariables(text: string): number {
  return text.match(/#\{[^}]+\}/g)?.length ?? 0;
}

/** 본문이 변수만으로 이뤄졌는지 — 알림톡 반려 사유(변수 전용 본문) */
export function isVariableOnlyBody(text: string): boolean {
  const stripped = text.replace(/#\{[^}]+\}/g, '').trim();
  return text.trim() !== '' && stripped === '';
}

/**
 * 미리보기용 — 알려진 변수는 표본값으로, 모르는 변수는 그대로 둔다.
 *
 * 규칙과 목록은 `shared/domain/template-variables` 가 갖는다(위 [삭제됨] 문단). 이 자리는
 * 기존 호출부를 위한 이름만 유지한다.
 */
export { applyTemplateVariableSamples as applyVariableSamples } from '../../../shared/domain/template-variables';

/* ── HTML 본문(이메일) — 순수 판정 ──────────────────────────────────────────────
 *
 * 이메일 템플릿 본문은 리치 텍스트(HTML)다. 검증(zod)·테스트는 DOM 없는 환경에서 도므로
 * @tds/ui 의 DOM 기반 richTextLength 를 쓸 수 없다 — 여기 정규식 근사치를 둔다(검증용으로 충분). */

/** HTML 태그를 걷어낸 대략적 평문 — 길이·빈값 판정의 공통 기반 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

/**
 * 리치 텍스트 본문이 실질적으로 비었는가. 에디터는 빈 상태에서도 `<p></p>` 를 내므로
 * 문자열 '' 검사로는 못 잡는다. 이미지만 있는 본문은 비지 않은 것으로 본다.
 */
export function isHtmlBodyEmpty(html: string): boolean {
  if (/<img\b/i.test(html)) return false;
  return htmlToPlainText(html) === '';
}

/** 값이 리치 텍스트(HTML)로 보이는가 — 태그가 하나라도 있으면 그렇게 본다 */
export function looksLikeRichText(value: string): boolean {
  return /<[a-z][^>]*>/i.test(value);
}

/**
 * 리치 텍스트 → **줄바꿈을 살린** 평문.
 *
 * htmlToPlainText 는 태그를 지우기만 해서 `<p>가</p><p>나</p>` 를 '가나' 로 붙여 버린다. 길이·빈값
 * 판정에는 충분하지만 사람이 읽을 본문으로 옮길 때는 문단이 뭉개진다. 블록 끝과 <br> 을 줄바꿈으로
 * 바꾼 뒤에 태그를 걷는다.
 */
export function richTextToPlainText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n');

  return (
    htmlToPlainText(withBreaks)
      // 문단 사이 빈 줄 하나까지만 남긴다 — 에디터가 내는 빈 <p> 가 줄바꿈을 부풀린다
      .replace(/\n{3,}/g, '\n\n')
  );
}

/**
 * 채널이 바뀔 때 본문을 새 채널의 표현으로 옮긴다.
 *
 * [왜 필요한가] body 는 채널이 공유하는 **한 개의 필드**인데 이메일만 HTML 을 쓴다. 변환 없이
 * 채널만 갈아타면 SMS·알림톡 본문에 `<p>…</p>` 가 남고, 그대로 저장돼 **수신자에게 태그가 문자로
 * 발송된다**. 미리보기에서 먼저 눈에 띄지만 문제는 저장 값에 있으므로 경계(채널 전환)에서 고친다.
 *
 * 반대 방향(→ 이메일)은 변환하지 않는다 — 평문은 RichTextField 의 ensureRichText 가 문단으로
 * 승격시키고, 그 승격은 에디터가 소유한 규칙이다.
 */
export function convertBodyForChannel(
  body: string,
  from: MessageChannel,
  to: MessageChannel,
): string {
  if (from === to || to === 'email') return body;
  return looksLikeRichText(body) ? richTextToPlainText(body) : body;
}

/* ── 발송 템플릿 ──────────────────────────────────────────────────────────────
 *
 * 채널(SMS/이메일/알림톡)별 재사용 문구. 템플릿 화면이 관리하고 발송 화면이 삽입한다.
 * 알림톡은 승인 상태를 갖고 승인된 것만 발송 가능. title 은 이메일 제목/알림톡 강조표기(SMS 는 ''). */
export interface MessageTemplate {
  readonly id: string;
  readonly name: string;
  readonly channel: MessageChannel;
  readonly title: string;
  readonly body: string;
  readonly approvalStatus: ApprovalStatus;
  /** 반려 사유 — approvalStatus 가 'rejected' 일 때 표시 */
  readonly rejectReason: string;
  readonly updatedAt: string;
}

export type MessageTemplateInput = Omit<MessageTemplate, 'id' | 'updatedAt'>;

export const TEMPLATE_NAME_MAX = 60;
export const TEMPLATE_TITLE_MAX = 100;
export const TEMPLATE_BODY_MAX = 2000;

export const TEMPLATE_FILTER_ALL = 'all';
export type TemplateChannelFilter = typeof TEMPLATE_FILTER_ALL | MessageChannel;

export function filterTemplatesByChannel(
  list: readonly MessageTemplate[],
  channel: TemplateChannelFilter,
): readonly MessageTemplate[] {
  if (channel === TEMPLATE_FILTER_ALL) return list;
  return list.filter((template) => template.channel === channel);
}

export function searchTemplates(
  list: readonly MessageTemplate[],
  keyword: string,
): readonly MessageTemplate[] {
  const needle = keyword.trim().toLowerCase();
  if (needle === '') return list;
  return list.filter(
    (template) =>
      template.name.toLowerCase().includes(needle) || template.body.toLowerCase().includes(needle),
  );
}

/** 발송 화면 삽입 후보 — 해당 채널 + (알림톡이면 승인된 것만) */
export function sendableTemplatesFor(
  list: readonly MessageTemplate[],
  channel: MessageChannel,
): readonly MessageTemplate[] {
  return list.filter(
    (template) =>
      template.channel === channel && isSendableTemplate(template.channel, template.approvalStatus),
  );
}

/* ── 바이트 · SMS 유형 판정 ───────────────────────────────────────────────────── */

const SMS_MAX_BYTES = 90;
export const LMS_MAX_BYTES = 2000;

/**
 * 제목(subject) 상한 — LMS·MMS 만 갖는다. **40 byte (한글 20자 / 영문 40자)**.
 *
 * [근거] SMS 에는 제목 필드 자체가 없고 LMS/MMS 만 제목을 갖는다(솔라피 문자 가이드
 * https://solapi.com/guides/sms). 40byte 라는 수치는 NHN Cloud SMS API v2.2 의 표준 규격 표가
 * 정본이다 — "LMS/MMS 제목: 40 bytes (한글 20자 / 영문 40자)", EUC-KR 기준:
 *   https://docs.nhncloud.com/ko/Notification/SMS/ko/api-guide-v2.2/
 *
 * [왜 본문과 같은 축(byte)인가] 제목도 문자 규격의 일부라 EUC-KR 바이트로 잰다 — 카카오의 글자 수
 * 축과 섞지 않는다(message-templates/kakao.ts 머리말이 그 갈림을 적어 둔다).
 *
 * [주의 — NHN 의 저장 한도는 더 크다] 같은 문서가 API **저장** 기준으로 제목 120자를 적지만,
 * "문자 잘림을 방지하기 위해 표준 규격으로 작성" 하라고 덧붙인다. 통신사에 실제로 닿는 경계는
 * 위 40byte 라 그쪽을 정본으로 삼는다.
 */
export const LMS_SUBJECT_MAX_BYTES = 40;

/** EUC-KR 기준 바이트 길이 — 한글/비ASCII 2byte, ASCII 1byte. 줄바꿈은 1byte 로 센다 */
// byteLengthOf 는 공통 모듈로 옮겼다 — 사이트 설정도 같은 규칙을 쓴다(shared/format.ts 머리말).
export { byteLengthOf } from '../../../shared/format';

export type SmsKind = 'sms' | 'lms' | 'mms';

const SMS_KIND_LABEL: Record<SmsKind, string> = {
  sms: 'SMS',
  lms: 'LMS',
  mms: 'MMS',
};

export function smsKindLabel(kind: SmsKind): string {
  return SMS_KIND_LABEL[kind];
}

/**
 * 이미지가 있으면 MMS, 없으면 90byte 이하 SMS·그 이상 LMS 로 자동 승격한다.
 *
 * [제목도 승격 사유다] SMS 에는 제목 필드가 아예 없다 — 제목을 한 글자라도 적으면 그 문자는
 * 90byte 안이어도 LMS 로 나간다. 솔라피 문자 가이드가 두 조건을 함께 적어 둔다:
 * "SMS 본문이 90bytes를 초과하거나 **제목 입력 시** LMS로 자동 전환되어 발송됩니다"
 *   https://solapi.com/guides/sms
 * 이 조건이 빠져 있으면 제목을 적은 90byte 이하 문자가 화면에서는 SMS(단가가 싸다)로 보이고
 * 실제로는 LMS 로 과금된다 — 운영자가 화면만 보고는 알 수 없는 어긋남이다.
 */
export function classifySms(bytes: number, hasImage: boolean, hasSubject = false): SmsKind {
  if (hasImage) return 'mms';
  return bytes <= SMS_MAX_BYTES && !hasSubject ? 'sms' : 'lms';
}

/** 선택한(자동 판정된) 유형의 바이트 한도 */
export function smsByteLimit(kind: SmsKind): number {
  return kind === 'sms' ? SMS_MAX_BYTES : LMS_MAX_BYTES;
}

/**
 * SMS 가 끝나고 LMS 가 시작되는 경계 — 미리보기가 '어디를 넘으면 승격되는가' 를 그리는 데 쓴다.
 *
 * [왜 smsByteLimit 로 대신할 수 없나] 그 함수는 **현재 등급의** 한도를 준다 — LMS 로 승격된 뒤에는
 * 2,000 을 돌려주므로 90 이라는 경계가 화면에서 사라진다. 정작 운영자가 알고 싶은 것은 '지금 몇
 * 바이트를 지웠어야 SMS 로 남았는가' 라서, 등급과 무관하게 고정인 이 값이 따로 필요하다.
 */
export const SMS_PROMOTION_THRESHOLD = SMS_MAX_BYTES;

/** 이 등급이 제목을 수신자에게 보여 주는가 — SMS 는 제목 필드가 없다(위 classifySms 머리말) */
export function showsSubject(kind: SmsKind): boolean {
  return kind !== 'sms';
}

/* ── 광고성 정보 규제 (정보통신망법 제50조) ───────────────────────────────────── */

const AD_PREFIX = '(광고)';

/** 무료 수신거부 표기로 인정하는 키워드(하나라도 있으면 충족) */
const OPT_OUT_KEYWORDS = ['무료수신거부', '무료거부', '수신거부'] as const;

export function hasAdPrefix(text: string): boolean {
  return text.trimStart().startsWith(AD_PREFIX);
}

export function hasOptOut(text: string): boolean {
  return OPT_OUT_KEYWORDS.some((keyword) => text.includes(keyword));
}

/** 광고 발송 본문 요건 — (광고) 표기 + 무료수신거부 문구를 모두 갖췄는가 */
export function meetsAdRequirements(text: string): boolean {
  return hasAdPrefix(text) && hasOptOut(text);
}

/* ── 야간 광고 전송 제한 (21:00~08:00) ─────────────────────────────────────────── */

const NIGHT_START_HOUR = 21;
const NIGHT_END_HOUR = 8;

/** 야간(21~08시) 시간대인가 — 시(hour) 단위 */
export function isNightHour(hour: number): boolean {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
}

/** 예약 시각(ISO/datetime-local)이 야간대인가. 잘못된 값은 false(별도 형식 검증에 맡긴다) */
export function isNightAt(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return isNightHour(date.getHours());
}

/* ── 발신번호 형식 ────────────────────────────────────────────────────────────── */

/** 국내 전화번호 — 숫자 9~11자리(하이픈 허용). 발신번호 사전등록 대상 */
function phoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function isPhoneNumber(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length >= 9 && digits.length <= 11;
}

export function formatPhone(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length < 4) return digits;
  if (digits.startsWith('02')) {
    const mid = digits.length > 9 ? digits.slice(2, 6) : digits.slice(2, 5);
    const tail = digits.slice(2 + mid.length);
    return [digits.slice(0, 2), mid, tail].filter((part) => part !== '').join('-');
  }
  const mid = digits.length > 10 ? digits.slice(3, 7) : digits.slice(3, 6);
  const tail = digits.slice(3 + mid.length);
  return [digits.slice(0, 3), mid, tail].filter((part) => part !== '').join('-');
}

/* ── 세그먼트 · 발신자 (데이터는 store, 타입은 여기) ───────────────────────────── */

/** 수신자 세그먼트(그룹) — 발송 대상 선택 단위 */
export interface Segment {
  readonly id: string;
  readonly label: string;
  /** 세그먼트 소속 수신자 수 */
  readonly recipientCount: number;
  readonly description: string;
}

/** 발신번호(SMS) — 사전등록·검증된 번호만 발신 가능 */
export interface SenderNumber {
  readonly id: string;
  readonly number: string;
  readonly label: string;
  /** 사전등록 검증 완료 여부 */
  readonly verified: boolean;
}

/** 발신자(이메일) — 발신 이메일 + 표시 이름 */
export interface SenderEmail {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly verified: boolean;
}

/* ── 발송 상태 (SMS·이메일·뉴스레터 캠페인 공통) ──────────────────────────────────
 *
 * 초안→예약→발송중→발송완료, 예약 취소. 실제 전송은 하지 않는다(각 data-source 의 // TODO(backend)
 * POST /api/campaigns/:id/send 주석만). 초안·예약만 편집 가능하다. */
export type SendStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'canceled';

export const SEND_STATUS_OPTIONS: readonly Option<SendStatus>[] = [
  { id: 'draft', label: '초안' },
  { id: 'scheduled', label: '예약' },
  { id: 'sending', label: '발송중' },
  { id: 'sent', label: '발송완료' },
  { id: 'canceled', label: '취소' },
] as const;

// [삭제됨] parseSendStatus / isSendStatus / SEND_STATUS_VALUES — 위 parseMessageChannel 과 같은 이유.
//   SMS·이메일·뉴스레터 목록이 IA-13 롤아웃으로 `parseFilter` 를 쓰면서 소비자가 0 이 됐다.

export const sendStatusLabel = (v: SendStatus): string => optionLabel(SEND_STATUS_OPTIONS, v);

const SEND_STATUS_TONE: Record<SendStatus, StatusTone> = {
  draft: 'neutral',
  scheduled: 'info',
  sending: 'warning',
  sent: 'success',
  canceled: 'danger',
};

export function sendStatusTone(status: SendStatus): StatusTone {
  return SEND_STATUS_TONE[status];
}

/**
 * 발송 상태가 허용하는 액션 — 상태마다 통째로 갈린다.
 *
 *   draft     → [수정] [삭제]
 *   scheduled → [수정] [예약취소] [삭제]
 *   sending   → (없음)
 *   sent      → [삭제]
 *   canceled  → [삭제]
 *
 * [왜 화면이 아니라 여기인가] message-templates/status.ts 의 actionsFor() 와 같은 이유다. 같은 판정을
 * 여러 곳이 한다: SMS·이메일·뉴스레터 목록 셋의 onEdit, 그리고 그 셋의 어댑터 update. 여섯 곳이 각자
 * `status === 'draft'` 를 세면 한 곳만 고쳐진 채 나머지가 남는다 — 전이 규칙의 정본을 한 파일에 둔다.
 *
 * [왜 sent 를 수정할 수 없나] 발송완료 캠페인은 '이미 나간 문자/메일' 의 기록이다. 그 자리에서 본문을
 * 갈아치우면 수신자가 받은 것과 관리자가 보는 것이 달라지고, 저장 시 상태가 초안으로 강등되면
 * 오픈율/클릭율이 무엇에 대한 수치인지 알 수 없게 된다(FS-035 §7 #14 · FS-033-EL-032).
 * 고치려면 복제해서 새 캠페인을 만든다 — 이력을 덮어쓰지 않는다.
 *
 * [이전 형태] `isEditableSend(status)` 단독 함수였다. **프로덕션 소비자가 0** 이었고(테스트만 호출)
 * 그래서 발송완료 캠페인이 편집으로 열렸다. 액션 묶음으로 바꿔 이 안에 흡수한다.
 */
export interface SendActions {
  /** 초안·예약만 편집한다(발송중/완료/취소는 조회만) */
  readonly canEdit: boolean;
  /** 예약만 취소한다 — 아직 일어나지 않은 실행을 물리는 행위다 */
  readonly canCancel: boolean;
  /** 발송중만 지울 수 없다 — 실행 중인 작업의 원본을 지우면 결과를 붙일 곳이 사라진다 */
  readonly canDelete: boolean;
}

export function sendActionsFor(status: SendStatus): SendActions {
  return {
    canEdit: status === 'draft' || status === 'scheduled',
    canCancel: status === 'scheduled',
    canDelete: status !== 'sending',
  };
}

/**
 * 발송 폼(SMS·이메일) 저장 버튼 라벨 — 저장은 실제 전송이 아니다.
 * 예약이면 '예약 저장', 아니면 '초안 저장'. 두 폼이 같은 3분기를 반복해 한 벌로 모은다.
 */
export function sendSubmitLabel(saving: boolean, status: 'draft' | 'scheduled'): string {
  if (saving) return '저장 중…';
  return status === 'scheduled' ? '예약 저장' : '초안 저장';
}

/* ── 발송 결과 통계 ─────────────────────────────────────────────────────────────
 *
 * 성공/실패/수신거부(반송) — 발송완료 캠페인의 결과. 성공률은 성공÷전체(0 나눗셈 방어). */
export interface SendStats {
  readonly total: number;
  readonly success: number;
  readonly failed: number;
}

/** 성공률(%) — 정수 반올림. 전체 0 이면 0 */
export function successRate(stats: SendStats): number {
  if (stats.total <= 0) return 0;
  return Math.round((stats.success / stats.total) * 100);
}

/** 이메일·뉴스레터 결과 — 발송 통계에 오픈/클릭을 더한다 */
export interface MailStats extends SendStats {
  readonly opened: number;
  readonly clicked: number;
}

/** 오픈율(%) — 오픈÷성공(전달) 기준. 성공 0 이면 0 */
export function openRate(stats: MailStats): number {
  if (stats.success <= 0) return 0;
  return Math.round((stats.opened / stats.success) * 100);
}

/** 클릭율(%) — 클릭÷성공(전달) 기준. 성공 0 이면 0 */
export function clickRate(stats: MailStats): number {
  if (stats.success <= 0) return 0;
  return Math.round((stats.clicked / stats.success) * 100);
}

/* ── 예상 발송 건수/비용 (건당 과금) ──────────────────────────────────────────────
 *
 * 세그먼트 수신자 수 합. 건당 과금은 유형별 단가(참고값)로 곱한다 — 실단가는 연동 시 서버가 준다. */
export function totalRecipients(
  segments: readonly Segment[],
  selectedIds: readonly string[],
): number {
  const selected = new Set(selectedIds);
  return segments
    .filter((segment) => selected.has(segment.id))
    .reduce((sum, segment) => sum + segment.recipientCount, 0);
}
