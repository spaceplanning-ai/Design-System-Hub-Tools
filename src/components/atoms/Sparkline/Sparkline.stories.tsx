import type { Meta, StoryObj } from '@storybook/react';
import { Sparkline } from './Sparkline';
import { sparklineMeta } from './Sparkline.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const DATA = [12, 18, 14, 22, 19, 28, 25, 34, 31, 42];

const meta: Meta<typeof Sparkline> = {
  title: 'Atoms/Sparkline',
  component: Sparkline,
  tags: ['autodocs'],
  parameters: metaParameters(sparklineMeta),
  argTypes: argTypesFromMeta(sparklineMeta),
  args: { ...argsFromMeta(sparklineMeta), data: DATA },
};
export default meta;

type Story = StoryObj<typeof Sparkline>;

export const Line: Story = {};

export const Bars: Story = { args: { type: 'B', color: '2' } };

/** Inline in a stat tile: value + trend. */
export const InStatTile: Story = {
  render: (args) => (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 4,
        padding: 'var(--tds-space-4)',
        border: '1px solid var(--tds-color-border-default)',
        borderRadius: 'var(--tds-radius-lg)',
        minWidth: 180,
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)' }}>월 매출</span>
      <span style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        ₩42.0M
      </span>
      <Sparkline {...args} width={160} height={36} />
    </div>
  ),
};
