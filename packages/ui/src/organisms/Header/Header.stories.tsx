// Header — Storybook 스토리 (CSF3 · Navigation/Header)
//
// argTypes 는 계약 생성물(generated/argtypes/Header.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// meta 는 node 슬롯이라 control 비활성 — Story args 로 직접 준다 (ADR-0003).
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { HeaderArgTypes } from '../../../generated/argtypes/Header.argtypes';
import { Header } from './Header';

/** 메타 슬롯 표본 — 오늘 날짜와 로그인 계정. 포맷은 앱의 일이라 DS 는 자리만 준다 */
const SAMPLE_META = (
  <>
    <p style={{ margin: 0, fontWeight: 'var(--tds-primitive-typography-font-weight-bold)' }}>
      <time dateTime="2026-07-20">2026. 7. 20 (월)</time>
    </p>
    <p style={{ margin: 0, color: 'var(--tds-color-text-muted)' }}>test@example.com</p>
  </>
);

const meta: Meta<typeof Header> = {
  title: 'Navigation/Header',
  component: Header,
  argTypes: { ...HeaderArgTypes },
  args: {
    title: '회원 관리',
    eyebrow: 'LOGO · 관리자',
    meta: SAMPLE_META,
  },
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof Header>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl">
    <Story />
  </div>
);

/** default — 눈썹 + 제목 + 메타가 모두 있는 기본형 */
export const Default: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).not.toBeNull();
    await expect(canvas.getByRole('heading', { level: 1, name: '회원 관리' })).not.toBeNull();
  },
};

/** 눈썹 없음 — 빈 문자열이면 그 줄 자체를 그리지 않는다(빈 <p> 를 남기면 제목이 밀린다) */
export const WithoutEyebrow: Story = {
  args: { eyebrow: '' },
};

/** 메타 없음 — 제목이 폭을 다 쓴다 */
export const WithoutMeta: Story = {
  args: { meta: null },
};

/** 제목만 — 필수 prop 하나로 성립하는 최소 형태 */
export const TitleOnly: Story = {
  args: { eyebrow: '', meta: null },
};

/** 최대 콘텐츠 — 제목이 길어도 높이는 고정이다(사이드바 브랜드 영역과 구분선을 맞춰야 한다) */
export const LongTitle: Story = {
  args: { title: '마케팅 이메일 템플릿 상세 · 발송 이력 및 수신 거부 관리' },
};

/** RTL — 논리 속성만 쓰므로 제목과 메타가 자리를 바꾼다 */
export const RightToLeft: Story = {
  args: {
    title: 'إدارة الأعضاء',
    eyebrow: 'LOGO · مدير',
    meta: <p style={{ margin: 0 }}>test@example.com</p>,
  },
  decorators: [rtlFrame],
};
