// Toast — 결과 통지 1건 (molecule · contracts/Toast.contract.json@1.1.0)
//
// 계약 dependencies: [] — 아이콘·버튼은 자체 인라인 글리프/버튼. 큐/위치/최대개수는 ToastProvider(앱) 소유.
// 시각 값은 전부 semantic 토큰 CSS 변수 — 하드코딩 hex/px 0건. 출처 인라인 스타일(feedbackStyle)을 클래스로 옮긴 것.
//
// [보이는 것] 아이콘 + 문구 + (onRetry 있으면) '다시 시도' + 닫기(×).
// [사라지는 것] success 4초 · cancelled 2초 · info 4초 · **error 는 자동으로 사라지지 않는다** —
//   사용자가 닫거나 재시도할 때까지 남는다 (실패를 조용히 삼키지 않는다).
//
// [a11y — 1.1.0: 라이브 영역을 소유하지 않는다]
//   토스트는 **동적으로 삽입되는 노드**다. 내용과 함께 생성된 라이브 영역은 NVDA/JAWS/VoiceOver 에서
//   신뢰성 있게 announce 되지 않는다 — 그래서 role/aria-live 를 여기서 떼고, 토스트보다 **먼저·항상**
//   존재하는 ToastProvider 의 지속 라이브 영역(polite/assertive 2개)이 통지를 소유한다 (A11Y-01).
//   Toast 는 시각 표현(tone·아이콘)과 자동소멸·닫기/재시도 배선만 담당한다.
//   kind 는 여전히 **어느 라이브 영역으로 갈지**를 정한다 — 그 분배는 ToastProvider 가 한다.
//
// [imperative props — 계약 밖 경계] id 는 onDismiss 인자(큐 키)라 Figma 대응이 없다.
//
// [MOTION-02] 퇴장 애니메이션 — **onDismiss 를 퇴장 애니메이션 뒤로 미룬다**
//   토스트를 지우는 주체는 ToastProvider 의 큐(filter)다. Toast 는 큐를 모른다 — 대신 이미 소유한
//   **onDismiss 의 호출 시점**을 늦춘다: 자동소멸 타이머·닫기(×)·다시 시도 → 퇴장 애니메이션 재생 →
//   끝나면 그때 onDismiss(id) → provider 가 큐에서 뺀다.
//   그래서 자동/수동 dismiss **양쪽 모두** 퇴장이 보이고, provider 의 큐(max 3)·라이브 영역 분배(A11Y-01)는
//   한 줄도 바뀌지 않는다 — 큐에서 빠지는 시점만 애니메이션 뒤로 밀린다.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';

import type { ToastKind, ToastProps } from '../../../generated/types/Toast.types';
import './Toast.css';

/** 퇴장 애니메이션의 keyframes 이름 — 이 애니메이션의 animationend 만 '소멸 완료'로 친다 */
const TOAST_EXIT_ANIMATION = 'tds-toast-out';

/**
 * 퇴장 애니메이션이 실제로 도는가 — computed style 로 **관측**한다 (MOTION-03).
 * reduced-motion 에서 CSS 가 animation 을 끄면 false → 기다리지 않고 즉시 소멸한다.
 * jsdom 은 CSS 를 적용하지 않아 '' → false → 기존 단위 테스트의 '즉시 onDismiss' 단언이 그대로 유효하다.
 */
function willAnimate(element: HTMLElement | null): boolean {
  if (element === null || typeof window.getComputedStyle !== 'function') return false;
  const style = window.getComputedStyle(element);
  if (style.animationName === '' || style.animationName === 'none') return false;
  return Number.parseFloat(style.animationDuration) > 0;
}

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
  readonly icon: ComponentType<GlyphProps>;
}

const TOAST_SPEC: Record<ToastKind, KindSpec> = {
  success: { tone: 'success', durationMs: 4000, icon: CheckCircleGlyph },
  // 취소는 '눌렸다'는 확인일 뿐이다 — 성공보다 짧게 스친다
  cancelled: { tone: 'info', durationMs: 2000, icon: XCircleGlyph },
  // 실패는 남는다. 사용자가 닫거나 재시도해야 사라진다
  error: { tone: 'danger', durationMs: null, icon: AlertTriangleGlyph },
  info: { tone: 'info', durationMs: 4000, icon: InfoCircleGlyph },
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

  const rootRef = useRef<HTMLDivElement>(null);
  // 퇴장 중인가 — true 가 되면 퇴장 애니메이션이 붙고, 끝나면 onDismiss(id) 가 불린다 (MOTION-02)
  const [exiting, setExiting] = useState(false);
  // 소멸 요청은 한 번만 — 타이머와 닫기 버튼이 겹쳐도 onDismiss 는 1회다
  const exitingRef = useRef(false);

  /** 소멸 요청 — 즉시 지우지 않고 퇴장 애니메이션을 시작한다 */
  const requestDismiss = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
  }, []);

  useEffect(() => {
    if (durationMs === null) return undefined;
    const timer = setTimeout(requestDismiss, durationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [durationMs, requestDismiss]);

  // 퇴장 애니메이션이 없으면(reduced-motion·jsdom) 기다릴 것이 없다 — 즉시 소멸한다
  useEffect(() => {
    if (!exiting) return;
    if (!willAnimate(rootRef.current)) onDismiss?.(id);
  }, [exiting, id, onDismiss]);

  return (
    // role/aria-live 없음 — 통지는 ToastProvider 의 지속 라이브 영역이 소유한다 (A11Y-01)
    <div
      ref={rootRef}
      className={`tds-toast tds-toast--${spec.tone}${exiting ? ' tds-toast--exiting' : ''}`}
      // 퇴장 애니메이션이 끝난 **그때** provider 에게 알린다 → 큐에서 빠진다 (MOTION-02).
      // 등장 애니메이션의 animationend 와 섞이지 않도록 keyframes 이름으로 정확히 가른다.
      onAnimationEnd={(event) => {
        if (event.animationName === TOAST_EXIT_ANIMATION) onDismiss?.(id);
      }}
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
            // 재시도는 **즉시** 부른다 — 복구 요청을 퇴장 애니메이션만큼 늦출 이유가 없다.
            // 토스트가 사라지는 것만 애니메이션 뒤로 미룬다.
            requestDismiss();
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
        onClick={requestDismiss}
      >
        <CloseGlyph />
      </button>
    </div>
  );
}
