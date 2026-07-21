// Badge — Storybook 스토리 (CSF3 · Atoms/Badge)
//
// [고정 IA] 비대화형 카운트 배지라 Playground/Interaction 이 없다. 아래 카테고리만 쓴다:
//   Overview        — 대표 쓰임새 한눈에(제목 옆 카운트 배지 tone 조합)
//   Variants/       — 의미 tone(neutral·danger·success)
//   Content/        — 자릿수(콘텐츠 형태)
//   Examples/       — hideWhenZero 분기 실제 사용 사례
//   Accessibility/  — RTL (dir=rtl · 한국어)
// argTypes 는 계약 생성물(generated/argtypes/Badge.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: combinationMatrix(tone 3 × state 1) 전수 + boolean(hideWhenZero) true/false + Dark/RTL.
import type { CSSProperties } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { BadgeArgTypes } from '../../../generated/argtypes/Badge.argtypes';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Design System/Components/Badge',
  component: Badge,
  argTypes: { ...BadgeArgTypes },
  args: { count: 3, tone: 'neutral', hideWhenZero: true },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof Badge>;

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
};

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 대표 쓰임새 한눈에. 제목 옆 카운트 배지가 tone 별로 나란히 놓이는 것이 가장 흔하다 */
export const Overview: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <Badge {...args} tone="neutral" count={3} />
      <Badge {...args} tone="success" count={7} />
      <Badge {...args} tone="danger" count={12} />
    </div>
  ),
};

/** neutral — 텍스트색 배경 위 서피스색 숫자 */
export const Neutral: Story = {
  name: 'Variants/Neutral',
  args: { tone: 'neutral', count: 3 },
};

/** danger — 처리 대기 건수 강조 */
export const Danger: Story = {
  name: 'Variants/Danger',
  args: { tone: 'danger', count: 12 },
};

/** success — 완료 건수 */
export const Success: Story = {
  name: 'Variants/Success',
  args: { tone: 'success', count: 7 },
};

/** 최소 콘텐츠 — 한 자리 수 */
export const MinimalCount: Story = {
  name: 'Content/Small Count',
  args: { count: 1 },
};

/** 최대 콘텐츠 — 자릿수가 늘어도 pill 이 깨지지 않는다 (min-inline-size + padding) */
export const LargeCount: Story = {
  name: 'Content/Large Count',
  args: { count: 129384, tone: 'danger' },
};

/** hideWhenZero=true + count=0 → 아무것도 렌더하지 않는다 (계약: `if (count <= 0) return null`) */
export const HiddenWhenZero: Story = {
  name: 'Examples/Hidden When Zero',
  args: { count: 0, hideWhenZero: true },
};

/** hideWhenZero=false + count=0 → 0 도 표시한다 */
export const VisibleWhenZero: Story = {
  name: 'Examples/Visible When Zero',
  args: { count: 0, hideWhenZero: false },
};

/** 음수 — hideWhenZero=false 면 그대로 표시된다 (계약: count<=0 판정) */
export const NegativeVisible: Story = {
  name: 'Examples/Negative Value',
  args: { count: -1, hideWhenZero: false },
};

/** RTL — dir=rtl 컨테이너에서 한국어 문맥으로 그려진다 */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { count: 42, tone: 'success' },
  decorators: [rtlFrame],
};
