import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';
import { labelMeta } from './Label.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: metaParameters(labelMeta),
  argTypes: argTypesFromMeta(labelMeta),
  args: { ...argsFromMeta(labelMeta), children: 'Email address' },
};
export default meta;

type Story = StoryObj<typeof Label>;

export const Playground: Story = {};
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true } };

export const RequiredOptional: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Label required>Email</Label>
      <Label optional>Nickname</Label>
      <Label hint="We never share this">Phone</Label>
    </div>
  ),
};
