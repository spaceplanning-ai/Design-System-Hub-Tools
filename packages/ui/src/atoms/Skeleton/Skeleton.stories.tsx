// Skeleton — Storybook 스토리 (CSF3 · Feedback/Skeleton)
//
// argTypes 는 계약 생성물(generated/argtypes/Skeleton.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// 커버리지: shape 3변형 전수 + boolean(isAnimated) true/false + RTL + 승계 원본인 표 배치.
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import { SkeletonArgTypes } from '../../../generated/argtypes/Skeleton.argtypes';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Components/Skeleton',
  component: Skeleton,
  argTypes: { ...SkeletonArgTypes },
  args: { shape: 'line', isAnimated: true },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

/** line/block 은 컨테이너 폭을 채우는 형태라, 폭을 주지 않으면 캔버스 전체로 퍼진다 */
const widthFrame: Decorator = (Story) => (
  <div style={{ inlineSize: 'var(--tds-space-10)' }}>
    <Story />
  </div>
);

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ inlineSize: 'var(--tds-space-10)', padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** line — 텍스트 한 줄 자리. 승계한 `.tds-ui-skeleton` 과 같은 형태이며 표 9곳이 쓰던 유일한 형태다 */
export const Line: Story = {
  args: { shape: 'line' },
  decorators: [widthFrame],
};

/** circle — 아바타/아이콘 자리. 폭을 채우면 타원이 되므로 여기만 정사각 고정이다 */
export const Circle: Story = {
  args: { shape: 'circle' },
};

/** block — 카드/썸네일 자리 */
export const Block: Story = {
  args: { shape: 'block' },
  decorators: [widthFrame],
};

/** isAnimated=false — 정지한 회색 블록. 정적 스냅샷(VRT·인쇄)용 옵트아웃이다 */
export const Static: Story = {
  args: { shape: 'line', isAnimated: false },
  decorators: [widthFrame],
};

/**
 * 승계 원본의 배치 — 표 로딩. 반복은 계약에 없다.
 * 호출부가 자기 표의 컬럼 수로 `<tr>`/`<td>` 를 반복하고 칸마다 Skeleton 한 장을 둔다
 * (apps/admin 의 표 9곳이 이 형태로 이관됐다).
 */
export const TableRows: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', inlineSize: 'var(--tds-space-10)' }}>
      <caption style={{ captionSide: 'top', paddingBlockEnd: 'var(--tds-space-2)' }}>
        불러오는 중
      </caption>
      <tbody aria-busy="true">
        {Array.from({ length: 3 }, (_, row) => (
          <tr key={`skeleton-${String(row)}`}>
            {Array.from({ length: 4 }, (_cell, cell) => (
              <td key={`cell-${String(cell)}`} style={{ padding: 'var(--tds-space-2)' }}>
                <Skeleton />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/** States — 계약 `states` 는 `default` 하나뿐이다. 시각 축은 shape 와 isAnimated 가 전부다 */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--tds-space-3)',
        inlineSize: 'var(--tds-space-10)',
      }}
    >
      <Skeleton shape="line" />
      <Skeleton shape="line" isAnimated={false} />
      <Skeleton shape="block" />
    </div>
  ),
};

/** RTL — 논리 속성(inline-size)만 쓰므로 방향이 뒤집혀도 같은 형태다 */
export const RightToLeft: Story = {
  args: { shape: 'line' },
  decorators: [rtlFrame],
};
