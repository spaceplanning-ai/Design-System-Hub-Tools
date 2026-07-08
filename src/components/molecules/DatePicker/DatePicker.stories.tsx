import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from './DatePicker';
import { datePickerMeta } from './DatePicker.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof DatePicker> = {
  title: 'Molecules/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: { ...metaParameters(datePickerMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(datePickerMeta),
  args: argsFromMeta(datePickerMeta),
  decorators: [
    (Story) => (
      <div style={{ width: 280, minHeight: 360 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

export const Playground: Story = {
  args: { defaultValue: '2026-07-05' },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('2026-07-05');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)' }}>
        <DatePicker {...args} value={value} onValueChange={setValue} />
        <p style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)' }}>
          선택: {value || '(없음)'}
        </p>
      </div>
    );
  },
};

/** Only dates within the given window are selectable. */
export const Bounded: Story = {
  args: { defaultValue: '2026-07-15', min: '2026-07-05', max: '2026-07-25' },
};

export const ErrorState: Story = {
  args: { status: 'error', defaultValue: '2026-13-40' },
};
