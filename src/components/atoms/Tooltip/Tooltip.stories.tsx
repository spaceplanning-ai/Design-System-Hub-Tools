import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { tooltipMeta } from './Tooltip.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: metaParameters(tooltipMeta),
  argTypes: argTypesFromMeta(tooltipMeta),
  args: { content: 'Helpful hint', placement: 'top', tone: 'inverse' },
  decorators: [(Story) => <div style={{ padding: 48 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {
  render: (a) => (
    <Tooltip {...a}>
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-6)' }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((p) => (
        <Tooltip key={p} content={`Placed ${p}`} placement={p}>
          <Button variant="outline">{p}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};
