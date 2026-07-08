import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { buttonMeta } from './Button.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Icon } from '../Icon';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: metaParameters(buttonMeta),
  argTypes: argTypesFromMeta(buttonMeta),
  args: { ...argsFromMeta(buttonMeta), children: 'Button' },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Playground: Story = {};

/** Type A/B/C — content layout presets. */
export const Types: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button {...args} type="A">
        Type A — Label
      </Button>
      <Button {...args} type="B" iconStart={<Icon name="download" size="sm" />}>
        Type B — Icon + Label
      </Button>
      <Button {...args} type="C" iconStart={<Icon name="settings" size="sm" />}>
        Settings
      </Button>
    </div>
  ),
};

/** Fill styles (the `variant` axis, labelled "Style"). */
export const Styles: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', flexWrap: 'wrap' }}>
      {(['solid', 'outline', 'ghost', 'soft', 'link'] as const).map((v) => (
        <Button key={v} {...args} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', flexWrap: 'wrap' }}>
      {(['brand', 'neutral', 'success', 'warning', 'danger'] as const).map((t) => (
        <Button key={t} {...args} tone={t}>
          {t}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', alignItems: 'center' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Button key={s} {...args} size={s}>
          Size {s}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', flexWrap: 'wrap' }}>
      <Button {...args} iconStart={<Icon name="plus" size="sm" />}>
        New item
      </Button>
      <Button {...args} variant="outline" iconEnd={<Icon name="arrow-right" size="sm" />}>
        Continue
      </Button>
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-3)', flexWrap: 'wrap' }}>
      <Button {...args}>Default</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Loading
      </Button>
      <Button {...args} fullWidth>
        Full width
      </Button>
    </div>
  ),
};
