import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';
import { searchInputMeta } from './SearchInput.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof SearchInput> = {
  title: 'Molecules/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  parameters: metaParameters(searchInputMeta),
  argTypes: argTypesFromMeta(searchInputMeta),
  args: argsFromMeta(searchInputMeta),
  decorators: [(Story) => <div style={{ maxWidth: 360 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof SearchInput>;

export const Playground: Story = {};
export const Prefilled: Story = { args: { defaultValue: 'design tokens' } };
export const Loading: Story = { args: { defaultValue: 'searching', loading: true } };

/** A trailing filter button, highlighted as active. */
export const WithFilter: Story = {
  render: () => <SearchInput onFilter={() => {}} filterActive placeholder="Search…" />,
};
