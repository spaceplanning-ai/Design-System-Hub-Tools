import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';
import { tabsMeta } from './Tabs.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Text } from '../../atoms/Text';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof Tabs> = {
  title: 'Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: metaParameters(tabsMeta),
  argTypes: argTypesFromMeta(tabsMeta),
  args: { variant: 'line', size: 'md', align: 'start' },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

const Demo = (args: React.ComponentProps<typeof Tabs>) => (
  <Tabs {...args} defaultValue="overview">
    <Tabs.List aria-label="Sections">
      <Tabs.Tab value="overview">Overview</Tabs.Tab>
      <Tabs.Tab value="specs">Specs</Tabs.Tab>
      <Tabs.Tab value="reviews">Reviews</Tabs.Tab>
      <Tabs.Tab value="disabled" disabled>
        Disabled
      </Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="overview">
      <Text tone="muted">Overview content — arrow keys move between tabs.</Text>
    </Tabs.Panel>
    <Tabs.Panel value="specs">
      <Text tone="muted">Technical specifications.</Text>
    </Tabs.Panel>
    <Tabs.Panel value="reviews">
      <Text tone="muted">Customer reviews.</Text>
    </Tabs.Panel>
  </Tabs>
);

/** Type A — tabs on top (default). */
export const TypeA: Story = { render: (a) => Demo({ ...a, type: 'A' }) };
/** Type B — tabs on the left (vertical). */
export const TypeB: Story = { render: (a) => Demo({ ...a, type: 'B' }) };
/** Type C — tabs on the bottom. */
export const TypeC: Story = { render: (a) => Demo({ ...a, type: 'C' }) };

/** Fill styles (the `variant` axis, labelled "Style"). */
export const Line: Story = { render: Demo };
export const Solid: Story = { render: (a) => Demo({ ...a, variant: 'solid' }) };
export const Pill: Story = { render: (a) => Demo({ ...a, variant: 'pill' }) };

/** Tabs with leading icons and a trailing badge. */
export const WithIconsAndBadges: Story = {
  render: (a) => (
    <Tabs {...a} defaultValue="home">
      <Tabs.List aria-label="Sections">
        <Tabs.Tab value="home" icon={<Icon name="home" />}>
          Home
        </Tabs.Tab>
        <Tabs.Tab value="settings" icon={<Icon name="settings" />}>
          Settings
        </Tabs.Tab>
        <Tabs.Tab value="alerts" icon={<Icon name="bell" />} badge={3}>
          Alerts
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="home">
        <Text tone="muted">Home content.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="settings">
        <Text tone="muted">Settings content.</Text>
      </Tabs.Panel>
      <Tabs.Panel value="alerts">
        <Text tone="muted">You have 3 new alerts.</Text>
      </Tabs.Panel>
    </Tabs>
  ),
};
