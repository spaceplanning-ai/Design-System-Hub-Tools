import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';
import { textareaMeta } from './Textarea.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Textarea> = {
  title: 'Atoms/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: metaParameters(textareaMeta),
  argTypes: argTypesFromMeta(textareaMeta),
  args: argsFromMeta(textareaMeta),
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Playground: Story = { render: (a) => <div style={{ maxWidth: 380 }}><Textarea {...a} /></div> };

export const States: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)', maxWidth: 380 }}>
      <Textarea {...a} placeholder="Default" />
      <Textarea {...a} status="error" defaultValue="Something went wrong" />
      <Textarea {...a} disabled placeholder="Disabled" />
    </div>
  ),
};

export const CharacterCount: Story = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <Textarea showCount maxLength={120} defaultValue="Hello" />
    </div>
  ),
};

export const AutoResize: Story = {
  render: () => (
    <div style={{ maxWidth: 380 }}>
      <Textarea autoResize placeholder="Type multiple lines…" />
    </div>
  ),
};
