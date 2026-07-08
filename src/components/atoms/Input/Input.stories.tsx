import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { inputMeta } from './Input.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../Icon';

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: metaParameters(inputMeta),
  argTypes: argTypesFromMeta(inputMeta),
  args: { ...argsFromMeta(inputMeta), placeholder: 'you@example.com' },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)', maxWidth: 320 }}>
      {(['outline', 'filled', 'underline'] as const).map((v) => (
        <Input key={v} {...a} variant={v} placeholder={v} />
      ))}
    </div>
  ),
};

export const States: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)', maxWidth: 320 }}>
      <Input {...a} placeholder="Default" />
      <Input {...a} status="error" defaultValue="invalid@" />
      <Input {...a} status="success" defaultValue="valid@example.com" />
      <Input {...a} disabled placeholder="Disabled" />
      <Input {...a} readOnly defaultValue="Read only" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: (a) => (
    <div style={{ maxWidth: 320 }}>
      <Input {...a} iconStart={<Icon name="search" size="sm" />} placeholder="Search…" />
    </div>
  ),
};

export const Interactive: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)', maxWidth: 320 }}>
      <Input {...a} clearable defaultValue="Clear me" iconStart={<Icon name="search" size="sm" />} />
      <Input {...a} type="password" revealable defaultValue="s3cr3t" iconStart={<Icon name="lock" size="sm" />} />
      <Input {...a} loading defaultValue="Checking availability…" />
    </div>
  ),
};

export const StatusIcons: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)', maxWidth: 320 }}>
      <Input {...a} status="error" defaultValue="invalid@" />
      <Input {...a} status="success" defaultValue="valid@example.com" />
    </div>
  ),
};
