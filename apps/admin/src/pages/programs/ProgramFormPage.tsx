// ProgramFormPage — 프로그램(펀딩) 등록/수정 (라우트: /programs/new · /programs/:id/edit)
//
// [프레임워크 재사용 + 다중 구획 레이아웃] 데이터 배선은 공용 CRUD 프레임워크(useCrudForm)를 그대로
// 쓰고, 화면은 구획 카드(기본정보·펀딩설정·스토리·대표이미지·리워드) + 좌측 구획 목차 레일 +
// 우측 실시간 미리보기로 구성한다. 상품 등록 폼(ProductFormPage)과 같은 골격이다 —
// FormPageShell 은 단일 카드 폼 전용이라, 다중 구획 + 미리보기 2단은 여기서 직접 배치한다.
//
// [무엇을 입력하는가] 후원형 펀딩은 '목표 금액 · 기간 · 리워드' 세 가지가 계약의 전부다. 모금액과
// 후원자수는 **후원이 만드는 값**이라 이 폼에 없다 (ProgramInput 이 그렇게 좁혀져 있다).
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { cssVar, isRichTextEmpty, sanitizeRichText } from '@tds/ui';

import './program-form.css';
import { formatNumber } from '../../shared/format';
import {
  Alert,
  alertActionRowStyle,
  Button,
  Card,
  CardTitle,
  controlStyle,
  ddStyle,
  dlStyle,
  dtStyle,
  errorIdOf,
  errorTextStyle,
  FilterRail,
  FormField,
  FormSectionAnchor,
  FormSectionNav,
  hintStyle,
  Icon,
  ImageThumb,
  ImageUploadField,
  pageTitleStyle,
  RichTextField,
  scrollToSection,
  SelectField,
  StatusBadge,
  tableStyle,
  tdStyle,
  thStyle,
  useActiveSection,
  useUnsavedChangesDialog,
} from '../../shared/ui';
import type { FormSectionItem } from '../../shared/ui';
import {
  FormConflictDialog,
  FormServerError,
  submitButtonLabel,
  useCrudForm,
} from '../../shared/crud';
import { useRouteWritePermissions } from '../../shared/permissions/RequirePermission';
import { fetchProgramCategoryOptions, programAdapter } from './data-source';
import { programSchema } from './validation';
import type { ProgramFormValues } from './validation';
import {
  fundingSummary,
  fundingTone,
  PROGRAM_STATUS_OPTIONS,
  programStatusLabel,
  programStatusTone,
} from './types';
import { daysLeft, PROGRAM_SUMMARY_MAX, PROGRAM_TITLE_MAX } from './_shared/store';
import type { Program, ProgramInput } from './_shared/store';

const RESOURCE = 'programs';
const ENTITY_LABEL = '프로그램';
const LIST_PATH = '/programs';
const UNSAVED_MESSAGE =
  '프로그램에 저장하지 않은 변경 사항이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.';

/**
 * 남은 일수의 기준일 — 목록 화면(ProgramListPage)과 같은 고정 기준일이다.
 *
 * daysLeft 는 `today` 를 인자로 받는다(store.ts 머리말): 화면이 `new Date()` 를 읽으면 미리보기의
 * '남은 일수'가 실행하는 날마다 달라져 스토리북 회귀 비교가 매일 깨진다.
 * 백엔드가 붙으면 이 상수는 서버가 내려주는 기준 시각으로 바뀐다.
 */
const TODAY = '2026-07-21';

/**
 * 스토리 카운터의 분모.
 *
 * programSchema 는 스토리 길이를 제한하지 않는다 — 창작자의 서술을 자를 이유가 없기 때문이다.
 * 그래서 이 값은 검증이 아니라 **작성 가이드**다(넘겨도 저장은 막히지 않는다). RichTextField 는
 * 카운터를 그리기 위해 분모를 요구하므로 화면이 정한다.
 */
const STORY_GUIDE_MAX = 5000;

/**
 * 폼 구획 — 좌측 레일의 한 줄이자 본문의 한 앵커.
 *
 * fields 는 그 구획이 책임지는 폼 필드다. 이 표가 있어야 레일이 '어느 구획에 오류가 있는지'를
 * 스스로 말할 수 있다 — 화면 어딘가에 흩어진 조건문으로 다시 적지 않는다.
 */
