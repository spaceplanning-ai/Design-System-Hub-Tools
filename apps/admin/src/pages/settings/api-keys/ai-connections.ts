// AI 프로바이더 연동 상태 — **저장된 자격증명의 사실만 안다** (시스템 설정 섹션 소유)
//
// ┌ 이 파일이 **비밀** 값을 갖지 않는 이유 ────────────────────────────────────┐
// │ 여기에는 API 키의 **평문이 없다.** 어떤 필드가 저장돼 있는지(storedFields)와    │
// │ 사용 설정이 켜져 있는지(enabled)만 안다.                                     │
// │                                                                          │
// │ 이것은 ../_shared/secret.ts 가 선언한 섹션 규약을 그대로 따르는 것이다:        │
// │ **평문을 담을 자리를 만들지 않는 것이 방어다.** 자리가 있으면 언젠가 화면에      │
// │ 그려진다 — 목록에, devtools 에, 스크린샷에.                                  │
// │                                                                          │
// │ ⚠ **비밀이 아닌 칸은 다르다**(엔드포인트·배포명·리전·API 버전). 그것은 리소스   │
// │ 주소이지 자격증명이 아니고, 되읽지 못하면 폼이 쓸모없어진다. 그래서 값을 갖는    │
// │ 자리를 **따로** 둔다(AiConnectionRecord.publicValues) — 한 자루에 섞지 않는     │
// │ 것이 요점이다.                                                              │
// └──────────────────────────────────────────────────────────────────────────┘
//
// ┌ 가짜 성공을 만들지 않는다 ─────────────────────────────────────────────────┐
// │ 저장되지도 않는데 '연동됨' 으로 보이게 하거나 저장 성공 배너를 띄우는 것은        │
// │ **금지다.** 그것이 이 화면에서 삭제된 renameApiKey 의 결함이었다 —              │
// │ 없는 id 를 조용히 지나치고 성공 토스트를 띄웠다(FS-069 §7.1).                  │
// │                                                                          │
// │ ✔ **이제 저장 경로가 있다** — /settings/api-keys/:providerId (BE-069 §7.5 #1  │
// │ 해소). 그래서 이 모듈의 규율이 더 중요해졌다: 저장이 **실제로 일어난 뒤에만**    │
// │ 상태가 바뀌고(./data-source.ts 가 문서를 갱신한다), 성공 토스트도 그때만 뜬다.   │
// │                                                                          │
// │ ⚠ 그래도 **검증(verify)은 여전히 시늉하지 않는다** — 아래 lastVerifiedAt 참고.  │
// └──────────────────────────────────────────────────────────────────────────┘

/** 자격증명 필드의 종류 — 프로바이더마다 요구하는 조합이 다르다(단일 키로 끝나지 않는 곳이 있다) */
export const AI_CREDENTIAL_FIELDS = [
  'apiKey',
  'baseUrl',
  'endpoint',
  'deployment',
  'apiVersion',
  'region',
  'accessKeyId',
  'secretAccessKey',
] as const;

export type AiCredentialFieldKey = (typeof AI_CREDENTIAL_FIELDS)[number];

/**
 * 한 자격증명 입력 칸의 요구 사항.
 *
 * **타입이 요구를 드러내야 한다** — '어차피 API 키 하나면 되겠지' 로 폼을 만들면
 * Azure OpenAI·Amazon Bedrock 처럼 키 하나로 되지 않는 곳에서 저장은 되는데 호출이 실패하는,
 * 가장 진단하기 어려운 형태의 고장이 된다.
 */
export interface AiCredentialField {
  readonly key: AiCredentialFieldKey;
  readonly label: string;
  /** 없으면 연동이 성립하지 않는가 */
  readonly required: boolean;
  /**
   * 시크릿인가 — true 면 **저장 후 다시 보여줄 수 없다.**
   * 목록은 고정 길이 마스크(`MASKED_SECRET_TEXT`)만 그리고, 평문은 입력 순간에만 존재한다.
   */
  readonly secret: boolean;
  readonly hint: string;
}

/**
 * 저장된 연동 하나 — **값이 아니라 사실의 집합**이다.
 *
 * `storedFields` 는 '어느 칸이 채워져 있는가' 만 말한다. 값은 여기 없다.
 */
