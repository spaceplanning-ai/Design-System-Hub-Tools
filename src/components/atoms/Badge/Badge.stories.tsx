import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { Icon } from '../Icon';
import { badgeMeta } from './Badge.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: metaParameters(badgeMeta),
  argTypes: argTypesFromMeta(badgeMeta),
  args: { ...argsFromMeta(badgeMeta), children: 'Badge' },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

export const Tones: Story = {
  render: (a) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-2)', flexWrap: 'wrap' }}>
      {(['brand', 'neutral', 'success', 'warning', 'danger', 'info'] as const).map((t) => (
        <Badge key={t} {...a} tone={t}>
          {t}
        </Badge>
      ))}
    </div>
  ),
};

export const Variants: Story = {
  render: (a) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-2)' }}>
      {(['solid', 'soft', 'outline'] as const).map((v) => (
        <Badge key={v} {...a} tone="success" variant={v} dot>
          {v}
        </Badge>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: (a) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-2)', flexWrap: 'wrap' }}>
      <Badge {...a} tone="success" icon={<Icon name="check-circle" size={12} />}>
        Success
      </Badge>
      <Badge {...a} tone="warning" icon={<Icon name="alert-triangle" size={12} />}>
        Warning
      </Badge>
      <Badge {...a} tone="danger" icon={<Icon name="x-circle" size={12} />}>
        Danger
      </Badge>
    </div>
  ),
};

export const Count: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' }}>
      <Badge tone="danger" count={5} />
      <Badge tone="brand" count={128} max={99} />
      <Badge tone="neutral" count={0} showZero />
    </div>
  ),
};
