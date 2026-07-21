// Result — Storybook 스토리 (CSF3 · Feedback/Result)
//
// argTypes 는 계약 생성물(generated/argtypes/Result.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// actions 는 슬롯이라 control 비활성 — Story args 로 <Button> 을 직접 넣는다.
//
// [문구가 스토리마다 다른 이유] 이 컴포넌트는 카피를 만들지 않고 받는다. 그래서 스토리가
// 보여줄 것은 '어떤 문구가 나오는가' 가 아니라 **어느 줄이 그려지고 어느 줄이 사라지는가** 다.
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { ResultArgTypes } from '../../../generated/argtypes/Result.argtypes';
import { Button } from '../../atoms/Button';
import { Result } from './Result';

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

const meta: Meta<typeof Result> = {
  title: 'Design System/Components/Result',
  component: Result,
  argTypes: { ...ResultArgTypes },
  args: {
    title: '문제가 발생했어요',
    description:
      '화면을 그리는 중 예상하지 못한 오류가 났습니다. 다시 시도해도 같은 문제가 계속되면 아래 코드와 함께 알려 주세요.',
    reference: 'A1B2-C3D4',
  },
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Result>;

/** default — 네 줄이 모두 있는 최대 형태 (렌더 예외 복구 화면, EXC-01) */
export const Default: Story = {
  args: {
    actions: (
      <>
        <Button variant="primary">다시 시도</Button>
        <Button variant="secondary">대시보드로</Button>
      </>
    ),
  },
};

/**
 * 권한 없음 (EXC-03) — 재시도 버튼을 주지 않는다. 다시 눌러도 또 403 이므로
 * 할 수 있는 일은 권한이 있는 곳으로 가는 것뿐이다. 참조 코드도 없다.
 */
export const Forbidden: Story = {
  args: {
    title: '접근 권한이 없습니다',
    description:
      '이 화면을 볼 수 있는 권한이 없습니다. 필요하다면 관리자에게 권한을 요청해 주세요.',
    reference: '',
    actions: <Button variant="secondary">대시보드로</Button>,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    // 액션은 하나뿐 — '다시 시도' 가 없는 것이 이 화면의 계약이다
    await expect(canvas.getAllByRole('button')).toHaveLength(1);
  },
};

/** 참조 코드 없음 — 빈 문자열이면 그 줄 자체가 사라진다 (빈 줄을 남기지 않는다) */
export const WithoutReference: Story = {
  args: {
    reference: '',
    actions: <Button variant="primary">다시 시도</Button>,
  },
};

/** 액션 없음 — 빠져나갈 수단을 주지 않으면 액션 줄을 그리지 않는다 */
export const WithoutActions: Story = {
  args: { actions: null },
};

/** 최소 콘텐츠 — 제목 하나. 설명·참조·액션이 모두 비면 h2 만 남는다 */
export const TitleOnly: Story = {
  args: { description: '', reference: '', actions: null },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 2 })).not.toBeNull();
    await expect(canvas.queryAllByRole('button')).toHaveLength(0);
  },
};

/** 라이브 영역 — role="alert" 로 렌더 즉시 보조기술에 전달된다 */
export const AlertLiveRegion: Story = {
  args: {
    actions: <Button variant="primary">다시 시도</Button>,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(alert.textContent).toContain('A1B2-C3D4');
  },
};

/** RTL — flex 흐름이 뒤집혀 제목·설명·액션이 오른쪽부터 흐른다 */
export const RightToLeft: Story = {
  args: {
    title: 'حدثت مشكلة',
    description: 'حدث خطأ غير متوقع أثناء عرض الشاشة. حاول مرة أخرى.',
    reference: 'A1B2-C3D4',
    actions: <Button variant="primary">إعادة المحاولة</Button>,
  },
  decorators: [rtlFrame],
};
