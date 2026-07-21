// Header — Storybook 스토리 (CSF3 · Layout organism)
//
// [고정 IA] Docs · Overview · Playground · Content(With Actions·Minimal·Long Title·Breadcrumb) ·
// Examples(실제 페이지 헤더) · Accessibility(ARIA Landmark·RTL·Keyboard).
// 이 컴포넌트는 상태가 default 하나뿐이고(States 생략) 자기 상호작용 이벤트가 없다(Interaction 생략)
// — meta 슬롯에 주입된 요소의 키보드 계약만 존재하므로 Accessibility/Keyboard 로 단언한다.
//
// argTypes 는 계약 생성물(generated/argtypes/Header.argtypes)을 spread 한다 (수기 작성 금지 — G5).
// meta 는 node 슬롯이라 control 로 편집하지 않고 Story args 로 직접 준다 (ADR-0003).
import type { CSSProperties } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { HeaderArgTypes } from '../../../generated/argtypes/Header.argtypes';
import { Button } from '../../atoms/Button';
import { Header } from './Header';

/** 메타 슬롯 표본 — 오늘 날짜와 로그인 계정. 포맷은 앱의 일이라 DS 는 자리만 준다 */
const SAMPLE_META = (
  <>
    <p style={{ margin: 0, fontWeight: 'var(--tds-primitive-typography-font-weight-bold)' }}>
      <time dateTime="2026-07-20">2026. 7. 20 (월)</time>
    </p>
    <p style={{ margin: 0, color: 'var(--tds-color-text-muted)' }}>test@example.com</p>
  </>
);

const actionRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-3)',
};

/** 메타 슬롯이 액션을 실을 때 — 목록 화면 우측 상단의 흔한 배치(내보내기 + 신규) */
const ACTION_META = (
  <div style={actionRow}>
    <Button variant="secondary" size="sm">
      내보내기
    </Button>
    <Button variant="primary" size="sm">
      회원 추가
    </Button>
  </div>
);

const meta: Meta<typeof Header> = {
  title: 'Design System/Components/Header',
  component: Header,
  argTypes: { ...HeaderArgTypes },
  args: {
    title: '회원 관리',
    eyebrow: 'LOGO · 관리자',
    meta: SAMPLE_META,
  },
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj<typeof Header>;

/** RTL 프레임 — 논리 속성만 쓰므로 dir 만 뒤집으면 제목과 메타가 자리를 바꾼다 */
const rtlFrame: Decorator = (Story) => (
  <div dir="rtl">
    <Story />
  </div>
);

/* ── Overview ───────────────────────────────────────────────────────────── */

/** Overview — 대표 쓰임새. 눈썹(브랜드·역할) + 화면 제목(h1) + 우측 메타(날짜·계정) */
export const Overview: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).not.toBeNull();
    await expect(canvas.getByRole('heading', { level: 1, name: '회원 관리' })).not.toBeNull();
  },
};

/* ── Playground ─────────────────────────────────────────────────────────── */

/** Playground — title·eyebrow 를 Controls 로 바꿔 본다(meta 는 node 슬롯이라 args 로만 준다) */
export const Playground: Story = {};

/* ── Content ────────────────────────────────────────────────────────────── */

/** 메타에 액션 — 우측 슬롯이 정보 대신 버튼을 실어 목록 화면의 주요 동작을 놓는다 */
export const WithActions: Story = {
  name: 'Content/With Actions',
  args: { meta: ACTION_META },
};

/** 최소 형태 — 필수 prop 하나(title)로 성립한다. 눈썹도 메타도 없이 제목이 폭을 다 쓴다 */
export const Minimal: Story = {
  name: 'Content/Minimal',
  args: { eyebrow: '', meta: null },
};

/** 긴 제목 — 제목이 길어져도 높이는 고정이다(Sidebar 브랜드 영역과 구분선을 맞춰야 한다) */
export const LongTitle: Story = {
  name: 'Content/Long Title',
  args: { title: '마케팅 이메일 템플릿 상세 · 발송 이력 및 수신 거부 관리' },
};

/** 눈썹이 경로를 말한다 — 상위 화면에서 내려온 자취를 브레드크럼처럼 눈썹에 담는다 */
export const Breadcrumb: Story = {
  name: 'Content/Breadcrumb',
  args: { title: '명재우', eyebrow: '회원 관리 · 회원 목록 · 회원 상세' },
};

/* ── Examples ───────────────────────────────────────────────────────────── */

/** 실제 상세 페이지 헤더 — 경로 눈썹 + 대상 이름(h1) + 우측 액션이 함께 놓인 흔한 조합 */
export const PageHeader: Story = {
  name: 'Examples/Page Header',
  args: {
    title: '명재우',
    eyebrow: '회원 관리 · 회원 상세',
    meta: ACTION_META,
  },
};

/* ── Accessibility ──────────────────────────────────────────────────────── */

/**
 * ARIA 랜드마크 — 네이티브 <header> 가 banner 이고(중복 role 없음), 제목은 <h1> 하나뿐이며
 * 눈썹은 제목이 아니라 <p> 다(제목 계층을 브랜드 이름으로 오염시키지 않는다).
 */
export const AriaLandmark: Story = {
  name: 'Accessibility/ARIA Landmark',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).not.toBeNull();
    // 제목은 h1 하나뿐 — 눈썹은 제목 계층에 끼지 않는다
    await expect(canvas.getAllByRole('heading')).toHaveLength(1);
    await expect(canvas.getByRole('heading', { level: 1, name: '회원 관리' })).not.toBeNull();
    // 눈썹은 <p> 다
    await expect(canvas.getByText(args.eyebrow ?? '').tagName).toBe('P');
  },
};

/** RTL — 논리 속성만 쓰므로 dir 만 뒤집으면 제목과 메타가 자리를 바꾼다(문구는 한국어로 검수) */
export const RightToLeft: Story = {
  name: 'Accessibility/RTL',
  args: {
    title: '회원 관리',
    eyebrow: 'LOGO · 관리자',
    meta: <p style={{ margin: 0 }}>test@example.com</p>,
  },
  decorators: [rtlFrame],
};

/**
 * 키보드 — 헤더 자체엔 상호작용 요소가 없다. 탭 순서에 끼는 것은 meta 슬롯에 주입된 요소뿐이며,
 * 그 요소가 실제로 포커스를 받는지 단언한다(주입한 쪽이 키보드 계약을 진다).
 */
export const Keyboard: Story = {
  name: 'Accessibility/Keyboard',
  args: { meta: ACTION_META },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const firstAction = canvas.getByRole('button', { name: '내보내기' });
    await userEvent.tab();
    await expect(firstAction).toHaveFocus();
  },
};
