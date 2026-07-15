// 일괄 쓰기 공용 유틸 (A41 소유 — apps/admin/src/shared/**)
//
// 콘텐츠 목록 6종의 '일괄 삭제 / 일괄 ON·OFF' 가 같은 규약을 쓴다: 선택된 항목마다 쓰기 요청을
// 병렬로 보내고, **부분 실패도 건수로 알린다**(하나가 실패해도 나머지는 반영). 취소(abort)는
// 실패로 세지 않는다 — 화면을 떠났거나 다이얼로그를 닫은 것이므로.
//
// 회원 목록의 useDeleteMembers/useBulkSendNotification 이 손으로 하던 allSettled 집계를 콘텐츠
// 목록이 다섯·여섯 번째 소비자가 되며 여기 한 곳으로 모은다.
import { isAbort } from './async';

/**
 * 항목마다 run 을 병렬 실행하고 **취소가 아닌 실패의 개수**를 돌려준다(0 = 전원 성공).
 * 백엔드가 붙으면 run 이 실제 요청이 되고 이 집계는 그대로 쓰인다.
 */
export async function settleAll<T>(
  items: readonly T[],
  run: (item: T) => Promise<unknown>,
): Promise<number> {
  const results = await Promise.allSettled(items.map((item) => run(item)));
  return results.filter((result) => result.status === 'rejected' && !isAbort(result.reason)).length;
}
