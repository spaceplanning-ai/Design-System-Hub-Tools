// FileDropzone — Storybook 스토리 (CSF3 · File/FileDropzone)
//
// argTypes 는 계약 생성물(generated/argtypes/FileDropzone.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: combinationMatrix(disabled × isInvalid = 4) 전수 + blockedWhen(disabled) +
//           활성 발화 대조 + meta 없음(엣지) + describedBy 연결 + FileChip 과 나란히 선 실제 배치 + Dark/RTL.
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { FileDropzoneArgTypes } from '../../../generated/argtypes/FileDropzone.argtypes';
import { FileChip } from './FileChip';
import { FileDropzone } from './FileDropzone';

const meta: Meta<typeof FileDropzone> = {
  title: 'File/FileDropzone',
  component: FileDropzone,
  argTypes: { ...FileDropzoneArgTypes },
  args: {
    label: '파비콘',
    title: '파일 선택 또는 끌어다 놓기',
    meta: '최소 16x16 / ICO · PNG',
    accept: 'image/x-icon,image/png',
    describedBy: '',
    disabled: false,
    isInvalid: false,
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', inlineSize: '26rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof FileDropzone>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/* ── combinationMatrix 전수 (disabled × isInvalid = 4) ─────────────────────── */

/** 기본 */
export const Default: Story = {};

/** 오류 — 테두리만 danger 로 바뀐다. 문구는 호출부가 소유한다 */
export const Invalid: Story = {
  args: { isInvalid: true },
};

/** 잠김 */
export const Disabled: Story = {
  args: { disabled: true },
};

/** 잠김 + 오류 — 이미 실패한 자리가 업로드 중에 잠긴 상태 */
export const DisabledInvalid: Story = {
  args: { disabled: true, isInvalid: true },
};

/** 형식 안내 없음(엣지) — meta 를 비우면 둘째 줄이 아예 없다 */
export const WithoutMeta: Story = {
  args: { meta: '' },
};

/** 오류 문구와 이어진 상태 — 문단은 호출부의 것이고 드롭존은 describedBy 로 잇기만 한다 */
export const DescribedByError: Story = {
  args: { isInvalid: true, describedBy: 'favicon-error' },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: '26rem' }}>
        <div style={{ display: 'flex' }}>
          <Story />
        </div>
        <p
          id="favicon-error"
          role="alert"
          style={{
            marginBlock: 'var(--tds-space-1)',
            color: 'var(--tds-color-feedback-danger-text)',
            fontSize: 'var(--tds-typography-caption-md-font-size)',
          }}
        >
          ICO 또는 PNG 파일만 올릴 수 있습니다.
        </p>
      </div>
    ),
  ],
};

/** 실제 배치 — 걸린 파일 칩과 드롭존이 가로로 나란히 선다 (이 쌍이 존재하는 이유) */
export const BesideFileChip: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--tds-space-3)',
          flexWrap: 'wrap',
          inlineSize: '32rem',
        }}
      >
        <FileChip src="" name="favicon.ico" size={13_000} onRemove={() => undefined} />
        <Story />
      </div>
    ),
  ],
};

/* ── 계약 events.onSelect.blockedWhen 전수 검증 (disabled) ────────────────────
 * 비발생은 렌더로 증명되지 않는다 — 스파이(args.onSelect = fn())를 관찰한다.
 */

/** FileDropzone: disabled 에서 onSelect 가 발화하지 않는다 (계약 blockedWhen: disabled) */
export const BlockedWhenDisabled: Story = {
  name: 'FileDropzone: disabled 상태에서 onSelect 가 발화하지 않는다',
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const zone = within(canvasElement).getByRole('button');

    await expect(zone).toBeDisabled();
    await userEvent.click(zone, { pointerEventsCheck: 0 });

    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

/** FileDropzone: 활성 상태에서는 고른 파일이 onSelect 로 나간다 (비발생 단언이 공허하지 않음을 보인다) */
export const FiresWhenEnabled: Story = {
  name: 'FileDropzone: 활성 상태에서는 onSelect 가 발화한다',
  play: async ({ canvasElement, args }) => {
    const input = canvasElement.querySelector('.tds-dropzone__input');
    if (!(input instanceof HTMLInputElement)) throw new Error('숨은 file input 을 찾지 못했다');

    // 숨은 입력은 pointer-events:none 이라 upload 가 닿지 않는다 — 탐색기가 값을 채우는 지점을 만든다
    await userEvent.upload(input, new File(['x'], 'favicon.ico', { type: 'image/x-icon' }), {
      applyAccept: false,
    });

    await expect(args.onSelect).toHaveBeenCalled();
  },
};

/** RTL */
export const RightToLeft: Story = {
  args: { label: 'الأيقونة', title: 'اختر ملفًا أو اسحبه هنا', meta: 'ICO · PNG' },
  decorators: [rtlFrame],
};

/**
 * Playground — 컨트롤 8개를 한 화면에서 전부 살려 둔다.
 * disabled 와 isInvalid 는 표면(테두리·커서)을 함께 결정하고 서로 겹칠 수 있어
 * 둘을 같이 돌려 봐야 우선순위가 보인다. Default 는 describedBy 가 비어 있다.
 */
export const Playground: Story = {
  args: {
    label: '파비콘',
    title: '파일 선택 또는 끌어다 놓기',
    meta: '최소 16x16 / ICO · PNG',
    accept: 'image/x-icon,image/png',
    describedBy: '',
    disabled: false,
    isInvalid: false,
  },
};
