import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox } from './Combobox';
import type { ComboboxOption } from './Combobox';
import { comboboxMeta } from './Combobox.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const OPTIONS: ComboboxOption[] = [
  { label: '서울', value: 'seoul' },
  { label: '부산', value: 'busan' },
  { label: '인천', value: 'incheon' },
  { label: '대구', value: 'daegu' },
  { label: '대전', value: 'daejeon' },
  { label: '광주', value: 'gwangju' },
  { label: '울산', value: 'ulsan' },
  { label: '세종', value: 'sejong', disabled: true },
  { label: '제주', value: 'jeju' },
];

const meta: Meta<typeof Combobox> = {
  title: 'Molecules/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { ...metaParameters(comboboxMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(comboboxMeta),
  args: { ...argsFromMeta(comboboxMeta), options: OPTIONS },
  decorators: [
    (Story) => (
      <div style={{ width: 280 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Combobox>;

export const Playground: Story = {};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('busan');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)' }}>
        <Combobox {...args} value={value} onValueChange={setValue} />
        <p style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)' }}>
          선택된 값: {value || '(없음)'}
        </p>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-4)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Combobox key={s} {...args} size={s} placeholder={`size ${s}`} />
      ))}
    </div>
  ),
};

export const ErrorState: Story = {
  args: { status: 'error', placeholder: '항목을 선택하세요' },
};
