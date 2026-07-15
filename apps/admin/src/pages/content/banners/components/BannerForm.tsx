// 배너 등록/수정 폼 (A41 소유)
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
  SelectField,
  useToast,
} from '../../../../shared/ui';
import { useCreateBanner, useUpdateBanner } from '../queries';
import { PLACEMENT_OPTIONS, TITLE_MAX_LENGTH } from '../types';
import type { Banner } from '../types';
import { bannerSchema } from '../validation';
import type { BannerFormValues } from '../validation';

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

function toValues(banner: Banner | null): BannerFormValues {
  if (banner === null) {
    return {
      title: '',
      imageUrl: '',
      linkUrl: '',
      placement: 'main',
      startAt: '',
      endAt: '',
      enabled: true,
      order: '1',
    };
  }
  return {
    title: banner.title,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    placement: banner.placement,
    startAt: banner.startAt,
    endAt: banner.endAt,
    enabled: banner.enabled,
    order: String(banner.order),
  };
}

interface BannerFormProps {
  readonly editing: Banner | null;
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}

export function BannerForm({ editing, onSaved, onCancel }: BannerFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: toValues(editing),
  });

  const create = useCreateBanner();
  const update = useUpdateBanner();
  const saving = create.isPending || update.isPending;

  const [serverError, setServerError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    reset(toValues(editing));
  }, [editing, reset]);

  const imageUrl = watch('imageUrl');
  const startAt = watch('startAt');
  const endAt = watch('endAt');
  const enabled = watch('enabled');

  const onValid = (values: BannerFormValues) => {
    setServerError(null);
    const controller = new AbortController();
    controllerRef.current = controller;

    const input = {
      title: values.title,
      imageUrl: values.imageUrl,
      linkUrl: values.linkUrl,
      placement: values.placement,
      startAt: values.startAt,
      endAt: values.endAt,
      enabled: values.enabled,
      order: Number(values.order.trim()),
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
            toast.success('배너를 저장했습니다.');
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
          toast.success('배너를 등록했습니다.');
          onSaved();
        },
        onError,
      },
    );
  };

  const periodError = errors.startAt?.message ?? errors.endAt?.message;

  return (
    <Card>
      <CardTitle>{editing !== null ? '배너 수정' : '배너 등록'}</CardTitle>

      <form onSubmit={(event) => void handleSubmit(onValid)(event)} noValidate style={formStyle}>
        {serverError !== null && <Alert tone="danger">{serverError}</Alert>}

        <div style={bodyStyle}>
          <FormField htmlFor="banner-title" label="제목" required error={errors.title?.message}>
            <input
              id="banner-title"
              type="text"
              className="tds-ui-input tds-ui-focusable"
              style={controlStyle(errors.title !== undefined)}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="예: 봄 시즌 기획전"
              disabled={saving}
              aria-invalid={errors.title !== undefined}
              aria-describedby={errors.title !== undefined ? errorIdOf('banner-title') : undefined}
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
            htmlFor="banner-link"
            label="링크 URL"
            error={errors.linkUrl?.message}
            hint="클릭 시 이동할 주소 (선택)"
          >
            <input
              id="banner-link"
              type="url"
              className="tds-ui-input tds-ui-focusable"
              style={controlStyle(errors.linkUrl !== undefined)}
              placeholder="https://example.com/promo"
              disabled={saving}
              aria-invalid={errors.linkUrl !== undefined}
              {...register('linkUrl')}
            />
          </FormField>

          <div style={rowStyle}>
            <FormField htmlFor="banner-placement" label="노출 위치" required>
              <SelectField id="banner-placement" disabled={saving} {...register('placement')}>
                {PLACEMENT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </FormField>

            <FormField
              htmlFor="banner-order"
              label="정렬 순서"
              required
              error={errors.order?.message}
              hint="작을수록 앞에 노출됩니다."
            >
              <input
                id="banner-order"
                type="number"
                min={0}
                className="tds-ui-input tds-ui-focusable"
                style={controlStyle(errors.order !== undefined)}
                disabled={saving}
                aria-invalid={errors.order !== undefined}
                {...register('order')}
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
              id="banner-enabled"
              type="checkbox"
              className="tds-ui-focusable"
              style={checkStyle}
              checked={enabled}
              disabled={saving}
              onChange={(event) => setValue('enabled', event.target.checked, { shouldDirty: true })}
            />
            <label htmlFor="banner-enabled" style={fieldLabelStyle}>
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
