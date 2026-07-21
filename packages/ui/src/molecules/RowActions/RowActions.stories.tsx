// RowActions — Storybook 스토리 (CSF3 · Molecules/RowActions)
//
// [고정 IA] Docs · Overview · States(Disabled) · Content(Few Actions) ·
// Examples(in a table row) · Accessibility(Keyboard·ARIA·RTL) · Interaction.
// disabled 축(false·true)은 낱개 조합으로 폭발시키지 않고 대표 상태 + Interaction 으로 덮는다.
// 계약 states 전수(hover·focus-visible 등)는 RowActions.test.tsx 가 소유한다.
//
// argTypes 는 계약 생성물(generated/argtypes/RowActions.argtypes)을 spread 한다 (수기 작성 금지 — G5).
import type { CSSProperties } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { RowActionsArgTypes } from '../../../generated/argtypes/RowActions.argtypes';
import { RowActions } from './RowActions';

const meta: Meta<typeof RowActions> = {
  title: 'Design System/Components/RowActions',
  component: RowActions,
  argTypes: { ...RowActionsArgTypes },
  args: {
    label: '공지 제목',
    disabled: false,
    onEdit: fn(),
    onDelete: fn(),
  },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof RowActions>;

/** RTL — 논리 속성이라 액션이 반대쪽으로 정렬된다(문구는 한국어로 검수) */
const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/* ── Overview ───────────────────────────────────────────────────────────── */

/** Overview — 대표 쓰임새(행 끝 수정 + 삭제). Controls 에서 disabled 를 바꿔 본다 */
export const Overview: Story = { args: { disabled: false } };

/* ── States ─────────────────────────────────────────────────────────────── */

/** 잠금 — 진행 중(삭제 요청 등)이면 두 버튼을 native disabled 로 잠근다 */
export const Disabled: Story = {
  name: 'States/Disabled',
  args: { disabled: true },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 적은 액션 — onEdit 미지정(읽기 전용 행)이면 연필 없이 삭제만 그린다(핸들러 유무가 버튼 유무) */
export const DeleteOnly: Story = {
  name: 'Content/Few Actions',
  render: () => <RowActions label="공지 제목" onDelete={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: '공지 제목 수정' })).toBeNull();
    await expect(canvas.getByRole('button', { name: '공지 제목 삭제' })).not.toBeNull();
  },
};

/* ── Examples ───────────────────────────────────────────────────────────── */

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  inlineSize: '100%',
  fontFamily: 'var(--tds-typography-label-md-font-family)',
  fontSize: 'var(--tds-typography-label-md-font-size)',
};

const cellStyle: CSSProperties = {
  padding: 'var(--tds-space-2) var(--tds-space-3)',
  borderBlockEnd: 'var(--tds-border-width-thin) solid var(--tds-color-border-default)',
  textAlign: 'start',
  color: 'var(--tds-color-text-default)',
};

/** 표 행 안에서 — 실제 목록 행 끝에 붙는 쓰임(액션 칸은 우측 정렬) */
export const InTableRow: Story = {
  name: 'Examples/in a table row',
  render: (args) => (
    <table style={tableStyle}>
      <tbody>
        <tr>
          <td style={cellStyle}>서비스 점검 안내</td>
          <td style={{ ...cellStyle, textAlign: 'end' }}>
            <RowActions {...args} label="서비스 점검 안내" />
          </td>
        </tr>
        <tr>
          <td style={cellStyle}>개인정보 처리방침 개정</td>
          <td style={{ ...cellStyle, textAlign: 'end' }}>
            <RowActions {...args} label="개인정보 처리방침 개정" />
          </td>
        </tr>
      </tbody>
    </table>
  ),
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** 키보드 — Tab 이 첫 액션(수정)으로 포커스를 옮긴다 */
export const Keyboard: Story = {
  name: 'Accessibility/Keyboard',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: '공지 제목 수정' })).toHaveFocus();
  },
};

/** ARIA — 각 버튼이 '{label} 수정' / '{label} 삭제' 로 접근 가능한 이름을 갖는다(색만으로 의미 전달 금지) */
export const AriaLabels: Story = {
  name: 'Accessibility/ARIA',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: '공지 제목 수정' })).not.toBeNull();
    await expect(canvas.getByRole('button', { name: '공지 제목 삭제' })).not.toBeNull();
  },
};

/** RTL — dir="rtl" 에서 액션 정렬이 반대로 뒤집힌다(한국어 콘텐츠로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  decorators: [rtlFrame],
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 액션을 누르면 onEdit·onDelete 가 발화한다 */
export const FiresWhenEnabled: Story = {
  name: 'Interaction/Action Click',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '공지 제목 수정' }));
    await expect(args.onEdit).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: '공지 제목 삭제' }));
    await expect(args.onDelete).toHaveBeenCalled();
  },
};

/** disabled 에서는 클릭해도 onEdit·onDelete 가 발화하지 않는다 (계약 blockedWhen: disabled) */
export const BlockedWhenDisabled: Story = {
  name: 'Interaction/Disabled',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '공지 제목 수정' }), {
      pointerEventsCheck: 0,
    });
    await userEvent.click(canvas.getByRole('button', { name: '공지 제목 삭제' }), {
      pointerEventsCheck: 0,
    });
    await expect(args.onEdit).not.toHaveBeenCalled();
    await expect(args.onDelete).not.toHaveBeenCalled();
  },
};
