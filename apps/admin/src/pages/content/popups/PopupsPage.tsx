// PopupsPage — 팝업 관리 (라우트: /content/popups) · A41 소유
//
// '목록 + 등록'이 한 화면에 있다 — '팝업 등록' 버튼이나 행의 수정 버튼을 누르면 인라인 폼이 뜬다.
// 상세 페이지는 없다(상세로 펼쳐 볼 내용이 없다 — 목록 행이 곧 요약이다).
//
// [실패는 조용히 삼키지 않는다] 조회 실패=인라인 배너, 저장/삭제 결과=토스트(삭제 실패는 다이얼로그 배너).
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { SegmentedControl } from '@tds/ui';

import { isAbort } from '../../../shared/async';
import { formatNumber } from '../../../shared/format';
import {
  Alert,
  Button,
  ConfirmDialog,
  hintStyle,
  Pagination,
  PlusCircleIcon,
  SearchField,
  useToast,
} from '../../../shared/ui';
import { PopupForm } from './components/PopupForm';
import { PopupsTable } from './components/PopupsTable';
import { useDeletePopup, usePopupsQuery } from './queries';
import { ENABLED_FILTERS, PAGE_SIZE } from './types';
import type { EnabledFilter, Popup } from './types';

const SEARCH_DEBOUNCE_MS = 250;

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-5)',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--tds-space-3)',
  flexWrap: 'wrap',
};

const toolbarLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
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

/** 폼 대상 — null(닫힘) · 'new'(신규) · Popup(수정) */
type FormTarget = Popup | 'new' | null;

export default function PopupsPage() {
  const toast = useToast();

  const [enabled, setEnabled] = useState<EnabledFilter>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<FormTarget>(null);

  const [pendingDelete, setPendingDelete] = useState<Popup | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);

  const deletePopup = useDeletePopup();
  const deleting = deletePopup.isPending;

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    setPage(1);
  }, [enabled, keyword]);

  const query = useMemo(() => ({ enabled, keyword, page }), [enabled, keyword, page]);
  const { data, isFetching: loading, error, refetch } = usePopupsQuery(query);

  const popups = useMemo(() => data?.popups ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (data === undefined) return;
    const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    if (page > pages) setPage(pages);
  }, [data, page]);

  const openDelete = (popup: Popup) => {
    setDeleteError(null);
    setPendingDelete(popup);
  };

  const closeDelete = () => {
    deleteControllerRef.current?.abort();
    deleteControllerRef.current = null;
    deletePopup.reset();
    setDeleteError(null);
    setPendingDelete(null);
  };

  const onConfirmDelete = () => {
    if (pendingDelete === null) return;
    const target = pendingDelete;
    const controller = new AbortController();
    deleteControllerRef.current = controller;
    setDeleteError(null);

    deletePopup.mutate(
      { id: target.id, signal: controller.signal },
      {
        onSuccess: () => {
          if (controller.signal.aborted) return;
          setPendingDelete(null);
          // 삭제한 팝업을 수정 중이었다면 폼도 닫는다
          setFormTarget((current) =>
            current !== null && current !== 'new' && current.id === target.id ? null : current,
          );
          toast.success('팝업을 삭제했습니다.');
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setDeleteError('팝업을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  return (
    <div style={pageStyle}>
      <div style={toolbarStyle}>
        <div style={toolbarLeftStyle}>
          <SearchField value={keywordInput} onChange={setKeywordInput} label="팝업 제목 검색" />
          <SegmentedControl
            value={enabled}
            options={ENABLED_FILTERS.map((filter) => ({ id: filter.id, label: filter.label }))}
            ariaLabel="팝업 상태 필터"
            onChange={(id) => setEnabled(id as EnabledFilter)}
          />
        </div>
        <Button variant="primary" onClick={() => setFormTarget('new')}>
          <PlusCircleIcon />
          팝업 등록
        </Button>
      </div>

      {formTarget !== null && (
        <PopupForm
          editing={formTarget === 'new' ? null : formTarget}
          onSaved={() => setFormTarget(null)}
          onCancel={() => setFormTarget(null)}
        />
      )}

      {error === null ? (
        <>
          <div style={summaryRowStyle}>
            <p style={hintStyle}>{loading ? '불러오는 중…' : `전체 ${formatNumber(total)}건`}</p>
          </div>

          <PopupsTable
            popups={popups}
            loading={loading}
            onEdit={(popup) => setFormTarget(popup)}
            onDelete={openDelete}
            deletingId={deleting ? (pendingDelete?.id ?? null) : null}
          />

          <Pagination page={page} totalPages={totalPages} onChange={setPage} label="팝업 페이지" />
        </>
      ) : (
        <Alert tone="danger">
          <div style={errorBodyStyle}>
            <span>팝업 목록을 불러오지 못했습니다.</span>
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

      {pendingDelete !== null && (
        <ConfirmDialog
          intent="delete"
          title="팝업 삭제"
          message={`'${pendingDelete.title}' 팝업을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="팝업 삭제"
          busy={deleting}
          error={deleteError}
          onConfirm={onConfirmDelete}
          onCancel={closeDelete}
        />
      )}
    </div>
  );
}
