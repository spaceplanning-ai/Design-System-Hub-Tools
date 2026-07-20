// 시크릿 취급 회귀 테스트 (시스템 설정 섹션)
//
// 여기서 지키는 것은 스타일이 아니라 **보안 계약**이다: 저장된 시크릿 표시는 자릿수조차
// 암시하지 않는다. 이 단언이 깨지면 '평문은 다시 보여줄 수 없다' 가 거짓이 된다.
//
// [지워진 것] maskSecret/previewOf 의 테스트는 그 두 함수와 함께 사라졌고,
// createDummyPlaintextKey 의 테스트는 API Key 발급 화면이 사라지며 함께 사라졌다(secret.ts 머리말).
import { describe, expect, it } from 'vitest';

import { MASKED_SECRET_TEXT } from './secret';

describe('MASKED_SECRET_TEXT — 저장된 OAuth 시크릿 표시', () => {
  it('자릿수를 암시하지 않는 고정 글리프다', () => {
    expect(/^•+$/.test(MASKED_SECRET_TEXT)).toBe(true);
  });
});
