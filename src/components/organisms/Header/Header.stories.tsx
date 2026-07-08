import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';
import { headerMeta } from './Header.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import { Avatar } from '../../atoms/Avatar';
import { SearchInput } from '../../molecules/SearchInput';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: { ...metaParameters(headerMeta), layout: 'fullscreen' },
  argTypes: argTypesFromMeta(headerMeta),
  args: { variant: 'surface', size: 'md' },
};
export default meta;

type Story = StoryObj<typeof Header>;

const renderHeader = (args: React.ComponentProps<typeof Header>) => (
  <Header
    {...args}
    brand={
      <>
        <Icon name="star" filled color="var(--tds-color-brand-solid)" /> TDS
      </>
    }
    nav={
      <>
        <Button variant="ghost" tone="neutral" size="sm">
          Product
        </Button>
        <Button variant="ghost" tone="neutral" size="sm">
          Docs
        </Button>
        <Button variant="ghost" tone="neutral" size="sm">
          Pricing
        </Button>
      </>
    }
    actions={
      <>
        <IconButton label="Notifications" icon={<Icon name="bell" size="sm" />} />
        <Avatar name="Sohyun B" size="sm" />
      </>
    }
  />
);

export const Default: Story = { render: renderHeader };

/** Type A — standard (brand · nav · actions). */
export const TypeA: Story = { render: (a) => renderHeader({ ...a, type: 'A' }) };
/** Type B — centered brand with nav on a second row. */
export const TypeB: Story = { render: (a) => renderHeader({ ...a, type: 'B' }) };
/** Type C — compact (nav hidden). */
export const TypeC: Story = { render: (a) => renderHeader({ ...a, type: 'C' }) };

/** Brand, nav, a search slot, actions, and a mobile hamburger. */
export const WithSearchAndMenu: Story = {
  render: (a) => (
    <Header
      {...a}
      onMenuToggle={() => {}}
      brand={
        <>
          <Icon name="star" filled color="var(--tds-color-brand-solid)" /> TDS
        </>
      }
      nav={
        <>
          <Button variant="ghost" tone="neutral" size="sm">
            Product
          </Button>
          <Button variant="ghost" tone="neutral" size="sm">
            Docs
          </Button>
        </>
      }
      search={<SearchInput placeholder="Search…" />}
      actions={
        <>
          <IconButton label="Notifications" icon={<Icon name="bell" size="sm" />} />
          <Avatar name="Sohyun B" size="sm" />
        </>
      }
    />
  ),
};
