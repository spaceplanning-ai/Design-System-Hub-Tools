import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';
import { radioMeta } from './Radio.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Radio> = {
  title: 'Atoms/Radio',
  component: Radio,
  tags: ['autodocs'],
  parameters: metaParameters(radioMeta),
  argTypes: argTypesFromMeta(radioMeta),
  args: { ...argsFromMeta(radioMeta), children: 'Option' },
};
export default meta;

type Story = StoryObj<typeof Radio>;

export const Playground: Story = {};

export const Group: Story = {
  render: (a) => (
    <div role="radiogroup" style={{ display: 'grid', gap: 'var(--tds-space-2)' }}>
      <Radio {...a} name="plan" defaultChecked>
        Starter
      </Radio>
      <Radio {...a} name="plan">
        Pro
      </Radio>
      <Radio {...a} name="plan" disabled>
        Enterprise (disabled)
      </Radio>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div role="radiogroup" style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Radio name="plan" description="$0 forever" defaultChecked>
        Free
      </Radio>
      <Radio name="plan" description="$12 per month">
        Pro
      </Radio>
    </div>
  ),
};
