import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { emptyStateMeta } from './EmptyState.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { ...metaParameters(emptyStateMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(emptyStateMeta),
  args: {
    ...argsFromMeta(emptyStateMeta),
    description: '아직 등록된 데이터가 없어요. 첫 항목을 추가해 시작해 보세요.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 440 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Playground: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button iconStart={<Icon name="plus" size="sm" />}>새 항목 추가</Button>,
  },
};

export const NoResults: Story = {
  args: {
    icon: <Icon name="search" />,
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 다시 검색해 보세요.',
  },
};

export const ErrorState: Story = {
  args: {
    tone: 'danger',
    icon: <Icon name="alert-triangle" />,
    title: '데이터를 불러오지 못했습니다',
    description: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    action: (
      <Button tone="danger" variant="outline">
        다시 시도
      </Button>
    ),
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-6)' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <EmptyState key={s} {...args} size={s} title={`Size ${s}`} />
      ))}
    </div>
  ),
};

/** Both a primary and a secondary action. */
export const WithSecondaryAction: Story = {
  args: {
    action: <Button iconStart={<Icon name="plus" size="sm" />}>새 항목 추가</Button>,
    secondaryAction: (
      <Button variant="ghost" tone="neutral">
        자세히 알아보기
      </Button>
    ),
  },
};

/** Each tone falls back to its own default glyph. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-6)' }}>
      {(['neutral', 'brand', 'danger'] as const).map((t) => (
        <EmptyState key={t} {...args} tone={t} title={`Tone ${t}`} />
      ))}
    </div>
  ),
};
