import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Table } from './Table';
import type { TableColumn } from './Table';
import { tableMeta } from './Table.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Badge } from '../../atoms/Badge';

interface Row extends Record<string, unknown> {
  name: string;
  role: string;
  status: 'active' | 'invited' | 'disabled';
}

const data: Row[] = [
  { name: 'Ada Lovelace', role: 'Owner', status: 'active' },
  { name: 'Alan Turing', role: 'Admin', status: 'active' },
  { name: 'Grace Hopper', role: 'Editor', status: 'invited' },
  { name: 'Katherine Johnson', role: 'Viewer', status: 'disabled' },
];

const toneFor = (s: Row['status']) =>
  s === 'active' ? 'success' : s === 'invited' ? 'warning' : 'neutral';

const columns: TableColumn<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
  {
    key: 'status',
    header: 'Status',
    align: 'end',
    render: (r) => (
      <Badge tone={toneFor(r.status)} variant="soft">
        {r.status}
      </Badge>
    ),
  },
];

const meta: Meta<typeof Table<Row>> = {
  title: 'Organisms/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: metaParameters(tableMeta),
  argTypes: argTypesFromMeta(tableMeta),
  args: { type: 'A', variant: 'default', size: 'md', columns, data, caption: 'Team members' },
};
export default meta;

type Story = StoryObj<typeof Table<Row>>;

export const Default: Story = {};
export const TypeB: Story = { args: { type: 'B' } };
export const Striped: Story = { args: { variant: 'striped' } };
export const Bordered: Story = { args: { variant: 'bordered' } };

const sortableColumns: TableColumn<Row>[] = columns.map((c) =>
  c.key === 'name' || c.key === 'role' ? { ...c, sortable: true } : c,
);

export const Sortable: Story = {
  render: () => (
    <Table
      columns={sortableColumns}
      data={data}
      defaultSortState={{ columnKey: 'name', direction: 'asc' }}
      caption="Team members"
    />
  ),
};

const SelectableDemo = () => {
  const [ids, setIds] = useState<string[]>([]);
  return (
    <div style={{ display: 'grid', gap: 'var(--tds-space-2)' }}>
      <div>{ids.length} selected</div>
      <Table
        selectable
        selectedRowIds={ids}
        onSelectionChange={setIds}
        getRowId={(_r, i) => String(i)}
        columns={columns}
        data={data}
        caption="Team members"
      />
    </div>
  );
};

export const Selectable: Story = { render: () => <SelectableDemo /> };

export const Loading: Story = {
  render: () => <Table loading columns={columns} data={[]} caption="Team members" />,
};

export const Empty: Story = {
  render: () => (
    <Table columns={columns} data={[]} emptyState="No results found" caption="Team members" />
  ),
};
