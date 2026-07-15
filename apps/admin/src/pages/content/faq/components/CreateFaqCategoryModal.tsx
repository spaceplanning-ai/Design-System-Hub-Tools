// FAQ 카테고리 등록 모달 (A41 소유)
//
// 껍데기(포커스 트랩·Esc·딤·포커스 복귀)는 공통 Modal 을 재사용한다. 여기서는 필드와 검증만.
// 회원 그룹 만들기(CreateGroupModal)와 같은 패턴 — 폼 제출은 검증까지, 실제 생성은
// intent="create" ConfirmDialog 로 한 번 확인한다(카테고리는 만들면 FAQ 가 붙는 실체다).
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useForm } from 'react-hook-form';

import { isAbort } from '../../../../shared/async';
import { zodResolver } from '../../../../shared/form/zodResolver';
import {
  Button,
  ConfirmDialog,
  controlStyle,
  errorTextStyle,
  fieldLabelStyle,
  fieldStyle,
  hintStyle,
  Modal,
} from '../../../../shared/ui';
import { useCreateFaqCategory } from '../queries';
import { faqCategorySchema } from '../validation';
import type { FaqCategoryFormValues } from '../validation';

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

interface CreateFaqCategoryModalProps {
  readonly onClose: () => void;
  readonly onCreated: (name: string) => void;
}

export function CreateFaqCategoryModal({ onClose, onCreated }: CreateFaqCategoryModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm<FaqCategoryFormValues>({
    resolver: zodResolver(faqCategorySchema),
    defaultValues: { name: '' },
  });

  const [serverError, setServerError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const create = useCreateFaqCategory();
  const saving = create.isPending;

  const nameRef = useRef<HTMLInputElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const onValid = (values: FaqCategoryFormValues) => {
    setServerError(null);
    setConfirming(values.name.trim());
  };

  const confirmCreate = () => {
    if (confirming === null) return;
    const trimmed = confirming;
    setServerError(null);

    const controller = new AbortController();
    controllerRef.current = controller;

    create.mutate(
      { input: { name: trimmed }, signal: controller.signal },
      {
        onSuccess: () => onCreated(trimmed),
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setConfirming(null);
          setServerError('카테고리를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  const cancelCreate = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    create.reset();
    setConfirming(null);
  };

  const nameField = register('name');
  const shownError = errors.name?.message ?? serverError;
  const invalid = shownError !== null && shownError !== undefined;

  return (
    <>
      <Modal
        title="FAQ 카테고리 등록"
        onClose={onClose}
        onSubmit={() => {
          setServerError(null);
          clearErrors();
          void handleSubmit(onValid, () => nameRef.current?.focus())();
        }}
        initialFocusRef={nameRef}
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={onClose}>
              취소
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? '만드는 중…' : '카테고리 만들기'}
            </Button>
          </>
        }
      >
        <div style={bodyStyle}>
          <div style={fieldStyle}>
            <label htmlFor="faq-category-name" style={fieldLabelStyle}>
              카테고리명
            </label>
            <input
              id="faq-category-name"
              type="text"
              className="tds-ui-input tds-ui-focusable"
              style={controlStyle(invalid)}
              placeholder="예: 결제"
              aria-invalid={invalid}
              disabled={saving}
              name={nameField.name}
              ref={(element) => {
                nameField.ref(element);
                nameRef.current = element;
              }}
              onChange={nameField.onChange}
              onBlur={nameField.onBlur}
            />
          </div>

          {invalid && (
            <p role="alert" style={errorTextStyle}>
              {shownError}
            </p>
          )}

          <p style={hintStyle}>
            카테고리를 만들면 FAQ 등록 화면의 분류 선택지에 추가됩니다. FAQ 는 카테고리별로 묶여
            사용자 화면에 노출됩니다.
          </p>
        </div>
      </Modal>

      {confirming !== null && (
        <ConfirmDialog
          intent="create"
          title="카테고리 만들기"
          message={`'${confirming}' 카테고리를 만듭니다.`}
          confirmLabel="카테고리 만들기"
          busy={saving}
          onConfirm={confirmCreate}
          onCancel={cancelCreate}
        />
      )}
    </>
  );
}
