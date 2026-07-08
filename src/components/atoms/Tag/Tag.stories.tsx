import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';
import { Icon } from '../Icon';
import { tagMeta } from './Tag.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Tag> = {
  title: 'Atoms/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: metaParameters(tagMeta),
  argTypes: argTypesFromMeta(tagMeta),
  args: { ...argsFromMeta(tagMeta), children: 'design-system' },
};
export default meta;

type Story = StoryObj<typeof Tag>;

export const Playground: Story = {};
export const Closable: Story = { args: { closable: true, tone: 'brand', variant: 'soft' } };

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-2)' }}>
      <Tag icon={<Icon name="tag" size={12} />}>Label</Tag>
      <Tag icon={<Icon name="dot" size={8} filled />}>Status</Tag>
    </div>
  ),
};