const SECTIONS = [
  {
    id: 'program-section-basic',
    label: '기본 정보',
    fields: ['title', 'creator', 'categoryId', 'summary'],
  },
  {
    id: 'program-section-funding',
    label: '펀딩 설정',
    fields: ['goalAmount', 'startDate', 'endDate', 'status'],
  },
  { id: 'program-section-story', label: '스토리', fields: ['story'] },
  { id: 'program-section-cover', label: '대표 이미지', fields: ['coverImageUrl'] },
  { id: 'program-section-rewards', label: '리워드', fields: ['rewards'] },
] as const satisfies readonly {
  id: string;
  label: string;
  fields: readonly (keyof ProgramFormValues)[];
}[];

/** 문서 순서대로 고정한 앵커 id — useActiveSection 이 렌더마다 관측자를 다시 붙이지 않게 모듈 상수다 */
const SECTION_IDS: readonly string[] = SECTIONS.map((section) => section.id);

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
};

const descriptionStyle: CSSProperties = {
  marginTop: cssVar('space.1'),
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: cssVar('color.text.muted'),
  fontSize: cssVar('typography.label.md.font-size'),
  lineHeight: cssVar('typography.label.md.line-height'),
};

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: cssVar('space.2'),
  paddingTop: cssVar('space.1'),
  paddingBottom: cssVar('space.1'),
  paddingLeft: 0,
  paddingRight: 0,
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  color: cssVar('color.text.muted'),
  fontSize: cssVar('typography.label.md.font-size'),
  lineHeight: cssVar('typography.label.md.line-height'),
  cursor: 'pointer',
};

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(calc(${cssVar('space.6')} * 13), 1fr))`,
  gap: cssVar('space.5'),
  alignItems: 'start',
};

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  minWidth: 0,
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(calc(${cssVar('space.6')} * 5), 1fr))`,
  gap: cssVar('space.4'),
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: cssVar('space.2'),
};

/* ── 미리보기 (후원자에게 보일 요약) ──────────────────────────────────────── */

const previewCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.2'),
  boxSizing: 'border-box',
  width: '100%',
  paddingTop: cssVar('space.3'),
  paddingBottom: cssVar('space.3'),
  paddingLeft: cssVar('space.3'),
  paddingRight: cssVar('space.3'),
  borderStyle: 'solid',
  borderWidth: cssVar('border-width.thin'),
  borderColor: cssVar('color.border.default'),
  borderRadius: cssVar('radius.lg'),
  background: cssVar('color.surface.default'),
};

const previewTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: cssVar('color.text.default'),
  fontSize: cssVar('typography.label.md.font-size'),
  fontWeight: cssVar('primitive.typography.font-weight.medium'),
  lineHeight: cssVar('typography.label.md.line-height'),
  overflowWrap: 'anywhere',
};

const previewSummaryStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: cssVar('color.text.muted'),
  fontSize: cssVar('typography.caption.md.font-size'),
  lineHeight: cssVar('typography.caption.md.line-height'),
  overflowWrap: 'anywhere',
};

const previewBadgeRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: cssVar('space.1'),
  flexWrap: 'wrap',
};

/* ── 리워드 편집기 ─────────────────────────────────────────────────────────── */

const rewardSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
};

const tableWrapStyle: CSSProperties = {
  width: '100%',
  overflowX: 'auto',
};

const rewardTextInputStyle: CSSProperties = {
  ...controlStyle(false),
  minWidth: `calc(${cssVar('space.6')} * 4)`,
};

const rewardNumberInputStyle: CSSProperties = {
  ...controlStyle(false),
  width: `calc(${cssVar('space.6')} * 3)`,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: cssVar('space.1'),
  paddingBottom: cssVar('space.1'),
  paddingLeft: cssVar('space.1'),
  paddingRight: cssVar('space.1'),
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  color: cssVar('color.feedback.danger.text'),
  cursor: 'pointer',
};

const disabledIconButtonStyle: CSSProperties = {
  ...iconButtonStyle,
  color: cssVar('color.text.disabled'),
  cursor: 'not-allowed',
};

/** 리워드 한 줄 — 폼 값의 원소(zod 스키마가 정본이라 여기서 다시 정의하지 않는다) */
type RewardValue = ProgramFormValues['rewards'][number];

/** 숫자 칸은 숫자만 남긴다 — '1,000원' 을 붙여 넣어도 값이 깨지지 않게 한다 */
const toDigits = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? 0 : Number(digits);
};

