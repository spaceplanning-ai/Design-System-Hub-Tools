import type { Meta, StoryObj } from '@storybook/react';
import { Menu, MenuItem, MenuSeparator, MenuLabel } from './Menu';
import { menuMeta } from './Menu.meta';
import { metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';
import { Icon } from '../../atoms/Icon';

const meta: Meta<typeof Menu> = {
  title: 'Molecules/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: { ...metaParameters(menuMeta), layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof Menu>;

export const Playground: Story = {
  render: () => (
    <Menu
      trigger={
        <Button variant="outline" iconEnd={<Icon name="chevron-down" size="sm" />}>
          메뉴
        </Button>
      }
    >
      <MenuLabel>계정</MenuLabel>
      <MenuItem icon={<Icon name="file" size="sm" />} shortcut="⌘N">
        새 문서
      </MenuItem>
      <MenuItem icon={<Icon name="image" size="sm" />}>이미지 삽입</MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Icon name="upload" size="sm" />} shortcut="⌘S">
        저장
      </MenuItem>
      <MenuItem disabled>내보내기 (준비 중)</MenuItem>
      <MenuSeparator />
      <MenuItem icon={<Icon name="trash" size="sm" />} danger shortcut="⌫">
        삭제
      </MenuItem>
    </Menu>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--tds-space-6)' }}>
      {(['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const).map((p) => (
        <Menu key={p} placement={p} trigger={<Button variant="outline">{p}</Button>}>
          <MenuItem>첫 번째</MenuItem>
          <MenuItem>두 번째</MenuItem>
          <MenuItem>세 번째</MenuItem>
        </Menu>
      ))}
    </div>
  ),
};
