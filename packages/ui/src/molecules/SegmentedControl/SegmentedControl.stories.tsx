// SegmentedControl — Storybook 스토리 (CSF3)
//
// [표준 8그룹 — variant 가 없어 Variants 는 생략] Overview·Playground·Sizes·States·Icons·
// Accessibility·Interaction. size×state 를 낱개 스토리로 폭발시키지 않는다 — 세부는 Controls 로.
// argTypes 는 계약 생성물 spread(수기 금지 — G5). options 는 데이터 prop 이라 control 비활성(ADR-0003).
//
// 상태(hover·focus-visible 등)의 스타일 규칙 검증은 SegmentedControl.test.tsx 가 소유한다
// (contract-states 5종 전수). 스토리는 카탈로그, 검증은 테스트 파일의 몫이다.
import { useEffect, useState, type CSSProperties } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { SegmentedControlArgTypes } from '../../../generated/argtypes/SegmentedControl.argtypes';
import { SegmentedControl } from './SegmentedControl';
import type { SegmentedControlProps } from '../../../generated/types/SegmentedControl.types';

const RANGE_OPTIONS = [
  { id: 'day', label: '일' },
  { id: 'week', label: '주' },
  { id: 'month', label: '월' },
];

/** 제어 컴포넌트 — 선택 값을 스토리가 잡는다 (SegmentedControl 은 controlled) */
function Controlled(args: SegmentedControlProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  return (
    <SegmentedControl
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
}

const meta: Meta<typeof SegmentedControl> = {
  title: 'Design System/Components/SegmentedControl',
  component: SegmentedControl,
  argTypes: { ...SegmentedControlArgTypes },
  args: {
    value: 'day',
    options: RANGE_OPTIONS,
    size: 'md',
    disabled: false,
    ariaLabel: '조회 기간',
    onChange: fn(),
  },
  render: (args) => <Controlled {...args} />,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof SegmentedControl>;

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
  alignItems: 'flex-start',
};

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 실제 쓰임새 한눈에. 기간 필터가 가장 흔한 자리다 */
export const Overview: Story = {
  render: () => (
    <div style={columnStyle}>
      <Controlled value="day" options={RANGE_OPTIONS} ariaLabel="조회 기간" size="md" />
      <Controlled
        value="on"
        options={[
          { id: 'on', label: '노출' },
          { id: 'off', label: '숨김' },
        ]}
        ariaLabel="노출 여부"
        size="md"
      />
    </div>
  ),
};

/** Playground — Controls 에서 size·disabled·value 를 바꿔 본다 (options 는 데이터라 args 로 준다) */
export const Playground: Story = {};

/** Sizes — 크기 규격 검증. sm·md 가 토큰 기반 높이로 그려진다 */
export const Sizes: Story = {
  render: (args) => (
    <div style={columnStyle}>
      <Controlled {...args} size="sm" />
      <Controlled {...args} size="md" />
    </div>
  ),
};

/**
 * States — UI 상태 검증. default·disabled·selected 를 한 화면에.
 * hover·focus-visible 는 포인터/키보드가 필요한 상호작용 상태라 정적 스토리로 만들 수 없다 —
 * 그 규칙 검증은 SegmentedControl.test.tsx 가 스타일시트·로빙 tabindex 로 단언한다.
 */
export const States: Story = {
  render: (args) => (
    <div style={columnStyle}>
      <Controlled {...args} value="day" />
      <Controlled {...args} value="month" />
      <Controlled {...args} disabled />
    </div>
  ),
};

/** Icons — 아이콘 세그먼트 옵션(icon 은 아이콘 이름). labelHidden 이면 라벨은 접근 이름으로 남고 시각은 아이콘만 (계약 1.1.0) */
export const Icons: Story = {
  args: {
    value: 'list',
    ariaLabel: '보기 방식',
    options: [
      { id: 'list', label: '목록', icon: 'list' },
      { id: 'grid', label: '격자', icon: 'layout-grid' },
      { id: 'menu', label: '메뉴', icon: 'menu' },
    ],
  },
};

/** 키보드 이동 — 화살표 키가 선택과 포커스를 함께 옮긴다 (라디오 그룹 관례) */
export const Accessibility: Story = {
  name: 'Accessibility/Keyboard Navigation',
  args: { value: 'day' },
  play: async ({ canvasElement, args }) => {
    const [first, second] = within(canvasElement).getAllByRole('radio');
    first?.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(args.onChange).toHaveBeenLastCalledWith('week');
    await expect(second).toHaveFocus();
    await expect(second).toHaveAttribute('aria-checked', 'true');
  },
};

/** RTL — 논리 속성이라 트랙·알약의 좌우가 문서 방향을 따른다 (문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { value: 'day' },
  decorators: [rtlFrame],
};

/** 세그먼트를 누르면 onChange 가 그 값으로 발화한다 (차단 검증은 test 의 blockedWhen) */
export const Interaction: Story = {
  name: 'Interaction/Select',
  args: { value: 'day' },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('radio', { name: '월' }));

    await expect(args.onChange).toHaveBeenCalledWith('month');
  },
};
