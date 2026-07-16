// Toast — 계약 검증 테스트 (contracts/Toast.contract.json@1.0.0)
//
//   kind      톤·아이콘·라이브·자동소멸을 정한다
//   a11y      success/cancelled/info → role="status"/polite · error → role="alert"/assertive
//   auto      success 4초 · cancelled 2초 · info 4초 · error 는 자동소멸 없음
//   onDismiss 타이머·닫기·재시도가 이 토스트의 id 를 인자로 부른다
//   onRetry   주면 '다시 시도' 버튼이 나타나고, 누르면 닫고 재시도한다
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Toast } from './Toast';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('Toast — 계약 kind·a11y·라이프사이클', () => {
  it('Toast: default — info kind 는 role="status" + aria-live="polite" 로 문구를 렌더한다', () => {
    render(<Toast id="t1" kind="info" message="변경 사항이 저장되었습니다" onDismiss={vi.fn()} />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toContain('변경 사항이 저장되었습니다');
  });

  it('Toast: error kind 는 role="alert" + aria-live="assertive" 다', () => {
    render(<Toast id="t1" kind="error" message="실패했습니다" onDismiss={vi.fn()} />);
    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
  });

  it('Toast: success 는 4초 후 onDismiss(id) 로 자동 소멸한다', () => {
    const onDismiss = vi.fn();
    render(<Toast id="t9" kind="success" message="완료" onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4000);
    expect(onDismiss).toHaveBeenCalledWith('t9');
  });

  it('Toast: cancelled 는 2초 후 자동 소멸한다', () => {
    const onDismiss = vi.fn();
    render(<Toast id="t2" kind="cancelled" message="취소됨" onDismiss={onDismiss} />);
    vi.advanceTimersByTime(1999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledWith('t2');
  });

  it('Toast: error 는 자동으로 사라지지 않는다 (타이머 없음)', () => {
    const onDismiss = vi.fn();
    render(<Toast id="t3" kind="error" message="실패" onDismiss={onDismiss} />);
    vi.advanceTimersByTime(60000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('Toast: 닫기(×) 버튼은 onDismiss 를 이 토스트 id 로 호출한다', () => {
    const onDismiss = vi.fn();
    render(<Toast id="t4" kind="error" message="실패" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }));
    expect(onDismiss).toHaveBeenCalledWith('t4');
  });

  it('Toast: onRetry 가 없으면 다시 시도 버튼이 없다', () => {
    render(<Toast id="t5" kind="error" message="실패" onDismiss={vi.fn()} />);
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBeNull();
  });

  it('Toast: onRetry 를 주면 다시 시도 버튼이 나타나고, 누르면 닫고(onDismiss) 재시도한다', () => {
    const onDismiss = vi.fn();
    const onRetry = vi.fn();
    render(<Toast id="t6" kind="error" message="실패" onDismiss={onDismiss} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onDismiss).toHaveBeenCalledWith('t6');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
