// TableReorder — Storybook 스토리 (CSF3 · Design System/Components/TableReorder)
//
// [고정 IA] Docs(MDX) · Overview · States(Disabled·First Row·Last Row) ·
// Content(Few Rows·Many Rows) · Accessibility(Keyboard·RTL·ARIA) ·
// Interaction(Move Up·Move Down·Disabled).
//
// [argTypes 를 spread 하지 않는 이유] 이 묶음은 **계약 비대상**이다 (TableReorder.tsx 머리말: 실제 API 가
// 순수 훅이라 계약 events 의 단일 payload 시그니처로 표현되지 않는다). 그래서 generated/argtypes 산출물이
// 없다 — 여기서는 수기 argTypes 도 두지 않고, 조립된 표를 실제로 움직여 보이는 스토리로 문서화한다.
//
// [스토리를 조합으로 늘리지 않는다] 대표형(Overview) 하나와 **경계·잠금·실제 이동을 단언하는 play** 로만
// 이루어진다. 행 수·locked 같은 축은 대표 상태로만 두고, 곱해서 폭발시키지 않는다.
import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
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
// (noUncheckedIndexedAccess). 경계·이동 스토리가 첫/가운데/끝 행을 인덱스로 집으므로 튜플로 고정한다.
const FAQ_ROWS = [
  { id: 'a', question: '배송은 얼마나 걸리나요?' },
  { id: 'b', question: '교환·반품은 어떻게 하나요?' },
  { id: 'c', question: '세금계산서를 받을 수 있나요?' },
] as const satisfies readonly Row[];

const TWO_ROWS: readonly Row[] = [
  { id: 'a', question: '배송은 얼마나 걸리나요?' },
  { id: 'b', question: '교환·반품은 어떻게 하나요?' },
];

const MANY_ROWS: readonly Row[] = [
  { id: 'a', question: '배송은 얼마나 걸리나요?' },
  { id: 'b', question: '교환·반품은 어떻게 하나요?' },
  { id: 'c', question: '세금계산서를 받을 수 있나요?' },
  { id: 'd', question: '해외로도 배송되나요?' },
  { id: 'e', question: '주문을 취소할 수 있나요?' },
  { id: 'f', question: '적립금은 어떻게 쓰나요?' },
];

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
 * ControlledReorderTable — 훅 + 표 조각을 실제 <table> 로 조립한 데모(순서 상태를 소유한다).
 * 훅은 '새 순서 배열' 만 만들어 넘기고, 이 래퍼가 그 결과를 지역 상태로 반영한다.
 */
function ControlledReorderTable({ rows = FAQ_ROWS, locked = false }: DemoProps) {
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

/** RTL 검수용 프레임 — 논리 속성(paddingInline·textAlign:start)이 뒤집히는지 본다. 콘텐츠는 한국어. */
const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

const meta: Meta<typeof ControlledReorderTable> = {
  title: 'Design System/Components/TableReorder',
  component: ControlledReorderTable,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof ControlledReorderTable>;

/* ── Overview ───────────────────────────────────────────────────────────── */

/** Overview — 대표 쓰임새(FAQ 노출 순서). 각 행에 드래그 손잡이와 위/아래 이동 버튼이 함께 있다 */
export const Overview: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** 저장 중 전체 잠금 — 그립과 이동 버튼을 전부 잠근다 */
export const Disabled: Story = {
  name: 'States/Disabled',
  args: { locked: true },
};

/** 첫 행 — '위로' 는 갈 곳이 없어 잠기고, 가운데 행은 열려 있다(전부 잠긴 상태와 구분된다) */
export const FirstRow: Story = {
  name: 'States/First Row',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 경계는 '이동할 곳이 없다' 는 사실이므로 잠금이 곧 계약이다
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[0].question} 위로 이동` }),
    ).toBeDisabled();
    // 가운데 행은 양쪽 다 열려 있어야 한다 — 전부 잠긴 상태와 구분되지 않으면 이 검사는 헛돈다
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[1].question} 위로 이동` }),
    ).not.toBeDisabled();
  },
};

