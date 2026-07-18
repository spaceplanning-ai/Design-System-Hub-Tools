// TemplateFormPage — 발송 템플릿 등록/수정 (라우트: /marketing/templates/new · /:id/edit)
//
// 데이터 배선은 공용 CRUD 프레임워크(useCrudForm)를 재사용하고, 화면은 입력 카드(기본 정보·본문·
// 카카오 심사) + 우측 미리보기 카드 2단으로 구성한다(SMS 발송 폼과 같은 결). 채널(SMS/이메일/알림톡)에
// 따라 필드가 갈린다: 이메일/알림톡은 제목, 이메일은 HTML 본문, 알림톡은 승인상태·반려사유.
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { ensureRichText } from '@tds/ui';

import {
  Alert,
  alertActionRowStyle,
  Button,
  Card,
  CardTitle,
  ChevronLeftIcon,
  controlStyle,
  errorIdOf,
  FormField,
  hintStyle,
  pageTitleStyle,
  RichTextField,
  SelectField,
  StatusBadge,
  TextareaField,
  useUnsavedChangesDialog,
} from '../../../shared/ui';
import { FormConflictDialog, FormServerError, useCrudForm } from '../../../shared/crud';
import { templateAdapter, TEMPLATE_RESOURCE } from './data-source';
import { templateSchema } from './validation';
import type { TemplateFormValues } from './validation';
import { TemplatePreview } from './components/TemplatePreview';
import { VariableInsertBar } from '../_shared/VariableInsertBar';
import {
  APPROVAL_STATUS_OPTIONS,
  byteLengthOf,
  classifySms,
  MESSAGE_CHANNEL_OPTIONS,
  requiresApproval,
  smsByteLimit,
  smsKindLabel,
  TEMPLATE_BODY_MAX,
  TEMPLATE_NAME_MAX,
  TEMPLATE_TITLE_MAX,
  usesTitle,
} from '../_shared/messaging';
import type { MessageTemplate, MessageTemplateInput } from '../_shared/messaging';

const ENTITY_LABEL = '발송 템플릿';
const LIST_PATH = '/marketing/templates';
const UNSAVED_MESSAGE =
  '발송 템플릿에 저장하지 않은 변경 사항이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.';

const EMPTY: TemplateFormValues = {
  name: '',
  channel: 'sms',
  title: '',
  body: '',
  approvalStatus: 'draft',
  rejectReason: '',
};

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-5)',
};

const descriptionStyle: CSSProperties = {
  marginTop: 'var(--tds-space-1)',
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-md-font-size)',
  lineHeight: 'var(--tds-typography-label-md-line-height)',
};

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: 'var(--tds-space-2)',
  paddingTop: 'var(--tds-space-1)',
  paddingBottom: 'var(--tds-space-1)',
  paddingLeft: 0,
  paddingRight: 0,
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-md-font-size)',
  lineHeight: 'var(--tds-typography-label-md-line-height)',
  cursor: 'pointer',
};

/** 입력(좌) · 미리보기(우) 2단 — 좁은 화면에서는 자동으로 한 단으로 접힌다 */
const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(calc(var(--tds-space-6) * 13), 1fr))',
  gap: 'var(--tds-space-5)',
  alignItems: 'start',
};

/** 좌측 입력 열 — 카드들을 세로로 쌓는다 */
const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-5)',
  minWidth: 0,
};

/** 우측 미리보기 카드 — 스크롤해도 따라오도록 sticky */
const previewColStyle: CSSProperties = {
  position: 'sticky',
  top: 'var(--tds-space-4)',
  minWidth: 0,
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--tds-space-2)',
};

const byteHintStyle: CSSProperties = { ...hintStyle };

function toInput(values: TemplateFormValues): MessageTemplateInput {
  return {
    name: values.name.trim(),
    channel: values.channel,
    title: usesTitle(values.channel) ? values.title.trim() : '',
    body: values.body.trim(),
    approvalStatus: values.approvalStatus,
    rejectReason: values.approvalStatus === 'rejected' ? values.rejectReason.trim() : '',
  };
}

