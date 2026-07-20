// 치환 변수 — 계약과 등록기 (데이터는 여기 없다)
//
// ─────────────────────────────────────────────────────────────────────────────
// [이 파일이 목록을 갖지 않는 이유 — 축1 페이지 간 결합]
//
// 카탈로그는 6개 도메인(회원·영업·콘텐츠·상품·포트폴리오·고객센터)의 값을 다룬다. 그 목록을
// 소비하는 곳은 마케팅 편집기다. 만약 `pages/marketing` 이 6개 도메인의 타입·픽스처를 직접
// import 하면 pages/marketing → pages/members, → pages/sales … 로 결합이 6줄 생기고
// code-quality 축1(page-coupling, blocker, 임계값 0건)이 그대로 잡는다.
//
// 방향을 뒤집는다: **공통 층인 여기는 자리(계약 + 등록기)만 만들고**, 실제 목록은
// `shared/domain/template-variable-catalog.ts` 가 리터럴로 들고, 그것을 등록하는 일은 두 쪽을
// 모두 아는 `wiring.ts` 가 한다. 마케팅 편집기는 끝까지 '회원'·'상품' 이라는 낱말을 모른 채
// `templateVariableCatalog()` 가 돌려주는 것만 그린다.
// (같은 결의 선례: `shared/fixtures/admin-groups.ts` 의 registerSenderUsageLookup)
//
// ─────────────────────────────────────────────────────────────────────────────
// [왜 fail-closed 가 아닌가 — admin-groups 와 반대로 간다]
//
// 발신 프로필 조회기는 등록되지 않으면 null 을 주고 삭제를 **거절**한다(fail-closed). 모르면
// 막는 것이 안전한 판단이기 때문이다.
//
// 여기서 같은 규칙을 쓰면 정반대로 위험해진다. 이 카탈로그의 소비자 중 하나가 '알 수 없는 토큰
// 경고' 인데, 배선되지 않은 상태에서 카탈로그를 빈 배열로 주면 **본문의 멀쩡한 토큰이 전부 오타로
// 보인다**. 페이지 단위 테스트는 App 을 렌더하지 않으므로 그 상태가 실제로 일어난다 —
// 그러면 경고는 제품이 아니라 미배선 상태를 검증하게 되고, 운영자에게는 '전부 오타' 라는
// 거짓말을 하게 된다. 거짓 경고는 진짜 경고를 무시하게 만들어서 경고 기능 자체를 죽인다.
//
// 그래서 '비었다(배열 0건)' 와 '모른다(null)' 를 구분한다. 모르는 동안 판정은 **보류**한다.
// ─────────────────────────────────────────────────────────────────────────────

/* ── 토큰 표기 ─────────────────────────────────────────────────────────────────
 *
 * `#{namespace.field}` — 겉껍질은 `#{...}`, 안쪽 이름은 영문 lowerCamelCase 점 표기.
 *
 * [왜 `{{...}}` 가 아닌가] 이 리포는 `#{...}` 를 전 채널 공통 문법으로 이미 확정했고, 그것을
 * 읽는 코드가 여럿이다 — `marketing/_shared/messaging.ts` 의 countVariables·isVariableOnlyBody,
 * `message-templates/kakao.ts` 의 VARIABLE_RE·variableTokensOf, `components/VariableText.tsx` 의
 * 하이라이트. 표기를 갈아타면 저 셋이 토큰을 못 본다. 특히 알림톡은 variableTokensOf 로
 * **심사 제출용 예시값 입력칸**을 만들므로, 칸이 안 생긴 채 제출돼 반려된다. 솔라피·카카오가
 * 쓰는 문법도 `#{...}` 다 — 바꿀 것은 표기가 아니라 안쪽 이름이다.
 *
 * [왜 안쪽이 영문인가] 발송 대행사(솔라피·카카오)와 주고받는 키이고, 장차 백엔드 응답의 필드
 * 경로와 1:1 로 붙는다. 한글 키는 인코딩·정규화(NFC/NFD)에서 조용히 어긋난다. 사람이 고르는
 * 화면은 한국어 라벨이고, 본문에 꽂히는 것은 영문 토큰이다 — 이 둘은 별개의 층이다.
 *
 * [규칙 하나를 전 도메인에 적용한다]
 *   namespace — 엔티티 이름 단수 lowerCamelCase (member, quote, returnRequest, caseStudy …)
 *   field     — 필드 이름 lowerCamelCase (name, totalAmount, validUntil …)
 *   구분자    — 점 하나. 중첩은 늘리지 않는다(`a.b.c` 금지) — 깊이가 늘면 사람이 못 외운다.
 *   ASCII 만. 대문자 시작·언더스코어·하이픈 금지.
 */
