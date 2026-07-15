// 조직 노드 등록/수정 모달 (A41 소유 — apps/admin/src/pages/company/org-chart/**)
//
// 껍데기(포커스 트랩·Esc·딤·포커스 복귀)는 공통 Modal 을 재사용한다. 하나의 모달이 등록/수정을
// 겸한다. 상위부서 select 는 부서만, 그리고 자기 자신·후손은 제외한다(순환 방지 — departmentCandidates).
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useForm } from 'react-hook-form';

import { isAbort } from '../../../shared/async';
import { zodResolver } from '../../../shared/form/zodResolver';
import {
  Alert,
  Button,
  controlStyle,
  errorIdOf,
  FormField,
  Modal,
  SelectField,
} from '../../../shared/ui';
import { useCrudCreate, useCrudUpdate } from '../_shared/crud';
import { orgAdapter } from './data-source';
import { departmentCandidates, NAME_MAX_LENGTH, ORG_TYPE_OPTIONS, TITLE_MAX_LENGTH } from './types';
import type { OrgInput, OrgNode, OrgNodeType } from './types';
import { orgSchema } from './validation';
import type { OrgFormValues } from './validation';

const RESOURCE = 'org-chart';

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

interface OrgFormModalProps {
  readonly nodes: readonly OrgNode[];
  readonly editing: OrgNode | null;
  readonly onClose: () => void;
  readonly onSaved: (name: string, isEdit: boolean) => void;
}

export function OrgFormModal({ nodes, editing, onClose, onSaved }: OrgFormModalProps) {
  const isEdit = editing !== null;

  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: editing?.name ?? '',
      type: editing?.type ?? 'department',
      parentId: editing?.parentId ?? '',
      title: editing?.title ?? '',
    },
  });

  const create = useCrudCreate<OrgNode, OrgInput>(RESOURCE, orgAdapter);
  const update = useCrudUpdate<OrgNode, OrgInput>(RESOURCE, orgAdapter);
  const saving = create.isPending || update.isPending;

  const [serverError, setServerError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const type = watch('type') as OrgNodeType;
  const isMember = type === 'member';
  const parents = departmentCandidates(nodes, editing?.id);

  const onValid = (values: OrgFormValues) => {
    setServerError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    const input: OrgInput = {
      name: values.name.trim(),
      type: values.type as OrgNodeType,
      parentId: values.parentId,
      // 부서에는 직책이 없다 — 구성원일 때만 싣는다
      title: values.type === 'member' ? values.title.trim() : '',
    };

    const onError = (cause: unknown) => {
      if (isAbort(cause)) return;
      setServerError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    };

    if (isEdit && editing !== null) {
      update.mutate(
        { id: editing.id, input, signal: controller.signal },
        { onSuccess: () => onSaved(values.name.trim(), true), onError },
      );
      return;
    }
    create.mutate(
      { input, signal: controller.signal },
      { onSuccess: () => onSaved(values.name.trim(), false), onError },
    );
  };

  const nameField = register('name');
  const nameInvalid = errors.name !== undefined;

  return (
    <Modal
      title={isEdit ? '조직 구성 수정' : '조직 구성 추가'}
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

        <FormField htmlFor="org-type" label="구분" required error={errors.type?.message}>
          <SelectField
            id="org-type"
            invalid={errors.type !== undefined}
            disabled={saving}
            aria-invalid={errors.type !== undefined}
            {...register('type')}
          >
            {ORG_TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </FormField>

        <FormField htmlFor="org-name" label="이름" required error={errors.name?.message}>
          <input
            id="org-name"
            type="text"
            className="tds-ui-input tds-ui-focusable"
            style={controlStyle(nameInvalid)}
            maxLength={NAME_MAX_LENGTH}
            placeholder={isMember ? '예: 홍길동' : '예: 경영지원본부'}
            disabled={saving}
            aria-invalid={nameInvalid}
            aria-describedby={nameInvalid ? errorIdOf('org-name') : undefined}
            name={nameField.name}
            ref={(element) => {
              nameField.ref(element);
              nameRef.current = element;
            }}
            onChange={nameField.onChange}
            onBlur={nameField.onBlur}
          />
        </FormField>

        <FormField
          htmlFor="org-parent"
          label="상위부서"
          error={errors.parentId?.message}
          hint="비우면 최상위로 배치됩니다."
        >
          <SelectField id="org-parent" disabled={saving} {...register('parentId')}>
            <option value="">최상위(없음)</option>
            {parents.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </SelectField>
        </FormField>

        {isMember && (
          <FormField
            htmlFor="org-title"
            label="직책"
            error={errors.title?.message}
            hint="구성원의 직책 (선택)"
          >
            <input
              id="org-title"
              type="text"
              className="tds-ui-input tds-ui-focusable"
              style={controlStyle(errors.title !== undefined)}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="예: 팀장"
              disabled={saving}
              aria-invalid={errors.title !== undefined}
              {...register('title')}
            />
          </FormField>
        )}
      </div>
    </Modal>
  );
}
