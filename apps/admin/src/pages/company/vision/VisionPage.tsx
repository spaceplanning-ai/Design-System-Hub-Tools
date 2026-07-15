// VisionPage — 비전·미션 (라우트: /company/vision) · A41 소유
//
// 단일 문서 폼(비전 · 미션 · 핵심가치 항목들). 핵심가치는 추가/삭제되는 동적 목록(RHF useFieldArray).
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { isAbort } from '../../../shared/async';
import { formatNumber } from '../../../shared/format';
import { zodResolver } from '../../../shared/form/zodResolver';
import {
  Button,
  controlStyle,
  errorTextStyle,
  FormField,
  hintStyle,
  PlusCircleIcon,
  TrashIcon,
  useToast,
} from '../../../shared/ui';
import { DocumentFormShell } from '../_shared/DocumentFormShell';
import { useDocumentQuery, useSaveDocument } from '../_shared/document';
import { visionKey, visionStore } from './data-source';
import {
  MAX_CORE_VALUES,
  MISSION_MAX_LENGTH,
  VALUE_DESC_MAX_LENGTH,
  VALUE_TITLE_MAX_LENGTH,
  VISION_MAX_LENGTH,
} from './types';
import { visionSchema } from './validation';
import type { VisionFormValues } from './validation';

const UNSAVED_MESSAGE =
  '비전·미션에 저장하지 않은 변경 사항이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.';

const textareaStyle = (invalid: boolean): CSSProperties => ({
  ...controlStyle(invalid),
  minHeight: 'calc(var(--tds-space-6) * 3)',
  resize: 'vertical',
});

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  color: 'var(--tds-color-text-default)',
  fontFamily: 'var(--tds-typography-label-lg-font-family)',
  fontSize: 'var(--tds-typography-label-lg-font-size)',
  fontWeight: 'var(--tds-primitive-typography-font-weight-bold)',
  lineHeight: 'var(--tds-typography-label-lg-line-height)',
};

const valuesListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-3)',
};

const valueRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-3)',
  paddingTop: 'var(--tds-space-3)',
  paddingBottom: 'var(--tds-space-3)',
  paddingLeft: 'var(--tds-space-4)',
  paddingRight: 'var(--tds-space-4)',
  borderStyle: 'solid',
  borderWidth: 'var(--tds-border-width-thin)',
  borderColor: 'var(--tds-color-border-default)',
  borderRadius: 'var(--tds-radius-md)',
  background: 'var(--tds-color-surface-raised)',
};

const valueHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-2)',
};

const valueIndexStyle: CSSProperties = {
  color: 'var(--tds-color-text-muted)',
  fontSize: 'var(--tds-typography-label-sm-font-size)',
  fontWeight: 'var(--tds-typography-label-sm-font-weight)',
  lineHeight: 'var(--tds-typography-label-sm-line-height)',
};

const dangerGhostStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--tds-space-1)',
  paddingTop: 'var(--tds-space-1)',
  paddingBottom: 'var(--tds-space-1)',
  paddingLeft: 'var(--tds-space-2)',
  paddingRight: 'var(--tds-space-2)',
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  color: 'var(--tds-color-feedback-danger-text)',
  fontSize: 'var(--tds-typography-label-sm-font-size)',
  cursor: 'pointer',
};

const EMPTY: VisionFormValues = { vision: '', mission: '', coreValues: [] };

