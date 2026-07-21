// Pagination — Storybook 스토리 (CSF3 · Data 계열 IA)
//
// [고정 IA — Data 계열] Table·DataTable·ListCard 와 같은 어휘로 문서화한다(조합 폭발 금지):
//   Docs · Overview · Playground · States/(First·Last·Middle·Single·Empty) ·
//   Features/(Range & Size Selector·Boundary — 데이터 고유 역량) · Content/(Few·Many) ·
//   Accessibility/(Keyboard·RTL) · Interaction/(Prev·Next·Jump Page)
// 상태·경계·범위 수학 전수 검증은 Pagination.test.tsx 가 소유. argTypes 는 계약 생성물 spread(G5).
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { PaginationArgTypes } from '../../../generated/argtypes/Pagination.argtypes';
import { Pagination } from './Pagination';
import type { PaginationProps } from '../../../generated/types/Pagination.types';

/**
 * 제어 컴포넌트 — page 와 pageSize 는 스토리가 잡는다.
 * 크기를 바꾸면 1페이지로 되감는다 — 그 되감기는 호출부의 몫이라는 계약(events.onPageSizeChange)을
 * 스토리가 실제로 보여 준다.
 */
function ControlledPagination(args: PaginationProps) {
  const [page, setPage] = useState(args.page);
  const [pageSize, setPageSize] = useState(args.pageSize);
  useEffect(() => setPage(args.page), [args.page]);
  useEffect(() => setPageSize(args.pageSize), [args.pageSize]);

  const size = pageSize ?? 0;
  const total = args.total ?? 0;
  const totalPages = size > 0 ? Math.ceil(total / size) : args.totalPages;

  return (
    <Pagination
      {...args}
      page={page}
      pageSize={size}
      totalPages={totalPages}
      onChange={(next) => {
        setPage(next);
        args.onChange?.(next);
      }}
      onPageSizeChange={(next) => {
        setPageSize(next);
        setPage(1);
        args.onPageSizeChange?.(next);
      }}
    />
  );
}

const meta: Meta<typeof Pagination> = {
  title: 'Design System/Components/Pagination',
  component: Pagination,
  argTypes: { ...PaginationArgTypes },
  args: {
    page: 3,
    totalPages: 10,
    label: '회원 목록 페이지',
    onChange: fn(),
    onPageSizeChange: fn(),
  },
  render: (args) => <ControlledPagination {...args} />,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

const stackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 대표 쓰임새. 가운데 페이지의 번호 창(양쪽 버튼 활성)이 가장 흔하다 */
export const Overview: Story = {};

/** Playground — page·totalPages·total·pageSize·label 을 Controls 로 바꿔 전 조합을 본다 */
export const Playground: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** 가운데 페이지 — 이전·다음이 모두 활성이다 */
export const Middle: Story = { name: 'States/Middle', args: { page: 3, totalPages: 10 } };

/** 첫 페이지 — '이전'이 native disabled 로 잠긴다 */
export const AtFirstPage: Story = {
  name: 'States/First Page',
  args: { page: 1 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '이전 페이지' })).toBeDisabled();
  },
};

/** 마지막 페이지 — '다음'이 native disabled 로 잠긴다 */
export const AtLastPage: Story = {
  name: 'States/Last Page',
  args: { page: 10 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: '다음 페이지' })).toBeDisabled();
  },
};

/** 단일 페이지 — totalPages ≤ 1 이면 번호 줄을 렌더하지 않는다 (nav 없음) */
export const SinglePageHidden: Story = {
  name: 'States/Single Page',
  args: { totalPages: 1, page: 1 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('navigation')).toBeNull();
  },
};

/** 0건 — 번호 줄은 사라지고 '전체 0건' 요약만 남는다 (ERP-05) */
export const EmptyRange: Story = {
  name: 'States/Empty',
  args: { page: 1, total: 0, pageSize: 10, pageSizeOptions: [10, 25, 50] },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('전체 0건');
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

/* ── Features ───────────────────────────────────────────────────────────── */

/** 범위 요약('전체 N건 중 x–y') + 페이지 크기 선택 — pageSize opt-in 표면 (ERP-05) */
export const WithRangeAndSizeSelector: Story = {
  name: 'Features/Range & Size Selector',
  args: {
    page: 2,
    total: 97,
    pageSize: 10,
    pageSizeOptions: [10, 25, 50, 100],
    label: '로그 페이지',
  },
  parameters: { layout: 'padded' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status')).toHaveTextContent('전체 97건 중 11–20');

    // 크기를 50으로 늘리면 1페이지로 되감기고 범위가 그에 맞게 다시 계산된다
    await userEvent.selectOptions(canvas.getByLabelText('페이지당'), '50');
    await expect(args.onPageSizeChange).toHaveBeenCalledWith(50);
    await expect(canvas.getByRole('status')).toHaveTextContent('전체 97건 중 1–50');
  },
};

/** 경계 창 — 번호 창(최대 5)이 양 끝에서 붙는다: 첫 페이지는 1–5, 마지막 페이지는 6–10 */
export const Boundary: Story = {
  name: 'Features/Boundary',
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={stackStyle}>
      <Pagination {...args} page={1} totalPages={10} label="첫 페이지 경계" />
      <Pagination {...args} page={10} totalPages={10} label="마지막 페이지 경계" />
    </div>
  ),
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 적은 페이지 — 전체가 창(5) 안에 들어와 창이 붙지 않는다 (1–3 전부 노출) */
export const FewPages: Story = { name: 'Content/Few Pages', args: { page: 2, totalPages: 3 } };

/** 많은 페이지 — 50페이지여도 창은 현재 페이지 주변 5개로 고정된다 */
export const ManyPages: Story = { name: 'Content/Many Pages', args: { page: 25, totalPages: 50 } };

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** 키보드 — Tab 으로 번호 창의 첫 버튼('이전')에 포커스가 들어오고 :focus-visible 링을 받는다 */
export const FocusVisible: Story = {
  name: 'Accessibility/Keyboard',
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('button', { name: '이전 페이지' })).toHaveFocus();
  },
};

/** RTL — 화살표가 논리 흐름을 따라 뒤집힌다 (문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { label: '회원 목록 페이지' },
  decorators: [rtlFrame],
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** '이전'을 누르면 onChange 가 page-1 로 발화한다 */
export const PrevPage: Story = {
  name: 'Interaction/Prev Page',
  args: { page: 3 },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '이전 페이지' }));
    await expect(args.onChange).toHaveBeenCalledWith(2);
  },
};

/** '다음'을 누르면 onChange 가 page+1 로 발화한다 */
export const NextPage: Story = {
  name: 'Interaction/Next Page',
  args: { page: 3 },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '다음 페이지' }));
    await expect(args.onChange).toHaveBeenCalledWith(4);
  },
};

/** 번호를 직접 누르면 onChange 가 그 페이지로 발화한다 */
export const JumpPage: Story = {
  name: 'Interaction/Jump Page',
  args: { page: 3 },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '5' }));
    await expect(args.onChange).toHaveBeenCalledWith(5);
  },
};
