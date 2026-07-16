// EmailTemplateListPage — 이메일 템플릿 목록 (라우트: /notifications/email-templates)
//
// [마케팅 '발송 템플릿 관리'와 무엇이 다른가] 저긴 채널로 나뉜 캠페인 문구 창고이고 알림톡 승인상태가
// 핵심 축이다. 여긴 **이벤트 트리거에 묶인 거래 문구**다 — 첫 열이 '이벤트'이고 좌측 필터가 주문/배송/
// 계정/보안이다. 승인상태 열이 없다(정보성 알림은 사전 심사 대상이 아니다).
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { formatDateTime } from '../../../shared/format';
import { Button, PlusCircleIcon, SearchField } from '../../../shared/ui';
import { CrudListShell, useCrudList } from '../../../shared/crud';
import type { CrudColumn } from '../../../shared/crud';
import { emailTemplateAdapter, EMAIL_TEMPLATE_RESOURCE } from './data-source';
import { CategoryFilter } from '../_shared/CategoryFilter';
import { TransactionalNotice } from '../_shared/TransactionalNotice';
import { useListQueryState } from '../_shared/useListQueryState';
import { emptyLabelFor } from '../_shared/emptyLabel';
import { triggerColumn } from '../_shared/triggerColumn';
import {
  ellipsisCellStyle,
  listLayoutStyle,
  numericMutedStyle,
  pageStyle,
  toolbarFiltersStyle,
  toolbarStyle,
} from '../_shared/styles';
import { countByCategory, filterByCategory, searchTemplates } from '../_shared/notification';
import type { EmailTemplate, EmailTemplateInput } from '../_shared/notification';

const ENTITY_LABEL = '이메일 템플릿';
const LIST_PATH = '/notifications/email-templates';

const nameOf = (item: EmailTemplate) => item.name;

const COLUMNS: readonly CrudColumn<EmailTemplate>[] = [
  triggerColumn<EmailTemplate>(),
  { header: '템플릿명', render: (item) => item.name },
  { header: '제목', render: (item) => <span style={ellipsisCellStyle}>{item.subject}</span> },
  {
    header: '수정일시',
    nowrap: true,
    render: (item) => <span style={numericMutedStyle}>{formatDateTime(item.updatedAt)}</span>,
  },
];

export default function EmailTemplateListPage() {
  const navigate = useNavigate();
  const query = useListQueryState();
  const { category, keyword, hasQuery, hasActiveFilters } = query;

  const controller = useCrudList<EmailTemplate, EmailTemplateInput>({
    resource: EMAIL_TEMPLATE_RESOURCE,
    adapter: emailTemplateAdapter,
    entityLabel: ENTITY_LABEL,
    nameOf,
  });
  const { clear } = controller;

  // STATE-04 — 필터/검색이 바뀌면 이제 숨겨진 행의 선택을 해제한다.
  useEffect(() => {
    clear();
  }, [category, keyword, clear]);

  const counts = useMemo(() => countByCategory(controller.items), [controller.items]);
  const visibleItems = useMemo(
    () => searchTemplates(filterByCategory(controller.items, category), keyword),
    [controller.items, category, keyword],
  );

  const toolbar = (
    <div style={toolbarStyle}>
      <div style={toolbarFiltersStyle}>
        {/* COMP-10 — 조합(IME) 중에는 커밋하지 않고, 조합이 끝난 뒤 debounce 로 한 번만 커밋한다. */}
        <SearchField
          value={query.draft}
          onChange={query.setDraft}
          label="템플릿명·이벤트 검색"
          placeholder="템플릿명 · 이벤트 검색"
          {...query.imeProps}
        />
      </div>
      <Button variant="primary" size="md" onClick={() => navigate(`${LIST_PATH}/new`)}>
        <PlusCircleIcon />
        이메일 템플릿 등록
      </Button>
    </div>
  );

  return (
    <div style={pageStyle}>
      <TransactionalNotice>주문·배송·계정·보안 이메일 문구를 관리합니다.</TransactionalNotice>

      <div style={listLayoutStyle}>
        <CategoryFilter filter={category} counts={counts} onChange={query.setCategory} />

        <CrudListShell
          entityLabel={ENTITY_LABEL}
          controller={controller}
          visibleItems={visibleItems}
          columns={COLUMNS}
          nameOf={nameOf}
          selectAllLabelId="notification-email-templates-select-all"
          emptyLabel={emptyLabelFor(ENTITY_LABEL, {
            hasQuery,
            keyword,
            hasActiveFilters,
            createHint: '이벤트에 묶을 문구를 등록해 주세요.',
          })}
          toolbar={toolbar}
          onEdit={(item) => navigate(`${LIST_PATH}/${item.id}/edit`)}
        />
      </div>
    </div>
  );
}
