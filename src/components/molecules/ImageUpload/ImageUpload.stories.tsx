import type { Meta, StoryObj } from '@storybook/react';
import { ImageUpload } from './ImageUpload';
import { imageUploadMeta } from './ImageUpload.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof ImageUpload> = {
  title: 'Molecules/ImageUpload',
  component: ImageUpload,
  tags: ['autodocs'],
  parameters: metaParameters(imageUploadMeta),
  argTypes: argTypesFromMeta(imageUploadMeta),
  args: { ...argsFromMeta(imageUploadMeta), hint: 'PNG · JPG' },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ImageUpload>;

export const Playground: Story = {};

export const Single: Story = {
  args: { multiple: false, label: '프로필 이미지', shape: 'circle', size: 'lg' },
};

export const Shapes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-6)' }}>
      {(['rounded', 'square', 'circle'] as const).map((s) => (
        <ImageUpload key={s} {...args} shape={s} multiple={false} label={s} />
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Type B — thumbnails in a single horizontal scrolling strip. */
export const TypeBStrip: Story = {
  args: { type: 'B', label: '추가' },
};
