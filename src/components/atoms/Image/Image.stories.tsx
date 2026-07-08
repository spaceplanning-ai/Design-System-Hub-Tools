import type { Meta, StoryObj } from '@storybook/react';
import { Image } from './Image';
import { imageMeta } from './Image.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Image> = {
  title: 'Atoms/Image',
  component: Image,
  tags: ['autodocs'],
  parameters: metaParameters(imageMeta),
  argTypes: argTypesFromMeta(imageMeta),
  args: { ...argsFromMeta(imageMeta), src: 'https://picsum.photos/400/300', alt: 'Sample', ratio: '4:3' },
  decorators: [(Story) => <div style={{ width: 320 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Image>;

export const Playground: Story = {};
export const Error: Story = { args: { src: 'https://invalid.example/none.png' } };
