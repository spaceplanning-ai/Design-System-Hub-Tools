import type { Meta, StoryObj } from '@storybook/react';
import { ListItem } from './ListItem';
import { listItemMeta } from './ListItem.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Avatar } from '../../atoms/Avatar';
import { Icon } from '../../atoms/Icon';
import { Badge } from '../../atoms/Badge';

const meta: Meta<typeof ListItem> = {
  title: 'Molecules/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  parameters: metaParameters(listItemMeta),
  argTypes: argTypesFromMeta(listItemMeta),
  args: { ...argsFromMeta(listItemMeta), title: 'Ada Lovelace', description: 'ada@example.com' },
  decorators: [(Story) => <div style={{ maxWidth: 380 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  args: {
    leading: <Avatar name="Ada Lovelace" size="sm" />,
    trailing: <Icon name="chevron-right" size="sm" />,
  },
};

/** Type B — comfortable two-line card layout with roomy padding and larger leading media. */
export const TypeB: Story = {
  args: {
    type: 'B',
    leading: <Avatar name="Ada Lovelace" size="md" />,
    title: 'Ada Lovelace',
    description: 'Countess of Lovelace · Mathematician and writer',
    trailing: <Badge tone="brand">Pro</Badge>,
  },
};

export const List: Story = {
  render: () => (
    <div role="list" style={{ display: 'grid', gap: 4 }}>
      {['Inbox', 'Starred', 'Archive'].map((t, i) => (
        <ListItem
          key={t}
          role="listitem"
          variant="interactive"
          selected={i === 0}
          leading={<Icon name={i === 1 ? 'star' : 'mail'} size="sm" />}
          title={t}
          trailing={<Badge tone="brand">{(i + 1) * 3}</Badge>}
        />
      ))}
    </div>
  ),
};

/** Interactive rows with a trailing chevron signalling navigation. */
export const Navigation: Story = {
  render: () => (
    <div role="list" style={{ display: 'grid', gap: 4 }}>
      {[
        { t: 'Account', icon: 'user' as const },
        { t: 'Notifications', icon: 'bell' as const },
        { t: 'Settings', icon: 'settings' as const },
      ].map((it) => (
        <ListItem
          key={it.t}
          role="listitem"
          variant="interactive"
          leading={<Icon name={it.icon} size="sm" />}
          title={it.t}
          withChevron
        />
      ))}
    </div>
  ),
};

/** Rows with a drag handle for reordering. */
export const Reorderable: Story = {
  render: () => (
    <div role="list" style={{ display: 'grid', gap: 4 }}>
      {['First task', 'Second task', 'Third task'].map((t) => (
        <ListItem key={t} role="listitem" dragHandle title={t} />
      ))}
    </div>
  ),
};
