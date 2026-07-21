// TableReorder — Storybook 스토리 (CSF3 · Tables/TableReorder)
//
// [argTypes 를 spread 하지 않는 이유] 이 묶음은 **계약 비대상**이다 (TableReorder.tsx 머리말: 실제 API 가
// 순수 훅이라 계약 events 의 단일 payload 시그니처로 표현되지 않는다). 그래서 generated/argtypes 산출물이
// 없다 — 여기서는 수기 argTypes 도 두지 않고, 조립된 표를 실제로 움직여 보이는 스토리로 문서화한다.
//
// [스토리를 조합으로 늘리지 않는다] 기본형 하나와 **경계·잠금·실제 이동을 단언하는 play** 로만 이루어진다.
// 행 수나 locked 같은 축은 Controls 로 돌려 보는 편이 낫고, 스토리로 곱해 두면 읽는 사람이 무엇이
// 검증되는 것이고 무엇이 그냥 그림인지 구분하지 못한다.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import {
  ReorderGripCell,
  ReorderGripHeaderCell,
  ReorderMoveButtons,
  useReorderableRows,
} from './TableReorder';

interface Row {
  readonly id: string;
  readonly question: string;
}

// `readonly Row[]` 로 넓히면 길이가 지워져 FAQ_ROWS[0] 이 `Row | undefined` 가 된다
// (noUncheckedIndexedAccess). 경계 스토리가 첫/가운데/끝 행을 인덱스로 집으므로 튜플로 고정한다.
const FAQ_ROWS = [
  { id: 'a', question: '배송은 얼마나 걸리나요?' },
  { id: 'b', question: '교환·반품은 어떻게 하나요?' },
  { id: 'c', question: '세금계산서를 받을 수 있나요?' },
] as const satisfies readonly Row[];

const cellStyle = {
  paddingBlock: 'var(--tds-space-3)',
  paddingInline: 'var(--tds-space-3)',
  borderBlockEnd: 'var(--tds-border-width-thin) solid var(--tds-color-border-subtle)',
  color: 'var(--tds-color-text-default)',
  fontSize: 'var(--tds-typography-body-md-font-size)',
  textAlign: 'start',
} as const;

interface DemoProps {
  /** 초기 행 — 스토리가 순서를 바꾸면 지역 상태가 따라간다 */
  readonly rows?: readonly Row[];
  /** 저장 진행 중 — 그립과 이동 버튼을 전부 잠근다 */
  readonly locked?: boolean;
}

/**
 * 훅 + 표 조각을 실제 <table> 로 조립한 데모.
 * 순서 상태는 이 데모가 들고 있다 — 훅은 '새 순서 배열' 만 만들어 넘긴다.
 */
function ReorderDemo({ rows = FAQ_ROWS, locked = false }: DemoProps) {
  const [order, setOrder] = useState<readonly Row[]>(rows);
  const ids = order.map((row) => row.id);

  const reorder = (orderedIds: readonly string[]): void => {
    setOrder(
      orderedIds
        .map((id) => order.find((row) => row.id === id))
        .filter((row): row is Row => row !== undefined),
    );
  };

  const { rowProps, rowStyle, moveBy } = useReorderableRows(ids, reorder, locked);

  return (
    <table style={{ borderCollapse: 'collapse', inlineSize: '100%' }}>
      <caption style={{ ...cellStyle, captionSide: 'top' }}>자주 묻는 질문 노출 순서</caption>
      <thead>
        <tr>
          <ReorderGripHeaderCell />
          <th scope="col" style={cellStyle}>
            질문
          </th>
          <th scope="col" style={cellStyle}>
            순서 이동
          </th>
        </tr>
      </thead>
      <tbody>
        {order.map((row, index) => (
          <tr key={row.id} {...rowProps(row.id)} style={rowStyle(row.id, {})}>
            <ReorderGripCell />
            <td style={cellStyle}>{row.question}</td>
            <td style={cellStyle}>
              <ReorderMoveButtons
                label={row.question}
                index={index}
                count={order.length}
                locked={locked}
                onMove={moveBy}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta: Meta<typeof ReorderDemo> = {
  title: 'Design System/Components/TableReorder',
  component: ReorderDemo,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof ReorderDemo>;

/** 기본형 — 행 수·잠금은 Controls 로 돌려 본다 */
export const Default: Story = {};

/** 저장 중 전체 잠금 */
export const Locked: Story = { args: { locked: true } };

export const BoundaryButtonsLocked: Story = {
  name: 'TableReorder: 첫 행의 위로·마지막 행의 아래로 이동이 잠긴다',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 경계는 '이동할 곳이 없다' 는 사실이므로 잠금이 곧 계약이다
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[0].question} 위로 이동` }),
    ).toBeDisabled();
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[2].question} 아래로 이동` }),
    ).toBeDisabled();
    // 가운데 행은 양쪽 다 열려 있어야 한다 — 전부 잠긴 상태와 구분되지 않으면 이 검사는 헛돈다
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[1].question} 위로 이동` }),
    ).not.toBeDisabled();
  },
};

export const KeyboardMove: Story = {
  name: 'TableReorder: 이동 버튼으로 순서가 실제로 바뀐다',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: `${FAQ_ROWS[1].question} 위로 이동` }),
    );
    // 순서가 바뀌었다는 것은 '두 번째 행이 첫 번째가 됐다' 로만 증명된다
    const bodyRows = canvas.getAllByRole('row').slice(1); // 머리행 제외
    const firstRow = bodyRows[0];
    if (firstRow === undefined) throw new Error('본문 행이 없다 — 표가 그려지지 않았다');
    expect(within(firstRow).getByText(FAQ_ROWS[1].question)).not.toBeNull();
  },
};

export const LockedBlocksMove: Story = {
  name: 'TableReorder: locked 이면 이동 버튼이 전부 잠긴다',
  args: { locked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const row of FAQ_ROWS) {
      expect(canvas.getByRole('button', { name: `${row.question} 위로 이동` })).toBeDisabled();
      expect(canvas.getByRole('button', { name: `${row.question} 아래로 이동` })).toBeDisabled();
    }
  },
};
