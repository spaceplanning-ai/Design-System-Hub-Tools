// 발신 프로필 카드 (편집기 좌측 · 상세 좌측이 공유)
//
// [왜 한 컴포넌트가 둘을 다 그리나] 상세의 좌측 카드는 편집기의 좌측 카드와 **같은 두 칸을 잠근
// 모습**이다(목업). 상세에 읽기 전용 dl 을 따로 그리면 같은 정보가 두 가지 모양으로 존재하게 되고,
// 발신 프로필에 항목이 하나 늘 때 한쪽만 늘어난다. disabled 하나로 두 화면을 낸다.
//
// [글자는 한 벌이다] 편집기가 영문이던 시절에는 `variant` 로 라벨 한 벌을 골라 받았다. 두 화면이
// 같은 한글을 쓰게 되면서 고를 것이 없어져 SENDER_CARD_COPY 한 벌만 읽는다(copy.ts 머리말).
//
// [둘째 칸은 종류가 정한다 — 이메일에 발신번호는 없다]
// 예전에는 이 카드가 언제나 발신번호 칸을 그렸다. 그래서 **이메일 템플릿 상세가 전화번호 줄을
// 띄웠다** — 이메일에는 발신번호라는 것이 아예 없는데도(TextTemplateContent 만 senderPhone 을 갖고,
// EmailTemplateContent 는 senderEmail 을 갖는다. types.ts). 호출부가 빈 문자열을 넘겨 그 줄을 비우는
// 식으로 덮으면 '값이 비었다' 와 '이 개념이 없다' 가 화면에서 같아 보인다. 그래서 카드가 채널을
// 판별 유니온으로 받고 종류에 맞는 칸을 그린다 — 없는 개념은 빈 칸이 아니라 아예 그리지 않는다.
//
// [왜 입력이 아니라 select 인가] 문자 발신번호는 사전등록제라 미등록 번호로는 발송 자체가 되지
// 않는다(types.ts SenderProfile 머리말). 손으로 칠 수 있게 두면 저장은 되고 발송만 실패한다.
// 이메일 주소도 같다 — SPF/DKIM 이 걸린 주소만 스팸함을 피한다.
import { Card, CardTitle, errorIdOf, FormField, SelectField } from '../../../../shared/ui';
import {
  KAKAO_CHANNEL_PLACEHOLDER,
  KAKAO_LABEL_CHANNEL,
  SENDER_CARD_COPY,
  SENDER_PROFILE_PLACEHOLDER,
  PHONE_PLACEHOLDER,
} from '../copy';
import type { SenderCardCopy } from '../copy';
import type { KakaoChannel } from '../kakao';
import { accentTitleStyle, sectionStyle } from '../styles';
import type { SenderProfile } from '../types';

const PROFILE_FIELD_ID = 'message-template-sender-profile';
/** 칸이 갈리므로 id 도 갈린다 — 라벨의 htmlFor 와 오류 id 가 서로 다른 칸을 가리키지 않게 한다 */
const CHANNEL_FIELD_ID: Readonly<Record<SenderChannel['kind'], string>> = {
  text: 'message-template-sender-phone',
  email: 'message-template-sender-email',
  kakao: 'message-template-sender-kakao-channel',
};

/**
 * 둘째 칸이 무엇인가 — 문자는 발신번호, 이메일은 발신 주소, 카카오는 발신 채널.
 * `kind` 는 TemplateContent 의 그것과 같은 낱말을 쓴다(호출부가 `content.kind` 로 그대로 좁힌다).
 *
 * [왜 카카오만 후보를 들고 오는가] 발신번호·발신 이메일은 **고른 프로필의 것**이라 후보를 프로필에서
 * 판다. 카카오 채널은 우리 조직 자산이 아니라 카카오 비즈니스에 등록한 계정이라 프로필과 아무
 * 관계가 없다 — 회사 전체가 채널 한둘을 공유한다(store.ts listKakaoChannels 머리말). 그래서 후보의
 * 출처가 다르고, 다른 것은 타입이 그렇게 말하게 둔다(빈 배열을 넘겨 흉내 내지 않는다).
 *
 * [왜 export 하지 않는가] 호출부는 객체 리터럴을 그대로 넘기고 **구조적으로** 이 타입을 만족한다 —
 * 이름을 내보내면 소비자 0인 export 가 한 건 늘 뿐이다(crud.ts WriteContext 가 같은 이유로 그렇다).
 */
type SenderChannel =
  | { readonly kind: 'text'; readonly phone: string }
  | { readonly kind: 'email'; readonly email: string }
  | {
      readonly kind: 'kakao';
      readonly channelId: string;
      readonly channels: readonly KakaoChannel[];
    };

/** 드롭다운 한 줄 — 카카오 채널은 id 와 보이는 이름이 다르므로 값과 글자를 갈라 둔다 */
interface ChannelOption {
  readonly value: string;
  readonly label: string;
}

interface ChannelField {
  readonly value: string;
  readonly options: readonly ChannelOption[];
  readonly label: string;
  readonly placeholder: string;
  /** 프로필을 먼저 골라야 하는가 — 카카오 채널만 프로필과 무관하다 */
  readonly needsProfile: boolean;
}

/**
 * 저장된 값이 후보에 없을 수 있다(번호가 회수됐거나 채널 연결이 끊겼다). 조용히 버리면 상세가
 * '값 없음' 으로 보이므로 맨 앞에 그대로 얹어 **사실을 보인다** — 잘못된 값이 있다는 것 자체가 정보다.
 */
