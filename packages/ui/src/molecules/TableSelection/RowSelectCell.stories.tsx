// RowSelectCell — Storybook 스토리 (CSF3 · Molecules/TableSelection/RowSelectCell)
//
// argTypes 는 계약 생성물(generated/argtypes/RowSelectCell.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// IA: Docs · Overview · States(Unselected·Selected) · Accessibility(RTL·ARIA) · Interaction(Toggle).
// disabled 는 계약에 없다 → States/Disabled·Interaction/Disabled 생략. checked enum(false·true) 전수.
import { useEffect, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { RowSelectCellArgTypes } from '../../../generated/argtypes/RowSelectCell.argtypes';
import { RowSelectCell } from './RowSelectCell';
import type { RowSelectCellProps } from '../../../generated/types/RowSelectCell.types';

/** <td> 는 표 안에서만 유효하다 — 스토리에서 최소 table 골격으로 감싼다 */
const tableFrame: Decorator = (Story) => (
  <table style={{ borderCollapse: 'collapse' }}>
    <tbody>
      <tr>
        <Story />
      </tr>
    </tbody>
  </table>
);

/** 제어 컴포넌트 — checked 는 스토리가 잡는다 */
function ControlledRowSelectCell(args: RowSelectCellProps) {
  const [checked, setChecked] = useState(args.checked);
  useEffect(() => setChecked(args.checked), [args.checked]);
  return (
    <RowSelectCell
      {...args}
      checked={checked}
      onToggle={(next) => {
        setChecked(next);
        args.onToggle?.(next);
      }}
    />
  );
}

const meta: Meta<typeof RowSelectCell> = {
  title: 'Design System/Components/RowSelectCell',
  component: RowSelectCell,
  argTypes: { ...RowSelectCellArgTypes },
  args: {
    id: 'faq-1',
    label: '자주 묻는 질문 선택',
    checked: false,
    onToggle: fn(),
  },
  render: (args) => <ControlledRowSelectCell {...args} />,
  decorators: [tableFrame],
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof RowSelectCell>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/* ── Overview ───────────────────────────────────────────────────────────── */

/** Overview — 대표 사용 예제. 목록 표 행의 미선택 선택 칸이 가장 흔하다 */
export const Overview: Story = { args: { checked: false } };

/* ── States (checked enum 전수) ───────────────────────────────────────────── */

/** 미선택 */
export const Unchecked: Story = { name: 'States/Unselected', args: { checked: false } };

/** 선택됨 */
export const Checked: Story = { name: 'States/Selected', args: { checked: true } };

/* ── Accessibility ────────────────────────────────────────────────────────── */

/** ARIA — 보이는 라벨이 없어 숨긴 문구(span#select-{id})를 aria-labelledby 로 잇는다 */
export const Aria: Story = {
  name: 'Accessibility/ARIA',
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('checkbox', { name: '자주 묻는 질문 선택' });
    await expect(box).toHaveAttribute('aria-labelledby', 'select-faq-1');
  },
};

/** RTL — 문서 방향만 뒤집는다. 논리 속성이라 시각 값은 그대로 미러링된다(한국어 콘텐츠) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  decorators: [rtlFrame],
};

/* ── Interaction ──────────────────────────────────────────────────────────── */

/** onToggle — 클릭이 다음 선택 상태(true)로 발화한다 */
export const TogglesOnClick: Story = {
  name: 'Interaction/Toggle',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('checkbox', { name: '자주 묻는 질문 선택' }),
    );
    await expect(args.onToggle).toHaveBeenCalledWith(true);
  },
};
