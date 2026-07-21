// FileChip — Storybook 스토리 (CSF3 · File/FileChip)
//
// argTypes 는 계약 생성물(generated/argtypes/FileChip.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: combinationMatrix(disabled = 2) 전수 + blockedWhen(disabled) + 활성 발화 대조 +
//           제거 불가(onRemove 없음) + 썸네일 없음(엣지) + 용량 표기 경계 + 긴 파일명 + Dark/RTL.
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { FileChipArgTypes } from '../../../generated/argtypes/FileChip.argtypes';
import { FileChip } from './FileChip';

const meta: Meta<typeof FileChip> = {
  title: 'Design System/Components/FileChip',
  component: FileChip,
  argTypes: { ...FileChipArgTypes },
  args: {
    src: '',
    name: 'favicon.ico',
    size: 13_000,
    disabled: false,
    onRemove: fn(),
  },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof FileChip>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/* ── combinationMatrix 전수 (disabled = 2) ─────────────────────────────────── */

/** 기본 — 썸네일 + 파일명 + 용량 + 제거(×) */
export const Default: Story = {};

/** 잠김 — 제거 버튼만 잠긴다(칩 자체는 계속 읽힌다) */
export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * 제거할 수 없는 자리 — onRemove 를 주지 않으면 × 버튼이 아예 생기지 않는다 (죽은 버튼 0).
 *
 * args 로 `undefined` 를 넣는 대신 render 에서 prop 자체를 빼야 한다 — exactOptionalPropertyTypes
 * 아래에서 '주지 않음' 과 'undefined 를 줌' 은 다른 값이고, 이 스토리가 보이려는 것은 전자다.
 */
export const WithoutRemove: Story = {
  render: () => <FileChip src="" name="favicon.ico" size={13_000} />,
};

/** 썸네일 없음(엣지) — src 가 비면 ImageThumb 가 placeholder 를 그린다 */
export const WithoutThumbnail: Story = {
  args: { src: '', name: 'terms.pdf', size: 480 },
};

/** 1KB 미만 — 바이트로 그대로 읽는다 */
export const TinyFile: Story = {
  args: { name: 'pixel.gif', size: 43 },
};

/** MB 단위 — 소수 1자리가 여기서부터 붙는다 ('작다/크다' 만 말한다) */
export const LargeFile: Story = {
  args: { name: 'hero@2x.png', size: 1024 * 1024 * 2.4 },
};

/** 긴 파일명 — 한 줄로 자르고 말줄임한다 (칩이 옆 드롭존을 밀어내지 않는다) */
export const LongFileName: Story = {
  args: { name: '2026-상반기-브랜드-리뉴얼-대표이미지-최종-v3-수정본.png', size: 812_000 },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '18rem' }}>
        <Story />
      </div>
    ),
  ],
};

/* ── 계약 events.onRemove.blockedWhen 전수 검증 (disabled) ────────────────────
 * 비발생은 렌더로 증명되지 않는다 — 스파이(args.onRemove = fn())를 관찰한다.
 */

/** FileChip: disabled 에서 onRemove 가 발화하지 않는다 (계약 blockedWhen: disabled) */
export const BlockedWhenDisabled: Story = {
  name: 'FileChip: disabled 상태에서 onRemove 가 발화하지 않는다',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const remove = within(canvasElement).getByRole('button');

    await expect(remove).toBeDisabled();
    await userEvent.click(remove, { pointerEventsCheck: 0 });

    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};

/** FileChip: 활성 상태에서는 onRemove 가 발화한다 (비발생 단언이 공허하지 않음을 보인다) */
export const FiresWhenEnabled: Story = {
  name: 'FileChip: 활성 상태에서는 onRemove 가 발화한다',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));

    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

/** RTL */
export const RightToLeft: Story = { args: { name: 'شعار.png' }, decorators: [rtlFrame] };
