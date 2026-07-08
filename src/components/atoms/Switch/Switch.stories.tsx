import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';
import { switchMeta } from './Switch.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Switch> = {
  title: 'Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: metaParameters(switchMeta),
  argTypes: argTypesFromMeta(switchMeta),
  args: { ...argsFromMeta(switchMeta), children: 'Enable notifications' },
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Switch key={s} {...a} size={s} defaultChecked>
          Size {s}
        </Switch>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Switch {...a} showIcons defaultChecked>
        On (check glyph)
      </Switch>
      <Switch {...a} showIcons>
        Off (close glyph)
      </Switch>
    </div>
  ),
};

export const Invalid: Story = {
  args: { invalid: true, children: 'Accept the terms (required)' },
};
