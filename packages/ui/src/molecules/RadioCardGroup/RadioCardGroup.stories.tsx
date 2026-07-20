// RadioCardGroup — Storybook 스토리 (CSF3 · Inputs/RadioCardGroup)
//
// argTypes 는 계약 생성물(generated/argtypes/RadioCardGroup.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: combinationMatrix(disabled = 2) 전수 + blockedWhen(disabled) + 활성 발화 대조 +
//           선택 위치(첫/끝) + 선택지 3개 + 빈 목록(엣지) + 긴 설명 + RTL.
import { useEffect, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { RadioCardGroupArgTypes } from '../../../generated/argtypes/RadioCardGroup.argtypes';
import { RadioCardGroup } from './RadioCardGroup';
import type { RadioCardGroupProps } from '../../../generated/types/RadioCardGroup.types';

const VISIBILITY = [
  { value: 'public', label: '전체 공개', description: '누구나 내 사이트에 접속할 수 있어요' },
  { value: 'private', label: '비공개', description: '관리자만 접근할 수 있어요' },
];

/** 제어 컴포넌트 — 스토리에서 실제로 선택이 옮겨 가도록 값을 로컬 상태로 잡는다 */
function ControlledRadioCardGroup(args: RadioCardGroupProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  return (
    <RadioCardGroup
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
}

const meta: Meta<typeof RadioCardGroup> = {
  title: 'Inputs/RadioCardGroup',
  component: RadioCardGroup,
  argTypes: { ...RadioCardGroupArgTypes },
  args: {
    name: 'visibility',
    legend: '사이트 접근 범위',
    value: 'public',
    options: VISIBILITY,
    disabled: false,
    onChange: fn(),
  },
  render: (args) => <ControlledRadioCardGroup {...args} />,
  // 카드가 설명 한 줄을 품는 넓이라, 폭을 주지 않으면 캔버스 전체로 퍼진다
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '28rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof RadioCardGroup>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)', inlineSize: '28rem' }}>
    <Story />
  </div>
);

/** 기본 — 첫 선택지가 켜져 있다 */
export const Default: Story = {};

/** 잠김 — 모든 카드가 잠기고 라벨이 흐려진다 (선택 표시는 그대로 남는다) */
export const Disabled: Story = {
  args: { disabled: true },
};

/** 마지막 선택지가 켜진 상태 */
export const LastSelected: Story = {
  args: { value: 'private' },
};

/** 선택지 3개 — 카드가 늘어도 설명이 제목과 같은 클릭 영역에 남는다 */
export const ThreeOptions: Story = {
  args: {
    name: 'indexing',
    legend: '검색엔진 노출',
    value: 'all',
    options: [
      { value: 'all', label: '전체 허용', description: '모든 페이지가 검색 결과에 나타나요' },
      { value: 'partial', label: '일부 허용', description: '공개 페이지만 검색 결과에 나타나요' },
      { value: 'none', label: '차단', description: '어떤 페이지도 검색 결과에 나타나지 않아요' },
    ],
  },
};

/** 긴 설명 — 두 줄로 접혀도 라디오 점이 첫 줄에 고정된다 */
export const LongDescription: Story = {
  args: {
    options: [
      {
        value: 'public',
        label: '전체 공개',
        description:
          '누구나 내 사이트에 접속할 수 있어요. 검색엔진 수집도 함께 허용되며, 로그인하지 않은 방문자에게도 모든 공개 페이지가 그대로 보입니다.',
      },
      { value: 'private', label: '비공개', description: '관리자만 접근할 수 있어요' },
    ],
  },
};

/** 선택지 없음(엣지) — legend 만 남는다. 빈 그룹을 지어내지 않는다 */
export const EmptyOptions: Story = {
  args: { value: '', options: [] },
};

/* ── 계약 events.onChange.blockedWhen 전수 검증 (disabled) ────────────────────
 * 비발생은 렌더로 증명되지 않는다 — 스파이(args.onChange = fn())를 관찰한다.
 */

/** RadioCardGroup: disabled 에서 onChange 가 발화하지 않는다 (계약 blockedWhen: disabled) */
export const BlockedWhenDisabled: Story = {
  name: 'RadioCardGroup: disabled 상태에서 onChange 가 발화하지 않는다',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const radio = within(canvasElement).getByRole('radio', { name: '비공개' });

    await expect(radio).toBeDisabled();
    await userEvent.click(radio, { pointerEventsCheck: 0 });

    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

/** RadioCardGroup: 활성 상태에서는 고른 value 로 onChange 가 발화한다 */
export const FiresWhenEnabled: Story = {
  name: 'RadioCardGroup: 활성 상태에서는 onChange 가 발화한다',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('radio', { name: '비공개' }));

    await expect(args.onChange).toHaveBeenCalledWith('private');
  },
};

/** RTL */
export const RightToLeft: Story = {
  args: {
    legend: 'نطاق الوصول',
    options: [
      { value: 'public', label: 'عام', description: 'يمكن لأي شخص الوصول إلى موقعك' },
      { value: 'private', label: 'خاص', description: 'المسؤولون فقط يمكنهم الوصول' },
    ],
  },
  decorators: [rtlFrame],
};
