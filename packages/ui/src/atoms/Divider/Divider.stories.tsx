// Divider — Storybook 스토리 (CSF3 · Data Display/Divider)
//
// argTypes 는 계약 생성물(generated/argtypes/Divider.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: orientation 2변형 전수 + Dark/RTL + 실제 배치(툴바·목록) 시연.
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { DividerArgTypes } from '../../../generated/argtypes/Divider.argtypes';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Design System/Components/Divider',
  component: Divider,
  argTypes: { ...DividerArgTypes },
  args: { orientation: 'horizontal' },
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Divider>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** 기본형 — 부모 폭을 채우는 가로선 */
export const Default: Story = {};

/** 세로선 — 부모 높이에 맞춰 늘어난다. 툴바가 쓰는 쪽이다 */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
      <span>실행취소</span>
      <Divider {...args} />
      <span>다시하기</span>
    </div>
  ),
};

/** 두 방향 한눈에 — 값이 둘뿐이라 갤러리가 곧 전량이다 */
export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-5)' }}>
      <div>
        <p>horizontal</p>
        <Divider orientation="horizontal" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
        <span>vertical</span>
        <Divider orientation="vertical" />
        <span>사이를 가른다</span>
      </div>
    </div>
  ),
};

/** 목록 사이 구분 — 실제로 쓰이는 배치 */
export const InList: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li style={{ paddingBlock: 'var(--tds-space-3)' }}>공지사항</li>
      <Divider />
      <li style={{ paddingBlock: 'var(--tds-space-3)' }}>자주 묻는 질문</li>
      <Divider />
      <li style={{ paddingBlock: 'var(--tds-space-3)' }}>1:1 문의</li>
    </ul>
  ),
};

/** RTL — 치수를 논리 속성으로만 그리므로 방향이 뒤집혀도 같은 선이다 */
export const RightToLeft: Story = {
  args: { orientation: 'vertical' },
  decorators: [rtlFrame],
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
      <span>يمين</span>
      <Divider {...args} />
      <span>يسار</span>
    </div>
  ),
};
