// Divider — Storybook 스토리 (CSF3 · Data Display/Divider)
//
// argTypes 는 계약 생성물(generated/argtypes/Divider.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: orientation 2변형 전수 + Dark/RTL + 실제 배치(툴바·목록) 시연.
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { DividerArgTypes } from '../../../generated/argtypes/Divider.argtypes';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Data Display/Divider',
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
