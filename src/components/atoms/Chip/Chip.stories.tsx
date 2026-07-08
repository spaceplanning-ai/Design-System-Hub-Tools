import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Chip } from './Chip';
import { chipMeta } from './Chip.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
  tags: ['autodocs'],
  parameters: metaParameters(chipMeta),
  argTypes: argTypesFromMeta(chipMeta),
  args: { ...argsFromMeta(chipMeta), children: 'Filter' },
};
export default meta;

type Story = StoryObj<typeof Chip>;

export const Playground: Story = {};

export const Selectable: Story = {
  render: () => {
    const [sel, setSel] = useState<string[]>(['React']);
    const options = ['React', 'Vue', 'Svelte', 'Solid'];
    return (
      <div style={{ display: 'flex', gap: 'var(--tds-space-2)' }}>
        {options.map((o) => (
          <Chip
            key={o}
            tone="brand"
            selected={sel.includes(o)}
            onClick={() => setSel((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]))}
          >
            {o}
          </Chip>
        ))}
      </div>
    );
  },
};

export const Removable: Story = {
  args: { removable: true, tone: 'info', variant: 'soft', children: 'Removable' },
};
