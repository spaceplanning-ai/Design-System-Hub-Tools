import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';
import { progressMeta } from './Progress.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Progress> = {
  title: 'Atoms/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: metaParameters(progressMeta),
  argTypes: argTypesFromMeta(progressMeta),
  args: argsFromMeta(progressMeta),
  decorators: [(Story) => <div style={{ width: 320 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Progress>;

export const Playground: Story = {};
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Tones: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      {(['brand', 'success', 'warning', 'danger'] as const).map((t, i) => (
        <Progress key={t} {...a} tone={t} value={(i + 1) * 22} />
      ))}
    </div>
  ),
};

export const WithLabel: Story = {
  args: { label: 'Uploading…', showValue: true, value: 68 },
};

export const Circular: Story = {
  decorators: [(Story) => <>{Story()}</>],
  render: (a) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-5)', alignItems: 'center' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Progress key={s} {...a} variant="circular" size={s} value={72} showValue />
      ))}
      <Progress {...a} variant="circular" tone="success" value={100} showValue />
      <Progress {...a} variant="circular" indeterminate />
    </div>
  ),
};
