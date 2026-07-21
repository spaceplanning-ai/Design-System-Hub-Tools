/**
 * Design System/Templates/Marketing/Alimtalk Templates — 알림톡(발송) 템플릿 목록 (조립 전용 · 게이트 G5).
 *
 * 카테고리는 영문 메뉴명이다: `/marketing/templates/alimtalk` → 메뉴 en = "Marketing"(마케팅 관리),
 * 화면 en = "Templates" (packages/ui/pages/_data/pages.ts 의 Marketing 그룹
 * `['/marketing/templates', '발송 템플릿 관리', 'Templates']`).
 *
 * 대응 실화면: apps/admin/src/pages/marketing/templates/TemplateListPage.tsx
 * (라우트 /marketing/templates/alimtalk).
 *
 * [메시지 템플릿 목록과 왜 별개인가 — 상태의 주인이 다르다] `/marketing/templates` 는 **운영자가 켜고
 * 끄는** 발행 상태(초안→사용중↔미사용)를 쓴다. 이 화면은 **카카오 사전 심사**를 축으로 만들어졌다 —
 * 상태가 초안·검수중·승인·반려이고 그 상태의 주인은 우리가 아니라 카카오다. 알림톡이 새 모델의 세
 * 번째 종류로 다시 들어올 때까지, 심사 상태·승인 문구 편집 잠금·반려 사유를 이 화면이 들고 있는다
 * (실화면 머리말의 ⚠ 재구축 대기 블록).
 *
 * [승인상태 열이 알림톡에서만 뜻을 갖는다] SMS·이메일은 정보통신망 채널이라 승인 개념이 없다 —
 * 그 행은 값을 비우는 대신 대시를 그린다(requiresApproval).
 *
 * [조립 원칙] `../../src` public DS 컴포넌트만 조합한다 — 이 폴더에서 신규 DS 컴포넌트를 만들지 않고
 * apps/admin 을 import 하지 않는다(레이어 경계). 앱 전용 조각은 DS 표면으로 갈음한다:
 *   CrudListShell/CrudTable → DS Table(+ SelectAllHeaderCell·RowSelectCell·SeqHeaderCell·SeqCell·RowActions)
 *
 * 실화면 ↔ DS 컴포넌트 매핑:
 *   템플릿명·본문 검색         → SearchField
 *   채널 필터                 → SelectField
 *   템플릿 등록 버튼           → Button(primary) + Icon(plus-circle)
 *   전체선택 헤더 / 행 선택칸   → SelectAllHeaderCell · RowSelectCell (+ tableSelectionState)
 *   순번 열                   → SeqHeaderCell · SeqCell
 *   채널 배지                  → StatusBadge(info)
 *   승인상태 배지              → StatusBadge(neutral·info·success·danger — approvalStatusTone 미러)
 *   본문 한 줄 미리보기         → 토큰 <span>(말줄임)
 *   수정일시                  → 토큰 <span>(tabular-nums)
 *   행 액션(수정·삭제)          → RowActions
 *   선택 일괄 삭제 바           → SelectionBar + Button(danger)
 *   삭제 확인                  → ConfirmDialog(intent=delete)
 *   목록 표                    → Table (leadingHead=선택+순번 / trailingHead=행 액션)
 *   빈 결과                    → Empty (이 화면은 채널 필터 분기를 갖지 않는다 — 실화면 STATE-05 미비점 그대로)
 *
 * 하드코딩 색상(hex)/px 리터럴 0건 — 시각 값은 토큰 CSS 변수(cssVar/typography)와 rem·calc·em 만 참조한다.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import {
  Button,
  ConfirmDialog,
  Empty as EmptyState,
  Icon,
  RowActions,
  RowSelectCell,
  SearchField,
  SelectAllHeaderCell,
  SelectField,
  SelectionBar,
  SeqCell,
  SeqHeaderCell,
  StatusBadge,
  Table,
  cssVar,
  tableSelectionState,
  typography,
} from '../../src';
import type { StatusBadgeTone, TableProps } from '../../src';

const meta: Meta = {
  title: 'Design System/Templates/Marketing/Alimtalk Templates',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/* ── 도메인 상수(실화면 _shared/messaging 미러) ─────────────────────────────────────────────── */

type MessageChannel = 'sms' | 'email' | 'alimtalk';

/** 카카오 템플릿 사전 심사 흐름: 등록(초안)→검수중→승인/반려 */
type ApprovalStatus = 'draft' | 'inspecting' | 'approved' | 'rejected';

const MESSAGE_CHANNEL_LABEL: Record<MessageChannel, string> = {
  sms: 'SMS/문자',
  email: '이메일',
  alimtalk: '카카오 알림톡',
};

