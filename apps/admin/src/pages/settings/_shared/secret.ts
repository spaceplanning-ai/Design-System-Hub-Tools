// 시크릿 취급 규약 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/**)
//
// ┌ 이 파일이 지키는 단 하나의 규칙 ───────────────────────────────────────────┐
// │ **평문 시크릿은 저장되지 않는다. 그러므로 다시 보여줄 수 없다.**              │
// │                                                                          │
// │ 이것은 '가려서 보여주기(masking)' 가 아니다. 마스킹은 값이 있는데 감추는 것이고, │
// │ 감춘 값은 언젠가 새어 나온다(DOM·리덕스 devtools·스크린샷·로그).               │
// │ 그래서 이 섹션의 모델은 평문을 **애초에 갖지 않는다** — 키가 걸려 있는지(hasSecret) │
// │ 만 안다. 화면이 그리는 고정 길이 글리프는 원본을 가린 표시가 아니라               │
// │ **우리가 가진 정보의 전부**다.                                               │
// │                                                                          │
// │ 저장 순간의 평문만 예외다: 운영자가 폼에 입력한 값은 저장 요청에만 실리고,          │
// │ 응답이 돌아오면 모델은 다시 `hasSecret` 만 안다.                                │
// └──────────────────────────────────────────────────────────────────────────┘
//
// [지워진 것 — maskSecret · previewOf · SecretPreview]
// 목록/상세는 한때 `sk_test_••••0001` 처럼 **접두어 + 마지막 4자**를 보여 줬다. 지금은 고정 길이
// 글리프(MASKED_SECRET_TEXT) 하나로 통일해, 자릿수도 마지막 4자도 노출하지 않는다 —
// '길이도 정보다' 를 끝까지 밀고 간 결과다. 그래서 세 표면은 소비자가 0이 됐고 삭제했다.
// 다시 필요해지면 그때 계약과 함께 되살린다 (죽은 공개 표면 0).
//
// [지워진 것 — createDummyPlaintextKey]
// API Key 발급 시연이 쓰던 더미 평문 생성기다. 발급·폐기 화면(Rest API V2 카드)이 통째로
// 사라지면서 소비자가 0이 됐다 — 자격증명 발급은 연동 마켓스토어의 관심사가 아니었다.
// 남은 소비자는 OAuth 설정뿐이고 그쪽은 평문을 **만들지 않고 입력받는다**.

/** 저장된 OAuth client secret 의 표시 — 마지막 4자도 남기지 않는다(식별이 이름으로 충분하다) */
export const MASKED_SECRET_TEXT = '••••••••••••';

/**
 * 클립보드 복사 — 실패를 삼키지 않는다(호출부가 성공/실패를 토스트로 알린다).
 *
 * navigator.clipboard 는 보안 컨텍스트(https/localhost)에서만 존재한다 — 없으면 false 를 돌려주고
 * 화면이 '직접 복사해 주세요' 로 안내한다. 조용히 아무 일도 일어나지 않는 경로를 만들지 않는다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator.clipboard === 'undefined') return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
