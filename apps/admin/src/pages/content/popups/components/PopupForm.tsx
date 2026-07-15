// 팝업 등록/수정 폼 (A41 소유)
//
// 목록과 같은 화면에 뜨는 인라인 폼(목록+등록). 폼 = RHF + zod/mini.
// 제어형 공통 컨트롤(ImageUrlField·DateRangeField·ON/OFF 체크박스)은 watch + setValue 로 RHF 에 문다.
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useForm } from 'react-hook-form';

import { isAbort } from '../../../../shared/async';
import { zodResolver } from '../../../../shared/form/zodResolver';
import {
  Alert,
  Button,
  Card,
  CardTitle,
  controlStyle,
  DateRangeField,
  errorIdOf,
  fieldLabelStyle,
  FormField,
  ImageUrlField,
  useToast,
} from '../../../../shared/ui';
import { useCreatePopup, useUpdatePopup } from '../queries';
import { POSITION_OPTIONS, TITLE_MAX_LENGTH } from '../types';
import type { Popup } from '../types';
import { popupSchema } from '../validation';
import type { PopupFormValues } from '../validation';

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(calc(var(--tds-space-6) * 8), 1fr))',
  gap: 'var(--tds-space-4)',
};

const checkboxRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
};

const checkStyle: CSSProperties = {
  width: 'var(--tds-space-4)',
  height: 'var(--tds-space-4)',
  accentColor: 'var(--tds-color-action-primary-default)',
  cursor: 'pointer',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--tds-space-2)',
};

function toValues(popup: Popup | null): PopupFormValues {
  if (popup === null) {
    return {
      title: '',
      imageUrl: '',
      linkUrl: '',
      position: 'home',
      startAt: '',
      endAt: '',
      enabled: true,
      priority: '1',
    };
  }
  return {
    title: popup.title,
    imageUrl: popup.imageUrl,
    linkUrl: popup.linkUrl,
    position: popup.position,
    startAt: popup.startAt,
    endAt: popup.endAt,
    enabled: popup.enabled,
    priority: String(popup.priority),
  };
}

interface PopupFormProps {
  /** 편집 대상 — null 이면 신규 등록 */
  readonly editing: Popup | null;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}

export function PopupForm({ editing, onSaved, onCancel }: PopupFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PopupFormValues>({
    resolver: zodResolver(popupSchema),
    defaultValues: toValues(editing),
  });

  const create = useCreatePopup();
  const update = useUpdatePopup();
  const saving = create.isPending || update.isPending;

  const [serverError, setServerError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  // 편집 대상이 바뀌면 폼을 그 값으로 리셋한다
  useEffect(() => {
    reset(toValues(editing));
  }, [editing, reset]);

  const imageUrl = watch('imageUrl');
  const startAt = watch('startAt');
  const endAt = watch('endAt');
  const enabled = watch('enabled');

  const onValid = (values: PopupFormValues) => {
    setServerError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    const input = {
      title: values.title,
      imageUrl: values.imageUrl,
      linkUrl: values.linkUrl,
      position: values.position,
      startAt: values.startAt,
      endAt: values.endAt,
      enabled: values.enabled,
      priority: Number(values.priority.trim()),
    };

    const onError = (cause: unknown) => {
      if (isAbort(cause)) return;
      setServerError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    };

    if (editing !== null) {
      update.mutate(
        { id: editing.id, input, signal: controller.signal },
        {
          onSuccess: () => {
            toast.success('팝업을 저장했습니다.');
            onSaved();
          },
          onError,
        },
      );
      return;
    }

    create.mutate(
      { input, signal: controller.signal },
      {
        onSuccess: () => {
          toast.success('팝업을 등록했습니다.');
          onSaved();
        },
        onError,
      },
    );
  };

  const periodError = errors.startAt?.message ?? errors.endAt?.message;

  return (
    <Card>
      <CardTitle>{editing !== null ? '팝업 수정' : '팝업 등록'}</CardTitle>

      <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate style={formStyle}>
        {serverError !== null && <Alert tone="danger">{serverError}</Alert>}

        <div style={bodyStyle}>
          <FormField htmlFor="popup-title" label="제목" required error={errors.title?.message}>
            <input
              id="popup-title"
              type="text"
              className="tds-ui-input tds-ui-focusable"
              style={controlStyle(errors.title !== undefined)}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="예: 신규 가입 혜택"
              disabled={saving}
              aria-invalid={errors.title !== undefined}
              aria-describedby={errors.title !== undefined ? errorIdOf('popup-title') : undefined}
              {...register('title')}
            />
          </FormField>

          <ImageUrlField
            label="이미지 URL"
            required
            value={imageUrl}
            onChange={(value) =>
              setValue('imageUrl', value, { shouldValidate: false, shouldDirty: true })
            }
            disabled={saving}
            error={errors.imageUrl?.message}
            hint="업로드 대신 호스팅된 이미지 URL 을 입력합니다."
          />

          <FormField
            htmlFor="popup-link"
            label="링크 URL"
            error={errors.linkUrl?.message}
            hint="클릭 시 이동할 주소 (선택)"
          >
            <input
              id="popup-link"
              type="url"
              className="tds-ui-input tds-ui-focusable"
              style={controlStyle(errors.linkUrl !== undefined)}
              placeholder="https://example.com/event"
              disabled={saving}
              aria-invalid={errors.linkUrl !== undefined}
              {...register('linkUrl')}
            />
          </FormField>

          <div style={rowStyle}>
            <FormField htmlFor="popup-position" label="노출 위치" required>
              <select
                id="popup-position"
                className="tds-ui-focusable"
                style={controlStyle(false)}
                disabled={saving}
                {...register('position')}
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              htmlFor="popup-priority"
              label="우선순위"
              required
              error={errors.priority?.message}
              hint="작을수록 먼저 노출됩니다."
            >
              <input
                id="popup-priority"
                type="number"
                min={0}
                className="tds-ui-input tds-ui-focusable"
                style={controlStyle(errors.priority !== undefined)}
                disabled={saving}
                aria-invalid={errors.priority !== undefined}
                {...register('priority')}
              />
            </FormField>
          </div>

          <DateRangeField
            label="노출 기간"
            required
            startValue={startAt}
            endValue={endAt}
            onStartChange={(value) => setValue('startAt', value, { shouldDirty: true })}
            onEndChange={(value) => setValue('endAt', value, { shouldDirty: true })}
            disabled={saving}
            error={periodError}
          />

          <div style={checkboxRowStyle}>
            <input
              id="popup-enabled"
              type="checkbox"
              className="tds-ui-focusable"
              style={checkStyle}
              checked={enabled}
              disabled={saving}
              onChange={(event) => setValue('enabled', event.target.checked, { shouldDirty: true })}
            />
            <label htmlFor="popup-enabled" style={fieldLabelStyle}>
              노출 ON
            </label>
          </div>
        </div>

        <div style={actionsStyle}>
          <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? '저장 중…' : editing !== null ? '저장' : '등록'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
