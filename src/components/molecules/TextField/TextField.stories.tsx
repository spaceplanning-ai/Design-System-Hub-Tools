import type { Meta, StoryObj } from '@storybook/react';
import { TextField } from './TextField';
import { textFieldMeta } from './TextField.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof TextField> = {
  title: 'Molecules/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: metaParameters(textFieldMeta),
  argTypes: argTypesFromMeta(textFieldMeta),
  args: { ...argsFromMeta(textFieldMeta), label: 'Email address', placeholder: 'you@example.com' },
  decorators: [(Story) => <div style={{ maxWidth: 460 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof TextField>;

export const Playground: Story = {};

/** All three purpose-built layouts side by side. */
export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-6)' }}>
      <TextField {...args} type="A" label="Type A — Stacked" hint="Label sits above the input." iconStart={<Icon name="mail" size="sm" />} />
      <TextField {...args} type="B" label="Type B — Floating" hint="Label floats on focus / when filled." />
      <TextField {...args} type="C" label="Type C — Inline" hint="Label sits to the left." />
    </div>
  ),
};

export const TypeA: Story = {
  args: { type: 'A', label: 'Full name', hint: 'As it appears on your ID.', iconStart: <Icon name="user" size="sm" /> },
};

export const TypeB: Story = {
  args: { type: 'B', label: 'Email address', placeholder: 'you@example.com' },
};

export const TypeC: Story = {
  args: { type: 'C', label: 'Company', placeholder: 'Acme Inc.' },
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-5)' }}>
      <TextField {...args} type="A" label="Default" />
      <TextField {...args} type="A" label="Required" required />
      <TextField {...args} type="A" label="Error" error="Please enter a valid email." defaultValue="invalid@" />
      <TextField {...args} type="A" label="Success" status="success" defaultValue="jane@example.com" />
      <TextField {...args} type="A" label="Disabled" disabled />
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-4)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <TextField {...args} key={s} type="B" size={s} label={`Size ${s}`} />
      ))}
    </div>
  ),
};

export const SuccessState: Story = {
  args: { label: 'Email', success: 'Address verified', defaultValue: 'a@b.com' },
};

export const PasswordReveal: Story = {
  args: { label: 'Password', inputType: 'password', revealable: true, defaultValue: 'secret' },
};
