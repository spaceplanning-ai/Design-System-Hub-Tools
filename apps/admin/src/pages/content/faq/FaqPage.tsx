// FaqPage — FAQ 목록 (라우트: /content/faq) · A41 소유
//
// 좌: 카테고리 + 노출 여부 필터 / 우: 검색 + 카테고리 등록(모달) + FAQ 등록 + 표 + 페이지네이션.
// 배치·패턴은 회원 관리(MembersPage)/공지사항을 따른다.
//
// [카테고리 등록은 모달] members 의 CreateGroupModal 패턴 — 목록에서 모달을 열어 만든다.
// [실패는 조용히 삼키지 않는다] 조회 실패=인라인 배너, 삭제 결과=토스트(실패는 다이얼로그 배너).
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
  useToast,
} from '../../../shared/ui';
import { CreateFaqCategoryModal } from './components/CreateFaqCategoryModal';
import { FaqFilters } from './components/FaqFilters';
import { FaqTable } from './components/FaqTable';
import { useDeleteFaq, useFaqCategoriesQuery, useFaqsQuery } from './queries';
import { CATEGORY_ALL, PAGE_SIZE } from './types';
import type { FaqSummary, VisibilityFilter } from './types';

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

const toolbarActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--tds-space-2)',
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

export default function FaqPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState<string>(CATEGORY_ALL);
  const [visibility, setVisibility] = useState<VisibilityFilter>('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<FaqSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteControllerRef = useRef<AbortController | null>(null);

  const deleteFaq = useDeleteFaq();
  const deleting = deleteFaq.isPending;

  const { data: categories } = useFaqCategoriesQuery();

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, visibility, keyword]);

  const query = useMemo(
    () => ({ categoryId, visibility, keyword, page }),
    [categoryId, visibility, keyword, page],
  );
  const { data, isFetching: loading, error, refetch } = useFaqsQuery(query);

  const faqs = useMemo(() => data?.faqs ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (data === undefined) return;
    const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    if (page > pages) setPage(pages);
  }, [data, page]);

  const openDelete = (faq: FaqSummary) => {
    setDeleteError(null);
    setPendingDelete(faq);
  };

  const closeDelete = () => {
    deleteControllerRef.current?.abort();
    deleteControllerRef.current = null;
    deleteFaq.reset();
    setDeleteError(null);
    setPendingDelete(null);
  };

  const onConfirmDelete = () => {
    if (pendingDelete === null) return;
    const target = pendingDelete;

    const controller = new AbortController();
    deleteControllerRef.current = controller;
    setDeleteError(null);

    deleteFaq.mutate(
      { id: target.id, signal: controller.signal },
      {
        onSuccess: () => {
          if (controller.signal.aborted) return;
          setPendingDelete(null);
          toast.success('FAQ 를 삭제했습니다.');
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          setDeleteError('FAQ 를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        },
      },
    );
  };

  return (
    <div style={pageStyle}>
      <div style={layoutStyle}>
        <FaqFilters
          categoryId={categoryId}
          visibility={visibility}
          categories={categories ?? []}
          categoryCounts={data?.categoryCounts ?? null}
          visibilityCounts={data?.visibilityCounts ?? null}
          onCategoryChange={setCategoryId}
          onVisibilityChange={setVisibility}
        />

        <div style={mainColumnStyle}>
          <div style={toolbarStyle}>
            <SearchField value={keywordInput} onChange={setKeywordInput} label="FAQ 질문 검색" />
            <div style={toolbarActionsStyle}>
              <Button variant="secondary" onClick={() => setCreatingCategory(true)}>
                카테고리 등록
              </Button>
              <Button variant="primary" onClick={() => navigate('/content/faq/new')}>
                <PlusCircleIcon />
                FAQ 등록
              </Button>
            </div>
          </div>

          {error === null ? (
            <>
              <div style={summaryRowStyle}>
                <p style={hintStyle}>
                  {loading ? '불러오는 중…' : `전체 ${formatNumber(total)}건`}
                </p>
              </div>

              <FaqTable
                faqs={faqs}
                loading={loading}
                onDelete={openDelete}
                deletingId={deleting ? (pendingDelete?.id ?? null) : null}
              />

              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                label="FAQ 페이지"
              />
            </>
          ) : (
            <Alert tone="danger">
              <div style={errorBodyStyle}>
                <span>FAQ 를 불러오지 못했습니다.</span>
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

      {creatingCategory && (
        <CreateFaqCategoryModal
          onClose={() => setCreatingCategory(false)}
          onCreated={(name) => {
            setCreatingCategory(false);
            toast.success(`'${name}' 카테고리를 만들었습니다.`);
          }}
        />
      )}

      {pendingDelete !== null && (
        <ConfirmDialog
          intent="delete"
          title="FAQ 삭제"
          message={`'${pendingDelete.question}' FAQ 를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="FAQ 삭제"
          busy={deleting}
          error={deleteError}
          onConfirm={onConfirmDelete}
          onCancel={closeDelete}
        />
      )}
    </div>
  );
}
