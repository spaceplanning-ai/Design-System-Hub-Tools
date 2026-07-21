// ToggleSwitch — Storybook 스토리 (CSF3)
//
// [고정 IA — Button 기준] checked·disabled·busy 8조합을 낱개로 폭발시키지 않는다. 상태 축만 남기고
// 세부 조합(Disabled On·Busy Off …)은 Playground Controls 로 넘긴다(Behavior 금지 → Interaction):
//   Overview · Playground · States/(Off·On·Disabled·Busy) · Examples/ · Accessibility/RTL · Interaction/
// 잠금 8조합 전수 검증은 ToggleSwitch.test.tsx 가 소유. argTypes 는 계약 생성물 spread(G5).
import { useEffect, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { ToggleSwitchArgTypes } from '../../../generated/argtypes/ToggleSwitch.argtypes';
import { ToggleSwitch } from './ToggleSwitch';
import type { ToggleSwitchProps } from '../../../generated/types/ToggleSwitch.types';

/** 제어 컴포넌트라 스토리에서 checked 를 실제로 토글해 보여준다 */
function ControlledToggle(args: ToggleSwitchProps) {
  const [checked, setChecked] = useState(args.checked);
  useEffect(() => setChecked(args.checked), [args.checked]);
  return (
    <ToggleSwitch
      {...args}
      checked={checked}
      onChange={(next) => {
        setChecked(next);
        args.onChange?.(next);
      }}
    />
  );
}

const meta: Meta<typeof ToggleSwitch> = {
  title: 'Design System/Components/ToggleSwitch',
  component: ToggleSwitch,
  argTypes: { ...ToggleSwitchArgTypes },
  args: {
    checked: false,
    label: 'FAQ 노출 여부',
    disabled: false,
    busy: false,
    onLabel: 'ON',
    offLabel: 'OFF',
    onChange: fn(),
  },
  render: (args) => <ControlledToggle {...args} />,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof ToggleSwitch>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 대표 쓰임새(켜진 상태). Controls 에서 disabled·busy 등을 바꿔 본다 */
export const Overview: Story = { args: { checked: true } };

/** Playground — checked·disabled·busy·문구를 Controls 로 바꿔 전 조합을 본다 */
export const Playground: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** off */
export const Off: Story = { name: 'States/Off', args: { checked: false } };

/** on */
export const On: Story = { name: 'States/On', args: { checked: true } };

/** disabled (잠금) — 세부 on/off 조합은 Playground 에서 */
export const Disabled: Story = { name: 'States/Disabled', args: { checked: true, disabled: true } };

/** busy (요청 진행 중 잠금 + aria-busy) */
export const Busy: Story = { name: 'States/Busy', args: { checked: true, busy: true } };

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 활성 상태에서는 onChange 가 다음 상태(!checked)로 발화한다 */
export const FiresWhenEnabled: Story = {
  name: 'Interaction/Enabled Change',
  args: { checked: false },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('switch'));
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

/** disabled 면 onChange 가 발화하지 않는다 (계약 blockedWhen: disabled) */
export const BlockedWhenDisabled: Story = {
  name: 'Interaction/Disabled Change',
  args: { checked: false, disabled: true },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('switch'), { pointerEventsCheck: 0 });
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** busy 면 onChange 가 발화하지 않는다 (계약 blockedWhen: busy) */
export const BlockedWhenBusy: Story = {
  name: 'Interaction/Busy Change',
  args: { checked: false, busy: true },
  play: async ({ canvasElement, args }) => {
    const sw = within(canvasElement).getByRole('switch');
    await expect(sw).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(sw, { pointerEventsCheck: 0 });
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/* ── Examples ───────────────────────────────────────────────────────────── */

/** 커스텀 ON/OFF 문구 (노출/숨김 등) */
export const CustomLabels: Story = {
  name: 'Examples/Custom Labels',
  args: { checked: true, onLabel: '노출', offLabel: '숨김', label: 'FAQ 노출' },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** RTL — 논리 속성이라 트랙·손잡이의 좌우가 문서 방향을 따른다(문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { checked: true, label: 'FAQ 노출 여부', onLabel: '노출', offLabel: '숨김' },
  decorators: [rtlFrame],
};
