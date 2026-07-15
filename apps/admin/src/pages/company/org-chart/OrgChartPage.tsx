// OrgChartPage — 조직도 (라우트: /company/org-chart) · A41 소유
//
// 부서/구성원 계층을 '들여쓰기된 목록'으로 보여준다(트리 다이어그램 X). 추가/수정은 모달, 삭제는
// 확인 다이얼로그. 삭제는 하위 노드까지 함께 지우므로(cascade) 확인 문구가 그 사실을 알린다.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import { isAbort } from '../../../shared/async';
import { formatNumber } from '../../../shared/format';
import {
  Alert,
  Button,
  ConfirmDialog,
  hintStyle,
  PlusCircleIcon,
  SelectionBar,
  StatusBadge,
  useRowSelection,
  useToast,
} from '../../../shared/ui';
import { useCrudBulkDelete, useCrudDelete, useCrudListQuery } from '../_shared/crud';
import { CrudTable } from '../_shared/CrudTable';
import type { CrudColumn } from '../_shared/CrudTable';
import { orgAdapter } from './data-source';
import { OrgFormModal } from './OrgFormModal';
import { descendantIds, flattenTree, orgTypeLabel, orgTypeTone } from './types';
import type { OrgInput, OrgNode, OrgRow } from './types';

const RESOURCE = 'org-chart';
const ENTITY_LABEL = '조직 구성';

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
  minWidth: 0,
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
};

const summaryRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
};

const errorBodyStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
};

const nodeNameStyle: CSSProperties = {
  fontWeight: 'var(--tds-primitive-typography-font-weight-medium)',
};

const mutedStyle: CSSProperties = { color: 'var(--tds-color-text-muted)' };

type ModalState = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; node: OrgNode };

const nameOf = (row: OrgRow) => row.name;

