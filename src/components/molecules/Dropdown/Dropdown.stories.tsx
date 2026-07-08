import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import { dropdownMeta } from './Dropdown.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof Dropdown> = {
  title: 'Molecules/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  parameters: metaParameters(dropdownMeta),
  argTypes: argTypesFromMeta(dropdownMeta),
  args: { placement: 'bottom-start', size: 'md' },
  decorators: [(Story) => <div style={{ padding: 24 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Playground: Story = {
  render: (args) => (
    <Dropdown
      {...args}
      trigger={
        <Button variant="outline" tone="neutral" iconEnd={<Icon name="chevron-down" size="sm" />}>
          Options
        </Button>
      }
      items={[
        { label: 'Edit', icon: <Icon name="edit" size="sm" />, onSelect: () => {} },
        { label: 'Duplicate', icon: <Icon name="plus" size="sm" />, onSelect: () => {} },
        { divider: true, label: '' },
        { label: 'Delete', icon: <Icon name="trash" size="sm" />, danger: true, onSelect: () => {} },
      ]}
    />
  ),
};

/** Section headers, descriptions, selection, shortcut hints and a danger item. */
export const RichItems: Story = {
  render: (args) => (
    <Dropdown
      {...args}
      trigger={
        <Button variant="outline" tone="neutral" iconEnd={<Icon name="chevron-down" size="sm" />}>
          Account
        </Button>
      }
      items={[
        { header: true, label: 'Signed in as Ada' },
        { label: 'Profile', description: 'Manage your public details', onSelect: () => {} },
        { label: 'Theme', selected: true, onSelect: () => {} },
        { label: 'Command palette', trailing: '⌘K', onSelect: () => {} },
        { divider: true, label: '' },
        { label: 'Sign out', icon: <Icon name="log-out" size="sm" />, danger: true, onSelect: () => {} },
      ]}
    />
  ),
};
