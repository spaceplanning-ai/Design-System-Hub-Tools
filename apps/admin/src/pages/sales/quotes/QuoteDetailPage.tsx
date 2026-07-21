// QuoteDetailPage — 견적 상세 (라우트: /sales/quotes/:id)
//
// [왜 만들었나] 견적에는 읽기 전용 표면이 없었다. 그래서 문의 화면의 '견적 보기' 링크 두 개가
// 실제로는 **수정 폼**(/sales/quotes/:id/edit)을 열었다 — 이름은 보기인데 열리는 것은 편집이었고,
// 이미 발행 완료되거나 수주로 전환된 견적까지 편집 화면으로 열렸다. 여기가 그 '보기' 다.
//
// [문서는 다시 그리지 않는다] 견적서 모습의 정본은 ./components/QuotePreview 다(폼의 미리보기와
// 같은 컴포넌트). 상세가 자기 사본을 만들면 두 화면의 견적서가 언젠가 갈라진다 — 인쇄 규칙
// (../quotes.css `@media print`)도 그 컴포넌트의 className 을 집으므로 사본은 인쇄도 못 한다.
//
// [연결] 이 견적이 어느 거래처의 것인지, 어느 문의에서 나왔는지를 링크로 준다. 예전에는 견적에서
// 거래처로 가는 길이 없었다(거래처가 자유 입력 문자열이었으므로 갈 곳 자체가 없었다).
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cssVar } from '@tds/ui';

import { isNotFound } from '../../../shared/errors/http-error';
import { objectParticle, seoulDayOf } from '../../../shared/format';
import { useRouteWritePermissions } from '../../../shared/permissions/RequirePermission';
import {
  Alert,
  alertActionRowStyle,
  Button,
  Card,
  CardTitle,
  ddStyle,
  dlStyle,
  dtStyle,
  fieldLabelStyle,
  Icon,
  mutedTextStyle,
  pageTitleStyle,
  StatusBadge,
} from '../../../shared/ui';
import { useCrudRowUpdate } from '../../../shared/crud';
import { AccountLink } from '../_shared/AccountLink';
import { formatWon } from '../_shared/business';
import { quoteAdapter } from './data-source';
import { QuotePreview } from './components/QuotePreview';
import {
  computeTotals,
  isInherited,
  quoteConvertBlock,
  quoteSourceChannelLabel,
  quoteSourceHref,
  quoteStatusMeta,
  taxModeLabel,
  toQuoteInput,
} from './types';
import { contractDraftBlock } from '../contracts/types';
import { findContractIdByQuote } from '../contracts/data-source';
import { billingCreateBlock } from '../billing/types';
import {
  BILLING_RESOURCE,
  createBillingFromQuote,
  findBillingIdByQuote,
} from '../billing/data-source';

const RESOURCE = 'sales-quotes';
const LIST_PATH = '/sales/quotes';
const CONTRACT_PATH = '/sales/contracts';
const BILLING_PATH = '/sales/billing';

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
};

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: cssVar('space.2'),
  paddingTop: cssVar('space.1'),
  paddingBottom: cssVar('space.1'),
  paddingLeft: 0,
  paddingRight: 0,
  borderStyle: 'none',
  borderWidth: 0,
  background: 'transparent',
  color: cssVar('color.text.muted'),
  fontSize: cssVar('typography.label.md.font-size'),
  lineHeight: cssVar('typography.label.md.line-height'),
  cursor: 'pointer',
};

const headRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

const badgeRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
  marginTop: cssVar('space.2'),
};

const headActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
};

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(calc(${cssVar('space.6')} * 15), 1fr))`,
  gap: cssVar('space.5'),
  alignItems: 'start',
};

const numericStyle: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: cssVar('space.2'),
};

/**
 * 견적서를 종이/PDF 로 낸다 (ERP-10).
 *
 * 인쇄 대상 지정은 ../quotes.css 의 `@media print` 가 한다(.tds-quote-doc 만 남기고 앱 셸을
 * 걷어낸다) — 그 규칙은 QuotePreview 를 렌더한 **어느 화면에서든** 성립하므로 이 상세도
 * 폼과 똑같이 인쇄를 부르기만 하면 된다. 왜 react-pdf 가 아닌지는 QuoteFormPage 머리말에 있다.
 */
function printQuote(): void {
  window.print();
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const quoteId = id ?? '';
  const navigate = useNavigate();
  const { canUpdate } = useRouteWritePermissions();

  const detailQuery = useQuery({
    queryKey: [RESOURCE, 'detail', quoteId],
    queryFn: ({ signal }) => quoteAdapter.fetchOne(quoteId, signal),
    enabled: id !== undefined,
  });
  const quote = detailQuery.data;

  // 수주 전환 — 목록의 인라인 액션과 **같은 훅·같은 규칙**을 쓴다. 예전에는 전환이 목록에만
  // 있어서, 견적을 열어 내용을 확인한 운영자가 전환하려면 목록으로 되돌아가야 했다.
  const convert = useCrudRowUpdate(RESOURCE, quoteAdapter);

  /**
   * 이 견적이 이미 계약·청구를 갖고 있는가.
   *
   * [왜 동기 조회인가] 버튼을 **그리는 순간** 답이 있어야 한다 — 비동기로 나중에 알면 '만들기'
   * 버튼이 잠깐 살아 있다가 죽고, 그 사이에 누른 사람은 두 번째 계약을 만든다. 두 저장소 모두
   * 같은 페이지(pages/sales) 안이라 결합이 아니다.
   */
  const contractId = useMemo(
    () => findContractIdByQuote(quote?.id ?? ''),
    // 전환·생성 뒤 재조회로 quote 객체가 새로 오면 다시 센다.
    [quote],
  );
  const billingId = useMemo(() => findBillingIdByQuote(quote?.id ?? ''), [quote]);

  const queryClient = useQueryClient();

  /**
   * 청구를 만든다 — 폼이 없다. 청구액·거래처는 견적이 이미 알고 있고, 청구 방식·개인결제창 링크는
   * 청구 상세에서 바로 고칠 수 있다. 물어볼 것이 없는 화면을 한 장 세우지 않는다.
   *
   * 견적 id 가 멱등키라 두 번 눌러도 청구는 하나다 — 저장소가 기존 청구를 그대로 돌려준다.
   */
  const onCreateBilling = (): void => {
    if (quote === undefined || billingCreateBlock(quote.status, billingId) !== null) return;
    const created = createBillingFromQuote(quote, seoulDayOf(new Date().toISOString()) ?? '');
    // 목록 캐시를 무효화하지 않으면 방금 만든 청구가 목록에 없는 것처럼 보인다.
    void queryClient.invalidateQueries({ queryKey: [BILLING_RESOURCE, 'list'] });
    navigate(`${BILLING_PATH}/${created.id}`);
  };

  // [EXC-12] 404 와 서버 오류는 복구 수단이 다르다 — 삭제된 견적에 '다시 시도'는 영원히 실패한다.
  if (detailQuery.error !== null) {
    const notFound = isNotFound(detailQuery.error);
    return (
      <div style={pageStyle}>
        <Alert tone="danger">
          <div style={alertActionRowStyle}>
            <span>
              {notFound
                ? '견적을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.'
                : '견적을 불러오지 못했습니다.'}
            </span>
            {!notFound && (
              <Button variant="secondary" onClick={() => void detailQuery.refetch()}>
                다시 시도
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate(LIST_PATH)}>
              목록으로
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <button
        type="button"
        className="tds-ui-focusable"
        style={backLinkStyle}
        onClick={() => navigate(LIST_PATH)}
      >
        <Icon name="chevron-left" />
        목록으로
      </button>

      {quote === undefined ? (
        <Card>
          <p style={{ ...fieldLabelStyle, color: cssVar('color.text.muted') }}>불러오는 중…</p>
        </Card>
      ) : (
        <>
          <div style={headRowStyle}>
            <div>
              <h1 style={pageTitleStyle}>{`견적 ${quote.quoteNo}`}</h1>
              <div style={badgeRowStyle}>
                <StatusBadge
                  tone={quoteStatusMeta(quote.status).tone}
                  label={quoteStatusMeta(quote.status).label}
                />
                {isInherited(quote) && <StatusBadge tone="info" label="문의에서 자동 발행" />}
              </div>
            </div>
            <div style={headActionsStyle}>
              <Button variant="secondary" onClick={printQuote}>
                인쇄 · PDF 저장
              </Button>
              {/* 파이프라인의 다음 칸으로 가는 액션들 — 전이 규칙이 열어 준 것만 존재한다 (EXC-03).
                  판정은 전부 ./types · ../contracts/types · ../billing/types 의 *Block 술어가 하고,
                  이 화면은 그 결과를 읽기만 한다: 화면이 자기 조건문으로 다시 판단하면 목록의
                  인라인 전환과 여기가 서로 다른 규칙을 갖게 된다. */}
              {canUpdate && quoteConvertBlock(quote.status) === null && (
                <Button
                  variant="secondary"
                  disabled={convert.pendingId === quote.id}
                  onClick={() =>
                    convert.run(
                      quote.id,
                      { ...toQuoteInput(quote), status: 'ordered' },
                      // [ERP-13] 조사는 shared/format 이 런타임에 고른다 — 견적번호마다 받침이 다르다
                      {
                        success: `'${quote.quoteNo}'${objectParticle(quote.quoteNo)} 수주로 전환했습니다.`,
                      },
                    )
                  }
                >
                  수주 전환
                </Button>
              )}
              {canUpdate && contractDraftBlock(quote.status, contractId) === null && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`${CONTRACT_PATH}/new?quoteId=${quote.id}`)}
                >
                  계약 초안 만들기
                </Button>
              )}
              {canUpdate && billingCreateBlock(quote.status, billingId) === null && (
                <Button variant="secondary" onClick={onCreateBilling}>
                  청구 만들기
                </Button>
              )}
              {/* 고치는 길은 이 버튼 하나뿐이고, 권한이 없으면 없다 (EXC-03) */}
              {canUpdate && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`${LIST_PATH}/${quote.id}/edit`)}
                >
                  견적 수정
                </Button>
              )}
            </div>
          </div>

          {/* 종료된 견적을 고치면 이미 나간 문서와 앱의 기록이 어긋난다 — 막지는 않되 밝힌다 */}
          {quote.status === 'ordered' && (
            <Alert tone="info">
              수주로 전환된 견적입니다. 지금 수정해도 이미 발송된 견적서는 바뀌지 않습니다.
            </Alert>
          )}

          <div style={layoutStyle}>
            <Card>
              <CardTitle>견적서</CardTitle>
              <QuotePreview
                quoteNo={quote.quoteNo}
                accountName={quote.accountName}
                accountBizNo={quote.accountBizNo}
                accountCeo={quote.accountCeo}
                contactName={quote.contactName}
                issueDate={quote.issueDate}
                validUntil={quote.validUntil}
                taxMode={quote.taxMode}
                items={quote.items}
                status={quote.status}
                note={quote.note}
              />
            </Card>

            <Card>
              <CardTitle>연결 · 요약</CardTitle>
              <dl style={dlStyle}>
                <dt style={dtStyle}>거래처</dt>
                <dd style={ddStyle}>
                  <AccountLink account={quote} />
                </dd>
                <dt style={dtStyle}>담당자</dt>
                <dd style={ddStyle}>
                  {quote.contactName === '' ? (
                    <span style={mutedTextStyle}>—</span>
                  ) : (
                    quote.contactName
                  )}
                </dd>
                <dt style={dtStyle}>원본 문의</dt>
                <dd style={ddStyle}>
                  {isInherited(quote) ? (
                    // 합쳐진 문의는 모두 나열한다 — 이 견적이 어느 요청들에서 왔는지가 곧 근거다
                    quote.sources.map((source) => (
                      <div key={source.id}>
                        <Link to={quoteSourceHref(source)} className="tds-ui-link tds-ui-focusable">
                          {source.no}
                        </Link>
                        {` · ${quoteSourceChannelLabel(source.channel)}`}
                      </div>
                    ))
                  ) : (
                    <span style={mutedTextStyle}>수동 등록 견적입니다.</span>
                  )}
                </dd>
                <dt style={dtStyle}>연결된 계약</dt>
                <dd style={ddStyle}>
                  {contractId === '' ? (
                    <span style={mutedTextStyle}>아직 계약이 없습니다.</span>
                  ) : (
                    <Link
                      to={`${CONTRACT_PATH}/${contractId}/edit`}
                      className="tds-ui-link tds-ui-focusable"
                    >
                      계약 열기
                    </Link>
                  )}
                </dd>
                <dt style={dtStyle}>연결된 청구</dt>
                <dd style={ddStyle}>
                  {billingId === '' ? (
                    <span style={mutedTextStyle}>아직 청구가 없습니다.</span>
                  ) : (
                    <Link
                      to={`${BILLING_PATH}/${billingId}`}
                      className="tds-ui-link tds-ui-focusable"
                    >
                      청구 열기
                    </Link>
                  )}
                </dd>
                <dt style={dtStyle}>견적일 · 유효기간</dt>
                <dd style={{ ...ddStyle, ...numericStyle }}>
                  {`${quote.issueDate} ~ ${quote.validUntil}`}
                </dd>
                <dt style={dtStyle}>과세유형</dt>
                <dd style={ddStyle}>{taxModeLabel(quote.taxMode)}</dd>
                <dt style={dtStyle}>합계금액</dt>
                <dd style={{ ...ddStyle, ...numericStyle }}>
                  {formatWon(computeTotals(quote.items, quote.taxMode).total)}
                </dd>
              </dl>
            </Card>
          </div>

          <div style={actionsStyle}>
            <Button variant="secondary" onClick={() => navigate(LIST_PATH)}>
              목록으로
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
