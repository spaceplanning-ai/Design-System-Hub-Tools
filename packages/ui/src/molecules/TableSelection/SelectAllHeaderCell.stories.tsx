// SelectAllHeaderCell — Storybook 스토리 (CSF3 · 고정 IA · Button 기준)
//
// [고정 IA] off/on/mixed 선택 상태를 낱개로 폭발시키지 않는다. 대표(Overview=mixed)만 앞에 두고
// 상태는 States/ 로, 접근성은 Accessibility/(RTL·ARIA) 로, 이벤트는 Interaction/ 로 묶는다:
//   Docs · Overview · States/ · Accessibility/(RTL·ARIA) · Interaction/Toggle All
// disabled prop 이 없으므로(계약 selection·onToggleAll 만) Disabled 계열은 해당 없음 → 생략.
// focus-visible 상태 전수 검증은 SelectAllHeaderCell.test.tsx 가 소유.
// argTypes 는 계약 생성물(generated/argtypes/SelectAllHeaderCell.argtypes)을 spread 한다 (수기 금지 — G5).
// 계약 dependencies: TriStateCheckbox — 3상태(off/on/mixed)를 selection 으로 전수 보인다.
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { SelectAllHeaderCellArgTypes } from '../../../generated/argtypes/SelectAllHeaderCell.argtypes';
import { SelectAllHeaderCell } from './SelectAllHeaderCell';

/** <th> 는 표 안에서만 유효하다 — 최소 table/thead/tr 골격으로 감싼다 */
const tableFrame: Decorator = (Story) => (
  <table style={{ borderCollapse: 'collapse' }}>
    <thead>
      <tr>
        <Story />
      </tr>
    </thead>
  </table>
);

const meta: Meta<typeof SelectAllHeaderCell> = {
  title: 'Design System/Components/SelectAllHeaderCell',
  component: SelectAllHeaderCell,
  argTypes: { ...SelectAllHeaderCellArgTypes },
  args: {
    label: '이 페이지의 FAQ 전체 선택',
    labelId: 'select-all-faq',
    selection: { allSelected: false, someSelected: false },
    onToggleAll: fn(),
  },
  decorators: [tableFrame],
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof SelectAllHeaderCell>;

/** RTL — 문서 방향만 뒤집는다(문구는 한국어로 검수) */
const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 대표 쓰임새(부분 선택). 이 컴포넌트를 일반 Checkbox 와 가르는 mixed 상태를 보인다 */
export const Overview: Story = {
  args: { selection: { allSelected: false, someSelected: true } },
};

/* ── States ─────────────────────────────────────────────────────────────── */

/** off — 아무것도 선택 안 됨 */
export const None: Story = {
  name: 'States/None Selected',
  args: { selection: { allSelected: false, someSelected: false } },
};

/** on — 전부 선택됨 (native checked) */
export const All: Story = {
  name: 'States/All Selected',
  args: { selection: { allSelected: true, someSelected: false } },
};

/** mixed — 일부만 선택됨 (indeterminate → aria-checked="mixed") */
export const Some: Story = {
  name: 'States/Indeterminate',
  args: { selection: { allSelected: false, someSelected: true } },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** RTL — 논리 속성이라 문서 방향만 뒤집는다(문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: {
    label: '이 페이지의 FAQ 전체 선택',
    selection: { allSelected: true, someSelected: false },
  },
  decorators: [rtlFrame],
};

/** ARIA — 숨긴 라벨(aria-labelledby)과 부분 선택(aria-checked="mixed")을 단언한다 */
export const Aria: Story = {
  name: 'Accessibility/ARIA',
  args: { selection: { allSelected: false, someSelected: true } },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox');
    await expect(box).toHaveAttribute('aria-checked', 'mixed');
    await expect(box).toHaveAttribute('aria-labelledby', 'select-all-faq');
  },
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** onToggleAll — 클릭이 다음 상태(true)로 발화한다 */
export const TogglesAll: Story = {
  name: 'Interaction/Toggle All',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('checkbox'));
    await expect(args.onToggleAll).toHaveBeenCalledWith(true);
  },
};
