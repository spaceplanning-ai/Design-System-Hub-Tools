// Spinner — Storybook 스토리 (CSF3 · Feedback/Spinner)
//
// argTypes 는 계약 생성물(generated/argtypes/Spinner.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: size 4변형 전수 + label 유/무(장식 ↔ role=status) + Dark/RTL + currentColor 승계 증명.
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { SpinnerArgTypes } from '../../../generated/argtypes/Spinner.argtypes';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Feedback/Spinner',
  component: Spinner,
  argTypes: { ...SpinnerArgTypes },
  args: { size: 'inherit', label: '' },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof Spinner>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** RTL — 원이라 방향이 뒤집혀도 같은 형태다. 회전 방향도 바뀌지 않는다 */
export const RightToLeft: Story = {
  args: { size: 'lg', label: 'جار التحميل' },
  decorators: [rtlFrame],
};
