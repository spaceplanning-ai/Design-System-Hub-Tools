// Sidebar — Storybook 스토리 (CSF3 · Navigation 계열)
//
// [고정 IA — Navigation 계열] Docs · Overview · Playground · States(Expanded·Active Item) ·
// Content(Few Items·Many Items) · Accessibility(Focus·RTL·ARIA) · Interaction(Navigate·Expand Group).
// activeHref×openId 세부 조합은 낱개 스토리로 폭발시키지 않고 Playground Controls 로 넘긴다.
// 계약 states 전수(hover·focus-visible 스타일 규칙)는 Sidebar.test.tsx 가 소유한다 — 포인터 hover 는
// 정적 스토리로 만들 수 없어 스토리에서 빼고 스타일시트 단언으로 검증한다.
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

/* ── Overview ───────────────────────────────────────────────────────────── */

/** Overview — 대표 쓰임새. 대시보드가 켜진 기본형, 가지는 접혀 있다 */
export const Overview: Story = {};

/* ── Playground ─────────────────────────────────────────────────────────── */

/** Playground — label·activeHref·openId·brand 를 Controls 로 바꿔 본다 */
export const Playground: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** 펼친 가지 — 하위 링크는 펼쳤을 때만 DOM 에 존재한다. aria-expanded=true · aria-controls 가 실재하는 목록을 가리킨다 */
export const OpenBranch: Story = {
  name: 'States/Expanded',
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

/** 활성 잎 — activeHref 가 가리키는 링크에 마커와 aria-current 가 함께 붙는다 */
export const ActiveLeaf: Story = {
  name: 'States/Active Item',
  args: { activeHref: '/users/members' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: '회원' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 최소 콘텐츠 — 섹션 하나에 잎 하나. 브랜드 슬롯도 비어 있다 */
export const Minimal: Story = {
  name: 'Content/Few Items',
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

/** 많은 항목 — nav 가 스크롤된다. 브랜드 영역은 스크롤에서 빠진다 */
export const ManyItems: Story = {
  name: 'Content/Many Items',
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

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** 포커스 — 키보드로 들어오면 링이 뜬다. 접힌 가지의 하위 링크는 탭 순서에 없다 */
export const FocusVisible: Story = {
  name: 'Accessibility/Focus',
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('link', { name: '대시보드' }).focus();
    await expect(canvas.getByRole('link', { name: '대시보드' })).toHaveFocus();
    await expect(canvas.queryByRole('link', { name: '회사 소개' })).toBeNull();
  },
};

/** RTL — 논리 속성만 쓰므로 사이드바가 오른쪽에 붙고 활성 마커도 반대편으로 따라간다 (문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: {
    label: '주 내비게이션',
    activeHref: '/users/members',
    brand: <strong>로고</strong>,
    sections: [
      {
        id: 'ops',
        title: '운영',
        items: [
          {
            id: 'dashboard',
            label: '대시보드',
            href: '/dashboard',
            icon: <Icon name="layout-grid" />,
          },
          { id: 'members', label: '회원', href: '/users/members', icon: <Icon name="users" /> },
        ],
      },
    ],
  },
  decorators: [rtlFrame],
};

/** ARIA — 바깥 aside 는 complementary, 안쪽 nav 가 label 로 이름을 갖는다. 활성 잎엔 aria-current, 펼친 가지엔 aria-expanded */
export const Aria: Story = {
  name: 'Accessibility/ARIA',
  args: { openId: 'company', activeHref: '/users/members' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // 바깥은 보조(complementary) 랜드마크, 안쪽 nav 가 label 로 이름을 갖는다
    await expect(canvas.getByRole('complementary')).not.toBeNull();
    await expect(canvas.getByRole('navigation', { name: '주 내비게이션' })).not.toBeNull();

    // 색만으로 의미를 전달하지 않는다 — 활성 잎은 aria-current, 펼친 가지는 aria-expanded 로도 말한다
    await expect(canvas.getByRole('link', { name: '회원' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(canvas.getByRole('button', { name: /기업 정보/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  },
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 링크는 진짜 href 다 — onNavigate 를 주면 수식키 없는 왼쪽 클릭만 가로챈다 */
export const Navigation: Story = {
  name: 'Interaction/Navigate',
  args: { onNavigate: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('link', { name: '회원' }));

    await expect(args.onNavigate).toHaveBeenLastCalledWith('/users/members');
  },
};

/**
 * 제어 컴포넌트 — 펼침 상태는 호출부가 소유한다. 가지를 누르면 열리고 다시 누르면 닫힌다.
 * '한 번에 하나만' 같은 규칙은 형제를 모두 보는 쪽만 강제할 수 있어 DS 가 자기 상태로 들지 않는다.
 */
export const ControlledToggle: Story = {
  name: 'Interaction/Expand Group',
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
