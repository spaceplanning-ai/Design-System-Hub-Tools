// IconButton — Storybook 스토리 (CSF3 · Actions/IconButton)
//
// argTypes 는 계약 생성물(generated/argtypes/IconButton.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: size 2 × pressed 3 × disabled 2 = 12 조합 전수 + Dark/RTL + 툴바 조립 시연.
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { IconButtonArgTypes } from '../../../generated/argtypes/IconButton.argtypes';
import { Divider } from '../Divider';
import { Icon } from '../Icon';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Actions/IconButton',
  component: IconButton,
  argTypes: { ...IconButtonArgTypes },
  args: {
    icon: <Icon name="undo" />,
    label: '되돌리기',
    size: 'md',
    pressed: 'unset',
    disabled: false,
  },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
} as const;

/* ── size × pressed × disabled 12조합 전수 ─────────────────────────────────── */

/** md · unset — 기본. 상태 없는 일반 액션이라 `aria-pressed` 가 아예 나가지 않는다 */
export const MediumUnset: Story = {
  args: { size: 'md', pressed: 'unset', disabled: false },
};

export const MediumOn: Story = {
  args: { size: 'md', pressed: 'on', disabled: false, icon: <Icon name="collapse-left" /> },
};

export const MediumOff: Story = {
  args: { size: 'md', pressed: 'off', disabled: false, icon: <Icon name="collapse-left" /> },
};

export const MediumUnsetDisabled: Story = {
  args: { size: 'md', pressed: 'unset', disabled: true },
};

export const MediumOnDisabled: Story = {
  args: { size: 'md', pressed: 'on', disabled: true, icon: <Icon name="collapse-left" /> },
};

export const MediumOffDisabled: Story = {
  args: { size: 'md', pressed: 'off', disabled: true, icon: <Icon name="collapse-left" /> },
};

/** sm · unset — 문자·알림톡 편집기가 쓰던 크기(space.6) */
export const SmallUnset: Story = {
  args: { size: 'sm', pressed: 'unset', disabled: false },
};

export const SmallOn: Story = {
  args: { size: 'sm', pressed: 'on', disabled: false, icon: <Icon name="collapse-left" /> },
};

export const SmallOff: Story = {
  args: { size: 'sm', pressed: 'off', disabled: false, icon: <Icon name="collapse-left" /> },
};

export const SmallUnsetDisabled: Story = {
  args: { size: 'sm', pressed: 'unset', disabled: true },
};

export const SmallOnDisabled: Story = {
  args: { size: 'sm', pressed: 'on', disabled: true, icon: <Icon name="collapse-left" /> },
};

export const SmallOffDisabled: Story = {
  args: { size: 'sm', pressed: 'off', disabled: true, icon: <Icon name="collapse-left" /> },
};

/* ── 조립 시연 ──────────────────────────────────────────────────────────────── */

/** Variant — 크기 축 두 값을 나란히. md 가 이메일 빌더, sm 이 문자 편집기의 현행 값이다 */
export const Sizes: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton icon={<Icon name="undo" />} label="되돌리기 (sm)" size="sm" />
      <IconButton icon={<Icon name="undo" />} label="되돌리기 (md)" size="md" />
    </div>
  ),
};

/**
 * States — 계약 states 축. 왼쪽 둘이 **unset 과 off** 다: 픽셀은 같고 낭독이 다르다.
 * 이 한 쌍이 pressed 를 boolean 이 아니라 3값으로 둔 이유의 시각적 증거다.
 */
export const States: Story = {
  render: () => (
    <div style={rowStyle}>
      <IconButton icon={<Icon name="undo" />} label="일반 액션 (unset)" />
      <IconButton icon={<Icon name="collapse-left" />} label="꺼진 토글 (off)" pressed="off" />
      <IconButton icon={<Icon name="collapse-left" />} label="켜진 토글 (on)" pressed="on" />
      <IconButton icon={<Icon name="undo" />} label="비활성" disabled />
      <IconButton
        icon={<Icon name="collapse-left" />}
        label="켜진 채 비활성"
        pressed="on"
        disabled
      />
    </div>
  ),
};

/**
 * 툴바 조립 — 이 컴포넌트가 실제로 놓이는 자리. Divider 와 함께 쓴다.
 * 승계 원본인 두 편집기 툴바가 하던 배치이며, 파일럿 소비자는 EmailToolbar 다.
 */
export const InToolbar: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--tds-space-2)',
        padding: 'var(--tds-space-2) var(--tds-space-3)',
        border: 'var(--tds-border-width-thin) solid var(--tds-color-border-default)',
        borderRadius: 'var(--tds-radius-md)',
        background: 'var(--tds-color-surface-default)',
      }}
    >
      <IconButton icon={<Icon name="collapse-left" />} label="왼쪽 패널 접기" pressed="off" />
      <Divider orientation="vertical" />
      <IconButton icon={<Icon name="undo" />} label="되돌리기" />
      <IconButton icon={<Icon name="redo" />} label="다시하기" disabled />
      <Divider orientation="vertical" />
      <IconButton icon={<Icon name="desktop" />} label="데스크톱 폭" pressed="on" />
      <IconButton icon={<Icon name="mobile" />} label="모바일 폭" pressed="off" />
    </div>
  ),
};

/**
 * RTL — 정사각 버튼이라 방향이 뒤집혀도 형태가 같다. 치수는 전부 논리 속성이다.
 * 뒤집혀야 하는 것은 아이콘의 방향성(collapse-left)이며 그것은 Icon 의 책임이다.
 */
export const RightToLeft: Story = {
  args: { label: 'تراجع', icon: <Icon name="undo" /> },
  decorators: [rtlFrame],
};
