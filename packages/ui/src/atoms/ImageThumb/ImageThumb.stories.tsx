// ImageThumb — Storybook 스토리 (CSF3 · Atoms/ImageThumb)
//
// [고정 IA — 운영 가이드] ImageThumb 는 비대화형 표시 전용 atom 이라 Playground/Interaction 이 없다.
// 크기는 고정 박스(CSS)라 Sizes 도 없다. 아래 어휘로만 문서화한다:
//   Overview — 대표 쓰임새(유효한 src → 실제 이미지)
//   States   — Loaded · Broken · Empty (계약 states: default / error)
//   Content  — Square · Wide · Portrait (박스가 다른 종횡비를 담는 모습)
//   Accessibility — RTL · ARIA alt (실제 이미지·placeholder 가 같은 접근 가능한 이름)
// argTypes 는 계약 생성물(generated/argtypes/ImageThumb.argtypes)을 spread 한다 (수기 작성 금지 — G5).
import type { CSSProperties } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { ImageThumbArgTypes } from '../../../generated/argtypes/ImageThumb.argtypes';
import { ImageThumb } from './ImageThumb';

/** 데모용 인라인 이미지 (외부 네트워크에 의존하지 않는다) — 종횡비만 다르게 준비한다 */
const WIDE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='24'%3E%3Crect width='60' height='24' rx='4' fill='%234f46e5'/%3E%3Ctext x='30' y='16' font-size='10' fill='white' text-anchor='middle'%3ELOGO%3C/text%3E%3C/svg%3E";
const SQUARE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='4' fill='%230ea5e9'/%3E%3C/svg%3E";
const PORTRAIT_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='48'%3E%3Crect width='24' height='48' rx='4' fill='%2316a34a'/%3E%3C/svg%3E";

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-4)',
  flexWrap: 'wrap',
};

const rtlFrame: Decorator = (Story) => (
  <div dir="rtl" style={{ padding: 'var(--tds-space-5)' }}>
    <Story />
  </div>
);

const meta: Meta<typeof ImageThumb> = {
  title: 'Design System/Components/ImageThumb',
  component: ImageThumb,
  argTypes: { ...ImageThumbArgTypes },
  args: { src: WIDE_SRC, alt: '샘플 로고' },
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof ImageThumb>;

/** Overview — 대표 쓰임새. 유효한 src 는 실제 이미지로 그려지고 alt 로 접근 가능한 이름을 갖는다 */
export const Overview: Story = {
  args: { src: WIDE_SRC, alt: '샘플 로고' },
};

/** States/Loaded — 유효한 src → 실제 <img> (alt 로 접근 가능한 이름) */
export const Default: Story = {
  name: 'States/Loaded',
  args: { src: WIDE_SRC, alt: '샘플 로고' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: '샘플 로고' })).toBeInTheDocument();
  },
};

/** States/Broken — 깨진 URL 은 onError 로 placeholder(role=img + aria-label)로 폴백한다 */
export const BrokenImage: Story = {
  name: 'States/Broken',
  args: { src: 'https://invalid.example/nope.png', alt: '깨진 이미지' },
};

/** States/Empty — trim 후 빈 문자열이면 placeholder(role=img + aria-label) */
export const EmptyPlaceholder: Story = {
  name: 'States/Empty',
  args: { src: '   ', alt: '로고 없음' },
  play: async ({ canvasElement }) => {
    const ph = within(canvasElement).getByRole('img', { name: '로고 없음' });
    await expect(ph.tagName).toBe('SPAN');
  },
};

/** Content/Square — 정사각 소스는 고정 박스 안에 object-fit:contain 으로 담긴다 */
export const ContentSquare: Story = {
  name: 'Content/Square',
  args: { src: SQUARE_SRC, alt: '정사각 이미지' },
};

/** Content/Wide — 가로로 긴 소스(로고류)가 박스 폭에 맞춰 담긴다 */
export const ContentWide: Story = {
  name: 'Content/Wide',
  args: { src: WIDE_SRC, alt: '가로형 이미지' },
};

/** Content/Portrait — 세로로 긴 소스가 박스 높이에 맞춰 담긴다 */
export const ContentPortrait: Story = {
  name: 'Content/Portrait',
  args: { src: PORTRAIT_SRC, alt: '세로형 이미지' },
};

/** Accessibility/RTL — 방향이 뒤집혀도 썸네일은 그대로. 아랍어 대신 한국어 콘텐츠 */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: { src: WIDE_SRC, alt: '샘플 로고' },
  decorators: [rtlFrame],
};

/**
 * Accessibility/ARIA alt — 계약 a11y(alt-both-paths): 실제 이미지는 alt 로, placeholder 는
 * role="img" + aria-label 로 **같은** 접근 가능한 이름을 준다. 둘 다 '회사 로고' 로 읽힌다.
 */
export const AriaAlt: Story = {
  name: 'Accessibility/ARIA alt',
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={rowStyle}>
      <ImageThumb src={WIDE_SRC} alt="회사 로고" />
      <ImageThumb src="" alt="회사 로고" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const named = within(canvasElement).getAllByRole('img', { name: '회사 로고' });
    // 실제 이미지 경로와 placeholder 경로가 같은 이름으로 각각 노출된다
    await expect(named).toHaveLength(2);
    await expect(named.some((el) => el.tagName === 'IMG')).toBe(true);
    await expect(named.some((el) => el.tagName === 'SPAN')).toBe(true);
  },
};
