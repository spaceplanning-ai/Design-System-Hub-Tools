import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { sidebarMeta } from './Sidebar.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../../atoms/Icon';
import { Badge } from '../../atoms/Badge';

const meta: Meta<typeof Sidebar> = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: { ...metaParameters(sidebarMeta), layout: 'fullscreen' },
  argTypes: argTypesFromMeta(sidebarMeta),
  args: { variant: 'surface', width: 'default', collapsed: false },
  decorators: [(Story) => <div style={{ height: 460, display: 'flex' }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

const renderSidebar = (args: React.ComponentProps<typeof Sidebar>) => (
  <Sidebar {...args} header={args.collapsed ? 'T' : 'TDS Console'}>
    <Sidebar.Section label="Main">
      <Sidebar.Item icon={<Icon name="home" size="sm" />} label="Home" active />
      <Sidebar.Item icon={<Icon name="search" size="sm" />} label="Explore" />
      <Sidebar.Item
        icon={<Icon name="bell" size="sm" />}
        label="Activity"
        badge={
          <Badge tone="brand" size="sm">
            3
          </Badge>
        }
      />
    </Sidebar.Section>
    <Sidebar.Section label="Account">
      <Sidebar.Item icon={<Icon name="user" size="sm" />} label="Profile" />
      <Sidebar.Item icon={<Icon name="settings" size="sm" />} label="Settings" />
    </Sidebar.Section>
  </Sidebar>
);

export const Default: Story = { render: renderSidebar };
export const Collapsed: Story = { render: (a) => renderSidebar({ ...a, collapsed: true }) };

/** Type A — standard density (default). */
export const TypeA: Story = { render: (a) => renderSidebar({ ...a, type: 'A' }) };
/** Type B — compact (condensed items). */
export const TypeB: Story = { render: (a) => renderSidebar({ ...a, type: 'B' }) };
/** Type C — boxed (each section in a card). */
export const TypeC: Story = { render: (a) => renderSidebar({ ...a, type: 'C' }) };

const CollapsibleDemo = (args: React.ComponentProps<typeof Sidebar>) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Sidebar
      {...args}
      collapsed={collapsed}
      onCollapsedToggle={() => setCollapsed((v) => !v)}
      header={collapsed ? 'T' : 'TDS Console'}
    >
      <Sidebar.Section label="Main">
        <Sidebar.Item icon={<Icon name="home" size="sm" />} label="Home" active />
        <Sidebar.Item icon={<Icon name="search" size="sm" />} label="Explore" />
        <Sidebar.Item
          icon={<Icon name="bell" size="sm" />}
          label="Activity"
          badge={
            <Badge tone="brand" size="sm">
              3
            </Badge>
          }
        />
      </Sidebar.Section>
    </Sidebar>
  );
};

/** Controlled collapse toggle — badges become dots when collapsed. */
export const Collapsible: Story = { render: (a) => <CollapsibleDemo {...a} /> };
