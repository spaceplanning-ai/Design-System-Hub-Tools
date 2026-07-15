// NoticesPage — 공지사항 목록 (라우트: /content/notices) · A41 소유
//
// 좌: 분류 + 상태 필터 / 우: 검색 + 등록 + 표 + 페이지네이션.
// 배치·스타일·패턴은 회원 관리(MembersPage)를 그대로 따른다 — 콘텐츠 목록의 정본이 된다.
//
// [실패는 조용히 삼키지 않는다 — shared/ui/README.md]
//   - 목록 조회 실패 → 인라인 배너(다시 시도). 화면이 비어 있고 할 일이 '다시 시도'뿐이라 사라지면 안 된다.
//   - 삭제(방금 시작한 쓰기)의 성공/실패 → 토스트. 삭제 실패는 다이얼로그 안 배너 + 재클릭 = 재시도.
//
// [데이터] 화면은 data-source.ts 하고만 대화한다. 백엔드가 붙어도 이 파일은 바뀌지 않는다.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

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
  SelectionBar,
  useRowSelection,
  useToast,
} from '../../../shared/ui';
import { NoticeFilters } from './components/NoticeFilters';
import { NoticesTable } from './components/NoticesTable';
import { useBulkDeleteNotices, useDeleteNotice, useNoticesQuery } from './queries';
import { PAGE_SIZE } from './types';
import type { CategoryFilter, NoticeSummary, StatusFilter } from './types';

const SEARCH_DEBOUNCE_MS = 250;

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tds-space-5)',
};

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'calc(var(--tds-space-6) * 9) minmax(0, 1fr)',
  gap: 'var(--tds-space-6)',
  alignItems: 'start',
};

const mainColumnStyle: CSSProperties = {
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

export default function NoticesPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const [pendingDelete, setPendingDelete] = useState<NoticeSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);

  const deleteNotice = useDeleteNotice();
  const deleting = deleteNotice.isPending;

  // 선택 + 일괄 삭제
  const { selectedIds, toggleOne, toggleAll, clear } = useRowSelection();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkControllerRef = useRef<AbortController | null>(null);
  const bulkDelete = useBulkDeleteNotices();
  const bulkDeleting = bulkDelete.isPending;

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // 조건이 바뀌면 1페이지부터 — 뒤 페이지를 보다 검색하면 빈 화면이 뜨는 걸 막는다
  useEffect(() => {
    setPage(1);
  }, [category, status, keyword]);

  // 페이지/필터가 바뀌면 선택은 무의미해진다 (보이지 않는 행이 선택된 채 남지 않게)
  useEffect(() => {
    clear();
  }, [category, status, keyword, page, clear]);

  const query = useMemo(
    () => ({ category, status, keyword, page }),
    [category, status, keyword, page],
  );
  const { data, isFetching: loading, error, refetch } = useNoticesQuery(query);

  const notices = useMemo(() => data?.notices ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 다른 관리자가 지워 총 페이지가 줄면 현재 페이지를 마지막으로 보정한다
  useEffect(() => {
    if (data === undefined) return;
    const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    if (page > pages) setPage(pages);
  }, [data, page]);

  const openDelete = (notice: NoticeSummary) => {
    setDeleteError(null);
    setPendingDelete(notice);
  };

  const closeDelete = () => {
    deleteControllerRef.current?.abort();
    deleteControllerRef.current = null;
    deleteNotice.reset();
    setDeleteError(null);
    setPendingDelete(null);
  };

  const onConfirmDelete = () => {
    if (pendingDelete === null) return;
    const target = pendingDelete;

    const controller = new AbortController();
    deleteControllerRef.current = controller;
    setDeleteError(null);

    deleteNotice.mutate(
      { id: target.id, signal: controller.signal },
      {
        onSuccess: () => {
          if (controller.signal.aborted) return;
          setPendingDelete(null);
          toast.success(`'${target.title}' 공지를 삭제했습니다.`);
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setDeleteError('공지를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
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
              `공지 ${formatNumber(ids.length)}건 중 ${formatNumber(failed)}건을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.`,
            );
            return;
          }
          setBulkOpen(false);
          clear();
          toast.success(`공지 ${formatNumber(ids.length)}건을 삭제했습니다.`);
        },
      },
    );
  };

  return (
    <div style={pageStyle}>
      <div style={layoutStyle}>
        <NoticeFilters
          category={category}
          status={status}
          categoryCounts={data?.categoryCounts ?? null}
          statusCounts={data?.statusCounts ?? null}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
        />

        <div style={mainColumnStyle}>
          <div style={toolbarStyle}>
            <SearchField value={keywordInput} onChange={setKeywordInput} label="공지 제목 검색" />
            <Button variant="primary" size="md" onClick={() => navigate('/content/notices/new')}>
              <PlusCircleIcon />
              공지 등록
            </Button>
          </div>

          {error === null ? (
            <>
              <div style={summaryRowStyle}>
                <p style={hintStyle}>
                  {loading ? '불러오는 중…' : `전체 ${formatNumber(total)}건`}
                  {selectedCount > 0 && ` · ${formatNumber(selectedCount)}건 선택됨`}
                </p>
              </div>

              <SelectionBar count={selectedCount} onClear={clear}>
                <Button variant="danger" disabled={bulkDeleting} onClick={() => setBulkOpen(true)}>
                  {`선택 ${formatNumber(selectedCount)}건 삭제`}
                </Button>
              </SelectionBar>

              <NoticesTable
                notices={notices}
                loading={loading}
                onDelete={openDelete}
                deletingId={deleting ? (pendingDelete?.id ?? null) : null}
                selectedIds={selectedIds}
                onToggleOne={toggleOne}
                onToggleAll={(checked) =>
                  toggleAll(
                    notices.map((notice) => notice.id),
                    checked,
                  )
                }
                startIndex={(page - 1) * PAGE_SIZE}
              />

              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                label="공지사항 페이지"
              />
            </>
          ) : (
            <Alert tone="danger">
              <div style={errorBodyStyle}>
                <span>공지사항을 불러오지 못했습니다.</span>
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
        </div>
      </div>

      {pendingDelete !== null && (
        <ConfirmDialog
          intent="delete"
          title="공지 삭제"
          message={`'${pendingDelete.title}' 공지를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="공지 삭제"
          busy={deleting}
          error={deleteError}
          onConfirm={onConfirmDelete}
          onCancel={closeDelete}
        />
      )}

      {bulkOpen && (
        <ConfirmDialog
          intent="delete"
          title="공지 일괄 삭제"
          message={`선택한 공지 ${formatNumber(selectedCount)}건을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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
