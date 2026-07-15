// 상품 카테고리 등록/수정 모달 (A41 소유 — apps/admin/src/pages/products/**)
//
// 껍데기(포커스 트랩·Esc·딤·포커스 복귀)는 공통 Modal 을 재사용한다. 하나의 모달이 등록과 수정을
// 겸한다(editing 유무로 갈린다). 쓰기 배선은 승격된 CRUD 프레임워크의 저수준 훅(useCrudCreate/Update)이다.
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useForm } from 'react-hook-form';

import { isAbort } from '../../../../shared/async';
import { zodResolver } from '../../../../shared/form/zodResolver';
import { useCrudCreate, useCrudUpdate } from '../../../../shared/crud';
import { Alert, Button, controlStyle, errorIdOf, FormField, Modal } from '../../../../shared/ui';
import { CATEGORY_RESOURCE, productCategoryAdapter } from '../data-source';
import { CATEGORY_NAME_MAX } from '../types';
import type { ProductCategoryUsage } from '../../_shared/store';
import { productCategorySchema } from '../validation';
import type { ProductCategoryFormValues } from '../validation';

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

interface ProductCategoryFormModalProps {
  /** 수정 대상 — null 이면 등록 */
  readonly editing: ProductCategoryUsage | null;
  readonly onClose: () => void;
  readonly onSaved: (name: string, isEdit: boolean) => void;
}

export function ProductCategoryFormModal({
  editing,
  onClose,
  onSaved,
}: ProductCategoryFormModalProps) {
  const isEdit = editing !== null;

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: { name: editing?.label ?? '' },
  });

  const create = useCrudCreate(CATEGORY_RESOURCE, productCategoryAdapter);
  const update = useCrudUpdate(CATEGORY_RESOURCE, productCategoryAdapter);
  const saving = create.isPending || update.isPending;

  const [serverError, setServerError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const onValid = (values: ProductCategoryFormValues) => {
    setServerError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    const name = values.name.trim();

    const onError = (cause: unknown) => {
      if (isAbort(cause)) return;
      setServerError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    };

    if (isEdit && editing !== null) {
      update.mutate(
        { id: editing.id, input: { name }, signal: controller.signal },
        { onSuccess: () => onSaved(name, true), onError },
      );
      return;
    }

    create.mutate(
      { input: { name }, signal: controller.signal },
      { onSuccess: () => onSaved(name, false), onError },
    );
  };

  const nameField = register('name');
  const invalid = errors.name !== undefined;

  return (
    <Modal
      title={isEdit ? '카테고리 수정' : '카테고리 추가'}
      onClose={onClose}
      onSubmit={() => {
        setServerError(null);
        clearErrors();
        void handleSubmit(onValid, () => nameRef.current?.focus())();
      }}
      initialFocusRef={nameRef}
      footer={
        <>
          <Button variant="secondary" size="md" disabled={saving} onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={saving}>
            {saving ? '저장 중…' : isEdit ? '저장' : '추가'}
          </Button>
        </>
      }
    >
      <div style={bodyStyle}>
        {serverError !== null && <Alert tone="danger">{serverError}</Alert>}

        <FormField
          htmlFor="product-category-name"
          label="카테고리 이름"
          required
          error={errors.name?.message}
        >
          <input
            id="product-category-name"
            type="text"
            className="tds-ui-input tds-ui-focusable"
            style={controlStyle(invalid)}
            maxLength={CATEGORY_NAME_MAX}
            placeholder="예: 아우터"
            disabled={saving}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorIdOf('product-category-name') : undefined}
            name={nameField.name}
            ref={(element) => {
              nameField.ref(element);
              nameRef.current = element;
            }}
            onChange={nameField.onChange}
            onBlur={nameField.onBlur}
          />
        </FormField>
      </div>
    </Modal>
  );
}
