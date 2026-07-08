import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';
import { dividerMeta } from './Divider.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Divider> = {
  title: 'Atoms/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: metaParameters(dividerMeta),
  argTypes: argTypesFromMeta(dividerMeta),
  args: argsFromMeta(dividerMeta),
};
export default meta;

type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = { render: (a) => <Divider {...a} /> };
export const WithLabel: Story = { args: { label: 'OR' } };
export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', height: 40, alignItems: 'center' }}>
      <span>Left</span>
      <Divider orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
