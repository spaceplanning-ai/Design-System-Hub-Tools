// 안내 콜아웃 — 연한 보라 상자에 제약을 적어 둔다
//
// [왜 Alert 가 아닌가] Alert 는 **방금 일어난 일**(저장 실패·승인 반려)을 알리는 피드백 배너이고
// role/aria-live 로 그 사실을 AT 에 통지한다. 여기 적히는 것은 '언제나 참인 제약'(글자 수 한도·
// 허용 확장자)이라 통지 대상이 아니다 — 화면이 뜰 때마다 스크린리더가 "SMS 는 90자" 를 읽어 주면
// 그건 알림이 아니라 소음이다. 그래서 aria-live 없는 정적 목록으로 둔다.
import type { CSSProperties } from 'react';

import { calloutListStyle, calloutStyle } from '../styles';
import { InfoGlyph } from './glyphs';

const iconStyle: CSSProperties = { flex: 'none' };

interface InfoCalloutProps {
  /** 제약 문구들 — 목업이 적어 둔 영문 그대로 온다 */
  readonly lines: readonly string[];
}

export function InfoCallout({ lines }: InfoCalloutProps) {
  return (
    <div style={calloutStyle}>
      <InfoGlyph style={iconStyle} />
      <ul style={calloutListStyle}>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
