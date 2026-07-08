import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';
import type { TextVariant } from './Text';
import { textMeta } from './Text.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  tags: ['autodocs'],
  parameters: metaParameters(textMeta),
  argTypes: argTypesFromMeta(textMeta),
  args: { ...argsFromMeta(textMeta), children: 'The quick brown fox jumps over the lazy dog' },
};
export default meta;

type Story = StoryObj<typeof Text>;

export const Playground: Story = {};

export const Scale: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-3)' }}>
      {(
        ['display', 'h1', 'h2', 'h3', 'h4', 'bodyLg', 'body', 'bodySm', 'label', 'caption', 'code'] as TextVariant[]
      ).map((v) => (
        <Text key={v} variant={v}>
          {v} — The quick brown fox
        </Text>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-2)' }}>
      {(['default', 'muted', 'subtle', 'brand', 'success', 'warning', 'danger'] as const).map((t) => (
        <Text key={t} tone={t}>
          Tone: {t}
        </Text>
      ))}
    </div>
  ),
};
