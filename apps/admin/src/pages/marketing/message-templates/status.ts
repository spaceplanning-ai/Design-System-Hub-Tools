// 발행 상태 전이 · 화면별 허용 액션 (초안 → 발행 → 사용중 ↔ 미사용)
//
// [왜 화면이 아니라 여기인가] 같은 전이를 세 곳이 판단한다: 편집기 헤더(초안 저장 / 발행 / 변경 저장),
// 상세 헤더(토글 · 수정 · 발행 · 삭제), 그리고 저장소. 세 곳이 각자 `status === 'draft'` 를 세면
// 한 곳만 고쳐진 채 나머지가 남는다 — 전이 규칙의 정본을 한 파일에 둔다(테스트도 여기를 겨눈다).
import type { StatusTone } from '../../../shared/ui';
import { isPublished } from './types';
import type { TemplateStatus } from './types';

/**
 * 상태 배지의 색 의도.
 *
 * 목업은 사용중 초록 · 미사용 회색 · 초안 테두리형이다. StatusBadge 의 tone 중 neutral 이
 * '회색 표면 + 테두리' 라 미사용과 초안이 같은 색이 된다 — 둘은 '발행됐지만 꺼짐' 과 '아직
 * 발행 전' 이라 목록에서 반드시 갈라져야 한다. 그래서 초안만 info 로 띄운다: 색은 목업과 다르지만
 * **두 상태가 구분된다는 것**이 이 열의 목적이고, 문구(초안/미사용)가 의미를 이중 전달한다.
 */
export function statusToneOf(status: TemplateStatus): StatusTone {
  if (status === 'active') return 'success';
  return status === 'draft' ? 'info' : 'neutral';
}

/**
 * 발행 — 초안을 켠 채로 내보낸다.
 *
 * [왜 active 인가] 발행은 '이제 이 템플릿을 발송 화면이 고를 수 있다' 는 선언이다. 발행하고도 꺼져
 * 있으면 아무 데서도 고를 수 없어 발행이 아무 일도 하지 않은 것이 된다. 끄고 싶으면 발행 뒤에 토글로
 * 끈다 — 두 행위를 하나로 합치지 않는다.
 *
 * 이미 발행된 것은 그대로 둔다. 다시 발행해도 켜지지 않는다 — 운영자가 꺼 둔 것을 '발행' 버튼이
 * 몰래 되켜면 그건 토글을 무시하는 것이다(상세 화면은 그래서 draft 에만 발행을 노출한다).
 */
export function publishedStatusOf(status: TemplateStatus): TemplateStatus {
  return status === 'draft' ? 'active' : status;
}

/**
 * 사용 여부 토글 — 켜고 끈다.
 *
 * 초안은 토글 대상이 아니다(아직 발행되지 않았다). 초안에 토글을 걸면 '발행하지 않고 켠' 상태가
 * 생겨 draft/active 의 구분이 무너지므로 그대로 돌려준다 — 화면은 애초에 토글을 그리지 않는다.
 */
export function toggledStatusOf(status: TemplateStatus): TemplateStatus {
  if (status === 'active') return 'inactive';
  if (status === 'inactive') return 'active';
  return status;
}

/**
 * 상세 화면 헤더가 그릴 액션 — 상태마다 통째로 갈린다.
 *
 *   active   → [사용 여부 토글 ON] [삭제]
 *   inactive → [사용 여부 토글 OFF] [삭제] [수정]
 *   draft    → [삭제] [수정] [발행]
 *
 * [왜 active 에는 수정이 없나] 켜져 있는 템플릿은 지금 이 순간 발송에 쓰이는 문구다. 그 자리에서
 * 본문을 갈아치우면 '어제 받은 문자와 오늘 받은 문자가 같은 템플릿인데 다르다' 가 된다. 고치려면
 * 먼저 끄게 한다 — 끄는 것은 한 번의 토글이고, 그 한 번이 '지금 쓰이는 것을 건드린다' 는 사실을
 * 운영자에게 알린다.
 */
export interface TemplateActions {
  /** 사용 여부 토글을 그리는가 — 발행된 것만 */
  readonly canToggleActive: boolean;
  readonly canEdit: boolean;
  readonly canPublish: boolean;
  readonly canDelete: boolean;
}

export function actionsFor(status: TemplateStatus): TemplateActions {
  return {
    canToggleActive: isPublished(status),
    canEdit: status !== 'active',
    canPublish: status === 'draft',
    canDelete: true,
  };
}
