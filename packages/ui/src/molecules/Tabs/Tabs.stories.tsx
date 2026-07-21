// Tabs — Storybook 스토리 (CSF3 · Design System/Components/Tabs)
//
// [고정 IA — Button 기준] 대표 상태만 남기고 세부 조합은 Playground Controls 로 넘긴다.
// disabled prop 이 없으므로 States 는 Selected 만(Disabled Tab 해당 없음). label 은 string 이라
// Content/With Icons 도 해당 없음(생략). 아랍어 금지 → RTL 은 dir="rtl" + 한국어.
//   Docs · Overview · Playground · States/(Selected) · Content/(Few Tabs·Many Tabs·Long Labels)
//   · Examples/ · Accessibility/(Keyboard Navigation·Focus·RTL) · Interaction/(Select Tab·Arrow Navigation)
// 계약 states 4종(default·hover·focus-visible·selected) 전수 단언은 Tabs.test.tsx 가 소유.
// argTypes 는 계약 생성물(generated/argtypes/Tabs.argtypes)을 spread 한다 (수기 금지 — G5).
import { useEffect, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { TabsArgTypes } from '../../../generated/argtypes/Tabs.argtypes';
import { Tabs, tabId, tabPanelId } from './Tabs';
import type { TabsProps } from '../../../generated/types/Tabs.types';

const WORK_TABS = [
  { id: 'product', label: '상품' },
  { id: 'inquiry', label: '문의' },
  { id: 'sales', label: '영업' },
];

/** 제어 컴포넌트 + 바깥 tabpanel — aria-controls 가 실제 요소를 가리키게 한다 */
function ControlledTabs(args: TabsProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  const current = args.items.find((item) => item.id === value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tds-space-4)' }}>
      <Tabs
        {...args}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange?.(next);
        }}
      />
      <div
        id={tabPanelId(value)}
        role="tabpanel"
        aria-labelledby={tabId(value)}
        tabIndex={0}
        style={{
          color: 'var(--tds-color-text-default)',
          fontFamily: 'var(--tds-typography-body-md-font-family)',
          fontSize: 'var(--tds-typography-body-md-font-size)',
        }}
      >
        {current?.label ?? ''} 패널 내용
      </div>
    </div>
  );
}

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Components/Tabs',
  component: Tabs,
  argTypes: { ...TabsArgTypes },
  args: { value: 'product', items: WORK_TABS, ariaLabel: '업무 영역', onChange: fn() },
  render: (args) => <ControlledTabs {...args} />,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

const tabsOf = (canvasElement: HTMLElement) => within(canvasElement).getAllByRole('tab');

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 대표 쓰임새(첫 탭 선택 + 연결된 패널). Controls 에서 value 등을 바꿔 본다 */
export const Overview: Story = {
  args: { value: 'product' },
};

/** Playground — value·ariaLabel 을 Controls 로 바꿔 본다 (items 는 데이터 prop — ADR-0003) */
export const Playground: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** selected — value 와 일치하는 탭만 aria-selected=true + 액션 컬러 밑줄. disabled 상태는 없다 */
export const Selected: Story = {
  name: 'States/Selected',
  args: { value: 'sales' },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 탭 2개 — 목록 범위 좁히기 같은 최소 구성 */
export const FewTabs: Story = {
  name: 'Content/Few Tabs',
  args: {
    value: 'all',
    items: [
      { id: 'all', label: '전체' },
      { id: 'mine', label: '내 담당' },
    ],
    ariaLabel: '목록 범위',
  },
};

/** 탭이 많을 때 — fluid 로 가로로 채우고 gap 을 유지한다 */
export const ManyTabs: Story = {
  name: 'Content/Many Tabs',
  args: {
    value: 'inquiry',
    items: [
      { id: 'product', label: '상품' },
      { id: 'inquiry', label: '문의' },
      { id: 'sales', label: '영업' },
      { id: 'consult', label: '상담' },
      { id: 'quote', label: '견적' },
      { id: 'contract', label: '계약' },
      { id: 'history', label: '이력' },
    ],
    ariaLabel: '업무 영역',
  },
};

/** 라벨이 길 때 — 비선택 탭도 같은 두께의 투명 밑줄이라 전환 시 라벨이 밀리지 않는다 */
export const LongLabels: Story = {
  name: 'Content/Long Labels',
  args: {
    value: 'consult',
    items: [
      { id: 'product', label: '상품 관리' },
      { id: 'inquiry', label: '고객 문의 · 답변 대기' },
      { id: 'sales', label: '영업 · 계약 진행' },
      { id: 'consult', label: '상담 이력 및 재방문 예약' },
    ],
    ariaLabel: '업무 영역',
  },
};

/* ── Examples ───────────────────────────────────────────────────────────── */

/** 목록 상태 필터 — 어드민에서 탭으로 진행 단계를 걸러 보는 실제 사용 사례 */
export const ListFilter: Story = {
  name: 'Examples/List Filter',
  args: {
    value: 'progress',
    items: [
      { id: 'all', label: '전체' },
      { id: 'progress', label: '진행중' },
      { id: 'done', label: '완료' },
    ],
    ariaLabel: '문의 상태 필터',
  },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** 키보드 이동 — Arrow/Home/End 로 선택과 포커스를 함께 옮긴다 (WAI-ARIA Tabs 자동 활성화) */
export const KeyboardNavigation: Story = {
  name: 'Accessibility/Keyboard Navigation',
  args: { value: 'product' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const [first, second, third] = tabsOf(canvasElement);
    first?.focus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(second).toHaveFocus();

    await userEvent.keyboard('{End}');
    await expect(third).toHaveAttribute('aria-selected', 'true');
    await expect(third).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await expect(first).toHaveFocus();
  },
};

/** 포커스 — 로빙 tabindex: 선택된 탭만 탭 순서(tabindex=0)에 있고 나머지는 -1 */
export const Focus: Story = {
  name: 'Accessibility/Focus',
  args: { value: 'product' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const [first, second] = tabsOf(canvasElement);
    await expect(first).toHaveAttribute('tabindex', '0');
    await expect(second).toHaveAttribute('tabindex', '-1');

    await userEvent.tab();
    await expect(first).toHaveFocus();
  },
};

/** RTL — 논리 속성이라 탭·밑줄의 좌우가 문서 방향을 따른다 (문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: {
    value: 'inquiry',
    items: [
      { id: 'product', label: '상품' },
      { id: 'inquiry', label: '문의' },
      { id: 'sales', label: '영업' },
    ],
    ariaLabel: '업무 영역',
  },
  decorators: [rtlFrame],
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 탭을 클릭하면 onChange 가 해당 탭의 id 로 발화한다 (계약 blockedWhen 없음) */
export const SelectTab: Story = {
  name: 'Interaction/Select Tab',
  args: { value: 'product' },
  play: async ({ canvasElement, args }) => {
    const [, second] = tabsOf(canvasElement);
    await userEvent.click(second as HTMLElement);
    await expect(args.onChange).toHaveBeenLastCalledWith('inquiry');
  },
};

/** ArrowRight 로 선택이 옮겨가며 onChange 가 다음 탭의 id 로 발화한다 */
export const ArrowNavigation: Story = {
  name: 'Interaction/Arrow Navigation',
  args: { value: 'product' },
  play: async ({ canvasElement, args }) => {
    const [first, second] = tabsOf(canvasElement);
    first?.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(args.onChange).toHaveBeenLastCalledWith('inquiry');
    await expect(second).toHaveFocus();
  },
};
