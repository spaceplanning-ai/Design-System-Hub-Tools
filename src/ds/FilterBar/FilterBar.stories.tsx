import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../../shared/figma'
import { FilterBar, type FilterBarProps } from './FilterBar'

const DEMO_FILTERS = [
  {
    key: 'status',
    label: '상태',
    options: [
      { value: 'active', label: '활성' },
      { value: 'inactive', label: '비활성' },
      { value: 'pending', label: '대기' },
    ],
  },
  {
    key: 'role',
    label: '역할',
    options: [
      { value: 'admin', label: '관리자' },
      { value: 'manager', label: '매니저' },
      { value: 'member', label: '일반 회원' },
    ],
  },
]

// 컨트롤드 컴포넌트용 데모 — 선택된 필터를 칩으로 노출한다
function FilterBarDemo(props: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(props.searchValue)
  const [filterValues, setFilterValues] = useState<Record<string, string | null>>(props.filterValues ?? {})
  const filters = props.filters ?? []
  const activeChips = filters.flatMap((filter) => {
    const selected = filter.options.find((option) => option.value === filterValues[filter.key])
    return selected ? [{ key: filter.key, label: `${filter.label}: ${selected.label}` }] : []
  })
  return (
    <FilterBar
      {...props}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      filterValues={filterValues}
      onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
      activeChips={activeChips}
      onRemoveChip={(key) => setFilterValues((prev) => ({ ...prev, [key]: null }))}
      onReset={() => {
        setSearchValue('')
        setFilterValues({})
      }}
    />
  )
}

const meta = {
  title: 'Admin/FilterBar',
  component: FilterBar,
  tags: ['autodocs'],
  args: {
    searchValue: '',
    searchPlaceholder: '이름, 이메일 검색',
    filters: DEMO_FILTERS,
    filterValues: {},
  },
  argTypes: {
    onSearchChange: { control: false },
    onFilterChange: { control: false },
    onRemoveChip: { control: false },
    onReset: { control: false },
    activeChips: { control: false },
  },
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <FilterBarDemo {...args} />,
}

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <FilterBar searchValue="" searchPlaceholder="이름, 이메일 검색" />
      <FilterBar searchValue="김토스" filters={DEMO_FILTERS} filterValues={{}} onReset={() => {}} />
      <FilterBar
        searchValue="김토스"
        filters={DEMO_FILTERS}
        filterValues={{ status: 'active', role: 'admin' }}
        activeChips={[
          { key: 'status', label: '상태: 활성' },
          { key: 'role', label: '역할: 관리자' },
        ]}
        onRemoveChip={() => {}}
        onReset={() => {}}
      />
    </div>
  ),
}
