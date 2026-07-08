import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';
import { popoverMeta } from './Popover.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';

const meta: Meta<typeof Popover> = {
  title: 'Molecules/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { ...metaParameters(popoverMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(popoverMeta),
  args: argsFromMeta(popoverMeta),
};
export default meta;

type Story = StoryObj<typeof Popover>;

export const Playground: Story = {
  render: (args) => (
    <Popover {...args} title="필터" trigger={<Button variant="outline">열기</Button>}>
      선택한 트리거 옆에 임의의 콘텐츠를 띄우는 앵커드 오버레이입니다.
    </Popover>
  ),
};

export const Sides: Story = {
  render: (args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, auto)',
        gap: 'var(--tds-space-10)',
        padding: 'var(--tds-space-16)',
      }}
    >
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Popover
          key={side}
          {...args}
          side={side}
          defaultOpen
          title={side}
          trigger={<Button variant="outline">{side}</Button>}
        >
          {side} 방향으로 열립니다.
        </Popover>
      ))}
    </div>
  ),
};

export const Alignments: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-12)', padding: 'var(--tds-space-8)' }}>
      {(['start', 'center', 'end'] as const).map((align) => (
        <Popover
          key={align}
          {...args}
          side="bottom"
          align={align}
          defaultOpen
          trigger={<Button variant="outline">align={align}</Button>}
        >
          정렬: {align}
        </Popover>
      ))}
    </div>
  ),
};
