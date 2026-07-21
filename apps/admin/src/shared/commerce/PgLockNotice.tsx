// 잠금 안내 — 잠긴 섹션이 **한 벌의 같은 모습**으로 말하게 한다
//
// [왜 한 벌인가] 상품 폼의 적립금, 쿠폰 목록, 적립금 정책, 통계·대시보드가 각자 배너를 그리면
// 운영자는 화면마다 새로 읽어야 한다. 사유·다음 행동(결제 설정)·값 보존 약속 셋은 언제나 같으므로
// 모양도 하나여야 한다.
//
// [왜 shared/commerce 인가] 이 배너가 아는 것은 결제 설정의 사실뿐이다(사유 문구·설정 경로·문의
// 창구). 화면 폴더에 두면 그 화면을 지울 때 함께 사라지고, 다른 화면이 복제본을 만든다.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Alert, alertActionRowStyle } from '../ui';
import { INQUIRY_PATH, PAYMENT_SETTINGS_PATH } from './payment-settings';
import type { CommerceDomain } from './payment-settings';

interface PgLockNoticeProps {
  /** 왜 잠겼는지 — pgLock() 이 돌려준 문구를 그대로 넘긴다(화면이 지어내지 않는다) */
  readonly reason: string;
  /**
   * 문의 창구 링크를 함께 걸 도메인. 생략하면 결제 설정 링크만 붙는다.
   *
   * 결제가 없는 동안 고객의 요청이 실제로 쌓이는 곳이라, '지금 무엇을 봐야 하는가' 의 답이다.
   */
  readonly inquiryDomain?: CommerceDomain | undefined;
  /** 화면 고유의 한 줄 — 예: 목록이 무엇을 감췄는지 */
  readonly children?: ReactNode;
}

/**
 * 잠긴 섹션 위에 얹는 안내 한 줄.
 *
 * 톤은 info 다 — 잠금은 **오류가 아니라 설정의 결과**이고, danger 로 칠하면 운영자는 고장으로 읽는다.
 */
export function PgLockNotice({ reason, inquiryDomain, children }: PgLockNoticeProps) {
  return (
    <Alert tone="info">
      <div style={alertActionRowStyle}>
        <span>
          {reason}
          {children}
        </span>
        <Link to={PAYMENT_SETTINGS_PATH} className="tds-ui-link tds-ui-focusable">
          결제 설정 열기
        </Link>
        {inquiryDomain !== undefined && (
          <Link to={INQUIRY_PATH[inquiryDomain]} className="tds-ui-link tds-ui-focusable">
            문의 화면 열기
          </Link>
        )}
      </div>
    </Alert>
  );
}