/** 마지막 행 — '아래로' 는 갈 곳이 없어 잠긴다 */
export const LastRow: Story = {
  name: 'States/Last Row',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[2].question} 아래로 이동` }),
    ).toBeDisabled();
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[1].question} 아래로 이동` }),
    ).not.toBeDisabled();
  },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 적은 행 — 두 행뿐이어도 첫/끝 경계 규칙이 그대로 적용된다 */
export const FewRows: Story = {
  name: 'Content/Few Rows',
  args: { rows: TWO_ROWS },
};

/** 많은 행 — 목록이 길어져도 손잡이·버튼 열이 무너지지 않는다 */
export const ManyRows: Story = {
  name: 'Content/Many Rows',
  args: { rows: MANY_ROWS },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/**
 * 키보드 경로 — 드래그는 마우스 전용이라, 각 행의 이동 버튼이 키보드만으로도 순서를 바꿀 수 있어야 한다.
 * 가운데 행 '위로' 버튼에 포커스를 주고 Enter 로 활성화해 순서가 바뀌는지 본다.
 */
export const Keyboard: Story = {
  name: 'Accessibility/Keyboard',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const up = canvas.getByRole('button', { name: `${FAQ_ROWS[1].question} 위로 이동` });
    up.focus();
    await expect(up).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    // 순서가 바뀌었다는 것은 '두 번째 행이 첫 번째가 됐다' 로만 증명된다
    const bodyRows = canvas.getAllByRole('row').slice(1); // 머리행 제외
    const firstRow = bodyRows[0];
    if (firstRow === undefined) throw new Error('본문 행이 없다 — 표가 그려지지 않았다');
    expect(within(firstRow).getByText(FAQ_ROWS[1].question)).not.toBeNull();
  },
};

/** RTL — paddingInline·textAlign:start 같은 논리 속성이 우→좌로 뒤집힌다(문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  decorators: [rtlFrame],
};

/** ARIA — 손잡이 열의 보이지 않는 라벨과 각 이동 버튼의 접근 가능한 이름을 단언한다 */
export const Aria: Story = {
  name: 'Accessibility/ARIA',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 헤더 grip 열의 스크린 리더 전용 라벨
    expect(canvas.getByText('정렬 손잡이')).not.toBeNull();
    // 이동 버튼은 대상 행 이름이 붙은 접근 가능한 이름을 갖는다(색만으로 의미 전달 금지)
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[0].question} 아래로 이동` }),
    ).not.toBeNull();
    expect(
      canvas.getByRole('button', { name: `${FAQ_ROWS[2].question} 위로 이동` }),
    ).not.toBeNull();
  },
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 위로 이동 — 가운데 행의 '위로' 를 누르면 그 행이 첫 번째가 된다 */
export const MoveUp: Story = {
  name: 'Interaction/Move Up',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: `${FAQ_ROWS[1].question} 위로 이동` }),
    );
    const bodyRows = canvas.getAllByRole('row').slice(1); // 머리행 제외
    const firstRow = bodyRows[0];
    if (firstRow === undefined) throw new Error('본문 행이 없다 — 표가 그려지지 않았다');
    expect(within(firstRow).getByText(FAQ_ROWS[1].question)).not.toBeNull();
  },
};

/** 아래로 이동 — 첫 행의 '아래로' 를 누르면 그 행이 두 번째로 내려간다 */
export const MoveDown: Story = {
  name: 'Interaction/Move Down',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: `${FAQ_ROWS[0].question} 아래로 이동` }),
    );
    const bodyRows = canvas.getAllByRole('row').slice(1); // 머리행 제외
    const secondRow = bodyRows[1];
    if (secondRow === undefined) throw new Error('본문 행이 없다 — 표가 그려지지 않았다');
    expect(within(secondRow).getByText(FAQ_ROWS[0].question)).not.toBeNull();
  },
};

/** 잠금 — locked 이면 모든 위/아래 이동 버튼이 잠긴다 */
export const InteractionDisabled: Story = {
  name: 'Interaction/Disabled',
  args: { locked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const row of FAQ_ROWS) {
      expect(canvas.getByRole('button', { name: `${row.question} 위로 이동` })).toBeDisabled();
      expect(canvas.getByRole('button', { name: `${row.question} 아래로 이동` })).toBeDisabled();
    }
  },
};
