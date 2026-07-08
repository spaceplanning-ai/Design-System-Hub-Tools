import type { Meta, StoryObj } from '@storybook/react';
import { Navbar } from './Navbar';
import type { NavItem } from './Navbar';
import { navbarMeta } from './Navbar.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';

const ITEMS: NavItem[] = [
  { label: '홈', href: '#', active: true },
  { label: '제품', href: '#' },
  { label: '가격', href: '#' },
  { label: '문서', href: '#' },
  { label: '준비 중', disabled: true },
];

const meta: Meta<typeof Navbar> = {
  title: 'Organisms/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  parameters: { ...metaParameters(navbarMeta), layout: 'fullscreen' },
  argTypes: argTypesFromMeta(navbarMeta),
  args: {
    ...argsFromMeta(navbarMeta),
    items: ITEMS,
    brand: 'TDS',
    actions: (
      <>
        <Button variant="ghost" size="sm">
          로그인
        </Button>
        <Button size="sm">시작하기</Button>
      </>
    ),
  },
};
export default meta;

type Story = StoryObj<typeof Navbar>;

export const Playground: Story = {};

export const Centered: Story = {
  args: { align: 'center' },
};

export const Elevated: Story = {
  args: { variant: 'elevated' },
};

/** Resize below 768px (or use the mobile viewport) to see the collapse toggle. */
export const Responsive: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
};

/** Type B — brand + actions on the top row, navigation centered on its own row below. */
export const TypeBTwoRow: Story = {
  args: { type: 'B', align: 'center' },
};