export interface AiConnection {
  readonly providerId: string;
  /** 운영자가 이 프로바이더를 쓰겠다고 켰는가 */
  readonly enabled: boolean;
  /** 저장돼 있는 자격증명 칸들 — **평문은 담기지 않는다** */
  readonly storedFields: readonly AiCredentialFieldKey[];
  /**
   * 마지막으로 **실제 호출로** 연결을 확인한 시각. 확인한 적 없으면 null.
   *
   * [지금은 항상 null 이다] 연결 검증은 서버가 프로바이더를 실제로 한 번 불러 봐야 성립한다 —
   * 브라우저에서 부르면 키가 브라우저로 내려와야 하고, 그 순간 '평문을 저장하지 않는다' 가 거짓이 된다.
   * 그래서 **검증한 척하지 않는다.** connectedAt 을 설정 수정 시각으로 대신하지 않는 것과 같은 규율이다.
   */
  readonly lastVerifiedAt: string | null;
  /** 이 연동을 처음 붙인 시각 — 서버가 기록한다. 없으면 null */
  readonly connectedAt: string | null;
}

/**
 * 저장소에 **실제로 들어 있는** 한 건 — `AiConnection`(사실만 아는 뷰)의 원본이다.
 *
 * ┌ 왜 두 타입인가 — 되읽을 수 있는 값과 없는 값이 갈리기 때문이다 ────────────┐
 * │ `secret: true` 인 칸(API 키)은 **저장 후 다시 돌려주지 않는다**. 그래서 값이   │
 * │ 아니라 '저장돼 있다' 는 사실만 남는다(`storedSecrets`).                       │
 * │                                                                          │
 * │ 반면 `secret: false` 인 칸(엔드포인트·배포명·리전·API 버전)은 **비밀이 아니고**  │
 * │ 되읽을 수 있어야 한다 — 폼이 기존 값을 못 보여주면 운영자가 배포명을 매번 다시  │
 * │ 입력해야 하고, 한 글자 틀리면 호출이 404 가 난다(BE-069 §7.7.2 #2).           │
 * │                                                                          │
 * │ 두 값을 한 자루에 담지 않는 것이 이 타입의 요점이다: **비밀이 들어갈 자리가**   │
 * │ `publicValues` 에 **구조적으로 없다.**                                      │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
export interface AiConnectionRecord {
  readonly providerId: string;
  readonly enabled: boolean;
  /** 비밀이 아닌 칸의 **값** — 폼이 되읽는다. 빈 문자열은 '저장 안 됨' 이다 */
  readonly publicValues: Readonly<Partial<Record<AiCredentialFieldKey, string>>>;
  /** 저장된 **비밀** 칸의 이름들 — 값은 여기에도, 어디에도 없다 */
  readonly storedSecrets: readonly AiCredentialFieldKey[];
  readonly lastVerifiedAt: string | null;
  readonly connectedAt: string | null;
}

/**
 * 저장돼 있는 칸의 이름들 — 비밀이든 아니든 '채워져 있다' 는 사실로 합친다.
 *
 * 빈 문자열은 **저장되지 않은 것으로 센다**: 빈 값을 보낸 것과 보내지 않은 것을 구분하지 않는다
 * (프로바이더에 빈 문자열 헤더를 보내면 401 이 난다 — 그래서 애초에 저장하지 않는다).
 */
export function storedFieldsOf(record: AiConnectionRecord): readonly AiCredentialFieldKey[] {
  const filled = AI_CREDENTIAL_FIELDS.filter((key) => {
    const value = record.publicValues[key];
    return value !== undefined && value.trim() !== '';
  });

  return [...filled, ...record.storedSecrets];
}

/** 저장 문서 → 화면·판정이 쓰는 **사실만 아는 뷰**. 값은 넘어가지 않는다 */
export function toConnection(record: AiConnectionRecord): AiConnection {
  return {
    providerId: record.providerId,
    enabled: record.enabled,
    storedFields: storedFieldsOf(record),
    lastVerifiedAt: record.lastVerifiedAt,
    connectedAt: record.connectedAt,
  };
}

/**
 * 연동이 **성립하는가** — 켜져 있고, 필수 자격증명이 빠짐없이 저장돼 있어야 한다.
 *
 * 둘 중 하나만으로는 부족하다: 켜기만 하고 키가 없으면 호출이 401 이고,
 * 키만 있고 꺼져 있으면 운영자가 쓰지 않겠다고 정한 것이다.
 */
export function connectionIsUsable(
  required: readonly AiCredentialField[],
  connection: AiConnection | undefined,
): boolean {
  if (connection === undefined || !connection.enabled) return false;
  return required
    .filter((field) => field.required)
    .every((field) => connection.storedFields.includes(field.key));
}
