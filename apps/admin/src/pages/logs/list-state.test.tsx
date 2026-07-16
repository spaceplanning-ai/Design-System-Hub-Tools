// 검색 입력의 IME 동작 (COMP-10) — apps/admin/src/pages/logs/**
//
// ─────────────────────────────────────────────────────────────────────────────
// [왜 이 테스트가 P0 인가]
//
// 한국 운영자는 **전부 IME 로 입력한다.** '홍길동' 을 치면 브라우저는 ㅎ → 호 → 홍 → 홍ㄱ …
// 자모마다 change 이벤트를 쏜다. 이것을 막지 않으면
//   · 완성된 단어 하나에 **10번 넘는 조회**가 나가고,
//   · 늦게 도착한 '홀' 의 응답이 '홍길동' 의 응답을 덮어쓴다 (last-response-wins).
//
// **영어 QA 에서는 절대 재현되지 않는다** — 영문 입력에는 조합 단계가 없기 때문이다.
// 그래서 이 회귀는 코드 리뷰로도, 수동 테스트로도 잡히지 않는다. 기계가 잡아야 한다.
// ─────────────────────────────────────────────────────────────────────────────
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSearchInput } from './list-state';

/** 디바운스가 지나가게 한다 (SEARCH_DEBOUNCE_MS = 250) */
function runDebounce(): void {
  act(() => {
    vi.advanceTimersByTime(300);
  });
}

describe('useSearchInput — 조합이 끝나야 조회한다', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('**조합 중에는 한 번도 커밋하지 않는다** — 자모마다 조회가 나가면 안 된다', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSearchInput('', onCommit));

    // '홍길동' 을 치는 동안 브라우저가 실제로 쏘는 순서
    act(() => {
      result.current.onCompositionStart();
    });
    for (const jamo of ['ㅎ', '호', '홍', '홍ㄱ', '홍기', '홍길', '홍길ㄷ', '홍길도', '홍길동']) {
      act(() => {
        result.current.onChange(jamo);
      });
      runDebounce();
    }

    // 디바운스가 아홉 번 지나갔는데도 조회는 0건이다
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('조합이 끝나면 **정확히 한 번** 커밋한다 (자모당 한 번이 아니다)', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSearchInput('', onCommit));

    act(() => {
      result.current.onCompositionStart();
      result.current.onChange('홍');
      result.current.onChange('홍길');
    });
    act(() => {
      result.current.onCompositionEnd('홍길동');
    });
    runDebounce();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('홍길동');
  });

  it('조합 중의 Enter 는 submit 이 아니다 — 한글을 확정하는 키다', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSearchInput('', onCommit));

    // isComposing=true 인 Enter 는 호출부가 무시해야 한다
    expect(result.current.shouldIgnoreKey(true)).toBe(true);
    // 조합이 끝난 뒤의 Enter 는 통과한다
    expect(result.current.shouldIgnoreKey(false)).toBe(false);
  });

  it('영문 입력은 디바운스 뒤 한 번 커밋한다 (조합 단계가 없다)', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSearchInput('', onCommit));

    act(() => {
      result.current.onChange('o');
      result.current.onChange('op');
      result.current.onChange('ops');
    });
    runDebounce();

    // 세 글자를 쳤지만 조회는 한 번 — 마지막 값으로
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('ops');
  });

  it('디바운스가 끝나기 전의 추가 입력은 앞의 타이머를 취소한다', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSearchInput('', onCommit));

    act(() => {
      result.current.onChange('a');
    });
    act(() => {
      vi.advanceTimersByTime(100); // 아직 250 이 안 됐다
    });
    act(() => {
      result.current.onChange('ab');
    });
    runDebounce();

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('ab');
  });

  it('같은 값으로는 다시 커밋하지 않는다 — 조회를 헛돌리지 않는다', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSearchInput('ops', onCommit));

    act(() => {
      result.current.onChange('ops');
    });
    runDebounce();

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('밖에서 검색어가 바뀌면(뒤로가기·링크 진입·검색 지우기) 입력칸이 따라온다', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ committed }: { committed: string }) => useSearchInput(committed, onCommit),
      { initialProps: { committed: 'ops' } },
    );

    expect(result.current.value).toBe('ops');

    // URL 이 바뀌었다 (예: Empty 의 '검색 지우기')
    rerender({ committed: '' });
    expect(result.current.value).toBe('');

    // 그리고 그 동기화가 다시 커밋을 유발하지 않는다 (무한 루프 방지)
    runDebounce();
    expect(onCommit).not.toHaveBeenCalled();
  });
});
