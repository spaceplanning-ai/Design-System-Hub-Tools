// SelectionBar — Storybook 스토리 (CSF3 · molecule)
//
// [고정 IA] Docs · Overview · States(Single Selected·Many Selected·All Selected·Empty) ·
// Content(Few Actions·With Danger Action·Long Count·Without Clear) ·
// Accessibility(RTL·ARIA live·Keyboard) · Interaction(Clear Selection·Bulk Action).
// count·noun 세부 조합은 낱개 스토리로 폭발시키지 않고 States/Content 대표값 + Controls 로 넘긴다.
// 계약 states 전수(default·focus-visible)는 SelectionBar.test.tsx 가 소유한다.
//
// argTypes 는 계약 생성물(generated/argtypes/SelectionBar.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 액션 버튼은 children 슬롯이라 DS Button(atom)을 그대로 조립해 실제 쓰임을 보인다.
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { SelectionBarArgTypes } from '../../../generated/argtypes/SelectionBar.argtypes';
import { Button } from '../../atoms/Button';
import { SelectionBar } from './SelectionBar';

const meta: Meta<typeof SelectionBar> = {
  title: 'Design System/Components/SelectionBar',
  component: SelectionBar,
  argTypes: { ...SelectionBarArgTypes },
  args: {
    count: 3,
    noun: '건',
    onClear: fn(),
    children: <Button variant="danger">일괄 삭제</Button>,
  },
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof SelectionBar>;

/** RTL 프레임 — 논리 속성 검수. 문구는 한국어 그대로 둔다(아랍어 금지) */
const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** 일괄 액션 버튼을 눌렀는지 단언하기 위한 스파이 — Interaction/Bulk Action 전용 */
const bulkAction = fn();

/* ── Overview ───────────────────────────────────────────────────────────── */

/** Overview — 대표 쓰임새(3건 선택 + 선택 해제 + 일괄 삭제). Controls 에서 count·noun 을 바꿔 본다 */
export const Overview: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** 한 건 선택 — 개수·단위 문구가 단수로 그려진다 */
export const SingleSelected: Story = {
  name: 'States/Single Selected',
  args: { count: 1, noun: '명' },
};

/** 여러 건 선택 — 대표 다중 선택 상태 */
export const ManySelected: Story = {
  name: 'States/Many Selected',
  args: { count: 12, noun: '명' },
};

/** 전체 선택 — 페이지의 모든 행을 고른 상태(개수만 커진다) */
export const AllSelected: Story = {
  name: 'States/All Selected',
  args: { count: 248, noun: '명' },
};

/** 선택 없음 — count=0 이면 바 자체를 그리지 않는다(선택이 없으면 바가 없다) */
export const Empty: Story = {
  name: 'States/Empty',
  args: { count: 0 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('region')).toBeNull();
  },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 적은 액션 — 파괴적이지 않은 단일 일괄 액션 */
export const FewActions: Story = {
  name: 'Content/Few Actions',
  render: (args) => (
    <SelectionBar {...args}>
      <Button variant="secondary">일괄 수정</Button>
    </SelectionBar>
  ),
};

/** 파괴적 액션 포함 — danger 버튼은 붉되 라벨이 '삭제'를 말한다(색만으로 의미 전달 금지) */
export const WithDangerAction: Story = {
  name: 'Content/With Danger Action',
  render: (args) => (
    <SelectionBar {...args}>
      <Button variant="secondary">일괄 수정</Button>
      <Button variant="danger">일괄 삭제</Button>
    </SelectionBar>
  ),
};

/** 큰 개수 — 천 단위 구분으로 표기한다(1,234,567) */
export const LongCount: Story = {
  name: 'Content/Long Count',
  args: { count: 1234567, noun: '명' },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region');
    await expect(region.textContent).toContain('1,234,567');
  },
};

/** 해제 없음 — onClear 미지정이면 '선택 해제' 버튼을 그리지 않는다 */
export const WithoutClear: Story = {
  name: 'Content/Without Clear',
  render: () => (
    <SelectionBar count={12} noun="명">
      <Button variant="danger">일괄 삭제</Button>
    </SelectionBar>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: '선택 해제' })).toBeNull();
  },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** RTL — 논리 속성이라 좌우가 뒤집혀도 문구는 한국어 그대로 검수한다 */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  decorators: [rtlFrame],
};

/** ARIA — 선택 상태를 알리는 region 이 접근성 이름('선택 항목 일괄 작업')을 갖는다 */
export const AriaLive: Story = {
  name: 'Accessibility/ARIA live',
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole('region', { name: '선택 항목 일괄 작업' });
    await expect(region).not.toBeNull();
  },
};

/** 키보드 — Tab 이 '선택 해제' 버튼으로 들어가 포커스를 받는다(focus-visible 링은 test 가 소유) */
export const Keyboard: Story = {
  name: 'Accessibility/Keyboard',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: '선택 해제' })).toHaveFocus();
  },
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** '선택 해제' 를 누르면 onClear 가 발화한다 */
export const InteractionClearSelection: Story = {
  name: 'Interaction/Clear Selection',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '선택 해제' }));
    await expect(args.onClear).toHaveBeenCalled();
  },
};

/** 일괄 액션 버튼(children)을 누르면 호출부 핸들러가 발화한다 */
export const InteractionBulkAction: Story = {
  name: 'Interaction/Bulk Action',
  render: (args) => (
    <SelectionBar {...args}>
      <Button variant="danger" onClick={bulkAction}>
        일괄 삭제
      </Button>
    </SelectionBar>
  ),
  play: async ({ canvasElement }) => {
    bulkAction.mockClear();
    await userEvent.click(within(canvasElement).getByRole('button', { name: '일괄 삭제' }));
    await expect(bulkAction).toHaveBeenCalledTimes(1);
  },
};
