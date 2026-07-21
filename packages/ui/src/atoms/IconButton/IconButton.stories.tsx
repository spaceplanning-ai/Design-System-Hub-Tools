// IconButton — Storybook 스토리 (CSF3)
//
// [표준 8그룹 — variant·아이콘슬롯 없어 그 그룹은 생략] Overview·Playground·Sizes·States·
// Accessibility·Interaction. size×pressed×disabled 를 낱개 스토리로 폭발시키지 않는다 — 세부는 Controls 로.
// argTypes 는 계약 생성물 spread(수기 금지 — G5). 상태 규칙 검증은 IconButton.test.tsx 가 소유.
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { IconButtonArgTypes } from '../../../generated/argtypes/IconButton.argtypes';
import { Divider } from '../Divider';
import { Icon } from '../Icon';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Design System/Components/IconButton',
  component: IconButton,
  argTypes: { ...IconButtonArgTypes },
  args: {
    icon: <Icon name="undo" />,
    label: '되돌리기',
    size: 'md',
    pressed: 'unset',
    disabled: false,
    onClick: fn(),
  },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
} as const;

/** Overview — 실제 놓이는 자리(편집기 툴바). Divider 와 함께 액션·토글이 늘어선다 */
export const Overview: Story = {
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

/** Playground — Controls 에서 size·pressed·disabled 를 바꿔 본다 */
export const Playground: Story = {};

/** Sizes — 크기 규격 검증. md 는 이메일 빌더, sm 은 문자·알림톡 편집기가 쓰던 값이다 */
export const Sizes: Story = {
  render: (args) => (
    <div style={rowStyle}>
      <IconButton {...args} size="sm" label="되돌리기 (sm)" />
      <IconButton {...args} size="md" label="되돌리기 (md)" />
    </div>
  ),
};

/**
 * States — pressed 3값이 이 컴포넌트의 핵심이다. unset 과 off 는 픽셀이 같고 낭독이 다르다
 * (일반 액션은 aria-pressed 가 아예 없고, 꺼진 토글은 aria-pressed="false"). on 만 시각이 다르다.
 * hover·active·focus-visible 규칙 검증은 IconButton.test.tsx 가 스타일시트를 읽어 단언한다.
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

/** Accessibility — 접근 이름(label)·type=button·키보드 포커스를 단언한다 */
export const Accessibility: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: '되돌리기' });

    await expect(button).toHaveAttribute('type', 'button');
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

/** Interaction — 누르면 onClick 이 발화한다(차단 검증은 IconButton.test.tsx 의 blockedWhen) */
export const Interaction: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '되돌리기' }));

    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
