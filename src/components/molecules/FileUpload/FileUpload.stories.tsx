import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './FileUpload';
import { fileUploadMeta } from './FileUpload.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof FileUpload> = {
  title: 'Molecules/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  parameters: metaParameters(fileUploadMeta),
  argTypes: argTypesFromMeta(fileUploadMeta),
  args: { ...argsFromMeta(fileUploadMeta), hint: '최대 10MB · PDF, PNG, JPG' },
  decorators: [
    (Story) => (
      <div style={{ width: 420 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof FileUpload>;

export const Playground: Story = {};

export const Multiple: Story = {
  args: { multiple: true, maxFiles: 5, hint: '여러 파일 선택 가능 (최대 5개)' },
};

export const AcceptImages: Story = {
  args: {
    accept: 'image/*',
    tone: 'brand',
    label: '이미지를 끌어다 놓으세요',
    hint: 'PNG, JPG, GIF',
  },
};

export const ErrorState: Story = {
  args: { status: 'error', hint: '파일 형식이 올바르지 않습니다' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Type B — compact inline row (icon + text on one line); fits inside a form field. */
export const TypeBInline: Story = {
  args: { type: 'B', label: '파일 선택', hint: '클릭하거나 드래그해서 업로드' },
};
