import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';
import { spinnerMeta } from './Spinner.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  parameters: metaParameters(spinnerMeta),
  argTypes: argTypesFromMeta(spinnerMeta),
  args: argsFromMeta(spinnerMeta),
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tds-space-4)' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Spinner key={s} size={s} />
      ))}
    </div>
  ),
};
