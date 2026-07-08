import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';
import { breadcrumbMeta } from './Breadcrumb.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Molecules/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: metaParameters(breadcrumbMeta),
  argTypes: argTypesFromMeta(breadcrumbMeta),
  args: {
    size: 'md',
    separator: 'chevron',
    items: [
      { label: 'Home', href: '#' },
      { label: 'Components', href: '#' },
      { label: 'Breadcrumb' },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Playground: Story = {};
export const Slash: Story = { args: { separator: 'slash' } };

/** The root crumb carries a leading home icon. */
export const WithHomeIcon: Story = {
  args: {
    items: [
      { label: 'Home', href: '#', icon: <Icon name="home" size={14} /> },
      { label: 'Components', href: '#' },
      { label: 'Breadcrumb' },
    ],
  },
};

/** A long trail collapses its middle into an expandable ellipsis. */
export const Collapsed: Story = {
  args: {
    maxItems: 3,
    items: [
      { label: 'Home', href: '#' },
      { label: 'Library', href: '#' },
      { label: 'Components', href: '#' },
      { label: 'Navigation', href: '#' },
      { label: 'Breadcrumb', href: '#' },
      { label: 'Collapsed' },
    ],
  },
};