const TOKEN_KEY_RE = /^[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*$/;

/** 네이밍 규칙에 맞는 키인가 — 카탈로그 자기검사(테스트)가 전 항목에 대고 돌린다 */
export function isTemplateVariableKey(key: string): boolean {
  return TOKEN_KEY_RE.test(key);
}

/** 본문에 꽂히는 문자열 — `#{member.name}` */
export function templateVariableToken(key: string): string {
  return `#{${key}}`;
}

/* ── 계약 ──────────────────────────────────────────────────────────────────── */

/**
 * 치환 변수 한 항목.
 *
 * [왜 sample 이 필수인가] 미리보기가 토큰을 그대로 보여 주면 운영자는 '수신자에게 어떻게 읽히는가'
 * 를 끝내 확인하지 못한다. 표본값 없이 추가할 수 있게 두면 값이 빈 항목이 섞이고 미리보기가
 * 군데군데 빈칸으로 나온다 — 그 빈칸이 버그인지 데이터인지 구분할 수 없다. 그래서 선택 항목이
 * 아니라 계약이다.
 */
interface TemplateVariable {
  /** `namespace.field` — 본문에는 `#{...}` 로 감싸 들어간다 */
  readonly key: string;
  /** 고르는 화면에 보이는 **한국어** 라벨 — 화면에서 실제로 쓰는 낱말이어야 한다 */
  readonly label: string;
  /** 미리보기 치환에 쓰는 표본값. 실제 픽스처에서 가져온 값이라 길이 감각이 맞는다 */
  readonly sample: string;
  /** 근거 — 이 필드가 실제로 존재하는 파일. 지어낸 항목을 막는 장치다 */
  readonly source: string;
}

/** 도메인 묶음 — 고르는 화면의 한국어 그룹 하나 */
interface TemplateVariableGroup {
  /** 한국어 도메인 이름 — '회원' · '영업' · '콘텐츠' · '상품' · '포트폴리오' · '고객센터' */
  readonly label: string;
  readonly variables: readonly TemplateVariable[];
}

export type TemplateVariableCatalog = readonly TemplateVariableGroup[];

/* ── 등록기 ────────────────────────────────────────────────────────────────── */

let catalog: TemplateVariableCatalog | null = null;

/** 카탈로그를 꽂는다 — 여러 번 불러도 결과가 같다(멱등). 호출자는 `wiring.ts` 하나다 */
export function registerTemplateVariableCatalog(next: TemplateVariableCatalog): void {
  catalog = next;
}

/**
 * 카탈로그를 읽는다 — **배선되지 않았으면 null**(빈 배열이 아니다).
 *
 * 호출부는 null 을 '모른다' 로 다뤄야 한다(머리말). 빈 배열로 뭉개면 알 수 없는 토큰 경고가
 * 멀쩡한 본문을 전부 오타로 신고한다.
 */
export function templateVariableCatalog(): TemplateVariableCatalog | null {
  return catalog;
}

/* ── 조회 · 검색 ──────────────────────────────────────────────────────────── */

/** 평평하게 편 전체 목록 — 검색·치환·검증이 그룹을 신경 쓰지 않게 한다 */
function flatten(groups: TemplateVariableCatalog): readonly TemplateVariable[] {
  return groups.flatMap((group) => group.variables);
}

/** 키로 한 항목을 찾는다 — 없으면 undefined(= 카탈로그에 없는 토큰) */
export function findTemplateVariable(key: string): TemplateVariable | undefined {
  const groups = catalog;
  if (groups === null) return undefined;
  return flatten(groups).find((variable) => variable.key === key);
}

/**
 * 검색 — 한국어 라벨 · 영문 키 · 도메인 이름 어느 쪽이 걸려도 남긴다.
 *
 * [왜 셋 다인가] 고르는 사람은 '이름' 으로 찾고, 본문을 검수하는 사람은 `member.name` 으로 찾고,
 * 처음 여는 사람은 '회원' 으로 훑는다. 라벨만 뒤지면 토큰을 보고 온 사람이 못 찾는다.
 * 도메인 이름이 걸린 경우 그 그룹의 항목을 **전부** 남긴다('회원' 을 치면 회원 변수가 다 보여야 한다).
 */
export function filterTemplateVariableGroups(
  groups: TemplateVariableCatalog,
  query: string,
): TemplateVariableCatalog {
  const needle = query.trim().toLowerCase();
  if (needle === '') return groups;

  const result: TemplateVariableGroup[] = [];
  for (const group of groups) {
    if (group.label.toLowerCase().includes(needle)) {
      result.push(group);
      continue;
    }
    const variables = group.variables.filter(
      (variable) =>
        variable.label.toLowerCase().includes(needle) ||
        variable.key.toLowerCase().includes(needle),
    );
    if (variables.length > 0) result.push({ label: group.label, variables });
  }
  return result;
}

/* ── 치환 · 검증 ──────────────────────────────────────────────────────────── */

/** 본문에서 토큰을 훑는다 — `#{...}` 안쪽 키만 돌려준다(중복 제거, 등장 순서 유지) */
export function templateVariableKeysOf(text: string): readonly string[] {
  const keys: string[] = [];
  for (const match of text.matchAll(/#\{([^}]*)\}/g)) {
    const key = match[1] ?? '';
    if (!keys.includes(key)) keys.push(key);
  }
  return keys;
}

/**
 * 미리보기용 치환 — 아는 토큰은 표본값으로 바꾸고 **모르는 토큰은 그대로 둔다.**
 *
 * [왜 모르는 것을 지우지 않는가] 지우면 미리보기가 깨끗해지고, 그 깨끗함이 곧 '문제가 없다' 는
 * 신호로 읽힌다. `#{typo.here}` 는 발송되면 수신자 화면에 그 글자 그대로 나가는 사고이므로,
 * 미리보기에서도 그대로 남아 눈에 걸려야 한다. 지우는 것이 아니라 드러내는 것이 목적이다.
 *
 * 배선 전(null)에는 **아무것도 치환하지 않는다** — 아는 것이 없으므로 원문이 곧 최선의 답이다.
 */
export function applyTemplateVariableSamples(text: string): string {
  const groups = catalog;
  if (groups === null) return text;

  return flatten(groups).reduce(
    (acc, variable) => acc.replaceAll(templateVariableToken(variable.key), variable.sample),
    text,
  );
}

/**
 * 카탈로그에 없는 토큰들 — 저장 전 경고의 근거.
 *
 * **배선되지 않았으면 null** 을 준다. '위반 0건' 과 '판정 불가' 는 다르다 — 호출부는 null 일 때
 * 경고를 띄우지 않아야 한다(머리말의 거짓 경고 문제).
 */
export function unknownTemplateVariableKeys(text: string): readonly string[] | null {
  const groups = catalog;
  if (groups === null) return null;

  const known = new Set(flatten(groups).map((variable) => variable.key));
  return templateVariableKeysOf(text).filter((key) => !known.has(key));
}

/* ── 치환 후 길이 ─────────────────────────────────────────────────────────────
 *
 * [왜 이것이 따로 필요한가] 문자(SMS 90byte / LMS 2,000byte)와 알림톡(1,000자)은 **발송되는
 * 글자**에 상한이 걸린다. 그런데 편집기가 세는 것은 **작성 중인 글자**다 — `#{member.name}`
 * 은 편집기에서 15자지만 발송될 때는 '명재우' 3자다. 반대로 `#{quote.totalAmount}` 는 19자
 * 자리에 '33,000,000' 10자가 들어간다.
 *
 * 즉 편집기 카운터는 발송 길이와 **다르다**. 그 차이를 숨기면 운영자는 상한 안쪽이라고 믿고
 * 저장했다가 발송 단계에서 LMS 로 승격돼 과금이 뛰거나, 알림톡 상한을 넘겨 잘린다.
 *
 * [왜 '예상' 인가 — 이 값은 보장이 아니다] 표본값은 픽스처에서 온 한 사람의 값이다. 실제
 * 수신자는 이름이 다섯 자일 수도, 주소가 두 줄일 수도 있다. 그래서 이 숫자는 **정확한 예측이
 * 아니라 감각**이고, 화면은 반드시 '수신자마다 달라진다' 를 함께 말해야 한다. 숫자만 보여 주면
 * 운영자는 그것을 상한으로 착각한다. */

/** 표본값으로 치환했을 때의 글자 수 — `[...s].length`(이모지 1자) 기준 */
export function sampleSubstitutedCharCount(text: string): number {
  return [...applyTemplateVariableSamples(text)].length;
}

/**
 * 치환 전후 길이가 달라지는가 — 안내 문구를 띄울지 가르는 기준.
 * 본문에 토큰이 하나도 없으면 길이는 변하지 않으므로 안내가 소음이 된다.
 */
export function hasLengthShiftingVariables(text: string): boolean {
  return templateVariableKeysOf(text).length > 0;
}
