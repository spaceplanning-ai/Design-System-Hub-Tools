import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';
import { autocompleteMeta } from './Autocomplete.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const FRUITS = [
  '사과',
  '바나나',
  '블루베리',
  '체리',
  '자몽',
  '포도',
  '키위',
  '레몬',
  '망고',
  '오렌지',
  '복숭아',
  '딸기',
];

const meta: Meta<typeof Autocomplete> = {
  title: 'Molecules/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  parameters: { ...metaParameters(autocompleteMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(autocompleteMeta),
  args: { ...argsFromMeta(autocompleteMeta), suggestions: FRUITS },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Autocomplete>;

export const Playground: Story = {};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)' }}>
        <Autocomplete {...args} value={value} onValueChange={setValue} />
        <p style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)' }}>
          입력값: {value || '(비어 있음)'}
        </p>
      </div>
    );
  },
};

/** Server already filtered the results, so pass through with `filter={(s) => s}`. */
export const AsyncLoading: Story = {
  args: { loading: true, suggestions: [] },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-4)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Autocomplete key={s} {...args} size={s} placeholder={`size ${s}`} />
      ))}
    </div>
  ),
};