function toValues(template: MessageTemplate): TemplateFormValues {
  return {
    name: template.name,
    channel: template.channel,
    title: template.title,
    body: template.body,
    approvalStatus: template.approvalStatus,
    rejectReason: template.rejectReason,
  };
}

export default function TemplateFormPage() {
  const navigate = useNavigate();

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
  } = useCrudForm<MessageTemplate, MessageTemplateInput, TemplateFormValues>({
    resource: TEMPLATE_RESOURCE,
    adapter: templateAdapter,
    entityLabel: ENTITY_LABEL,
    listPath: LIST_PATH,
    schema: templateSchema,
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
  const disabled = saving || loadingDetail;
  const unsavedDialog = useUnsavedChangesDialog(isDirty && !saving, { message: UNSAVED_MESSAGE });

  const channel = watch('channel');
  const body = watch('body');
  const title = watch('title');
  const approvalStatus = watch('approvalStatus');

  const bytes = byteLengthOf(body);
  const smsKind = classifySms(bytes, false);
  const insertVariable = (token: string) =>
    setValue('body', `${body}${token}`, { shouldDirty: true, shouldValidate: true });

  // [EXC-12] 404 와 서버 오류는 복구 수단이 다르다 — 이미 삭제된 항목에 '다시 시도'를 권하지 않는다.
  if (loadFailure !== null) {
    return (
      <div style={pageStyle}>
        <Alert tone="danger">
          <div style={alertActionRowStyle}>
            <span>
              {loadFailure === 'not-found'
                ? '발송 템플릿을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.'
                : '발송 템플릿을 불러오지 못했습니다.'}
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
        <ChevronLeftIcon />
        목록으로
      </button>

      <div>
        <h1 style={pageTitleStyle}>{isEdit ? '발송 템플릿 수정' : '발송 템플릿 등록'}</h1>
        <p style={descriptionStyle}>
          채널을 고르면 필요한 항목이 달라집니다. 오른쪽 미리보기로 수신자가 볼 모습을 실시간으로
          확인할 수 있습니다.
        </p>
      </div>

      <form onSubmit={submit} noValidate style={pageStyle}>
        <FormServerError serverError={serverError} errorReference={errorReference} />

        <div style={layoutStyle}>
          <div style={columnStyle}>
            <Card>
              <CardTitle>기본 정보</CardTitle>

              <FormField
                htmlFor="template-name"
                label="템플릿명"
                required
                error={errors.name?.message}
              >
                <input
                  id="template-name"
                  type="text"
                  className="tds-ui-input tds-ui-focusable"
                  style={controlStyle(errors.name !== undefined)}
                  maxLength={TEMPLATE_NAME_MAX}
                  placeholder="예: 주문 완료 안내(SMS)"
                  disabled={disabled}
                  aria-invalid={errors.name !== undefined}
                  aria-describedby={
                    errors.name !== undefined ? errorIdOf('template-name') : undefined
                  }
                  {...register('name')}
                />
              </FormField>

              <FormField
                htmlFor="template-channel"
                label="채널"
                required
                hint="SMS 는 길이에 따라 LMS·MMS 로 자동 분류됩니다. 알림톡은 카카오 사전 심사가 필요합니다."
              >
                <SelectField id="template-channel" disabled={disabled} {...register('channel')}>
                  {MESSAGE_CHANNEL_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              </FormField>
            </Card>

            <Card>
              <CardTitle>본문 작성</CardTitle>

              {usesTitle(channel) && (
                <FormField
                  htmlFor="template-title"
                  label={channel === 'email' ? '이메일 제목' : '강조표기(제목)'}
                  required
                  error={errors.title?.message}
                >
                  <input
                    id="template-title"
                    type="text"
                    className="tds-ui-input tds-ui-focusable"
                    style={controlStyle(errors.title !== undefined)}
                    maxLength={TEMPLATE_TITLE_MAX}
                    placeholder={
                      channel === 'email'
                        ? '예: [스페이스플래닝] 이달의 소식'
                        : '예: 배송 출발 안내'
                    }
                    disabled={disabled}
                    aria-invalid={errors.title !== undefined}
                    aria-describedby={
                      errors.title !== undefined ? errorIdOf('template-title') : undefined
                    }
                    {...register('title')}
                  />
                </FormField>
              )}

              {channel === 'email' ? (
                // 이메일 본문은 HTML — 서식(굵게·제목·목록·링크·이미지)을 그대로 담는다.
                // sanitize·평문→HTML 승격은 RichTextField(껍데기)가 경계에서 처리한다.
                <RichTextField
                  label="본문"
                  required
                  value={ensureRichText(body)}
                  onChange={(value) =>
                    setValue('body', value, { shouldDirty: true, shouldValidate: true })
                  }
                  maxLength={TEMPLATE_BODY_MAX}
                  disabled={disabled}
                  error={errors.body?.message}
                  hint="굵게·제목·목록·링크·이미지를 넣을 수 있습니다. #{이름} 등 치환변수도 그대로 씁니다."
                  placeholder="이메일 본문을 작성하세요."
                  rows={12}
                />
              ) : (
                <TextareaField
                  label="본문"
                  required
                  value={body}
                  onChange={(value) =>
                    setValue('body', value, { shouldDirty: true, shouldValidate: true })
                  }
                  maxLength={TEMPLATE_BODY_MAX}
                  disabled={disabled}
                  error={errors.body?.message}
                  placeholder="발송할 문구를 입력하세요. #{이름} 등 치환변수를 넣을 수 있습니다."
                  rows={6}
                />
              )}
              {channel === 'sms' && (
                <p style={byteHintStyle}>
                  {`${String(bytes)} byte · ${smsKindLabel(smsKind)} (한도 ${String(smsByteLimit(smsKind))} byte)`}
                  {smsKind === 'lms' && ' — 90 byte 초과로 LMS 로 발송됩니다.'}
                </p>
              )}

              <VariableInsertBar onInsert={insertVariable} disabled={disabled} />
            </Card>

            {requiresApproval(channel) && (
              <Card>
                <CardTitle>카카오 심사</CardTitle>

                <FormField
                  htmlFor="template-approval"
                  label="승인상태"
                  hint="알림톡은 카카오 사전 심사(검수중→승인/반려)를 거칩니다. 승인된 템플릿만 발송에 쓸 수 있습니다."
                >
                  <SelectField
                    id="template-approval"
                    disabled={disabled}
                    {...register('approvalStatus')}
                  >
                    {APPROVAL_STATUS_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectField>
                </FormField>

                {approvalStatus === 'rejected' && (
                  <>
                    <StatusBadge
                      tone="danger"
                      label="반려됨 — 사유를 확인하고 재편집 후 다시 제출하세요."
                    />
                    <TextareaField
                      label="반려 사유"
                      value={watch('rejectReason')}
                      onChange={(value) => setValue('rejectReason', value, { shouldDirty: true })}
                      maxLength={200}
                      disabled={disabled}
                      placeholder="카카오 심사 반려 사유"
                      rows={2}
                    />
                  </>
                )}
              </Card>
            )}
          </div>

          <div style={previewColStyle}>
            <Card>
              <CardTitle>미리보기</CardTitle>
              <TemplatePreview channel={channel} title={title} body={body} />
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
          <Button type="submit" variant="primary" size="md" disabled={disabled}>
            {saving ? '저장 중…' : isEdit ? '저장' : '등록'}
          </Button>
        </div>
      </form>

      <FormConflictDialog conflict={conflict} />

      {unsavedDialog}
    </div>
  );
}