const APPROVAL_STATUS_LABEL: Record<ApprovalStatus, string> = {
  draft: '초안',
  inspecting: '검수중',
  approved: '승인',
  rejected: '반려',
};

const APPROVAL_TONE: Record<ApprovalStatus, StatusBadgeTone> = {
  draft: 'neutral',
  inspecting: 'info',
  approved: 'success',
  rejected: 'danger',
};

/** 알림톡만 사전 승인 대상 — 정보통신망 채널(SMS/이메일)은 승인 개념이 없다 */
const requiresApproval = (channel: MessageChannel): boolean => channel === 'alimtalk';

const CHANNEL_FILTER_ALL = 'all';
type ChannelFilter = typeof CHANNEL_FILTER_ALL | MessageChannel;

const CHANNEL_FILTER_OPTIONS: readonly { readonly id: ChannelFilter; readonly label: string }[] = [
  { id: CHANNEL_FILTER_ALL, label: '전체 채널' },
  { id: 'sms', label: MESSAGE_CHANNEL_LABEL.sms },
  { id: 'email', label: MESSAGE_CHANNEL_LABEL.email },
  { id: 'alimtalk', label: MESSAGE_CHANNEL_LABEL.alimtalk },
];

/* ── 데모 데이터(실화면 marketing/_shared/store 의 템플릿 픽스처 미러) ─────────────────────── */

interface DemoTemplate {
  readonly id: string;
  readonly name: string;
  readonly channel: MessageChannel;
  readonly body: string;
  readonly approvalStatus: ApprovalStatus;
  /** 반려 사유 — approvalStatus 가 'rejected' 일 때만 값을 갖는다 */
  readonly rejectReason: string;
  readonly updatedAt: string;
}

const DEMO_TEMPLATES: readonly DemoTemplate[] = [
  {
    id: 'tpl-sms-1',
    name: '주문 완료 안내(SMS)',
    channel: 'sms',
    body: '#{이름}님, 주문(#{주문번호})이 정상 접수되었습니다. 감사합니다.',
    approvalStatus: 'approved',
    rejectReason: '',
    updatedAt: '2026-07-10T10:00',
  },
  {
    id: 'tpl-sms-2',
    name: '여름 세일 광고(SMS)',
    channel: 'sms',
    body: '(광고) #{이름}님, 여름맞이 #{쿠폰명} 쿠폰이 발급되었습니다. 무료수신거부 080-123-4567',
    approvalStatus: 'approved',
    rejectReason: '',
    updatedAt: '2026-07-12T09:00',
  },
  {
    id: 'tpl-email-1',
    name: '월간 뉴스레터 기본형',
    channel: 'email',
    body: '안녕하세요 #{이름}님, 이번 달 새 소식과 혜택을 전해드립니다.',
    approvalStatus: 'approved',
    rejectReason: '',
    updatedAt: '2026-07-01T08:00',
  },
  {
    id: 'tpl-alim-1',
    name: '배송 출발 알림(알림톡)',
    channel: 'alimtalk',
    body: '#{이름}님, 주문하신 상품(#{주문번호})이 출발했습니다.',
    approvalStatus: 'approved',
    rejectReason: '',
    updatedAt: '2026-07-08T14:00',
  },
  {
    id: 'tpl-alim-2',
    name: '적립금 소멸 예정(알림톡)',
    channel: 'alimtalk',
    body: '#{이름}님, 적립금 #{적립금}원이 곧 소멸될 예정입니다.',
    approvalStatus: 'inspecting',
    rejectReason: '',
    updatedAt: '2026-07-14T11:00',
  },
  {
    id: 'tpl-alim-3',
    name: '이벤트 참여 감사(알림톡)',
    channel: 'alimtalk',
    body: '#{이름} #{쿠폰명}',
    approvalStatus: 'rejected',
    rejectReason: '본문이 변수로만 구성되어 있습니다. 안내 문구를 추가해 주세요.',
    updatedAt: '2026-07-13T16:00',
  },
];

const ENTITY_LABEL = '발송 템플릿';
const SELECT_ALL_LABEL_ID = 'marketing-templates-select-all';
const PAGE_SIZE = 10;
const BODY_PREVIEW_MAX = 60;

const fmt = (value: number): string => value.toLocaleString('ko-KR');
const formatDateTime = (value: string): string => value.replace('T', ' ');

/** 본문 한 줄 미리보기 — 줄바꿈을 접고 60자에서 자른다 */
const bodyPreview = (body: string): string => {
  const oneLine = body.replace(/\s+/g, ' ').trim();
  return oneLine.length > BODY_PREVIEW_MAX ? `${oneLine.slice(0, BODY_PREVIEW_MAX)}…` : oneLine;
};

