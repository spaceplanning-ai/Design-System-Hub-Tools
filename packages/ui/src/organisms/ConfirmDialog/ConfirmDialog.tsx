// ConfirmDialog — CRUD 확인의 단일 창구 (organism · contracts/ConfirmDialog.contract.json@1.0.0)
//
// 계약 dependencies: Modal(organism) + Alert(atom) + Button(atom). intent 아이콘은 자체 인라인 글리프.
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건.
//
// [intent → 톤·라벨·아이콘] create/update=primary · delete/discard=danger. 호출부는 의도만 준다.
// [error] 비어 있지 않으면 본문 아래 danger 배너(Alert) — 확인 버튼이 되살아나 재클릭이 곧 재시도다.
// [busy] 확인 버튼을 disabled + aria-busy 로 잠가 중복 클릭을 막는다(계약 onConfirm.blockedWhen: busy).
//        스피너 없이 aria-busy 만 쓴다 — 라벨이 '처리 중…' 으로 바뀐다(Button 네이티브 aria-busy 패스스루).
//
// [취소 토스트는 앱의 것] DS 는 onCancel 을 부르기만 한다 — '작업이 취소되었습니다' 토스트는 앱 어댑터(useToast)가 얹는다.
// [imperative props — 계약 밖 경계] onConfirm·onCancel(필수), error/confirmLabel/cancelLabel(exactOptional widen · B2 선례).
import type { ComponentType, SVGProps } from 'react';

import { Alert } from '../../atoms/Alert';
import { Button } from '../../atoms/Button';
import type { ButtonVariant } from '../../atoms/Button';
import { Modal } from '../Modal';
import type {
  ConfirmDialogIntent,
  ConfirmDialogProps,
} from '../../../generated/types/ConfirmDialog.types';
import './ConfirmDialog.css';

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const GLYPH_BASE = {
  className: 'tds-confirmdialog__glyph',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** 생성 — 원 안에 + */
function PlusCircleGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}

/** 수정 — 연필 */
function PencilGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      <path d="M15 5l3 3" />
    </svg>
  );
}

/** 삭제 — 휴지통 */
function TrashGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

/** 이탈 — 삼각형 안에 느낌표 */
function AlertTriangleGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <path d="M12 4 3 20h18Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

interface IntentSpec {
  readonly confirmLabel: string;
  readonly variant: ButtonVariant;
  readonly glyph: ComponentType<GlyphProps>;
  /** 아이콘 톤 — 색으로도 의도를 이중 전달한다 (아이콘 모양 + 버튼 색) */
  readonly tone: 'primary' | 'danger';
}

const INTENT: Record<ConfirmDialogIntent, IntentSpec> = {
  create: { confirmLabel: '만들기', variant: 'primary', glyph: PlusCircleGlyph, tone: 'primary' },
  update: { confirmLabel: '저장', variant: 'primary', glyph: PencilGlyph, tone: 'primary' },
  delete: { confirmLabel: '삭제', variant: 'danger', glyph: TrashGlyph, tone: 'danger' },
  discard: { confirmLabel: '나가기', variant: 'danger', glyph: AlertTriangleGlyph, tone: 'danger' },
};

/**
 * onConfirm·onCancel 은 명령형 필수 배선, error/confirmLabel/cancelLabel 은 exactOptionalPropertyTypes
 * 경계에서 undefined(및 error 는 null) 허용으로 넓힌다 (B2 선례).
 */
type ConfirmDialogComponentProps = Omit<
  ConfirmDialogProps,
  'confirmLabel' | 'cancelLabel' | 'error' | 'onConfirm' | 'onCancel'
> & {
  readonly confirmLabel?: string | undefined;
  readonly cancelLabel?: string | undefined;
  readonly error?: string | null | undefined;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
};

export function ConfirmDialog({
  intent,
  title,
  message,
  confirmLabel = '',
  cancelLabel = '취소',
  busy = false,
  error = '',
  onConfirm,
  onCancel,
}: ConfirmDialogComponentProps) {
  const spec = INTENT[intent];
  const Glyph = spec.glyph;
  const failed = error !== null && error !== undefined && error !== '';

  return (
    <Modal
      title={title}
      icon={
        <span className={`tds-confirmdialog__icon tds-confirmdialog__icon--${spec.tone}`}>
          <Glyph />
        </span>
      }
      onClose={onCancel}
      footer={
        <>
          {/* busy 중에도 취소는 살아 있다 — 이것이 진행 중 요청의 abort 경로다 */}
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={spec.variant}
            // 중복 클릭 차단 — 확인은 요청 1건만 만든다 (계약 onConfirm.blockedWhen: busy)
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
          >
            {busy ? '처리 중…' : confirmLabel !== '' ? confirmLabel : spec.confirmLabel}
          </Button>
        </>
      }
    >
      <div className="tds-confirmdialog__body">
        <p className="tds-confirmdialog__message">{message}</p>
        {failed ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}