export default function VisionPage() {
  const toast = useToast();
  const { data, isFetching, error, refetch } = useDocumentQuery(visionKey, visionStore);
  const save = useSaveDocument(visionKey, visionStore);
  const saving = save.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<VisionFormValues>({
    resolver: zodResolver(visionSchema),
    defaultValues: EMPTY,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'coreValues' });

  const [serverError, setServerError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (data === undefined) return;
    reset({
      vision: data.vision,
      mission: data.mission,
      coreValues: data.coreValues.map((value) => ({ ...value })),
    });
  }, [data, reset]);

  const loading = isFetching && data === undefined;
  const disabled = saving || loading;
  const atMax = fields.length >= MAX_CORE_VALUES;
  const countError = (errors.coreValues as { message?: string } | undefined)?.message;

  const onValid = (values: VisionFormValues) => {
    setServerError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    save.mutate(
      { input: values, signal: controller.signal },
      {
        onSuccess: () => {
          reset(values);
          toast.success('비전·미션을 저장했습니다.');
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setServerError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  return (
    <DocumentFormShell
      cardTitle="비전·미션"
      description="별표(*) 항목은 필수입니다. 핵심가치는 필요한 만큼 추가하거나 삭제할 수 있습니다."
      loading={loading}
      loadFailed={error !== null}
      onRetry={() => void refetch()}
      serverError={serverError}
      saving={saving}
      dirty={isDirty}
      unsavedMessage={UNSAVED_MESSAGE}
      onSubmit={(event) => void handleSubmit(onValid)(event)}
    >
      <FormField htmlFor="vision-vision" label="비전" required error={errors.vision?.message}>
        <textarea
          id="vision-vision"
          className="tds-ui-input tds-ui-focusable"
          style={textareaStyle(errors.vision !== undefined)}
          rows={3}
          maxLength={VISION_MAX_LENGTH}
          placeholder="회사가 이루고자 하는 미래상을 입력하세요."
          disabled={disabled}
          aria-invalid={errors.vision !== undefined}
          {...register('vision')}
        />
      </FormField>

      <FormField htmlFor="vision-mission" label="미션" required error={errors.mission?.message}>
        <textarea
          id="vision-mission"
          className="tds-ui-input tds-ui-focusable"
          style={textareaStyle(errors.mission !== undefined)}
          rows={3}
          maxLength={MISSION_MAX_LENGTH}
          placeholder="비전을 이루기 위해 수행할 사명을 입력하세요."
          disabled={disabled}
          aria-invalid={errors.mission !== undefined}
          {...register('mission')}
        />
      </FormField>

      <div style={valuesListStyle}>
        <h3 style={sectionTitleStyle}>핵심가치</h3>

        {fields.length === 0 ? (
          <p style={hintStyle}>등록된 핵심가치가 없습니다. 아래 버튼으로 추가하세요.</p>
        ) : (
          fields.map((field, index) => (
            <div key={field.id} style={valueRowStyle}>
              <div style={valueHeaderStyle}>
                <span style={valueIndexStyle}>{`핵심가치 ${formatNumber(index + 1)}`}</span>
                <button
                  type="button"
                  className="tds-ui-focusable"
                  style={dangerGhostStyle}
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <TrashIcon />
                  삭제
                </button>
              </div>

              <FormField
                htmlFor={`value-title-${String(index)}`}
                label="제목"
                required
                error={errors.coreValues?.[index]?.title?.message}
              >
                <input
                  id={`value-title-${String(index)}`}
                  type="text"
                  className="tds-ui-input tds-ui-focusable"
                  style={controlStyle(errors.coreValues?.[index]?.title !== undefined)}
                  maxLength={VALUE_TITLE_MAX_LENGTH}
                  placeholder="예: 정직"
                  disabled={disabled}
                  aria-invalid={errors.coreValues?.[index]?.title !== undefined}
                  {...register(`coreValues.${index}.title`)}
                />
              </FormField>

              <FormField
                htmlFor={`value-desc-${String(index)}`}
                label="설명"
                error={errors.coreValues?.[index]?.description?.message}
              >
                <textarea
                  id={`value-desc-${String(index)}`}
                  className="tds-ui-input tds-ui-focusable"
                  style={textareaStyle(errors.coreValues?.[index]?.description !== undefined)}
                  rows={2}
                  maxLength={VALUE_DESC_MAX_LENGTH}
                  placeholder="핵심가치에 대한 설명(선택)"
                  disabled={disabled}
                  {...register(`coreValues.${index}.description`)}
                />
              </FormField>
            </div>
          ))
        )}

        {countError !== undefined && (
          <p role="alert" style={errorTextStyle}>
            {countError}
          </p>
        )}

        <div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={disabled || atMax}
            onClick={() => append({ title: '', description: '' })}
          >
            <PlusCircleIcon />
            핵심가치 추가
          </Button>
        </div>
      </div>
    </DocumentFormShell>
  );
}
