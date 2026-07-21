// Divider — Storybook 스토리 (CSF3)
//
// [단순 컴포넌트] Playground 없음(운영 가이드 §11 — Divider 는 Controls 폭발 대상 아님).
// Default + Examples(실제 배치) + Accessibility(RTL). orientation 은 Controls 로 바꾼다.
import type { Meta, StoryObj } from '@storybook/react';

import { DividerArgTypes } from '../../../generated/argtypes/Divider.argtypes';
import { Divider } from './Divider';

const rowStyle = { display: 'flex', alignItems: 'center', gap: 'var(--tds-space-3)' } as const;

const meta: Meta<typeof Divider> = {
  title: 'Design System/Components/Divider',
  component: Divider,
  argTypes: { ...DividerArgTypes },
  args: { orientation: 'horizontal' },
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Divider>;

/** 기본형 — 부모 폭을 채우는 가로선 */
export const Default: Story = {};

/* ── Examples ───────────────────────────────────────────────────────────── */

/** 세로선 — 툴바에서 액션 사이를 가른다. 부모 높이에 맞춰 늘어난다 */
export const Vertical: Story = {
  name: 'Examples/Vertical',
  args: { orientation: 'vertical' },
  render: (args) => (
    <div style={rowStyle}>
      <span>실행취소</span>
      <Divider {...args} />
      <span>다시하기</span>
    </div>
  ),
};

/** 목록 사이 구분 — 실제로 쓰이는 배치 */
export const InList: Story = {
  name: 'Examples/In List',
  parameters: { controls: { disable: true } },
  render: () => (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li style={{ paddingBlock: 'var(--tds-space-3)' }}>공지사항</li>
      <Divider />
      <li style={{ paddingBlock: 'var(--tds-space-3)' }}>자주 묻는 질문</li>
      <Divider />
      <li style={{ paddingBlock: 'var(--tds-space-3)' }}>1:1 문의</li>
    </ul>
  ),
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** RTL — 치수를 논리 속성으로만 그리므로 방향이 뒤집혀도 같은 선이다. 문서 방향만 뒤집는다 */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { orientation: 'vertical' },
  decorators: [
    (Story) => (
      <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div style={rowStyle}>
      <span>실행취소</span>
      <Divider {...args} />
      <span>다시하기</span>
    </div>
  ),
};
