import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';
import { footerMeta } from './Footer.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import { Link } from '../../atoms/Link';

const columns = [
  { title: 'Product', links: [{ label: 'Features' }, { label: 'Pricing' }, { label: 'Changelog' }] },
  { title: 'Company', links: [{ label: 'About' }, { label: 'Careers' }, { label: 'Blog' }] },
  { title: 'Resources', links: [{ label: 'Docs' }, { label: 'Support' }, { label: 'Status' }] },
];

const social = (
  <>
    <IconButton label="GitHub" variant="ghost" size="sm" icon={<Icon name="git-branch" size="sm" />} />
    <IconButton label="Email" variant="ghost" size="sm" icon={<Icon name="mail" size="sm" />} />
    <IconButton label="Website" variant="ghost" size="sm" icon={<Icon name="globe" size="sm" />} />
  </>
);

const legal = (
  <>
    <Link tone="neutral" underline="hover" size="sm">
      Privacy
    </Link>
    <Link tone="neutral" underline="hover" size="sm">
      Terms
    </Link>
  </>
);

const meta: Meta<typeof Footer> = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
  parameters: { ...metaParameters(footerMeta), layout: 'fullscreen' },
  argTypes: argTypesFromMeta(footerMeta),
  args: {
    variant: 'surface',
    brand: (
      <>
        <Icon name="star" filled color="var(--tds-color-brand-solid)" /> TDS
      </>
    ),
    description: 'A metadata-driven design system for React, Storybook and Figma.',
    copyright: '© 2026 TDS. All rights reserved.',
  },
};
export default meta;

type Story = StoryObj<typeof Footer>;

/** Type A — multi-column links with a bottom bar. */
export const TypeA: Story = { args: { type: 'A', columns, social, legal } };
/** Type B — simple centered brand + social. */
export const TypeB: Story = { args: { type: 'B', social, legal } };
/** Type C — minimal single row. */
export const TypeC: Story = { args: { type: 'C', social, legal } };

const newsletterColumns = columns.map((col, i) =>
  i === columns.length - 1
    ? { ...col, links: col.links.map((link, j) => (j === 0 ? { ...link, external: true } : link)) }
    : col,
);

const newsletter = (
  <div style={{ display: 'grid', gap: 'var(--tds-space-2)' }}>
    <h4>Stay in the loop</h4>
    <input type="email" placeholder="you@example.com" aria-label="Email address" />
  </div>
);

/** Type A with a newsletter slot and an external column link. */
export const WithNewsletter: Story = {
  args: { type: 'A', columns: newsletterColumns, newsletter, social, legal },
};
