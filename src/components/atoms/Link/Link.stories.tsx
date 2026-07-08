import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';
import { linkMeta } from './Link.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Link> = {
  title: 'Atoms/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: metaParameters(linkMeta),
  argTypes: argTypesFromMeta(linkMeta),
  args: { ...argsFromMeta(linkMeta), children: 'Learn more', href: '#' },
};
export default meta;

type Story = StoryObj<typeof Link>;

export const Playground: Story = {};
export const External: Story = { args: { external: true, children: 'Documentation' } };

export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-4)', flexWrap: 'wrap' }}>
      <Link trailingIcon="arrow-right">Learn more</Link>
      <Link leadingIcon="download">Download</Link>
      <Link external href="https://example.com">
        External
      </Link>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Link disabled href="#">
      Disabled link
    </Link>
  ),
};