/* ── 표 열 정의(데이터 열 5개 — 선택·순번은 leading, 액션은 trailing) ───────────────────────── */

const COLUMNS: TableProps['columns'] = [
  { id: 'name', header: '템플릿명' },
  { id: 'channel', header: '채널', nowrap: true },
  { id: 'approval', header: '승인상태', nowrap: true },
  { id: 'body', header: '본문' },
  { id: 'updated', header: '수정일시', nowrap: true },
];

/* ── 스타일(토큰·rem·em 만) ───────────────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  padding: cssVar('space.6'),
  minBlockSize: '100vh',
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
};

const headingStyle: CSSProperties = {
  ...typography('typography.title.lg'),
  margin: 0,
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

const filtersStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
  flexGrow: 1,
  minWidth: 0,
};

const searchWrapStyle: CSSProperties = {
  flexGrow: 1,
  minWidth: 0,
  maxWidth: `calc(${cssVar('space.6')} * 12)`,
};

const selectWrapStyle: CSSProperties = {
  width: `calc(${cssVar('space.6')} * 5)`,
};

const summaryStyle: CSSProperties = {
  ...typography('typography.label.sm'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const bodyPreviewStyle: CSSProperties = {
  display: 'block',
  color: cssVar('color.text.muted'),
  maxWidth: `calc(${cssVar('space.6')} * 12)`,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const dateStyle: CSSProperties = {
  color: cssVar('color.text.muted'),
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const actionCellStyle: CSSProperties = {
  paddingTop: cssVar('space.2'),
  paddingBottom: cssVar('space.2'),
  paddingLeft: cssVar('space.3'),
  paddingRight: cssVar('space.3'),
  textAlign: 'right',
};

/** 시각적으로만 숨김(접근성 트리에는 남긴다) — px 없이 rem·무단위 0 만 사용 */
const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '0.0625rem',
  height: '0.0625rem',
  padding: 0,
  margin: '-0.0625rem',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/* ── 제어형 화면(rules-of-hooks: Capitalized 컴포넌트에서 useState) ───────────────────────── */

interface TemplateListScreenProps {
  readonly loading?: boolean;
  readonly initialKeyword?: string;
  readonly initialChannel?: ChannelFilter;
  readonly initialSelectedIds?: readonly string[];
}

