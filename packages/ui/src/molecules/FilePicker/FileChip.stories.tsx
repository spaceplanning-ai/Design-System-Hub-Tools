// FileChip — Storybook 스토리 (CSF3 · File 계열)
//
// [고정 IA] Docs · Overview · States(Disabled) · Content(Without Remove·Without Thumbnail·
// Tiny File·Large File·Long Filename) · Accessibility(RTL) · Interaction(Remove·Disabled Remove).
// combinationMatrix(disabled = 2)는 Overview(false)·States/Disabled(true)로 전수한다. 계약 states
// (default·hover·focus-visible·disabled)와 formatFileSize 경계는 FileChip.test.tsx 가 소유한다.
//
// argTypes 는 계약 생성물(generated/argtypes/FileChip.argtypes)을 spread 한다 (수기 작성 금지 — G5).
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

/* ── Overview ───────────────────────────────────────────────────────────── */

/** 대표 쓰임새 — 썸네일 + 파일명 + 용량 + 제거(×). Controls 로 각 prop 을 바꿔 본다 */
export const Default: Story = { name: 'Overview' };

/* ── States ─────────────────────────────────────────────────────────────── */

/** 잠김 — 제거 버튼만 잠긴다(칩 자체는 계속 읽힌다). combinationMatrix disabled = true */
export const Disabled: Story = {
  name: 'States/Disabled',
  args: { disabled: true },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/**
 * 제거할 수 없는 자리 — onRemove 를 주지 않으면 × 버튼이 아예 생기지 않는다 (죽은 버튼 0).
 *
 * args 로 `undefined` 를 넣는 대신 render 에서 prop 자체를 빼야 한다 — exactOptionalPropertyTypes
 * 아래에서 '주지 않음' 과 'undefined 를 줌' 은 다른 값이고, 이 스토리가 보이려는 것은 전자다.
 */
export const WithoutRemove: Story = {
  name: 'Content/Without Remove',
  render: () => <FileChip src="" name="favicon.ico" size={13_000} />,
};

/** 썸네일 없음(엣지) — src 가 비면 ImageThumb 가 placeholder 를 그린다 */
export const WithoutThumbnail: Story = {
  name: 'Content/Without Thumbnail',
  args: { src: '', name: 'terms.pdf', size: 480 },
};

/** 1KB 미만 — 바이트로 그대로 읽는다 */
export const TinyFile: Story = {
  name: 'Content/Tiny File',
  args: { name: 'pixel.gif', size: 43 },
};

/** MB 단위 — 소수 1자리가 여기서부터 붙는다 ('작다/크다' 만 말한다) */
export const LargeFile: Story = {
  name: 'Content/Large File',
  args: { name: 'hero@2x.png', size: 1024 * 1024 * 2.4 },
};

/** 긴 파일명 — 한 줄로 자르고 말줄임한다 (칩이 옆 드롭존을 밀어내지 않는다) */
export const LongFileName: Story = {
  name: 'Content/Long Filename',
  args: { name: '2026-상반기-브랜드-리뉴얼-대표이미지-최종-v3-수정본.png', size: 812_000 },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '18rem' }}>
        <Story />
      </div>
    ),
  ],
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** RTL — 논리 속성이라 칩이 반대 방향으로 자동으로 뒤집힌다(문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { name: '회사-로고.png' },
  decorators: [rtlFrame],
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 활성 상태에서 제거(×)를 누르면 onRemove 가 발화한다 (비발생 단언이 공허하지 않음을 보인다) */
export const FiresWhenEnabled: Story = {
  name: 'Interaction/Remove',
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button'));

    await expect(args.onRemove).toHaveBeenCalledTimes(1);
  },
};

/** disabled 에서 제거(×)가 발화하지 않는다 (계약 blockedWhen: disabled) */
export const BlockedWhenDisabled: Story = {
  name: 'Interaction/Disabled Remove',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const remove = within(canvasElement).getByRole('button');

    await expect(remove).toBeDisabled();
    await userEvent.click(remove, { pointerEventsCheck: 0 });

    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};
