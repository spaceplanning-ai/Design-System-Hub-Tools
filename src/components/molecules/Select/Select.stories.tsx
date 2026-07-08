import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';
import { selectMeta } from './Select.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../../atoms/Icon';

const options = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
];

const meta: Meta<typeof Select> = {
  title: 'Molecules/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: metaParameters(selectMeta),
  argTypes: argTypesFromMeta(selectMeta),
  args: { ...argsFromMeta(selectMeta), options, placeholder: 'Choose a country' },
  decorators: [(Story) => <div style={{ maxWidth: 320 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Playground: Story = {};
export const Error: Story = { args: { status: 'error', defaultValue: 'us' } };
export const Disabled: Story = { args: { disabled: true } };

/** A leading icon renders inside the control. */
export const WithLeadingIcon: Story = {
  render: () => <Select iconStart={<Icon name="globe" size="sm" />} options={options} placeholder="Country" />,
};

/** Error and success states render their matching status icons. */
export const StatusIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Select status="error" options={options} defaultValue="us" />
      <Select status="success" options={options} defaultValue="jp" />
    </div>
  ),
};
