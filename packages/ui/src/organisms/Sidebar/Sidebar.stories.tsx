// Sidebar — Storybook 스토리 (CSF3 · Navigation/Sidebar)
//
// argTypes 는 계약 생성물(generated/argtypes/Sidebar.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// sections 는 데이터 prop 이라 control 비활성 — Story args 로 직접 준다 (ADR-0003).
//
// [높이를 주는 프레임으로 감싼다] 사이드바는 세로로 100% 를 채우는 껍데기라, 높이가 없는
// 캔버스에 그대로 두면 nav 영역이 0 으로 접힌다.
import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { SidebarArgTypes } from '../../../generated/argtypes/Sidebar.argtypes';
import { Icon } from '../../atoms/Icon';
import { Sidebar } from './Sidebar';

const SECTIONS = [
  {
    id: 'ops',
    title: '운영',
    items: [
      { id: 'dashboard', label: '대시보드', href: '/dashboard', icon: <Icon name="layout-grid" /> },
      { id: 'members', label: '회원', href: '/users/members', icon: <Icon name="users" /> },
    ],
  },
  {
    id: 'site',
    title: '사이트',
    items: [
      {
        id: 'company',
        label: '기업 정보',
        icon: <Icon name="building" />,
        children: [
          { id: 'profile', label: '회사 소개', href: '/company/profile' },
          { id: 'history', label: '연혁', href: '/company/history' },
          { id: 'certificates', label: '인증서', href: '/company/certificates' },
        ],
      },
      { id: 'content', label: '콘텐츠', href: '/content/notices', icon: <Icon name="file-text" /> },
    ],
  },
];

const BRAND = <strong>LOGO</strong>;

/** 사이드바는 세로 100% 껍데기라, 높이를 주지 않으면 nav 영역이 0 으로 접힌다 */
const heightFrame: Decorator = (Story) => (
  <div style={{ display: 'flex', blockSize: 'calc(var(--tds-space-10) * 12)' }}>
    <Story />
  </div>
);

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ display: 'flex', blockSize: 'calc(var(--tds-space-10) * 12)' }}>
    <Story />
  </div>
);

const meta: Meta<typeof Sidebar> = {
  title: 'Design System/Components/Sidebar',
  component: Sidebar,
  argTypes: { ...SidebarArgTypes },
  args: {
    label: '주 내비게이션',
    sections: SECTIONS,
    activeHref: '/dashboard',
    openId: '',
    brand: BRAND,
  },
  decorators: [heightFrame],
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

/** default — 아무 가지도 펼치지 않은 기본형 */
export const Default: Story = {};

/** selected — activeHref 가 가리키는 잎에 마커와 aria-current 가 함께 붙는다 */
export const ActiveLeaf: Story = {
  args: { activeHref: '/users/members' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: '회원' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

/** open — 펼친 가지. 하위 링크는 펼쳤을 때만 DOM 에 존재한다 */
export const OpenBranch: Story = {
  args: { openId: 'company', activeHref: '/company/history' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /기업 정보/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(canvas.getByRole('link', { name: '연혁' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

/** hover — 행 위에 포인터. 배경만 바뀌고 활성 마커는 그대로다 */
export const Hover: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('link', { name: '회원' }));
  },
};

/** focus-visible — 키보드로 들어오면 링이 뜬다. 접힌 가지의 하위 링크는 탭 순서에 없다 */
export const FocusVisible: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('link', { name: '대시보드' }).focus();
    await expect(canvas.getByRole('link', { name: '대시보드' })).toHaveFocus();
    await expect(canvas.queryByRole('link', { name: '회사 소개' })).toBeNull();
  },
};

/**
 * 제어 컴포넌트 — 펼침 상태는 호출부가 소유한다.
 * '한 번에 하나만' 같은 규칙은 형제를 모두 보는 쪽만 강제할 수 있어 DS 가 자기 상태로 들지 않는다.
 */
export const ControlledToggle: Story = {
  args: { onToggle: fn(), onNavigate: fn() },
  render: function ControlledSidebar(args) {
    const [openId, setOpenId] = useState('');
    return (
      <Sidebar
        {...args}
        openId={openId}
        onToggle={(id) => {
          args.onToggle?.(id);
          // 한 번에 하나만 — 같은 가지를 다시 누르면 닫는다
          setOpenId((prev) => (prev === id ? '' : id));
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const branch = canvas.getByRole('button', { name: /기업 정보/ });

    await userEvent.click(branch);
    await expect(args.onToggle).toHaveBeenLastCalledWith('company');
    await expect(canvas.getByRole('link', { name: '회사 소개' })).not.toBeNull();

    await userEvent.click(branch);
    await expect(canvas.queryByRole('link', { name: '회사 소개' })).toBeNull();
  },
};

/** 링크는 진짜 href 다 — onNavigate 를 주면 수식키 없는 왼쪽 클릭만 가로챈다 */
export const Navigation: Story = {
  args: { onNavigate: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('link', { name: '회원' }));

    await expect(args.onNavigate).toHaveBeenLastCalledWith('/users/members');
  },
};

/** 최소 콘텐츠 — 섹션 하나에 잎 하나. 브랜드 슬롯도 비어 있다 */
export const Minimal: Story = {
  args: {
    brand: null,
    sections: [
      {
        id: 'ops',
        title: '운영',
        items: [{ id: 'dashboard', label: '대시보드', href: '/dashboard' }],
      },
    ],
  },
};

/** 최대 콘텐츠 — 항목이 많아 nav 가 스크롤된다. 브랜드 영역은 스크롤에서 빠진다 */
export const ManyItems: Story = {
  args: {
    openId: 'company',
    sections: [
      ...SECTIONS,
      {
        id: 'more',
        title: '기타',
        items: [
          { id: 'stats', label: '통계', href: '/stats', icon: <Icon name="bar-chart" /> },
          {
            id: 'support',
            label: '고객센터',
            href: '/support/tickets',
            icon: <Icon name="headset" />,
          },
          { id: 'marketing', label: '마케팅', href: '/marketing', icon: <Icon name="megaphone" /> },
          { id: 'logs', label: '로그', href: '/logs', icon: <Icon name="scroll-text" /> },
          { id: 'settings', label: '설정', href: '/settings', icon: <Icon name="settings" /> },
        ],
      },
    ],
  },
};

/** RTL — 논리 속성만 쓰므로 사이드바가 오른쪽에 붙고 활성 마커도 반대편으로 따라간다 */
export const RightToLeft: Story = {
  args: {
    label: 'التنقل الرئيسي',
    activeHref: '/users/members',
    brand: <strong>شعار</strong>,
    sections: [
      {
        id: 'ops',
        title: 'التشغيل',
        items: [
          {
            id: 'dashboard',
            label: 'لوحة التحكم',
            href: '/dashboard',
            icon: <Icon name="layout-grid" />,
          },
          { id: 'members', label: 'الأعضاء', href: '/users/members', icon: <Icon name="users" /> },
        ],
      },
    ],
  },
  decorators: [rtlFrame],
};
