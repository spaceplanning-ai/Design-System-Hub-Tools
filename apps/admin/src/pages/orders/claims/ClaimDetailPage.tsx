// ClaimDetailPage — 클레임(취소·교환·반품) 상세·처리 (라우트: /orders/claims/:id)
//
// 요청 정보(주문·상품·옵션·사유) + 처리 진행 스텝퍼 + 상태 전이 + 교환 옵션(재발송) + **환불 처리** +
// 재고 이동 이력 + 처리 메모. 저장은 프레임워크 저수준 훅(useCrudUpdate). 삭제는 없다(감사 성격).
//
// [두 축을 각자의 카드로 나눈다] 클레임 처리와 환불은 별개의 축이고 끝나는 시점도 다르다
// (./refund 머리말). 한 카드에 섞으면 '완료' 버튼이 무엇을 완료하는지 화면에서 읽히지 않는다.
//
// [막힌 동작은 사유를 그대로 보여 준다] 전이 가드가 돌려준 문자열을 버튼 옆에 쓴다 — 화면은 사유를
// 다시 지어내지 않고, 저장소도 같은 함수로 막는다(../claims/types · ./refund).
//
// [옵션·재고의 정본은 상품이다] 이 화면은 조회기(shared/domain/variant-ref)가 준 옵션만 그리고,
// 실제 증감은 어댑터가 클레임 갱신과 한 덩이로 처리한다. 재고 부족은 422 로 되돌아와 인라인 오류가 된다.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cssVar, Stepper } from '@tds/ui';

import { isAbort } from '../../../shared/async';
import { formatNumber } from '../../../shared/format';
import {
  isHttpError,
  isNotFound,
  isUnprocessable,
  referenceOf,
} from '../../../shared/errors/http-error';
import { orderDetailPath } from '../../../shared/domain/order-ref';
import { orderStatusLabel } from '../../../shared/domain/order';
import { policyReturnFee } from '../../../shared/domain/shipping-policy';
import { useRouteWritePermissions } from '../../../shared/permissions/RequirePermission';
import {
  Alert,
  alertActionRowStyle,
  Button,
  Card,
  CardTitle,
  ConfirmDialog,
  ddStyle,
  dlStyle,
  dtStyle,
  fieldLabelStyle,
  FormField,
  hintStyle,
  Icon,
  pageTitleStyle,
  SelectField,
  StatusBadge,
  TextareaField,
  useToast,
  useUnsavedChangesDialog,
} from '../../../shared/ui';
import { useCrudItem, useCrudUpdate } from '../../../shared/crud';
import { claimAdapter, fetchClaimVariants, findClaimOrder } from './data-source';
import { ExchangeOptionField } from './components/ExchangeOptionField';
import { RefundSection } from './components/RefundSection';
import { StockMovementTable } from './components/StockMovementTable';
import {
  cancelBlock,
  claimFlow,
  claimTransitionBlock,
  CLAIM_NOTE_MAX,
  isClaimStatus,
  isStockApplied,
  kindLabel,
  kindTone,
  movesStock,
  nextClaimStatuses,
  optionLabel,
  statusLabel,
  statusMeta,
  stockIssueMessage,
  toClaimInput,
  validateStockPlan,
} from './types';
import type { ClaimInput, ClaimStatus } from './types';
import {
  defaultReturnFee,
  isRefundable,
  parseFeeInput,
  refundBreakdown,
  refundTransitionBlock,
  REFUND_FEE_INVALID,
} from './refund';
import type { ClaimRefund, RefundStatus } from './refund';

const RESOURCE = 'claims';
const LIST_PATH = '/orders/claims';
const UNSAVED_MESSAGE =
  '처리 내용에 저장하지 않은 변경이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.';

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

const stepperWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.2'),
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: cssVar('space.2'),
  flexWrap: 'wrap',
};

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { canUpdate } = useRouteWritePermissions();

  const detailQuery = useCrudItem(RESOURCE, claimAdapter, id ?? '');
  const claim = detailQuery.data;

  // 옵션·재고의 정본은 상품이다 — 교환 클레임이 로드된 뒤에만 조회한다(취소·반품은 선택지가 없다).
  const needsVariants = claim?.kind === 'exchange';
  const variantQuery = useQuery({
    queryKey: [RESOURCE, 'variants', claim?.productId ?? ''],
    queryFn: ({ signal }) => fetchClaimVariants(claim?.productId ?? '', signal),
    enabled: needsVariants,
  });
  const variants = variantQuery.data;

  const update = useCrudUpdate(RESOURCE, claimAdapter);
  const saving = update.isPending;

  const [status, setStatus] = useState<ClaimStatus>('requested');
  const [note, setNote] = useState('');
  const [exchangeValues, setExchangeValues] = useState<readonly string[]>([]);
  const [feeInput, setFeeInput] = useState('');
  const [couponRestored, setCouponRestored] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errorReference, setErrorReference] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmStock, setConfirmStock] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);

  /**
   * 반품배송비의 출발값 — **아직 환불을 접수하지 않은 건에만** 정책 기본값을 넣는다.
   * 이미 접수된 건의 값은 운영자가 그 건을 보고 정한 금액이다(판매자 귀책이라 0으로 둔 건 등).
   * 정책을 뒤늦게 얹으면 그 판단이 조용히 지워진다.
   */
  const policyFee = policyReturnFee();
  useEffect(() => {
    if (claim === undefined) return;
    setStatus(claim.status);
    setNote(claim.adminNote);
    setExchangeValues(claim.exchangeOptionValues);
    setCouponRestored(claim.refund.couponRestored);
    const fallback = defaultReturnFee(claim.kind, policyFee);
    const initial =
      claim.refund.status === 'none' ? (fallback ?? null) : claim.refund.returnShippingFee;
    setFeeInput(initial === null ? '' : String(initial));
  }, [claim, policyFee]);

  const order = useMemo(
    () => (claim === undefined ? null : findClaimOrder(claim.orderId)),
    [claim],
  );

  const applied = claim !== undefined && isStockApplied(claim);
  const isExchange = claim?.kind === 'exchange';
  // 재고가 이미 반영된 클레임은 교환 옵션을 다시 고를 수 없다 — 이동은 한 번뿐이다(중복 반영 방지).
  const optionLocked = applied || !canUpdate;

  const parsedFee = parseFeeInput(feeInput);
  const feeError = feeInput.trim() === '' || parsedFee !== null ? undefined : REFUND_FEE_INVALID;

  /** 편집 중인 값이 반영된 환불 정보 — 계산·전이 판정·저장이 모두 이 한 벌을 읽는다 */
  const draftRefund: ClaimRefund | undefined =
    claim === undefined
      ? undefined
      : {
          ...claim.refund,
          returnShippingFee: parsedFee ?? claim.refund.returnShippingFee,
          couponRestored,
        };

  const dirty =
    claim !== undefined &&
    draftRefund !== undefined &&
    (status !== claim.status ||
      note !== claim.adminNote ||
      optionLabel(exchangeValues) !== optionLabel(claim.exchangeOptionValues) ||
      draftRefund.returnShippingFee !== claim.refund.returnShippingFee ||
      draftRefund.couponRestored !== claim.refund.couponRestored);
  const unsavedDialog = useUnsavedChangesDialog(dirty && !saving, { message: UNSAVED_MESSAGE });

  /* 상태 선택지 — 지금 갈 수 있는 곳 + 현재 상태. 갈 수 없는 상태를 열어 두고 저장에서 막으면
     운영자는 이미 마음을 정한 뒤에 거절당한다. */
  const statusOptions = useMemo(() => {
    if (claim === undefined) return [];
    return [claim.status, ...nextClaimStatuses(claim, order)];
  }, [claim, order]);

  const transitionBlock =
    claim === undefined || status === claim.status
      ? null
      : claimTransitionBlock(claim, status, order);

  // 완료로 넘길 때만 재고 유효성이 걸린다 — 진행·반려·철회는 재고를 건드리지 않는다(도메인 재사용).
  const pendingIssue = useMemo(() => {
    if (claim === undefined || variants === undefined) return null;
    if (!movesStock({ kind: claim.kind, status }) || applied) return null;
    return validateStockPlan({ ...claim, exchangeOptionValues: exchangeValues }, variants);
  }, [claim, variants, status, exchangeValues, applied]);

  const blockedMessage = pendingIssue === null ? null : stockIssueMessage(pendingIssue);
  const exchangeFieldError =
    fieldError ??
    (pendingIssue !== null && pendingIssue !== 'unknown-origin' ? blockedMessage : null);

  /* [EXC-11] 이 저장이 **재고를 실제로 움직이는가**. 움직이면 stockAppliedAt 이 못 박혀
     되돌릴 수 없다 — 그래서 확인을 한 번 받는다. 되돌릴 수 있는 저장(진행·메모)은 묻지 않는다. */
  const willMoveStock = claim !== undefined && movesStock({ kind: claim.kind, status }) && !applied;

  const submit = (patch: Partial<ClaimInput>, message: string) => {
    if (claim === undefined || id === undefined) return;
    setConfirmStock(false);
    setConfirmRefund(false);
    setServerError(null);
    setErrorReference(null);
    setFieldError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    update.mutate(
      { id, input: { ...toClaimInput(claim), ...patch }, signal: controller.signal },
      {
        onSuccess: () => {
          if (controller.signal.aborted) return;
          toast.success(message);
          void detailQuery.refetch();
          // 재고가 움직였으면 옵션 쪽 조회도 낡았다 — 선택지의 재고 수치를 즉시 되맞춘다.
          if (needsVariants) void variantQuery.refetch();
        },
        onError: (cause: unknown) => {
          if (isAbort(cause)) return;
          // 422 는 어느 입력이 틀렸는지 아는 실패다 — 폼 배너가 아니라 그 필드로 되돌린다 (EXC-07).
          if (isUnprocessable(cause) && isHttpError(cause)) {
            setFieldError(cause.violations[0]?.message ?? cause.message);
            return;
          }
          setServerError(
            isHttpError(cause) ? cause.message : '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          );
          setErrorReference(referenceOf(cause));
        },
      },
    );
  };

  const saveClaim = () => {
    if (claim === undefined || draftRefund === undefined) return;
    submit(
      {
        status,
        adminNote: note.trim(),
        exchangeOptionValues: [...exchangeValues],
        refund: draftRefund,
      },
      willMoveStock ? '처리 내용을 저장하고 재고를 반영했습니다.' : '처리 내용을 저장했습니다.',
    );
  };

  const saveRefund = (to: RefundStatus) => {
    if (draftRefund === undefined) return;
    submit(
      { refund: { ...draftRefund, status: to } },
      to === 'completed' ? '환불을 완료 처리했습니다.' : '환불을 접수했습니다.',
    );
  };

  // [EXC-12] 404 와 서버 오류는 복구 수단이 다르다 — 이미 삭제된 클레임에 '다시 시도'는 영원히 실패한다.
  if (detailQuery.error !== null) {
    const notFound = isNotFound(detailQuery.error);
    return (
      <div style={pageStyle}>
        <Alert tone="danger">
          <div style={alertActionRowStyle}>
            <span>
              {notFound
                ? '클레임을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.'
                : '클레임을 불러오지 못했습니다.'}
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

  const cancelWarning = claim === undefined || claim.kind !== 'cancel' ? null : cancelBlock(order);

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

      <div>
        <h1 style={pageTitleStyle}>클레임 처리</h1>
      </div>

      {claim === undefined || draftRefund === undefined ? (
        <Card>
          <p style={{ ...fieldLabelStyle, color: cssVar('color.text.muted') }}>불러오는 중…</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>
              요청 정보
              <StatusBadge tone={kindTone(claim.kind)} label={kindLabel(claim.kind)} />
            </CardTitle>

            {serverError !== null && (
              <Alert tone="danger">
                <div style={alertActionRowStyle}>
                  <span>{serverError}</span>
                  {errorReference !== null && (
                    <span style={hintStyle}>오류 코드 {errorReference}</span>
                  )}
                </div>
              </Alert>
            )}

            {cancelWarning !== null && <Alert tone="warning">{cancelWarning}</Alert>}

            <div style={stepperWrapStyle}>
              <span style={fieldLabelStyle}>처리 진행</span>
              {status === 'rejected' || status === 'withdrawn' ? (
                <StatusBadge
                  tone={statusMeta(status).tone}
                  label={`${statusLabel(status)} — 처리 종료`}
                />
              ) : (
                <Stepper
                  steps={claimFlow(claim.kind).map((step) => ({
                    id: step,
                    label: statusLabel(step),
                  }))}
                  current={status}
                  ariaLabel="처리 진행 단계"
                />
              )}
            </div>

            <dl style={dlStyle}>
              <dt style={dtStyle}>주문번호</dt>
              <dd style={ddStyle}>
                {/* 원 주문으로 건너뛰는 유일한 실 — 경로의 정본은 shared/domain/order-ref 다 */}
                <Link to={orderDetailPath(claim.orderId)} className="tds-ui-link tds-ui-focusable">
                  {claim.orderId}
                </Link>
              </dd>
              <dt style={dtStyle}>주문 상태</dt>
              <dd style={ddStyle}>
                {order === null
                  ? '주문 정보를 확인할 수 없습니다.'
                  : `${orderStatusLabel(order.status)}${order.canceled ? ' · 취소됨' : ''}`}
              </dd>
              <dt style={dtStyle}>상품</dt>
              <dd style={ddStyle}>{claim.productName}</dd>
              <dt style={dtStyle}>주문 옵션</dt>
              <dd style={ddStyle}>{optionLabel(claim.optionValues)}</dd>
              <dt style={dtStyle}>신청자</dt>
              <dd style={ddStyle}>{claim.customer}</dd>
              <dt style={dtStyle}>수량</dt>
              <dd style={ddStyle}>{formatNumber(claim.quantity)}개</dd>
              <dt style={dtStyle}>사유</dt>
              <dd style={ddStyle}>{claim.reason}</dd>
              <dt style={dtStyle}>상세 사유</dt>
              <dd style={ddStyle}>{claim.reasonDetail}</dd>
              <dt style={dtStyle}>접수일</dt>
              <dd style={ddStyle}>{claim.requestedAt}</dd>
            </dl>

            <FormField htmlFor="claim-status" label="처리 상태">
              <SelectField
                id="claim-status"
                value={status}
                disabled={saving || !canUpdate}
                onChange={(event) => {
                  if (isClaimStatus(event.target.value)) setStatus(event.target.value);
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel(option)}
                  </option>
                ))}
              </SelectField>
            </FormField>

            <TextareaField
              label="처리 메모"
              value={note}
              onChange={setNote}
              maxLength={CLAIM_NOTE_MAX}
              disabled={saving || !canUpdate}
              placeholder="수거·검수·환불 등 처리 내역을 기록하세요."
              rows={4}
            />

            {!canUpdate && (
              <Alert tone="info">이 클레임을 처리할 권한이 없습니다. 조회만 가능합니다.</Alert>
            )}

            <div style={actionsStyle}>
              {transitionBlock !== null && <span style={hintStyle}>{transitionBlock}</span>}
              <Button variant="secondary" disabled={saving} onClick={() => navigate(LIST_PATH)}>
                목록으로
              </Button>
              {canUpdate && (
                <Button
                  variant="primary"
                  size="md"
                  loading={saving}
                  disabled={saving || !dirty || pendingIssue !== null || transitionBlock !== null}
                  onClick={() => {
                    // 재고를 움직이지 않는 저장(진행·반려·메모 수정)은 확인을 묻지 않는다 —
                    // 되돌릴 수 있는 일에까지 확인을 붙이면 정작 중요한 확인이 무시된다.
                    if (willMoveStock) setConfirmStock(true);
                    else saveClaim();
                  }}
                >
                  처리 저장
                </Button>
              )}
            </div>
          </Card>

          {isExchange && (
            <Card>
              <CardTitle>
                교환 재발송 · 재고
                {applied && <StatusBadge tone="success" label="재고 반영 완료" />}
              </CardTitle>

              {variantQuery.error !== null ? (
                <Alert tone="danger">
                  <div style={alertActionRowStyle}>
                    <span>
                      {isNotFound(variantQuery.error)
                        ? '연결된 상품을 찾을 수 없어 교환 옵션을 불러오지 못했습니다.'
                        : '상품 옵션을 불러오지 못했습니다.'}
                    </span>
                    {!isNotFound(variantQuery.error) && (
                      <Button variant="secondary" onClick={() => void variantQuery.refetch()}>
                        다시 시도
                      </Button>
                    )}
                  </div>
                </Alert>
              ) : variants === undefined ? (
                <p style={hintStyle}>옵션·재고를 불러오는 중…</p>
              ) : applied ? (
                <p style={hintStyle}>
                  {`재고가 이미 반영되어 교환 옵션을 바꿀 수 없습니다. 재발송 옵션: ${optionLabel(claim.exchangeOptionValues)}`}
                </p>
              ) : (
                <ExchangeOptionField
                  variants={variants}
                  originValues={claim.optionValues}
                  value={exchangeValues}
                  quantity={claim.quantity}
                  disabled={saving || optionLocked}
                  error={exchangeFieldError ?? undefined}
                  onChange={setExchangeValues}
                />
              )}

              {pendingIssue === 'unknown-origin' && blockedMessage !== null && (
                <Alert tone="danger">{blockedMessage}</Alert>
              )}
            </Card>
          )}

          {isRefundable(claim.kind) && (
            <RefundSection
              draft={draftRefund}
              saved={claim.refund}
              feeInput={feeInput}
              feeError={feeError}
              policyFee={policyFee}
              disabled={saving || !canUpdate}
              requestBlock={refundTransitionBlock(claim, 'requested')}
              completeBlock={
                parsedFee === null
                  ? REFUND_FEE_INVALID
                  : refundTransitionBlock({ ...claim, status }, 'completed')
              }
              onFeeChange={setFeeInput}
              onCouponRestoredChange={setCouponRestored}
              onRequest={() => saveRefund('requested')}
              onComplete={() => setConfirmRefund(true)}
            />
          )}

          <Card>
            <CardTitle>재고 이동 이력</CardTitle>
            <StockMovementTable
              movements={claim.stockMovements}
              emptyHint={
                claim.kind === 'cancel'
                  ? '취소는 이 화면에서 재고를 움직이지 않습니다. 출고 전 재고는 주문을 취소할 때 되돌아갑니다.'
                  : '아직 반영된 재고 이동이 없습니다. 완료 처리 시 기록됩니다.'
              }
            />
          </Card>
        </>
      )}

      {/* 되돌릴 수 없는 재고 이동의 확인 창구. intent='update' 인 이유: 삭제가 아니라 '확정' 이다.
          실패해도 다이얼로그는 닫히지 않는다(error 배너 + 재클릭이 곧 재시도 — ConfirmDialog 계약). */}
      {confirmStock && claim !== undefined && (
        <ConfirmDialog
          intent="update"
          title={isExchange ? '교환 재고 반영' : '반품 재고 반영'}
          message={`'${claim.productName}' ${formatNumber(claim.quantity)}개의 재고가 이동합니다. 재고 반영은 되돌릴 수 없으며, 반영 후에는 교환 옵션을 바꿀 수 없습니다.`}
          confirmLabel="재고 반영"
          busy={saving}
          {...(serverError !== null && { error: serverError })}
          onConfirm={saveClaim}
          onCancel={() => {
            controllerRef.current?.abort();
            setConfirmStock(false);
          }}
        />
      )}

      {/* 환불완료도 되돌릴 수 없다 — 적립금 원장은 추가만 되는 장부라 잘못 얹으면 지울 수 없다. */}
      {confirmRefund && claim !== undefined && draftRefund !== undefined && (
        <ConfirmDialog
          intent="update"
          title="환불 완료 처리"
          message={`${formatNumber(refundBreakdown(draftRefund).total)}원을 환불 완료로 기록하고, 사용한 적립금 ${formatNumber(draftRefund.pointUsed)}원을 원장에 복원합니다. 이 처리는 되돌릴 수 없습니다.`}
          confirmLabel="환불 완료"
          busy={saving}
          {...(serverError !== null && { error: serverError })}
          onConfirm={() => saveRefund('completed')}
          onCancel={() => {
            controllerRef.current?.abort();
            setConfirmRefund(false);
          }}
        />
      )}

      {unsavedDialog}
    </div>
  );
}
