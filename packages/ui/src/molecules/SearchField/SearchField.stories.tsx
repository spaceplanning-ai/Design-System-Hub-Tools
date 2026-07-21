// SearchField — Storybook 스토리 (CSF3)
//
// [고정 IA — Form 계열] 대표 상태만 그룹으로 남기고 세부 조합은 Controls 로 넘긴다
// (Button 기준 IA · Behavior 금지 → Interaction · Slot 금지 → Content/Icons):
//   Overview · Playground · States/ · Content/ · Icons/ · Accessibility/ · Interaction/
// 계약 states 는 default·focus-visible 뿐 — disabled/error 상태·clear 버튼이 없어 해당 그룹은 생략한다.
// 상태 규칙 검증은 SearchField.test.tsx 가 소유. argTypes 는 계약 생성물 spread(G5).
import { useEffect, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from '@storybook/test';

import { SearchFieldArgTypes } from '../../../generated/argtypes/SearchField.argtypes';
import { SearchField } from './SearchField';
import type { SearchFieldProps } from '../../../generated/types/SearchField.types';

/** 제어 컴포넌트 — 스토리에서 실제로 입력이 되도록 값을 로컬 상태로 잡는다 */
function ControlledSearchField(args: SearchFieldProps) {
  const [value, setValue] = useState(args.value);
  useEffect(() => setValue(args.value), [args.value]);
  return (
    <SearchField
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange?.(next);
      }}
    />
  );
}

const meta: Meta<typeof SearchField> = {
  title: 'Design System/Components/SearchField',
  component: SearchField,
  argTypes: { ...SearchFieldArgTypes },
  args: {
    value: '',
    label: '공지 제목 검색',
    placeholder: '검색',
    onChange: fn(),
  },
  render: (args) => <ControlledSearchField {...args} />,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof SearchField>;

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

/** Overview — 대표 쓰임새. 돋보기 겹친 검색 입력에 검색어가 채워진 목록 툴바의 '검색' */
export const Overview: Story = {
  args: { value: '리뉴얼', label: '상품명 검색', placeholder: '상품명 · SKU · 브랜드 검색' },
};

/** Playground — Controls 에서 value·label·placeholder 를 바꿔 전 조합을 여기서 본다 */
export const Playground: Story = {};

/* ── States ─────────────────────────────────────────────────────────────── */

/** 빈 상태 — 값이 없어 placeholder 만 보인다 */
export const Empty: Story = {
  name: 'States/Empty',
  args: { value: '' },
};

/** 값이 채워진 상태 */
export const Filled: Story = {
  name: 'States/Filled',
  args: { value: '리뉴얼' },
};

/** focus-visible — 키보드(Tab)로 포커스가 들어오면 포커스 링이 뜬다 */
export const FocusVisible: Story = {
  name: 'States/Focus Visible',
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await expect(within(canvasElement).getByRole('searchbox')).toHaveFocus();
  },
};

/* ── Content ────────────────────────────────────────────────────────────── */

/** placeholder — 무엇을 검색하는지 안내하는 placeholder 문구 */
export const Placeholder: Story = {
  name: 'Content/Placeholder',
  args: { value: '', label: '사용자 검색', placeholder: '이름 · 이메일 · 부서로 검색' },
};

/** 긴 검색어 — 입력 폭을 넘는 값이 잘리거나 레이아웃을 밀지 않고 가로로 스크롤된다 */
export const LongQuery: Story = {
  name: 'Content/Long Query',
  args: {
    label: '주소 검색',
    value: '서울특별시 강남구 테헤란로 152 강남파이낸스센터 27층 스페이스플래닝 디자인시스템팀',
  },
};

/* ── Icons ──────────────────────────────────────────────────────────────── */

/** 돋보기 아이콘 — 입력에 겹친 장식(aria-hidden). 클릭은 아래 입력으로 통과한다 */
export const SearchIcon: Story = {
  name: 'Icons/Search Icon',
  args: { value: '', label: '공지 제목 검색' },
  play: async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('.tds-search__icon');
    await expect(icon).not.toBeNull();
    await expect(icon).toHaveAttribute('aria-hidden', 'true');
  },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/** RTL — 돋보기가 논리 속성(inset-inline-start)을 따라 우측으로 간다 */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { label: '공지 제목 검색', placeholder: '검색', value: '리뉴얼' },
  decorators: [rtlFrame],
};

/** 키보드 — Tab 으로 searchbox 에 도달하고 숨김 라벨이 접근 가능한 이름을 준다 */
export const Keyboard: Story = {
  name: 'Accessibility/Keyboard',
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('searchbox', { name: '공지 제목 검색' });
    await userEvent.tab();
    await expect(input).toHaveFocus();
  },
};

/* ── Interaction ────────────────────────────────────────────────────────── */

/** 입력하면 onChange 가 네이티브 이벤트가 아니라 새 문자열(값)을 넘긴다 */
export const EnabledChange: Story = {
  name: 'Interaction/Enabled Change',
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('searchbox', { name: '공지 제목 검색' });
    await userEvent.type(input, '안내');

    await expect(input).toHaveValue('안내');
    await expect(args.onChange).toHaveBeenCalled();
    await expect(args.onChange).toHaveBeenLastCalledWith('안내');
  },
};