interface RewardEditorProps {
  readonly rewards: readonly RewardValue[];
  readonly disabled: boolean;
  readonly error?: string | undefined;
  readonly onChange: (next: RewardValue[]) => void;
}

/**
 * 리워드 목록 편집기.
 *
 * [왜 이 화면 안에 있나] 소비자가 이 폼 하나다 — 공유될 때 옮긴다(shared/ui README 규칙 1).
 * [왜 이미 후원된 리워드를 못 지우나] claimedCount 는 **후원자가 이미 고른 수**다. 그 줄을 지우면
 * 후원자가 무엇을 받기로 했는지 가리키는 곳이 사라진다 — 서버도 같은 이유로 막는다.
 */
function RewardEditor({ rewards, disabled, error, onChange }: RewardEditorProps) {
  const patch = (id: string, next: Partial<RewardValue>) => {
    onChange(rewards.map((reward) => (reward.id === id ? { ...reward, ...next } : reward)));
  };

  const addReward = () => {
    onChange([
      ...rewards,
      {
        // 화면에서 만든 임시 id — 저장 뒤에는 서버가 준 id 로 대체된다.
        // randomUUID 라 같은 밀리초에 두 번 눌러도 key 가 겹치지 않는다.
        id: `rw-${crypto.randomUUID()}`,
        title: '',
        amount: 0,
        description: '',
        limitCount: 0,
        claimedCount: 0,
      },
    ]);
  };

  const removeReward = (id: string) => {
    onChange(rewards.filter((reward) => reward.id !== id));
  };

  return (
    <div style={rewardSectionStyle}>
      <p style={hintStyle}>
        후원자가 고를 리워드를 등록하세요. 수량 한정은 0 이면 무제한입니다. 이미 후원된 리워드는
        삭제할 수 없습니다 — 후원자가 받기로 한 대가가 사라지기 때문입니다.
      </p>

      {rewards.length === 0 ? (
        <p style={hintStyle}>
          등록된 리워드가 없습니다. 리워드가 없으면 후원자가 고를 것이 없습니다.
        </p>
      ) : (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <caption style={hintStyle}>리워드 목록 — 각 칸을 직접 편집합니다.</caption>
            <thead>
              <tr>
                <th scope="col" style={thStyle}>
                  리워드명
                </th>
                <th scope="col" style={thStyle}>
                  후원 금액(원)
                </th>
                <th scope="col" style={thStyle}>
                  설명
                </th>
                <th scope="col" style={thStyle}>
                  수량 한정
                </th>
                <th scope="col" style={thStyle}>
                  후원 수
                </th>
                <th scope="col" style={thStyle}>
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((reward, index) => {
                const rowName = reward.title.trim() === '' ? `리워드 ${index + 1}` : reward.title;
                const claimed = reward.claimedCount > 0;
                return (
                  <tr key={reward.id}>
                    <td style={tdStyle}>
                      <input
                        type="text"
                        className="tds-ui-input tds-ui-focusable"
                        style={rewardTextInputStyle}
                        value={reward.title}
                        placeholder="예: 얼리버드 1대"
                        disabled={disabled}
                        aria-label={`${rowName} 리워드명`}
                        onChange={(event) => patch(reward.id, { title: event.target.value })}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="tds-ui-input tds-ui-focusable"
                        style={rewardNumberInputStyle}
                        value={String(reward.amount)}
                        disabled={disabled}
                        aria-label={`${rowName} 후원 금액`}
                        onChange={(event) =>
                          patch(reward.id, { amount: toDigits(event.target.value) })
                        }
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="text"
                        className="tds-ui-input tds-ui-focusable"
                        style={rewardTextInputStyle}
                        value={reward.description}
                        placeholder="예: 본품 + 파우치"
                        disabled={disabled}
                        aria-label={`${rowName} 설명`}
                        onChange={(event) => patch(reward.id, { description: event.target.value })}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="tds-ui-input tds-ui-focusable"
                        style={rewardNumberInputStyle}
                        value={String(reward.limitCount)}
                        disabled={disabled}
                        aria-label={`${rowName} 수량 한정 (0 이면 무제한)`}
                        onChange={(event) =>
                          patch(reward.id, { limitCount: toDigits(event.target.value) })
                        }
                      />
                    </td>
                    {/* 후원 수는 후원이 만드는 값이라 읽기 전용이다 — 폼이 손댈 축이 아니다 */}
                    <td style={tdStyle}>{`${formatNumber(reward.claimedCount)}명`}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        className="tds-ui-focusable"
                        style={claimed ? disabledIconButtonStyle : iconButtonStyle}
                        disabled={disabled || claimed}
                        aria-label={
                          claimed
                            ? `${rowName} — 이미 후원된 리워드라 삭제할 수 없습니다`
                            : `${rowName} 삭제`
                        }
                        title={claimed ? '이미 후원된 리워드는 삭제할 수 없습니다' : undefined}
                        onClick={() => removeReward(reward.id)}
                      >
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <span>
        <Button variant="secondary" size="md" disabled={disabled} onClick={addReward}>
          <Icon name="plus-circle" />
          리워드 추가
        </Button>
      </span>

      {error !== undefined && error !== '' && (
        <p role="alert" style={errorTextStyle}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── 폼 값 ↔ 도메인 ───────────────────────────────────────────────────────── */

const EMPTY: ProgramFormValues = {
  title: '',
  categoryId: '',
  creator: '',
  summary: '',
  story: '',
  goalAmount: '',
  startDate: '',
  endDate: '',
  // 새 프로그램은 '작성 중' 에서 출발한다 — 열기 전에 스토리·리워드를 마저 채우는 것이 보통이다
  status: 'draft',
  coverImageUrl: '',
  rewards: [],
};

function toInput(values: ProgramFormValues): ProgramInput {
  return {
    title: values.title.trim(),
    categoryId: values.categoryId,
    creator: values.creator.trim(),
    summary: values.summary.trim(),
    // **저장 지점 sanitize** — 필드가 이미 걸러 내보내지만 여기서 한 번 더 건다. 폼 값은 필드
    // 말고도 닿을 수 있는 자리(setValue·리셋·복원)라, 저장으로 나가는 마지막 길목에서 확인한다.
    // trim() 하지 않는다 — HTML 이라 앞뒤 공백은 마크업 사이의 것이고, 빈 본문('<p></p>')은
    // 문자열 비교가 아니라 isRichTextEmpty 가 판정한다.
    story: isRichTextEmpty(values.story) ? '' : sanitizeRichText(values.story),
    goalAmount: Number(values.goalAmount.trim() || '0'),
    startDate: values.startDate,
    endDate: values.endDate,
    status: values.status,
    coverImageUrl: values.coverImageUrl,
    // 제목 앞뒤 공백은 목록 정렬을 흔든다 — 저장 직전에 눕힌다
    rewards: values.rewards.map((reward) => ({
      ...reward,
      title: reward.title.trim(),
      description: reward.description.trim(),
    })),
  };
}

function toValues(program: Program): ProgramFormValues {
  return {
    title: program.title,
    categoryId: program.categoryId,
    creator: program.creator,
    summary: program.summary,
    story: program.story,
    goalAmount: String(program.goalAmount),
    startDate: program.startDate,
    endDate: program.endDate,
    status: program.status,
    coverImageUrl: program.coverImageUrl,
    // 읽기 전용 배열을 그대로 넘기면 폼이 소유권 없는 배열을 편집하게 된다 — 복사해서 넣는다
    rewards: program.rewards.map((reward) => ({ ...reward })),
  };
}

/**
 * 입력 중인 문자열 → 숫자(미리보기 전용).
 *
 * 검증을 통과하기 **전** 값도 그려야 한다 — '10,000,000' 처럼 타이핑 중인 값에서 숫자만 건져낸다.
 * 저장 경로(toInput)는 이 관대함을 쓰지 않는다: 거기서는 스키마가 이미 형식을 통과시킨 뒤다.
 */
function previewNumber(raw: string): number {
  return Number((raw.trim() || '0').replace(/\D/g, '')) || 0;
}

export default function ProgramFormPage() {
  const navigate = useNavigate();
  const { canCreate, canUpdate } = useRouteWritePermissions();
  const {
    form,
    isEdit,
    saving,
    loadingDetail,
    loadFailure,
    retryLoad,
    serverError,
    errorReference,
    conflict,
    submit,
    isDirty,
    loaded,
  } = useCrudForm<Program, ProgramInput, ProgramFormValues>({
    resource: RESOURCE,
    adapter: programAdapter,
    entityLabel: ENTITY_LABEL,
    listPath: LIST_PATH,
    schema: programSchema,
    empty: EMPTY,
    toInput,
    toValues,
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // 쓰기 권한은 등록/수정이 다른 축이다 — 등록 화면은 create, 수정 화면은 update 를 본다 (EXC-03).
  // 없으면 입력은 보여 주되 저장을 막는다: 읽기는 허용된 화면이라 내용을 지울 이유가 없다.
  const canSave = isEdit ? canUpdate : canCreate;
  const disabled = saving || loadingDetail;

  const unsavedDialog = useUnsavedChangesDialog(isDirty && !saving, { message: UNSAVED_MESSAGE });

  const categoriesQuery = useQuery({
    queryKey: [RESOURCE, 'category-options'],
    queryFn: ({ signal }) => fetchProgramCategoryOptions(signal),
  });
  const categories = categoriesQuery.data ?? [];

  /**
   * 카테고리는 2단계다 — 폼이 저장하는 값(`categoryId`)은 **최종 선택 하나**이고,
   * 중분류를 고르면 그 id, 고르지 않으면 대분류 id 가 들어간다. 두 셀렉트는 그 값에서 되짚어 그린다.
   */
  const categoryId = watch('categoryId');
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const categoryRootId =
    selectedCategory === undefined ? '' : (selectedCategory.parentId ?? selectedCategory.id);
  const categoryChildId =
    selectedCategory !== undefined && selectedCategory.parentId !== null ? selectedCategory.id : '';
  const categoryRootOptions = categories.filter((category) => category.parentId === null);
  const categoryChildOptions =
    categoryRootId === ''
      ? []
      : categories.filter((category) => category.parentId === categoryRootId);

  /** 대분류를 바꾸면 중분류 선택은 버린다 — 다른 갈래의 중분류가 남아 있으면 안 된다 */
  const setCategory = (next: string) =>
    setValue('categoryId', next, { shouldDirty: true, shouldValidate: true });

  const title = watch('title');
  const creator = watch('creator');
  const summary = watch('summary');
  const story = watch('story');
  const goalAmount = watch('goalAmount');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const status = watch('status');
  const coverImageUrl = watch('coverImageUrl');
  const rewards = watch('rewards');

  // 좌측 레일 — 지금 보고 있는 구획(스크롤 추적)과 오류가 남은 구획을 함께 말한다
  const activeSectionId = useActiveSection(SECTION_IDS);
  const sectionNavItems = useMemo<readonly FormSectionItem[]>(
    () =>
      SECTIONS.map((section) => {
        // 오류 표시는 errors 하나만 본다 — 구획마다 조건을 다시 적으면 표와 화면이 어긋난다
        const invalid = section.fields.some((field) => errors[field] !== undefined);
        return invalid
          ? { id: section.id, label: section.label, invalid: true }
          : { id: section.id, label: section.label };
      }),
    [errors],
  );

  const rewardsError = (errors.rewards as { message?: string } | undefined)?.message;

  // 미리보기 파생값 — 아직 검증을 통과하지 않은 입력에서도 그린다
  const goalPreview = previewNumber(goalAmount);
  const leftDays = endDate === '' ? null : daysLeft(endDate, TODAY);
  const cheapestReward = rewards.reduce<number | null>(
    (lowest, reward) => (lowest === null || reward.amount < lowest ? reward.amount : lowest),
    null,
  );

  // [EXC-12] 404 와 서버 오류는 복구 수단이 다르다 — 이미 삭제된 항목에 '다시 시도'를 권하면
  // 영원히 실패하는 버튼을 누르게 된다.
  if (loadFailure !== null) {
    return (
      <div style={pageStyle}>
        <Alert tone="danger">
          <div style={alertActionRowStyle}>
            <span>
              {loadFailure === 'not-found'
                ? '프로그램을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.'
                : '프로그램을 불러오지 못했습니다.'}
            </span>
            {loadFailure === 'error' && (
              <Button variant="secondary" onClick={retryLoad}>
                다시 시도
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate(LIST_PATH)}>
              목록으로
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button
        type="button"
        className="tds-ui-focusable"
        style={backLinkStyle}
        onClick={() => navigate(LIST_PATH)}
      >
        <Icon name="chevron-left" />
        목록으로
      </button>

      <div>
        <h1 style={pageTitleStyle}>{isEdit ? '프로그램 수정' : '프로그램 등록'}</h1>
        <p style={descriptionStyle}>
          {/* 방향('왼쪽·오른쪽')을 적지 않는다 — 좁은 화면에서는 목차가 폼 위로 접혀 올라간다 */}
          별표(*) 항목은 필수입니다. 목차로 구획을 오가고, 미리보기로 후원자에게 보일 요약을
          확인하세요.
        </p>
      </div>

      {/* 저장할 수 없는 화면임을 먼저 말한다 — 다 입력한 뒤 버튼이 죽어 있는 것을 발견하지 않게 */}
      {!canSave && (
        <Alert tone="warning">
          이 프로그램을 {isEdit ? '수정' : '등록'}할 권한이 없습니다. 내용은 확인할 수 있지만 저장은
          되지 않습니다.
        </Alert>
      )}

      <form onSubmit={submit} noValidate style={pageStyle}>
        <FormServerError serverError={serverError} errorReference={errorReference} />

        {/* 좌: 구획 목차 레일 / 우: 폼 본문 + 미리보기. 좁은 화면에서는 1단으로 접힌다
            (program-form.css — 미디어 쿼리는 인라인 style 로 표현할 수 없다) */}
        <div className="tds-programform-layout">
          <div className="tds-programform-rail">
            {/* 껍데기(간격·안내문 구분선·시각 언어)는 목록 화면의 레일과 같은 것을 쓴다.
                내용물만 다르다 — 필터가 아니라 내비게이션이다 (FormSectionNav 머리말 참조). */}
            <FilterRail
              notice={
                <p style={hintStyle}>
                  구획을 누르면 해당 위치로 이동합니다. 붉은 점이 붙은 구획에는 확인이 필요한 입력이
                  남아 있습니다.
                </p>
              }
            >
              <FormSectionNav
                navLabel="프로그램 폼 구획 이동"
                heading="구획"
                items={sectionNavItems}
                activeId={activeSectionId}
                onJump={scrollToSection}
              />
            </FilterRail>
          </div>

          <div style={layoutStyle}>
            <div style={columnStyle}>
              {/* ── 기본 정보 ── */}
              <FormSectionAnchor id={SECTIONS[0].id} label={SECTIONS[0].label}>
                <Card>
                  <CardTitle>기본 정보</CardTitle>

                  <FormField
                    htmlFor="program-title"
                    label="프로그램명"
                    required
                    error={errors.title?.message}
                  >
                    <input
                      id="program-title"
                      type="text"
                      className="tds-ui-input tds-ui-focusable"
                      style={controlStyle(errors.title !== undefined)}
                      maxLength={PROGRAM_TITLE_MAX}
                      placeholder="예: 무선 스튜디오 모니터 헤드폰"
                      disabled={disabled}
                      aria-invalid={errors.title !== undefined}
                      aria-describedby={
                        errors.title !== undefined ? errorIdOf('program-title') : undefined
                      }
                      {...register('title')}
                    />
                  </FormField>

                  <div style={rowStyle}>
                    <FormField
                      htmlFor="program-creator"
                      label="창작자"
                      required
                      error={errors.creator?.message}
                    >
                      <input
                        id="program-creator"
                        type="text"
                        className="tds-ui-input tds-ui-focusable"
                        style={controlStyle(errors.creator !== undefined)}
                        maxLength={40}
                        placeholder="예: 사운드랩"
                        disabled={disabled}
                        aria-invalid={errors.creator !== undefined}
                        aria-describedby={
                          errors.creator !== undefined ? errorIdOf('program-creator') : undefined
                        }
                        {...register('creator')}
                      />
                    </FormField>

                    <FormField
                      htmlFor="program-category"
                      label="카테고리 (대분류)"
                      required
                      error={errors.categoryId?.message}
                    >
                      <SelectField
                        id="program-category"
                        isInvalid={errors.categoryId !== undefined}
                        disabled={disabled}
                        aria-invalid={errors.categoryId !== undefined}
                        aria-describedby={
                          errors.categoryId !== undefined
                            ? errorIdOf('program-category')
                            : undefined
                        }
                        value={categoryRootId}
                        onChange={(event) => setCategory(event.target.value)}
                      >
                        <option value="">대분류 선택</option>
                        {categoryRootOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>

                    {/* 2Depth — 고르지 않으면 대분류에 등록된다. 하위가 없는 대분류면 잠근다 */}
                    <FormField
                      htmlFor="program-category-child"
                      label="카테고리 (중분류)"
                      hint={
                        categoryRootId === ''
                          ? '대분류를 먼저 선택하세요.'
                          : categoryChildOptions.length === 0
                            ? '이 대분류에는 중분류가 없습니다.'
                            : '선택하지 않으면 대분류에 등록됩니다.'
                      }
                    >
                      <SelectField
                        id="program-category-child"
                        disabled={disabled || categoryChildOptions.length === 0}
                        value={categoryChildId}
                        onChange={(event) =>
                          setCategory(
                            event.target.value === '' ? categoryRootId : event.target.value,
                          )
                        }
                      >
                        <option value="">
                          {categoryChildOptions.length === 0 ? '없음' : '선택 안 함'}
                        </option>
                        {categoryChildOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>
                  </div>

                  <FormField
                    htmlFor="program-summary"
                    label="한 줄 소개"
                    required
                    error={errors.summary?.message}
                    hint="목록과 카드에 제목 아래로 붙는 한 줄입니다."
                  >
                    <input
                      id="program-summary"
                      type="text"
                      className="tds-ui-input tds-ui-focusable"
                      style={controlStyle(errors.summary !== undefined)}
                      maxLength={PROGRAM_SUMMARY_MAX}
                      placeholder="예: 스튜디오 모니터링을 그대로 옮긴 무선 헤드폰"
                      disabled={disabled}
                      aria-invalid={errors.summary !== undefined}
                      aria-describedby={
                        errors.summary !== undefined ? errorIdOf('program-summary') : undefined
                      }
                      {...register('summary')}
                    />
                  </FormField>
                </Card>
              </FormSectionAnchor>

              {/* ── 펀딩 설정 ── */}
              <FormSectionAnchor id={SECTIONS[1].id} label={SECTIONS[1].label}>
                <Card>
                  <CardTitle>펀딩 설정</CardTitle>

                  <FormField
                    htmlFor="program-goal"
                    label="목표 금액(원)"
                    required
                    error={errors.goalAmount?.message}
                    hint="기간이 끝나는 순간 이 금액을 넘겼는지로 성공·실패가 갈립니다."
                  >
                    <input
                      id="program-goal"
                      type="text"
                      inputMode="numeric"
                      className="tds-ui-input tds-ui-focusable"
                      style={controlStyle(errors.goalAmount !== undefined)}
                      placeholder="예: 10000000"
                      disabled={disabled}
                      aria-invalid={errors.goalAmount !== undefined}
                      aria-describedby={
                        errors.goalAmount !== undefined ? errorIdOf('program-goal') : undefined
                      }
                      {...register('goalAmount')}
                    />
                  </FormField>

                  <div style={rowStyle}>
                    <FormField
                      htmlFor="program-start"
                      label="시작일"
                      required
                      error={errors.startDate?.message}
                    >
                      <input
                        id="program-start"
                        type="date"
                        className="tds-ui-input tds-ui-focusable"
                        style={controlStyle(errors.startDate !== undefined)}
                        disabled={disabled}
                        aria-invalid={errors.startDate !== undefined}
                        aria-describedby={
                          errors.startDate !== undefined ? errorIdOf('program-start') : undefined
                        }
                        {...register('startDate')}
                      />
                    </FormField>

                    <FormField
                      htmlFor="program-end"
                      label="종료일"
                      required
                      error={errors.endDate?.message}
                    >
                      <input
                        id="program-end"
                        type="date"
                        className="tds-ui-input tds-ui-focusable"
                        style={controlStyle(errors.endDate !== undefined)}
                        disabled={disabled}
                        aria-invalid={errors.endDate !== undefined}
                        aria-describedby={
                          errors.endDate !== undefined ? errorIdOf('program-end') : undefined
                        }
                        {...register('endDate')}
                      />
                    </FormField>

                    <FormField
                      htmlFor="program-status"
                      label="상태"
                      required
                      hint="성공·실패는 기간이 끝난 뒤 목표 달성 여부로 갈립니다."
                    >
                      <SelectField id="program-status" disabled={disabled} {...register('status')}>
                        {PROGRAM_STATUS_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </SelectField>
                    </FormField>
                  </div>
                </Card>
              </FormSectionAnchor>

              {/* ── 스토리 ── */}
              <FormSectionAnchor id={SECTIONS[2].id} label={SECTIONS[2].label}>
                <Card>
                  <CardTitle>스토리</CardTitle>
                  {/* 스토리는 서식이 필요한 본문이라 RichTextField(Tiptap) 다 — 나가는 값은 이미
                      sanitize 된 HTML 이고, 들어오는 값도 필드가 렌더 지점에서 다시 sanitize 한다. */}
                  <RichTextField
                    label="프로그램 스토리"
                    value={story}
                    onChange={(value) => setValue('story', value, { shouldDirty: true })}
                    maxLength={STORY_GUIDE_MAX}
                    disabled={disabled}
                    error={errors.story?.message}
                    hint="왜 만들었는지·무엇을 만드는지·언제 보내는지를 적으면 후원 결정이 쉬워집니다. 글자 수는 서식을 빼고 셉니다."
                    placeholder="이 프로그램을 시작한 이유와 만들려는 것을 설명하세요."
                    rows={8}
                  />
                </Card>
              </FormSectionAnchor>

              {/* ── 대표 이미지 ── */}
              <FormSectionAnchor id={SECTIONS[3].id} label={SECTIONS[3].label}>
                <Card>
                  <CardTitle>대표 이미지</CardTitle>
                  <ImageUploadField
                    label="대표 이미지"
                    value={coverImageUrl}
                    onChange={(value) => setValue('coverImageUrl', value, { shouldDirty: true })}
                    disabled={disabled}
                    error={errors.coverImageUrl?.message}
                    hint="목록과 상세의 첫인상입니다. 가로가 긴 이미지가 잘 맞습니다."
                  />
                </Card>
              </FormSectionAnchor>

              {/* ── 리워드 ── */}
              <FormSectionAnchor id={SECTIONS[4].id} label={SECTIONS[4].label}>
                <Card>
                  <CardTitle>리워드</CardTitle>
                  <RewardEditor
                    rewards={rewards}
                    disabled={disabled}
                    error={rewardsError}
                    onChange={(next) =>
                      setValue('rewards', next, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                </Card>
              </FormSectionAnchor>
            </div>

            {/* ── 우측 실시간 미리보기 ── */}
            <Card>
              <CardTitle>후원자 노출 미리보기</CardTitle>
              {/* 값이 비어 있어도 자리를 비우지 않는다 — '무엇이 아직 안 채워졌는지'가 곧 정보다 */}
              <div style={previewCardStyle}>
                <ImageThumb src={coverImageUrl} alt={`${title.trim() || '프로그램'} 대표 이미지`} />
                <p style={previewTitleStyle}>{title.trim() === '' ? '프로그램명 미입력' : title}</p>
                <p style={previewSummaryStyle}>
                  {summary.trim() === '' ? '한 줄 소개 미입력' : summary}
                </p>
                <span style={previewBadgeRowStyle}>
                  <StatusBadge
                    tone={programStatusTone(status)}
                    label={programStatusLabel(status)}
                  />
                </span>
              </div>

              <dl style={dlStyle}>
                <dt style={dtStyle}>창작자</dt>
                <dd style={ddStyle}>{creator.trim() === '' ? '—' : creator}</dd>

                <dt style={dtStyle}>목표 금액</dt>
                <dd style={ddStyle}>{`${formatNumber(goalPreview)}원`}</dd>

                <dt style={dtStyle}>기간</dt>
                <dd style={ddStyle}>
                  {startDate === '' || endDate === '' ? '—' : `${startDate} ~ ${endDate}`}
                </dd>

                <dt style={dtStyle}>남은 일수</dt>
                <dd style={ddStyle}>
                  {leftDays === null
                    ? '—'
                    : leftDays === 0
                      ? '오늘 마감'
                      : `${formatNumber(leftDays)}일`}
                </dd>

                <dt style={dtStyle}>리워드</dt>
                <dd style={ddStyle}>
                  {rewards.length === 0
                    ? '없음'
                    : `${formatNumber(rewards.length)}종 · 최저 ${formatNumber(cheapestReward ?? 0)}원`}
                </dd>
              </dl>

              {/* 모금 현황은 **저장된 사실**이다 — 폼에 없는 값이라 입력에 따라 움직이지 않는다.
                  등록 화면에는 아직 후원이 없으므로 이 줄 자체를 그리지 않는다. */}
              {loaded !== undefined && (
                <p style={hintStyle}>
                  저장된 모금 현황{' '}
                  <StatusBadge tone={fundingTone(loaded)} label={fundingSummary(loaded)} />
                </p>
              )}
            </Card>
          </div>
        </div>

        <div style={actionsStyle}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={saving}
            onClick={() => navigate(LIST_PATH)}
          >
            취소
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={disabled || !canSave}>
            {submitButtonLabel(saving, isEdit)}
          </Button>
        </div>
      </form>

      <FormConflictDialog conflict={conflict} />

      {unsavedDialog}
    </div>
  );
}