function TemplateListScreen({
  loading = false,
  initialKeyword = '',
  initialChannel = CHANNEL_FILTER_ALL,
  initialSelectedIds = [],
}: TemplateListScreenProps) {
  const [templates, setTemplates] = useState<readonly DemoTemplate[]>(DEMO_TEMPLATES);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [channel, setChannel] = useState<ChannelFilter>(initialChannel);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(initialSelectedIds),
  );
  const [confirming, setConfirming] = useState<DemoTemplate | null>(null);

  const visible = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return templates.filter((template) => {
      if (channel !== CHANNEL_FILTER_ALL && template.channel !== channel) return false;
      if (needle === '') return true;
      return (
        template.name.toLowerCase().includes(needle) || template.body.toLowerCase().includes(needle)
      );
    });
  }, [templates, keyword, channel]);

  const selection = tableSelectionState(visible, selectedIds);
  const selectedCount = selectedIds.size;

  const toggleOne = (id: string, checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const template of visible) {
        if (checked) next.add(template.id);
        else next.delete(template.id);
      }
      return next;
    });
  };

  const removeTemplate = (id: string): void => {
    setTemplates((prev) => prev.filter((template) => template.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const rows: TableProps['rows'] = visible.map((template, index) => ({
    id: template.id,
    selected: selectedIds.has(template.id),
    onActivate: () => {
      /* 실화면: 행 클릭 → 수정 폼(/marketing/templates/alimtalk/:id/edit) */
    },
    // 반려된 템플릿은 고쳐야 할 것이 있는 유일한 상태다 — 행 자체를 danger 로 물들여 눈에 띄게 한다
    ...(template.approvalStatus === 'rejected' && { tone: 'danger' as const }),
    leading: [
      <RowSelectCell
        key="select"
        id={template.id}
        label={`${template.name} 선택`}
        checked={selectedIds.has(template.id)}
        onToggle={(checked) => toggleOne(template.id, checked)}
      />,
      <SeqCell key="seq" seq={index + 1} />,
    ],
    cells: [
      template.name,
      <StatusBadge key="channel" tone="info" label={MESSAGE_CHANNEL_LABEL[template.channel]} />,
      requiresApproval(template.channel) ? (
        <StatusBadge
          key="approval"
          tone={APPROVAL_TONE[template.approvalStatus]}
          label={APPROVAL_STATUS_LABEL[template.approvalStatus]}
        />
      ) : (
        <span key="approval" style={dateStyle}>
          —
        </span>
      ),
      <span key="body" style={bodyPreviewStyle}>
        {bodyPreview(template.body)}
      </span>,
      <span key="updated" style={dateStyle}>
        {formatDateTime(template.updatedAt)}
      </span>,
    ],
    trailing: [
      <td key="actions" style={actionCellStyle}>
        <RowActions
          label={template.name}
          onEdit={() => {
            /* 실화면: 연필 → 수정 폼. 승인·검수중이면 폼 안에서 내용이 잠긴다 */
          }}
          onDelete={() => setConfirming(template)}
        />
      </td>,
    ],
  }));

  return (
    <div style={pageStyle}>
      <h1 style={headingStyle}>{ENTITY_LABEL}</h1>

      <div style={toolbarStyle}>
        <div style={filtersStyle}>
          <div style={searchWrapStyle}>
            <SearchField
              label="템플릿명·본문 검색"
              value={keyword}
              placeholder="템플릿명 · 본문 검색"
              onChange={setKeyword}
            />
          </div>
          <span style={selectWrapStyle}>
            <SelectField
              value={channel}
              aria-label="채널로 거르기"
              onChange={(event) => {
                const raw = event.target.value;
                setChannel(
                  CHANNEL_FILTER_OPTIONS.find((option) => option.id === raw)?.id ??
                    CHANNEL_FILTER_ALL,
                );
              }}
            >
              {CHANNEL_FILTER_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </span>
        </div>
        <Button variant="primary" size="md" iconLeft={<Icon name="plus-circle" />}>
          템플릿 등록
        </Button>
      </div>

      <p style={summaryStyle}>
        {loading ? '불러오는 중…' : `전체 ${fmt(visible.length)}건`}
        {selectedCount > 0 ? ` · ${fmt(selectedCount)}건 선택됨` : ''}
      </p>

      <SelectionBar count={selectedCount} onClear={() => setSelectedIds(new Set())}>
        <Button
          variant="danger"
          onClick={() => {
            for (const id of selectedIds) removeTemplate(id);
          }}
        >
          {`선택 ${fmt(selectedCount)}건 삭제`}
        </Button>
      </SelectionBar>

      <Table
        caption="발송 템플릿 목록 — 행을 누르면 수정 폼으로 이동합니다. 승인·검수중 템플릿은 내용이 잠깁니다."
        columns={COLUMNS}
        rows={rows}
        leadingHead={[
          <SelectAllHeaderCell
            key="select-all"
            label="이 페이지의 발송 템플릿 전체 선택"
            labelId={SELECT_ALL_LABEL_ID}
            selection={selection}
            onToggleAll={toggleAll}
          />,
          <SeqHeaderCell key="seq" />,
        ]}
        trailingHead={[
          <th key="actions-head" scope="col" className="tds-table__head tds-table__head--end">
            <span style={visuallyHidden}>행 액션</span>
          </th>,
        ]}
        loading={loading}
        skeletonRows={PAGE_SIZE}
        empty={
          // 실화면은 이 화면에서 채널 필터 분기(hasActiveFilters)를 넘기지 않는다 — 그대로 미러한다
          <EmptyState
            label={ENTITY_LABEL}
            hasQuery={keyword.trim() !== ''}
            onClearSearch={() => setKeyword('')}
          />
        }
      />

      {confirming !== null && (
        <ConfirmDialog
          intent="delete"
          title="발송 템플릿 삭제"
          message={`'${confirming.name}'을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={() => {
            removeTemplate(confirming.id);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}

/** 정상: 세 채널 × 네 승인상태를 덮는 템플릿 6건. 반려 행은 danger 톤으로 눈에 띈다 */
export const Default: Story = {
  render: () => <TemplateListScreen />,
};

/** 최초 로드: 표 스켈레톤(Table loading) — 첫 로드에서만 켠다(STATE-01) */
export const Loading: Story = {
  render: () => <TemplateListScreen loading />,
};

/** 빈 결과: 검색 결과 없음 — Table empty 슬롯에 Empty(검색 지우기 복구) */
export const Empty: Story = {
  render: () => <TemplateListScreen initialKeyword="등록되지 않은 템플릿" />,
};

/** 선택됨: 여러 행 선택 → SelectionBar(일괄 삭제) 노출 + 선택 행 강조 */
export const Selection: Story = {
  render: () => <TemplateListScreen initialSelectedIds={['tpl-alim-2', 'tpl-alim-3']} />,
};

/** 필터 적용: 채널='카카오 알림톡' — 승인상태 열이 뜻을 갖는 유일한 채널만 남긴 목록 */
export const Filtered: Story = {
  render: () => <TemplateListScreen initialChannel="alimtalk" />,
};
