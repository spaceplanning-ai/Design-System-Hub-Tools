// 렌더 예외 경계
//
// [왜 필요한가 — EXC-01]
// 이 앱에는 ErrorBoundary 가 **0건**이었다. React 는 렌더 중 throw 를 잡지 못하면 트리 전체를
// unmount 한다 — 컴포넌트 하나가 던지면 **사이드바까지 사라진 흰 화면**이 남고, 운영자는 다른
// 메뉴로 갈 수조차 없다. 게다가 `useToast` 는 provider 밖에서 의도적으로 throw 하도록 설계돼 있어
// (shared/ui/ToastProvider.tsx) 경계가 없으면 그 방어가 곧 앱 전체 크래시가 된다.
//
// [왜 클래스인가]
// componentDidCatch/getDerivedStateFromError 는 **클래스에만 있는 React API** 다. 훅 등가물이
// 존재하지 않으며, react-error-boundary 도입은 이번 배치의 '라이브러리 금지' 제약에 걸린다.
// 이 파일이 이 앱의 유일한 클래스 컴포넌트인 이유다.
//
// [배치] AppShell 의 <Outlet> 바로 바깥에 두면 화면만 복구 UI 로 바뀌고 **셸(사이드바·헤더)은
// 살아남는다** — 그래서 다른 메뉴로 걸어 나갈 수 있다. 셸 자체가 던지는 경우를 위해 App 루트에도
// 한 겹 더 둔다.
//
// ─────────────────────────────────────────────────────────────────────────────
// [DS 승격 판단 — 2026-07-20: 분류표 Utilities/error-boundary 는 비워 둔다]
//
// 이 파일은 승격 후보로 지목됐고, 검토 결과 **DS 대상이 아니라고 판정했다.** 근거 넷:
//
//   1. 그릴 표면이 없다. render() 가 하는 일은 children 을 그대로 통과시키거나 fallback() 을
//      호출하는 것뿐이다 — 자기 DOM 이 한 노드도 없다. 그래서 계약 스키마가 요구하는
//      tokens(minProperties: 1)·anatomy 를 정직하게 채울 수 없고, 13값 states 열거형에서
//      고를 상태도 a11y.role 도 없다. 스키마가 못 받는다는 것은 취향이 아니라 구조 신호다.
//   2. 이 앱의 오류 모양을 안다. referenceOf(./http-error)는 이 제품의 HTTP 오류 형태에서
//      상관관계 코드를 뽑는다 — DS 가 이걸 들면 HTTP 오류 의미론까지 소유하게 된다.
//   3. 선례가 있다. shared/ui/ToastProvider 도 같은 이유(앱 층의 큐/컨텍스트라 계약 부적합)로
//      승격이 거절됐다. 같은 기준을 여기에 그대로 적용한다.
//   4. **시각 표면은 이미 승격됐다.** 이 경계가 보여 주는 것은 fallback 이고 그 fallback 은
//      ErrorScreens 다 — 그 껍데기가 @tds/ui 의 Result(분류표 Feedback/result-page)로 갔다.
//      즉 분류표가 이 행에서 원하던 UI 가치는 result-page 를 통해 이미 DS 에 들어와 있고,
//      여기 남은 것은 componentDidCatch 라는 **React 기구**뿐이다.
//
// 되돌리려면: 이 판단을 뒤집는 사실은 '경계 자체에 시각 표면이 생겼다' 하나뿐이다.
// 그때는 표면만 떼어 계약을 만들고 기구는 여기 남긴다 — 통째로 올리지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { referenceOf } from './http-error';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
  /** 복구 UI. resetKey 가 바뀌면 경계가 스스로 풀린다 — 라우트 이동이 곧 복구다 */
  readonly fallback: (state: ErrorBoundaryRenderState) => ReactNode;
  /** 이 값이 바뀌면 오류 상태를 버린다 (보통 location.pathname) */
  readonly resetKey?: string;
}

export interface ErrorBoundaryRenderState {
  readonly error: Error;
  /** 운영자가 신고에 붙일 짧은 상관관계 코드 (EXC-20) */
  readonly reference: string | null;
  /** 같은 화면을 다시 그려 본다 */
  readonly reset: () => void;
}

interface ErrorBoundaryState {
  readonly error: Error | null;
  readonly resetKey: string | undefined;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Pick<ErrorBoundaryState, 'error'> {
    return { error };
  }

  /**
   * resetKey 가 바뀌면 오류를 버린다 — **렌더 중에** 판정해야 한다.
   * componentDidUpdate 에서 setState 로 지우면 낡은 fallback 이 한 프레임 깜빡인다.
   */
  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): ErrorBoundaryState | null {
    if (props.resetKey === state.resetKey) return null;
    return { error: null, resetKey: props.resetKey };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // 로깅은 남긴다 — 참조 코드로 신고가 들어오면 이 줄과 대조한다 (EXC-20).
    // 경계가 예외를 삼키므로, 이 한 줄이 없으면 그 예외는 **어디에도 기록되지 않는다**.
    // TODO(backend): 원격 오류 수집(Sentry 등)이 붙으면 이 한 줄이 그 전송 지점이 된다.
    console.error('[ErrorBoundary]', referenceOf(error) ?? '(no-ref)', error, info.componentStack);
  }

  reset(): void {
    this.setState({ error: null });
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return this.props.fallback({
      error,
      reference: referenceOf(error),
      reset: this.reset,
    });
  }
}
