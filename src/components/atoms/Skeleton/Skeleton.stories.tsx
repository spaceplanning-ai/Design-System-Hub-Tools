import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';
import { skeletonMeta } from './Skeleton.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: metaParameters(skeletonMeta),
  argTypes: argTypesFromMeta(skeletonMeta),
  args: { ...argsFromMeta(skeletonMeta), width: 240, height: 16 },
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Playground: Story = {};

export const Shapes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-5)' }}>
      <Skeleton {...args} shape="circle" width={48} height={48} />
      <Skeleton {...args} shape="rounded" width={120} height={72} />
      <Skeleton {...args} shape="rect" width={120} height={72} />
      <Skeleton {...args} shape="text" width={160} height={16} />
    </div>
  ),
};

export const TextLines: Story = {
  args: { shape: 'text', lines: 4, width: 320 },
};

/** A typical media card placeholder composed from bones. */
export const CardExample: Story = {
  render: (args) => (
    <div
      style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)' }}
    >
      <Skeleton {...args} shape="rounded" width="100%" height={150} />
      <div style={{ display: 'flex', gap: 'var(--tds-space-3)', alignItems: 'center' }}>
        <Skeleton {...args} shape="circle" width={40} height={40} />
        <div style={{ flex: 1 }}>
          <Skeleton {...args} shape="text" lines={2} />
        </div>
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: (args) => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-4)', width: 280 }}
    >
      {(['shimmer', 'pulse', 'none'] as const).map((a) => (
        <div key={a}>
          <code style={{ fontSize: 12, color: 'var(--tds-color-fg-subtle)' }}>{a}</code>
          <Skeleton {...args} animation={a} shape="rounded" width="100%" height={48} />
        </div>
      ))}
    </div>
  ),
};