export default function OrgChartPage() {
  const toast = useToast();
  const {
    data,
    isFetching: loading,
    error,
    refetch,
  } = useCrudListQuery<OrgNode, OrgInput>(RESOURCE, orgAdapter);
  const nodes = useMemo(() => data ?? [], [data]);
  const rows = useMemo(() => flattenTree(nodes), [nodes]);

  const { selectedIds, toggleOne, toggleAll, clear } = useRowSelection();
  const selectedCount = selectedIds.size;

  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  const [pendingDelete, setPendingDelete] = useState<OrgNode | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);
  const deleteNode = useCrudDelete<OrgNode, OrgInput>(RESOURCE, orgAdapter);
  const deleting = deleteNode.isPending;

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkControllerRef = useRef<AbortController | null>(null);
  const bulkDelete = useCrudBulkDelete<OrgNode, OrgInput>(RESOURCE, orgAdapter);
  const bulkDeleting = bulkDelete.isPending;

  // 목록이 바뀌면(삭제 등) 사라진 행의 선택이 남지 않게 정리한다
  useEffect(() => {
    clear();
  }, [nodes, clear]);

  const pendingDescendants =
    pendingDelete === null ? 0 : descendantIds(nodes, pendingDelete.id).length;

  const closeDelete = () => {
    deleteControllerRef.current?.abort();
    deleteControllerRef.current = null;
    deleteNode.reset();
    setDeleteError(null);
    setPendingDelete(null);
  };

  const onConfirmDelete = () => {
    if (pendingDelete === null) return;
    const target = pendingDelete;
    const controller = new AbortController();
    deleteControllerRef.current = controller;
    setDeleteError(null);

    deleteNode.mutate(
      { id: target.id, signal: controller.signal },
      {
        onSuccess: () => {
          if (controller.signal.aborted) return;
          setPendingDelete(null);
          toast.success(`'${target.name}' 을(를) 삭제했습니다.`);
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setDeleteError('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  const closeBulk = () => {
    bulkControllerRef.current?.abort();
    bulkControllerRef.current = null;
    bulkDelete.reset();
    setBulkError(null);
    setBulkOpen(false);
  };

  const onConfirmBulkDelete = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const controller = new AbortController();
    bulkControllerRef.current = controller;
    setBulkError(null);

    bulkDelete.mutate(
      { ids, signal: controller.signal },
      {
        onSuccess: (failed) => {
          if (controller.signal.aborted) return;
          if (failed > 0) {
            setBulkError(
              `${formatNumber(ids.length)}건 중 ${formatNumber(failed)}건을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
            );
            return;
          }
          setBulkOpen(false);
          clear();
          toast.success(`선택한 조직 구성 ${formatNumber(ids.length)}건을 삭제했습니다.`);
        },
      },
    );
  };

  const onSaved = (name: string, isEdit: boolean) => {
    setModal({ kind: 'closed' });
    toast.success(isEdit ? `'${name}' 을(를) 저장했습니다.` : `'${name}' 을(를) 추가했습니다.`);
  };

  const columns: readonly CrudColumn<OrgRow>[] = [
    {
      header: '구성',
      render: (row) => (
        <span
          style={{
            paddingLeft: `calc(var(--tds-space-4) * ${String(row.depth)})`,
            ...nodeNameStyle,
          }}
        >
          {row.name}
        </span>
      ),
    },
    {
      header: '구분',
      nowrap: true,
      render: (row) => <StatusBadge tone={orgTypeTone(row.type)} label={orgTypeLabel(row.type)} />,
    },
    {
      header: '직책',
      nowrap: true,
      render: (row) =>
        row.type === 'member' && row.title.trim() !== '' ? (
          row.title
        ) : (
          <span style={mutedStyle}>—</span>
        ),
    },
  ];

  const deleteMessage =
    pendingDelete === null
      ? ''
      : pendingDescendants > 0
        ? `'${pendingDelete.name}' 과(와) 하위 ${formatNumber(pendingDescendants)}개 항목을 함께 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
        : `'${pendingDelete.name}' 을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다.`;

  return (
    <div style={pageStyle}>
      <div style={toolbarStyle}>
        <p style={hintStyle}>부서와 구성원을 계층으로 관리합니다. 상위부서를 지정해 배치하세요.</p>
        <Button variant="primary" size="md" onClick={() => setModal({ kind: 'create' })}>
          <PlusCircleIcon />
          조직 구성 추가
        </Button>
      </div>

      {error === null ? (
        <>
          <div style={summaryRowStyle}>
            <p style={hintStyle}>
              {loading ? '불러오는 중…' : `전체 ${formatNumber(rows.length)}건`}
              {selectedCount > 0 && ` · ${formatNumber(selectedCount)}건 선택됨`}
            </p>
          </div>

          <SelectionBar count={selectedCount} onClear={clear}>
            <Button variant="danger" disabled={bulkDeleting} onClick={() => setBulkOpen(true)}>
              {`선택 ${formatNumber(selectedCount)}건 삭제`}
            </Button>
          </SelectionBar>

          <CrudTable
            items={rows}
            loading={loading}
            entityLabel={ENTITY_LABEL}
            columns={columns}
            nameOf={nameOf}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onToggleAll={(checked) =>
              toggleAll(
                rows.map((row) => row.id),
                checked,
              )
            }
            onEdit={(row) => setModal({ kind: 'edit', node: row })}
            onDelete={(row) => {
              setDeleteError(null);
              setPendingDelete(row);
            }}
            deletingId={deleting ? (pendingDelete?.id ?? null) : null}
            selectAllLabelId="org-select-all"
            emptyLabel="등록된 조직 구성이 없습니다."
          />
        </>
      ) : (
        <Alert tone="danger">
          <div style={errorBodyStyle}>
            <span>조직도를 불러오지 못했습니다.</span>
            <Button
              variant="secondary"
              onClick={() => {
                void refetch();
              }}
            >
              다시 시도
            </Button>
          </div>
        </Alert>
      )}

      {modal.kind !== 'closed' && (
        <OrgFormModal
          nodes={nodes}
          editing={modal.kind === 'edit' ? modal.node : null}
          onClose={() => setModal({ kind: 'closed' })}
          onSaved={onSaved}
        />
      )}

      {pendingDelete !== null && (
        <ConfirmDialog
          intent="delete"
          title="조직 구성 삭제"
          message={deleteMessage}
          confirmLabel="삭제"
          busy={deleting}
          error={deleteError}
          onConfirm={onConfirmDelete}
          onCancel={closeDelete}
        />
      )}

      {bulkOpen && (
        <ConfirmDialog
          intent="delete"
          title="조직 구성 일괄 삭제"
          message={`선택한 조직 구성 ${formatNumber(selectedCount)}건과 그 하위 항목을 함께 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel={`${formatNumber(selectedCount)}건 삭제`}
          busy={bulkDeleting}
          error={bulkError}
          onConfirm={onConfirmBulkDelete}
          onCancel={closeBulk}
        />
      )}
    </div>
  );
}
