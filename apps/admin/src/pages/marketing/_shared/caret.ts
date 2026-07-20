// 커서 자리에 끼워 넣기 — 변수 삽입이 문장 가운데를 겨눌 수 있게 한다
//
// [왜 끝에 붙이면 안 되나] '{안녕하세요} 님, 주문이 접수되었습니다' 의 '님' 앞에 이름을 넣으려던
// 운영자가 매번 끝에 붙은 토큰을 잘라내어 옮겨야 한다. 변수는 대개 문장 **가운데**에 들어가므로
// 끝에 붙이는 것은 거의 항상 틀린 자리다.

/**
 * 편집 중인 글 조각의 선택 범위 — 접힌 커서면 start === end.
 *
 * export 하지 않는다: 호출부는 `activeCaretRange()` 가 준 값을 `insertAtCaret()` 에 그대로
 * 넘길 뿐 이 이름을 적을 일이 없다(추론으로 충분하다). 쓰이지 않는 export 는 공개 표면만
 * 넓힌다 — 클린코드 점검 축5.
 */
interface CaretRange {
  readonly start: number;
  readonly end: number;
}

/**
 * 순수 삽입 — 선택 범위를 토큰으로 갈아 끼운다.
 *
 * 선택된 글자가 있으면 **덮어쓴다**. 흔한 흐름이기 때문이다: 자리표시로 적어 둔 '[이름]' 을
 * 드래그해 놓고 변수를 누른다. 그때 지우지 않고 끼워 넣으면 '[이름]#{member.name}' 이 된다.
 *
 * 범위가 없으면(포커스가 본문 밖) 끝에 붙인다 — 자리를 모르는 채로 가운데를 추측하는 것보다
 * 예측 가능한 실패다.
 */
export function insertAtCaret(text: string, token: string, range: CaretRange | null): string {
  if (range === null) return `${text}${token}`;

  // 범위를 글자 수 안으로 가둔다 — DOM 이 준 값이 항상 최신 value 와 맞는다는 보장은 없다
  const start = Math.max(0, Math.min(range.start, text.length));
  const end = Math.max(start, Math.min(range.end, text.length));
  return `${text.slice(0, start)}${token}${text.slice(end)}`;
}

// [넣지 않았다] caretAfterInsert — 삽입 뒤 커서를 토큰 끝으로 되돌려 놓는 함수를 두려 했으나
//   소비자가 생기지 않았다. 커서를 옮기려면 입력 DOM 노드에 setSelectionRange 를 불러야 하는데,
//   이메일 빌더의 본문은 계약 컴포넌트 TextareaField 가 그리므로 노드를 붙잡을 구멍이 없다
//   (activeCaretRange 머리말의 (1)(2)(3) 과 같은 제약). 값만 계산해 두고 쓰지 못하는 함수는
//   죽은 코드라 남기지 않는다 — 필요해지는 날 그 자리에서 만든다.

/**
 * 지금 포커스를 가진 입력의 선택 범위 — 없으면 null.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * [왜 ref 가 아니라 document.activeElement 인가 — 이 우회를 남기는 이유]
 *
 * 문자 편집기는 textarea 를 자기가 그리므로 ref 를 붙여 selectionStart 를 읽는다(그쪽이 더
 * 정확하고, 그래서 그 방식을 유지한다). 이메일 빌더는 다르다 — 블록 본문을 계약 컴포넌트
 * `TextareaField`(@tds/ui)가 그리고, 그 계약에는 ref 를 넘길 구멍이 없다.
 *
 * 선택지는 셋이었다.
 *   (1) 계약에 ref prop 을 추가한다 — 변수 삽입 하나 때문에 DS 계약을 넓히는 것은 값이 비싸다.
 *       계약 변경은 codegen·Figma·contract-test 를 전부 건드린다.
 *   (2) 그 자리만 계약을 버리고 raw textarea 로 그린다 — 이메일 빌더의 본문 입력만 앱의 다른
 *       입력과 테두리·포커스링·잠금 표현이 어긋난다.
 *   (3) 포커스를 가진 노드에서 읽는다 — 지금 것.
 *
 * (3)의 전제는 '변수 버튼을 누르기 직전까지 포커스가 본문에 있었다' 인데, 버튼을 누르는 순간
 * 포커스는 버튼으로 옮겨 간다. 그래서 **onMouseDown 에서 preventDefault** 로 포커스 이동을
 * 막아야 이 함수가 본문을 본다 — 그 배선은 호출부(EmailToolbar 의 변수 버튼)가 한다.
 * 전제가 깨지면 range 가 null 이 되고 위 insertAtCaret 이 끝에 붙인다(안전한 퇴화).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function activeCaretRange(): CaretRange | null {
  // 서버 렌더·테스트 환경 방어 — document 가 없으면 자리를 알 길이 없다
  if (typeof document === 'undefined') return null;

  const node = document.activeElement;
  if (!(node instanceof HTMLTextAreaElement) && !(node instanceof HTMLInputElement)) return null;
  // number·checkbox 등은 selectionStart 가 null 이다(사양) — text/textarea 만 자리를 안다
  if (node.selectionStart === null) return null;

  const start = node.selectionStart;
  return { start, end: node.selectionEnd ?? start };
}
