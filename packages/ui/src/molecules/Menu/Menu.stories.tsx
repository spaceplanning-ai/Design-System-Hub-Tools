// Menu — Storybook 스토리 (CSF3 · Actions/Menu)
//
// argTypes 는 계약 생성물(generated/argtypes/Menu.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// items 는 데이터 prop 이라 control 비활성 — Story args 로 직접 준다 (ADR-0003).
//
// [팝업이 잘리지 않게] 팝업은 absolute 라 부모의 높이를 넘어선다. 스토리마다 아래쪽 여백을
// 확보하는 프레임으로 감싼다 — 안 그러면 Docs 캔버스에서 잘려 나온다.
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { MenuArgTypes } from '../../../generated/argtypes/Menu.argtypes';
import { Menu } from './Menu';

const MEMBER_ACTIONS = [
  { id: 'notify', label: '알림 발송' },
  { id: 'export', label: '내보내기' },
  { id: 'delete', label: '회원 삭제', danger: true },
];

/** 팝업이 캔버스 아래로 넘치지 않도록 아래쪽 여백을 확보한다 */
const popupFrame: Decorator = (Story) => (
  <div style={{ paddingBlockEnd: 'calc(var(--tds-space-10) * 2)' }}>
    <Story />
  </div>
);

const rtlFrame: Decorator = (Story) => (
  <div
    dir="rtl"
    style={{ padding: 'var(--tds-space-5)', paddingBlockEnd: 'calc(var(--tds-space-10) * 2)' }}
  >
    <Story />
  </div>
);

const meta: Meta<typeof Menu> = {
  title: 'Design System/Components/Menu',
  component: Menu,
  argTypes: { ...MenuArgTypes },
  args: {
    label: '명재우 회원 액션',
    items: MEMBER_ACTIONS,
    align: 'end',
    trigger: 'more-horizontal',
  },
  decorators: [popupFrame],
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Menu>;

/** 트리거는 접근 가능한 이름으로 집는다 — 라벨을 바꾸는 스토리는 이름을 넘긴다 */
const triggerOf = (canvasElement: HTMLElement, name = '명재우 회원 액션') =>
  within(canvasElement).getByRole('button', { name });

/** default — 닫힌 트리거 */
export const Default: Story = {};

/** hover — 트리거 위에 포인터 */
export const Hover: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const trigger = triggerOf(canvasElement);
    await userEvent.hover(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** focus-visible — 열리면 첫 항목이 포커스를 받는다 */
export const FocusVisible: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(triggerOf(canvasElement));
    await expect(canvas.getByRole('menuitem', { name: '알림 발송' })).toHaveFocus();
  },
};

/** open — 팝업이 열린 상태 */
export const Open: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(triggerOf(canvasElement));
    await expect(canvas.getByRole('menu', { name: '명재우 회원 액션' })).not.toBeNull();
    await expect(canvas.getAllByRole('menuitem')).toHaveLength(3);
  },
};

/** disabled — 잠긴 항목은 지우지 않고 잠그고 **이유를 적는다** */
export const DisabledItems: Story = {
  args: {
    label: '구글 로그인 더보기',
    trigger: 'more-vertical',
    items: [
      { id: 'view', label: '연동 상세' },
      { id: 'edit', label: '설정 수정', disabledReason: '발송이 끝난 뒤에 바꿀 수 있습니다' },
      { id: 'unlink', label: '연동 해제', danger: true, disabledReason: '권한이 없습니다' },
    ],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(triggerOf(canvasElement, '구글 로그인 더보기'));
    const locked = canvas.getByRole('menuitem', { name: '설정 수정' });
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    // 잠근 이유가 항목에 이어져 있다 — 잠긴 버튼만 있으면 왜인지 알 길이 없다
    await expect(locked).toHaveAttribute('aria-describedby');
  },
};

/**
 * 키보드 전수 — 이 컴포넌트를 승격한 이유 그 자체다.
 * 출처 구현 둘 중 약한 쪽에는 화살표·Home/End 가 없었다.
 */
export const KeyboardNavigation: Story = {
  args: { onSelect: fn(), onOpenChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = triggerOf(canvasElement);

    // ArrowDown 으로 연다 (닫힌 트리거에서)
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(true);
    await expect(canvas.getByRole('menuitem', { name: '알림 발송' })).toHaveFocus();

    // ArrowDown / ArrowUp — 순환 이동
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('menuitem', { name: '내보내기' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(canvas.getByRole('menuitem', { name: '알림 발송' })).toHaveFocus();

    // End / Home
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('menuitem', { name: '회원 삭제' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('menuitem', { name: '알림 발송' })).toHaveFocus();

    // Escape — 닫고 **트리거로 포커스 복귀**
    await userEvent.keyboard('{Escape}');
    await expect(canvas.queryByRole('menu')).toBeNull();
    await expect(trigger).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false);
  },
};

/** align=start — 좌측 툴바용. 논리 속성이라 RTL 에서 자동으로 뒤집힌다 */
export const AlignStart: Story = {
  args: { align: 'start' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await userEvent.click(triggerOf(canvasElement));
  },
};

/** trigger=more-vertical — 같은 글리프를 90도 돌려 쓴다 (Icon 계약에 세로 글리프가 없다) */
export const VerticalTrigger: Story = {
  args: { trigger: 'more-vertical' },
};

/** 최소 콘텐츠 — 명령 하나 */
export const SingleItem: Story = {
  args: { items: [{ id: 'delete', label: '회원 삭제', danger: true }] },
};

/** 최대 콘텐츠 — 명령이 많고 라벨이 길 때 */
export const ManyItems: Story = {
  args: {
    items: [
      { id: 'notify', label: '알림 발송' },
      { id: 'export', label: '회원 정보 내보내기 (CSV)' },
      { id: 'grade', label: '등급 변경' },
      { id: 'memo', label: '운영 메모 남기기' },
      { id: 'suspend', label: '계정 이용 정지', danger: true },
      { id: 'delete', label: '회원 삭제', danger: true },
    ],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await userEvent.click(triggerOf(canvasElement));
  },
};

/** RTL — align 이 논리 속성이라 팝업이 반대 모서리로 붙는다 */
export const RightToLeft: Story = {
  args: {
    label: 'إجراءات العضو',
    items: [
      { id: 'notify', label: 'إرسال إشعار' },
      { id: 'export', label: 'تصدير' },
      { id: 'delete', label: 'حذف العضو', danger: true },
    ],
  },
  decorators: [rtlFrame],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await userEvent.click(triggerOf(canvasElement, 'إجراءات العضو'));
  },
};
