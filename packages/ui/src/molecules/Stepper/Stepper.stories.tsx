// Stepper — Storybook 스토리 (CSF3 · Navigation/Stepper)
//
// argTypes 는 계약 생성물(generated/argtypes/Stepper.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// steps 는 데이터 prop 이라 control 비활성 — Story args 로 직접 준다 (ADR-0003).
//
// [play 가 키보드를 두드리지 않는 이유] 이 컴포넌트는 비대화형이다. 계약 a11y.keyboard 가
// 'none' 이므로 키보드 맵을 재연할 것이 없고, 대신 **포커스 순서에 들어가지 않는다**는
// 그 계약 자체를 play 로 검증한다.
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

/** default — 흐름 중간. 현재 단계까지 채워진다 */
export const Default: Story = {};

/** checked(완료) — 마지막 단계가 current 라 전부 채워진다 */
export const AllDone: Story = {
  args: { current: 'done' },
};

/** selected(현재) — 첫 단계. 하나만 채워진다 */
export const AtFirstStep: Story = {
  args: { current: 'received' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const steps = within(canvasElement).getAllByRole('listitem');
    await expect(steps[0]).toHaveAttribute('aria-current', 'step');
    await expect(steps[1]).not.toHaveAttribute('aria-current');
  },
};

/**
 * 흐름 밖 종료 — 반려·실주. 단계 목록에 없는 값이라 아무 단계도 채우지 않는다.
 * 그 사실은 호출부가 danger 배너로 따로 알린다 (계약 description).
 */
export const OutOfFlow: Story = {
  args: { current: 'rejected' },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const steps = within(canvasElement).getAllByRole('listitem');
    for (const step of steps) {
      await expect(step).toHaveAttribute('data-done', 'false');
    }
  },
};

/** 비대화형 — Tab 을 눌러도 어떤 단계도 포커스를 받지 않는다 (계약 a11y.keyboard: none) */
export const NonInteractive: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    await userEvent.tab();
    for (const step of canvas.getAllByRole('listitem')) {
      await expect(step).not.toHaveFocus();
    }
  },
};

/** 최소 콘텐츠 — 단계 둘 */
export const MinimalSteps: Story = {
  args: {
    steps: [
      { id: 'draft', label: '작성' },
      { id: 'published', label: '게시' },
    ],
    current: 'draft',
    ariaLabel: '게시 단계',
  },
};

/** 최대 콘텐츠 — 단계가 많고 라벨이 길 때 (줄바꿈으로 흘러간다) */
export const ManySteps: Story = {
  args: { steps: PIPELINE_FLOW, current: 'proposal', ariaLabel: '파이프라인 단계' },
};

/** RTL — flex 흐름이 뒤집혀 단계가 오른쪽부터 흐른다 */
export const RightToLeft: Story = {
  args: {
    steps: [
      { id: 'received', label: 'مستلم' },
      { id: 'collecting', label: 'قيد الجمع' },
      { id: 'inspecting', label: 'قيد الفحص' },
      { id: 'done', label: 'مكتمل' },
    ],
    current: 'inspecting',
    ariaLabel: 'مراحل المعالجة',
  },
  decorators: [rtlFrame],
};
