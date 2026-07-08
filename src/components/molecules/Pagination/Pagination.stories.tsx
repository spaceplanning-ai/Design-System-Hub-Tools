import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';
import { paginationMeta } from './Pagination.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';

const meta: Meta<typeof Pagination> = {
  title: 'Molecules/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: metaParameters(paginationMeta),
  argTypes: argTypesFromMeta(paginationMeta),
  args: { page: 1, count: 10, siblingCount: 1, variant: 'ghost', size: 'md', shape: 'rounded' },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Playground: Story = {
  render: (args) => {
    const [page, setPage] = useState(args.page);
    return <Pagination {...args} page={page} onPageChange={setPage} />;
  },
};

export const ManyPages: Story = {
  render: (args) => {
    const [page, setPage] = useState(8);
    return <Pagination {...args} count={24} page={page} onPageChange={setPage} />;
  },
};

/** First/last jump buttons plus an ellipsis for large ranges. */
export const WithEdges: Story = {
  render: () => <Pagination page={5} count={20} showEdges onPageChange={() => {}} />,
};
