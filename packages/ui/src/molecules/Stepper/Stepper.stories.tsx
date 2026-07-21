// Stepper — Storybook 스토리 (CSF3)
//
// [고정 IA — Navigation 진행 표시기] 이 컴포넌트는 값 증감 +/- 입력이 아니라 흐름을 '보여 주는'
// 비대화형 표시기다(계약 category: Navigation). 그래서 Inputs 계열 어휘(Increment·At Min·With Unit …)는
// 해당 없음이라 전부 생략하고, 진행 위치를 상태 축으로 남긴다(Behavior 금지 → Interaction 없음):
//   Overview · Playground · States/(At First Step·Completed·Out of Flow) · Content/ · Accessibility/(Keyboard·RTL)
// 계약 states 매핑: default(미도달) · checked(완료·현재 단계까지 채움) · selected(현재·굵은 테두리).
// states[] 전수 검증은 Stepper.test.tsx 가 소유. argTypes 는 계약 생성물 spread(G5).
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { StepperArgTypes } from '../../../generated/argtypes/Stepper.argtypes';
import { Stepper } from './Stepper';

const RETURN_FLOW = [
  { id: 'received', label: '접수' },
  { id: 'collecting', label: '수거중' },
  { id: 'inspecting', label: '검수중' },
  { id: 'done', label: '완료' },
];

const PIPELINE_FLOW = [
  { id: 'lead', label: '리드' },
  { id: 'consult', label: '상담' },
  { id: 'proposal', label: '제안' },
  { id: 'negotiation', label: '협상' },
  { id: 'won', label: '수주' },
];

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

const meta: Meta<typeof Stepper> = {
  title: 'Design System/Components/Stepper',
  component: Stepper,
  argTypes: { ...StepperArgTypes },
  args: { steps: RETURN_FLOW, current: 'collecting', ariaLabel: '처리 진행 단계' },
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Stepper>;

/** Overview — 대표 쓰임새(흐름 중간). 현재 단계까지 채워진다. Controls 에서 current 를 바꿔 본다 */
export const Overview: Story = {};

/** Playground — current 를 Controls 로 바꿔 각 단계·흐름 밖 값까지 전 상태를 여기서 본다 */
export const Playground: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** 첫 단계(selected) — 하나만 채워지고 그 <li> 에 aria-current="step" 이 붙는다 */
export const AtFirstStep: Story = {
  name: 'States/At First Step',
  args: { current: 'received' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const steps = within(canvasElement).getAllByRole('listitem');
    await expect(steps[0]).toHaveAttribute('aria-current', 'step');
    await expect(steps[1]).not.toHaveAttribute('aria-current');
  },
};

/** 완료(checked) — 마지막 단계가 current 라 전부 채워진다 */
export const AllDone: Story = {
  name: 'States/Completed',
  args: { current: 'done' },
};

/**
 * 흐름 밖 종료 — 반려·실주. 단계 목록에 없는 값이라 아무 단계도 채우지 않는다.
 * 그 사실은 호출부가 danger 배너로 따로 알린다 (계약 description).
 */
export const OutOfFlow: Story = {
  name: 'States/Out of Flow',
  args: { current: 'rejected' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const steps = within(canvasElement).getAllByRole('listitem');
    for (const step of steps) {
      await expect(step).toHaveAttribute('data-done', 'false');
    }
  },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 최소 콘텐츠 — 단계 둘 */
export const MinimalSteps: Story = {
  name: 'Content/Minimal Content',
  args: {
    steps: [
      { id: 'draft', label: '작성' },
      { id: 'published', label: '게시' },
    ],
    current: 'draft',
    ariaLabel: '게시 단계',
  },
};

/** 긴 콘텐츠 — 단계가 많고 라벨이 길 때 (flex-wrap 으로 줄이 바뀐다) */
export const ManySteps: Story = {
  name: 'Content/Long Content',
  args: { steps: PIPELINE_FLOW, current: 'proposal', ariaLabel: '파이프라인 단계' },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** 비대화형 — 버튼이 없고 Tab 을 눌러도 어떤 단계도 포커스를 받지 않는다 (계약 a11y.keyboard: none) */
export const NonInteractive: Story = {
  name: 'Accessibility/Keyboard',
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    await userEvent.tab();
    for (const step of canvas.getAllByRole('listitem')) {
      await expect(step).not.toHaveFocus();
    }
  },
};

/** RTL — 논리 속성이라 단계가 오른쪽부터 흐른다(문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { steps: RETURN_FLOW, current: 'inspecting', ariaLabel: '처리 진행 단계' },
  decorators: [rtlFrame],
};