function withUnknown(value: string, options: readonly ChannelOption[]): readonly ChannelOption[] {
  if (value === '' || options.some((option) => option.value === value)) return options;
  return [{ value, label: value }, ...options];
}

const asOptions = (values: readonly string[]): readonly ChannelOption[] =>
  values.map((value) => ({ value, label: value }));

function channelFieldOf(
  channel: SenderChannel,
  selected: SenderProfile | null,
  copy: SenderCardCopy,
): ChannelField {
  switch (channel.kind) {
    case 'text':
      return {
        value: channel.phone,
        options: withUnknown(channel.phone, asOptions(selected?.phoneNumbers ?? [])),
        label: copy.phoneLabel,
        placeholder: PHONE_PLACEHOLDER,
        needsProfile: true,
      };
    case 'email':
      return {
        value: channel.email,
        options: withUnknown(channel.email, asOptions(selected?.emails ?? [])),
        label: copy.emailLabel,
        // 목업이 번호 칸에만 예시(0123456789)를 줬다 — 나머지는 라벨과 같은 벌을 쓴다
        placeholder: copy.emailLabel,
        needsProfile: true,
      };
    case 'kakao':
      return {
        value: channel.channelId,
        options: withUnknown(
          channel.channelId,
          channel.channels.map((one) => ({ value: one.id, label: `${one.name} ${one.searchId}` })),
        ),
        label: KAKAO_LABEL_CHANNEL,
        placeholder: KAKAO_CHANNEL_PLACEHOLDER,
        // 카카오 채널은 프로필의 자산이 아니다 — 프로필을 고르기 전에도 고를 수 있다
        needsProfile: false,
      };
  }
}

interface SenderProfileCardProps {
  readonly profiles: readonly SenderProfile[];
  readonly profileId: string;
  readonly channel: SenderChannel;
  readonly disabled: boolean;
  readonly profileError?: string | undefined;
  /** 둘째 칸의 오류 — 문자 편집기의 발신번호 검증이 유일한 출처다 */
  readonly channelError?: string | undefined;
  readonly onProfileChange: (id: string) => void;
  /** 둘째 칸의 변경 — 상세는 읽기 전용이라 아무것도 하지 않는다 */
  readonly onChannelChange: (value: string) => void;
}

export function SenderProfileCard({
  profiles,
  profileId,
  channel,
  disabled,
  profileError,
  channelError,
  onProfileChange,
  onChannelChange,
}: SenderProfileCardProps) {
  const copy = SENDER_CARD_COPY;

  /**
   * 후보는 **고른 프로필의 것만** 보인다. 전체를 보이면 마케팅센터 이름으로 고객지원 번호가
   * 나가는 조합을 화면이 허락하게 된다 — 조합의 유효성은 여기서 닫는다.
   *
   * 저장된 값이 목록에 없을 수도 있다(프로필이 바뀌었거나 번호가 회수됐다). 그 값을 조용히 버리면
   * 상세 화면이 '번호 없음' 으로 보이므로, 목록에 없으면 맨 앞에 그대로 얹어 사실을 보인다.
   */
  const selected = profiles.find((profile) => profile.id === profileId) ?? null;

  /**
   * 둘째 칸이 무엇을 그릴지를 한 번에 정한다 — 값·후보·라벨·자리표시자.
   *
   * [왜 exhaustive switch 인가] 세 갈래를 삼항 연산자로 늘어놓으면 네 번째 채널이 생겼을 때
   * 모든 삼항이 조용히 마지막 갈래로 흘러간다(카카오 칸에 이메일 라벨이 붙는 식이다). switch 는
   * 그때 컴파일 오류로 빠진 자리를 알려 준다.
   *
   * [왜 {value,label} 인가] 번호·주소는 값이 곧 보이는 글자지만 **카카오 채널은 id 와 이름이
   * 다르다** — 문자열 배열로는 `kc-main` 이 드롭다운에 그대로 보인다.
   */
  const field = channelFieldOf(channel, selected, copy);
  const channelFieldId = CHANNEL_FIELD_ID[channel.kind];

  return (
    <Card>
      <CardTitle>
        <span style={accentTitleStyle}>{copy.title}</span>
      </CardTitle>

      <div style={sectionStyle}>
        <FormField
          htmlFor={PROFILE_FIELD_ID}
          label={copy.profileLabel}
          required
          error={profileError}
        >
          <SelectField
            id={PROFILE_FIELD_ID}
            value={profileId}
            disabled={disabled}
            isInvalid={profileError !== undefined}
            aria-invalid={profileError !== undefined}
            {...(profileError !== undefined && { 'aria-describedby': errorIdOf(PROFILE_FIELD_ID) })}
            onChange={(event) => onProfileChange(event.target.value)}
          >
            <option value="">{SENDER_PROFILE_PLACEHOLDER}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </SelectField>
        </FormField>

        <FormField htmlFor={channelFieldId} label={field.label} required error={channelError}>
          <SelectField
            id={channelFieldId}
            value={field.value}
            // 프로필을 고르기 전에는 고를 것 자체가 없다 — 빈 드롭다운을 열게 두지 않는다
            // (카카오 채널만 예외다: 프로필의 자산이 아니라 후보가 프로필과 무관하게 존재한다)
            disabled={disabled || (field.needsProfile && selected === null)}
            isInvalid={channelError !== undefined}
            aria-invalid={channelError !== undefined}
            {...(channelError !== undefined && { 'aria-describedby': errorIdOf(channelFieldId) })}
            onChange={(event) => onChannelChange(event.target.value)}
          >
            <option value="">{field.placeholder}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </FormField>
      </div>
    </Card>
  );
}
