// 일괄 쓰기 집계(settleAll) 단언 (A41)
//
// 콘텐츠 목록 6종의 일괄 삭제/ON·OFF 가 공유하는 규약: 부분 실패도 건수로 알리고, 취소는 실패가 아니다.
import { describe, expect, it } from 'vitest';

import { settleAll } from './bulk';

describe('settleAll — 일괄 쓰기 집계', () => {
  it('전원 성공이면 실패 0', async () => {
    expect(await settleAll(['a', 'b', 'c'], () => Promise.resolve())).toBe(0);
  });

  it('실패 건수를 센다', async () => {
    const failed = await settleAll(['a', 'b', 'c'], (id) =>
      id === 'b' ? Promise.reject(new Error('실패')) : Promise.resolve(),
    );
    expect(failed).toBe(1);
  });

  it('취소(AbortError)는 실패로 세지 않는다', async () => {
    const abortError = new DOMException('요청이 취소되었습니다.', 'AbortError');
    const failed = await settleAll(['a', 'b'], (id) =>
      id === 'a' ? Promise.reject(abortError) : Promise.resolve(),
    );
    expect(failed).toBe(0);
  });

  it('빈 목록은 실패 0', async () => {
    expect(await settleAll([], () => Promise.resolve())).toBe(0);
  });
});
