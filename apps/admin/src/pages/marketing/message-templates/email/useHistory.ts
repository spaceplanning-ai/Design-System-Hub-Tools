// 되돌리기/다시하기 — 제어 컴포넌트 위에서의 이력
//
// [어려운 점] 이 빌더는 값을 소유하지 않는다(value/onChange). 그런데 undo 는 '이전 값' 을 알아야
// 하므로 **누군가는 지나간 값을 기억해야 한다**. 값의 주인(부모)에게 이력까지 지우면 빌더를 쓰는
// 모든 화면이 이력 코드를 복제한다. 그래서 이력만 여기서 갖고, 되돌릴 때 onChange 로 부모에게
// 옛 값을 돌려준다 — 부모는 여전히 값의 유일한 주인이다.
//
// [왜 past 를 ref 가 아니라 state 로도 갖나] canUndo/canRedo 는 버튼의 disabled 를 정한다. ref 만
// 쓰면 이력이 바뀌어도 리렌더가 일어나지 않아 버튼이 계속 잠긴 채로 남는다. 그래서 배열 자체를
// state 로 둔다(길이가 50 이하라 복사 비용이 문제되지 않는다).
//
// [상한 50] 무한 이력은 대용량 본문 50개를 통째로 들고 있는 것과 같다. 오래된 것부터 버린다 —
// 실제 편집에서 50번 이전으로 돌아가는 일은 없고, 있다면 그것은 되돌리기가 아니라 다시 만드는 일이다.
import { useCallback, useRef, useState } from 'react';

/** 이력 상한 — 이보다 오래된 상태는 버린다 */
export const HISTORY_LIMIT = 50;

export interface HistoryHandle<T> {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** 새 값으로 바꾸며 현재 값을 이력에 쌓는다 (되돌릴 수 있는 변경) */
  readonly commit: (next: T) => void;
  readonly undo: () => void;
  readonly redo: () => void;
}

export function useHistory<T>(value: T, onChange: (next: T) => void): HistoryHandle<T> {
  const [past, setPast] = useState<readonly T[]>([]);
  const [future, setFuture] = useState<readonly T[]>([]);

  /**
   * 최신 value/onChange 를 콜백이 deps 없이 읽게 한다 — commit/undo/redo 의 참조가 매 렌더
   * 바뀌면 이들을 deps 로 받는 하위 컴포넌트가 통째로 리렌더된다.
   */
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  /* [갱신 함수 안에서 다른 setState 를 부르지 않는다] React 18 StrictMode 는 상태 갱신 함수를
   * 두 번 호출한다(순수성 검사). 갱신 함수 안에 setFuture/onChange 같은 부수효과를 넣으면 그
   * 부수효과가 **두 번** 일어나 이력이 어긋난다. 그래서 다음 값을 먼저 계산해 두고 평범한
   * setState 로 넘긴다 — past/future 를 deps 로 받아 참조가 바뀌는 비용은 감수한다. */

  const commit = useCallback((next: T) => {
    setPast((prev) => {
      const grown = [...prev, valueRef.current];
      // 상한을 넘으면 **가장 오래된 것**부터 버린다
      return grown.length > HISTORY_LIMIT ? grown.slice(grown.length - HISTORY_LIMIT) : grown;
    });
    // 새 갈래가 생기면 되돌아갈 미래는 더 이상 유효하지 않다
    setFuture([]);
    onChangeRef.current(next);
  }, []);

  const undo = useCallback(() => {
    const previous = past[past.length - 1];
    if (previous === undefined) return;
    setPast(past.slice(0, -1));
    setFuture([valueRef.current, ...future]);
    onChangeRef.current(previous);
  }, [past, future]);

  const redo = useCallback(() => {
    const [upcoming, ...rest] = future;
    if (upcoming === undefined) return;
    setPast([...past, valueRef.current]);
    setFuture(rest);
    onChangeRef.current(upcoming);
  }, [past, future]);

  return { canUndo: past.length > 0, canRedo: future.length > 0, commit, undo, redo };
}
