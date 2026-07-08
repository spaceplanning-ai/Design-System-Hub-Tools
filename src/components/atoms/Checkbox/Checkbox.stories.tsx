import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';
import { checkboxMeta } from './Checkbox.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: metaParameters(checkboxMeta),
  argTypes: argTypesFromMeta(checkboxMeta),
  args: { ...argsFromMeta(checkboxMeta), children: 'Accept terms' },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {};

export const States: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Checkbox {...a} defaultChecked>
        Checked
      </Checkbox>
      <Checkbox {...a} indeterminate>
        Indeterminate
      </Checkbox>
      <Checkbox {...a} invalid>
        Invalid
      </Checkbox>
      <Checkbox {...a} disabled>
        Disabled
      </Checkbox>
    </div>
  ),
};

export const WithDescription: Story = {
  render: (a) => (
    <Checkbox {...a} description="You can unsubscribe anytime.">
      Email updates
    </Checkbox>
  ),
};
