// PrivacyPage — 개인정보 처리방침 (라우트: /content/privacy) · A41 소유
//
// [오너 피드백 ⑦] 문서 전문 dump 를 없애고 다른 목록(공지 등)과 같은 툴바 패턴으로 통일했다.
//   상단 툴바(검색 + '새 버전 등록') + 버전 이력 표(VersionHistoryTable 공통). 단일 문서라 종류 선택은 없다.
//   현재 시행본은 목록에서 '현재' 배지로 강조한다(전문은 행을 눌러 상세 페이지에서 본다).
//
// [실패는 조용히 삼키지 않는다] 조회 실패=인라인 배너, 삭제 결과=토스트(삭제 실패는 다이얼로그 배너).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { isAbort } from '../../../shared/async';
import { formatNumber } from '../../../shared/format';
import {
  Alert,
  Button,
  ConfirmDialog,
  PlusCircleIcon,
  SearchField,
  SelectionBar,
  useRowSelection,
  useToast,
  VersionHistoryTable,
} from '../../../shared/ui';
import type { VersionRow } from '../../../shared/ui';
import {
  useBulkDeletePrivacyVersions,
  useDeletePrivacyVersion,
  usePrivacyVersionsQuery,
} from './queries';
import { isCurrent, STATUS_LABEL, STATUS_TONE } from './types';
import type { PrivacyVersion } from './types';

const SEARCH_DEBOUNCE_MS = 250;

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-4)',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
};

const errorBodyStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
};

function toRow(version: PrivacyVersion): VersionRow {
  return {
    id: version.id,
    version: version.version,
    effectiveDate: version.effectiveDate,
    statusTone: STATUS_TONE[version.status],
    statusLabel: STATUS_LABEL[version.status],
    current: isCurrent(version),
  };
}

export default function PrivacyPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const { data: versions, isFetching: loading, error, refetch } = usePrivacyVersionsQuery();

  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const [pendingDelete, setPendingDelete] = useState<PrivacyVersion | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);

  const deleteVersion = useDeletePrivacyVersion();
  const deleting = deleteVersion.isPending;

  const { selectedIds, toggleOne, toggleAll, clear } = useRowSelection();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkControllerRef = useRef<AbortController | null>(null);
  const bulkDelete = useBulkDeletePrivacyVersions();
  const bulkDeleting = bulkDelete.isPending;

  useEffect(() => {
    clear();
  }, [keyword, clear]);

  const versionList = useMemo(() => versions ?? [], [versions]);
  const rows = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    const filtered =
      trimmed === ''
        ? versionList
        : versionList.filter((version) => version.version.toLowerCase().includes(trimmed));
    return filtered.map(toRow);
  }, [versionList, keyword]);

  const closeDelete = () => {
    deleteControllerRef.current?.abort();
    deleteControllerRef.current = null;
    deleteVersion.reset();
    setDeleteError(null);
    setPendingDelete(null);
  };

  const onConfirmDelete = () => {
    if (pendingDelete === null) return;
    const target = pendingDelete;
    const controller = new AbortController();
    deleteControllerRef.current = controller;
    setDeleteError(null);

    deleteVersion.mutate(
      { id: target.id, signal: controller.signal },
      {
        onSuccess: () => {
          if (controller.signal.aborted) return;
          setPendingDelete(null);
          toast.success(`${target.version} 버전을 삭제했습니다.`);
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setDeleteError('버전을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  const openDelete = (id: string) => {
    const version = versionList.find((item) => item.id === id);
    if (version === undefined) return;
    setDeleteError(null);
    setPendingDelete(version);
  };

  const selectedCount = selectedIds.size;

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
              `버전 ${formatNumber(ids.length)}건 중 ${formatNumber(failed)}건을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
            );
            return;
          }
          setBulkOpen(false);
          clear();
          toast.success(`버전 ${formatNumber(ids.length)}건을 삭제했습니다.`);
        },
      },
    );
  };

  if (error !== null) {
    return (
      <div style={pageStyle}>
        <Alert tone="danger">
          <div style={errorBodyStyle}>
            <span>개인정보 처리방침을 불러오지 못했습니다.</span>
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
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={toolbarStyle}>
        <SearchField value={keywordInput} onChange={setKeywordInput} label="처리방침 버전 검색" />
        <Button variant="primary" size="md" onClick={() => navigate('/content/privacy/new')}>
          <PlusCircleIcon />새 버전 등록
        </Button>
      </div>

      <SelectionBar count={selectedCount} onClear={clear}>
        <Button variant="danger" disabled={bulkDeleting} onClick={() => setBulkOpen(true)}>
          {`선택 ${formatNumber(selectedCount)}건 삭제`}
        </Button>
      </SelectionBar>

      <VersionHistoryTable
        versions={rows}
        caption="개인정보 처리방침 버전 이력 — 체크박스로 선택하고, 행을 누르면 전문을 봅니다. 수정/삭제 버튼으로 각 버전을 관리합니다."
        onEdit={(id) => navigate(`/content/privacy/${id}/edit`)}
        onDelete={openDelete}
        deletingId={deleting ? (pendingDelete?.id ?? null) : null}
        detailPathOf={(id) => `/content/privacy/${id}`}
        emptyMessage={loading ? '불러오는 중…' : '등록된 버전이 없습니다.'}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={(checked) =>
          toggleAll(
            rows.map((row) => row.id),
            checked,
          )
        }
      />

      {pendingDelete !== null && (
        <ConfirmDialog
          intent="delete"
          title="처리방침 버전 삭제"
          message={`${pendingDelete.version} 버전을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="버전 삭제"
          busy={deleting}
          error={deleteError}
          onConfirm={onConfirmDelete}
          onCancel={closeDelete}
        />
      )}

      {bulkOpen && (
        <ConfirmDialog
          intent="delete"
          title="처리방침 버전 일괄 삭제"
          message={`선택한 버전 ${formatNumber(selectedCount)}건을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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
