// Toast — 결과 통지 1건 (molecule · contracts/Toast.contract.json@1.0.0)
//
// 계약 dependencies: [] — 아이콘·버튼은 자체 인라인 글리프/버튼. 큐/위치/최대개수는 ToastProvider(앱) 소유.
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건. 출처 인라인 스타일(feedbackStyle)을 클래스로 옮긴 것.
//
// [보이는 것] 아이콘 + 문구 + (onRetry 있으면) '다시 시도' + 닫기(×).
// [사라지는 것] success 4초 · cancelled 2초 · info 4초 · **error 는 자동으로 사라지지 않는다** —
//   사용자가 닫거나 재시도할 때까지 남는다 (실패를 조용히 삼키지 않는다).
//
// [a11y] success/cancelled/info: role="status" + aria-live="polite" / error: role="alert" + aria-live="assertive".
//
// [imperative props — 계약 밖 경계] id 는 onDismiss 인자(큐 키)라 Figma 대응이 없다.
import { useEffect } from 'react';
import type { ComponentType, SVGProps } from 'react';

import type { ToastKind, ToastProps } from '../../../generated/types/Toast.types';
import './Toast.css';

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const GLYPH_BASE = {
  className: 'tds-toast__glyph',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** 성공 — 원 안에 체크 */
function CheckCircleGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/** 취소 — 원 안에 × */
function XCircleGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

/** 실패 — 삼각형 안에 느낌표 */
function AlertTriangleGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <path d="M12 4 3 20h18Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** 안내 — 원 안에 i */
function InfoCircleGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M12 11v5" />
    </svg>
  );
}

/** 닫기 — × */
function CloseGlyph(props: GlyphProps) {
  return (
    <svg {...GLYPH_BASE} {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

type Tone = 'success' | 'info' | 'danger';

interface KindSpec {
  readonly tone: Tone;
  /** null = 자동 소멸 없음 */
  readonly durationMs: number | null;
  readonly live: 'status' | 'alert';
  readonly icon: ComponentType<GlyphProps>;
}

const TOAST_SPEC: Record<ToastKind, KindSpec> = {
  success: { tone: 'success', durationMs: 4000, live: 'status', icon: CheckCircleGlyph },
  // 취소는 '눌렸다'는 확인일 뿐이다 — 성공보다 짧게 스친다
  cancelled: { tone: 'info', durationMs: 2000, live: 'status', icon: XCircleGlyph },
  // 실패는 남는다. 사용자가 닫거나 재시도해야 사라진다
  error: { tone: 'danger', durationMs: null, live: 'alert', icon: AlertTriangleGlyph },
  info: { tone: 'info', durationMs: 4000, live: 'status', icon: InfoCircleGlyph },
};

/** id — onDismiss 인자(큐 키). Figma 대응이 없는 명령형 경계 prop */
interface ToastImperativeProps {
  readonly id: string;
}

/**
 * 계약의 옵셔널 이벤트 prop 을 경계에서 undefined 허용으로 넓힌 컴포넌트 props (B2 선례).
 * exactOptionalPropertyTypes 하에서 호출부(ToastProvider)가 onRetry={item.retry}(()=>void|undefined)를
 * 그대로 넘길 수 있게 한다 — 실패가 아닌 토스트는 retry 가 없다.
 */
type ToastComponentProps = Omit<ToastProps, 'onDismiss' | 'onRetry'> &
  ToastImperativeProps & {
    readonly onDismiss?: ((id: string) => void) | undefined;
    readonly onRetry?: (() => void) | undefined;
  };

export function Toast({ id, kind = 'info', message, onDismiss, onRetry }: ToastComponentProps) {
  const spec = TOAST_SPEC[kind];
  const Icon = spec.icon;
  const { durationMs } = spec;

  useEffect(() => {
    if (durationMs === null) return undefined;
    const timer = setTimeout(() => {
      onDismiss?.(id);
    }, durationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [durationMs, id, onDismiss]);

  return (
    <div
      className={`tds-toast tds-toast--${spec.tone}`}
      role={spec.live}
      aria-live={spec.live === 'alert' ? 'assertive' : 'polite'}
    >
      <span className="tds-toast__icon">
        <Icon />
      </span>

      <span className="tds-toast__message">{message}</span>

      {onRetry !== undefined && (
        <button
          type="button"
          className="tds-toast__action"
          onClick={() => {
            onDismiss?.(id);
            onRetry();
          }}
        >
          다시 시도
        </button>
      )}

      <button
        type="button"
        className="tds-toast__close"
        aria-label="알림 닫기"
        onClick={() => {
          onDismiss?.(id);
        }}
      >
        <CloseGlyph />
      </button>
    </div>
  );
}
