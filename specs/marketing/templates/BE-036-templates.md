---
id: BE-036
title: "메시지 템플릿 백엔드 기능 명세"
functionalSpec: FS-036
owner: 백엔드 명세
reviewer: 명세 리뷰
gate: G9
status: draft
version: 2.0
date: 2026-07-18
---

# BE-036. 메시지 템플릿 백엔드 기능 명세

> **2.0 개정 (2026-07-18) — 대상 화면이 바뀌었다.**
> 1.0 은 알림톡 심사 모델(`pages/marketing/templates/**`)의 계약이었다. `/marketing/templates` 는 이제 **메시지 템플릿**(`pages/marketing/message-templates/**`)이 서비스한다. **API 경로 `/api/marketing/message-templates` 는 그대로 유효하다** — 바뀐 것은 라우트가 아니라 그 라우트가 가리키는 화면이며, 새 화면의 심이 같은 경로를 쓴다(`data-source.ts:38-39`). **1.0 의 §7.1(승인 상태 서버 정본화)·EP-05(카카오 심사 제출)는 이 계약에서 빠진다** — 승인 개념이 없는 모델이고, 알림톡 화면은 파킹됐다(§4.9).

## 1. 개요

| 항목 | 내용 |
|---|---|
| 대상 화면 | FS-036 메시지 템플릿 (`/marketing/templates` · `/new?kind=` · `/:id` · `/:id/edit`) |
| 범위 | 템플릿 목록/상세/등록/수정/삭제(단건·일괄), **상태 전용 변경(발행·Active 토글)**, 종류별(문자/이메일) 필드 요건, 첨부 이미지 업로드 |
| 범위 밖 | **카카오 알림톡 심사**(§4.9 파킹) · 실제 발송(SMS·이메일 발송 화면 소유) · 발신 프로필 레지스트리(**BE-005 운영진 그룹 소유** — §7.1) · 세그먼트(BE-033) · 일괄 전용 엔드포인트(§7.9) |
| 프론트 어댑터 | `apps/admin/src/pages/marketing/message-templates/data-source.ts` (**`createStoreAdapter`**, scope `marketing-message-templates` — `:17,40-47`) → 같은 폴더 `store.ts` |
| 도메인 타입 | **`apps/admin/src/pages/marketing/message-templates/types.ts`** — 이 화면은 자기 타입을 갖는다. `_shared/messaging.ts` 의 동명 타입(`:224`)은 **알림톡 모델**이며 이 계약의 대상이 아니다(§7.10) |
| 검증 정본 | `apps/admin/src/pages/marketing/message-templates/validation.ts` — `textTemplateSchema`(`:67-133`) · `emailTemplateSchema`(`:167-215`). **서버가 같은 규칙을 재검증한다**(§7.4) |
| 경로 주의 | **라우트와 API 경로가 다르다.** 사람이 보는 주소는 `/marketing/templates`(App.tsx:331)이고 API 는 `/api/marketing/message-templates`(`data-source.ts:38-39`)다. 이 갈림은 실수가 아니라 **이관의 흔적**이다 — 새 화면은 `message-templates` 라는 이름으로 만들어졌지만, 운영자가 매일 여는 주소를 바꾸지 않기 위해 옛 자리를 그대로 물려받았다(`data-source.ts:20-26`). 옛 개발용 주소 `/marketing/message-templates` 는 **`/marketing/templates` 로 리다이렉트한다**(App.tsx:341-348 — `<Navigate replace/>`). **API 경로를 라우트에 맞춰 고쳐 쓰지 않는다** — 심 문구가 계약이다 |

> **에러 봉투·권한 모델 상속**: BE-003 §2·§3 을 그대로 상속한다. 아래는 메시지 템플릿 고유 차이만 기술한다.

## 2. 공통 (상속)

- **에러 봉투**: BE-003 §2. 공통 에러코드 동일. **5xx·예상외 실패는 `traceId`(참조 코드)를 싣는다** — 프론트가 저장 실패 배너에 '오류 코드 <ref>' 로 노출한다(FS-036-EL-039 · `useCrudForm.ts:203`).
- **권한**: `admin` = 전체. `operator` = 조회 계열만, 쓰기(등록·수정·**상태 변경**·삭제) → 403. 마케팅 읽기 권한 없는 관리자 → 컬렉션 403 / 개별 404 은닉(BE-003 §3.2).
- **CSRF**: 쓰기(POST·PUT·PATCH·DELETE)에 `X-CSRF-Token`.
- **타임아웃**: 조회·쓰기 5초 → 504. (**프론트에는 타임아웃 상한이 없다** — FS-036 §7 #23.)
- **프론트 역할 분기 없음**(FS-036 §4.1) — 등록·수정·삭제 버튼과 **발행·Active 토글**이 권한과 무관하게 렌더되므로 **권한 강제는 전적으로 서버 책임**이다(FS-036 §7 #10).
- **낙관적 동시성**: 쓰기 요청에 `If-Match`(또는 `version`)를 실어 보낸다. 불일치 → 409/412 → 프론트 충돌 다이얼로그(FS-036-EL-039). **현재 프론트 어댑터의 409 는 '존재 여부' 기반이라 대상이 삭제됐을 때만 발현된다** — §7.3.
- **멱등키**: 등록·수정 요청은 제출 **시도** 단위 `Idempotency-Key` 헤더를 싣는다(§7.11). **상태 변경(EP-05)은 이 배선을 지나지 않는다** — §7.2.

## 3. 데이터 계약 (`message-templates/types.ts` 대조)

| 타입 | 필드 | 비고 |
|---|---|---|
| `MessageTemplate`(목록 행 = 상세) | `id` · `name` · `status`(`TemplateStatus`) · `senderProfileId` · `content`(`TemplateContent`) · `createdBy` · `createdAt` · `lastEditedBy` · `lastEditedAt`(`types.ts:238-250`) | 목록과 상세가 **같은 타입** — 목록 응답이 본문(블록 스택 포함)까지 싣는다(§7.12) |
| `MessageTemplateDraft`(쓰기 입력) | `Pick<MessageTemplate, 'name' \| 'status' \| 'senderProfileId' \| 'content'>`(`store.ts:201-204`) | **id·이력 4필드는 입력에 없다 — 서버가 채운다.** 1.0 의 §7.1(클라이언트가 상태 이력을 보내는 문제)이 구조적으로 닫혀 있다 |
| `TemplateStatus` | `'draft'` \| `'active'` \| `'inactive'`(`types.ts:18`) | 심사 주체가 없다. **운영자가 켜고 끄는** 발행 상태다. 배지·필터 라벨은 `초안`/`사용중`/`미사용`(`TEMPLATE_STATUS_LABEL`). **값과 라벨은 다른 층이다** — 값은 저장·비교·필터 쿼리의 식별자라 영문 그대로고, 라벨만 한국어다 |
| `TemplateKind` | `'email'` \| `'text'`(`types.ts:38`) | **독립 필드가 아니다** — `content.kind` 가 판별자이고 `templateKindOf`(`:255-257`)가 꺼내 쓴다. **등록 후 바꿀 수 없다**(FS-036 §1.1) |
| `TextTemplateContent` | `kind:'text'` · `body` · `imageFileName` · `vendor`(`TextMessageVendor`) · `senderPhone`(`types.ts:65-72`) | `TextMessageVendor = 'SureM' \| 'NHN' \| 'Solapi'`(`:63`) — 계약된 대행사 회선 |
| `EmailTemplateContent` | `kind:'email'` · `senderEmail` · `subject` · `blocks`(`readonly EmailBlock[]`) · `canvas`(`EmailCanvasStyle`)(`types.ts:226-232`) | 본문이 **문자열이 아니라 구조체 배열**이다 — 이것이 1.0 과 가장 크게 갈리는 지점이다(§7.5) |
| `EmailBlock` | 7종 판별 유니온 — heading · text · button · image · logo · avatar · divider(`types.ts:91-193`). 공통 `{id, padding{top,bottom,left,right}}`(`:97-107`) | 종류마다 필드가 다르다. 서버는 **판별자별 스키마**로 검증해야 한다(§7.5) |
| `EmailCanvasStyle` | `backdropColor` · `canvasColor` · `canvasBorderColor` · `canvasBorderRadius` · `fontFamily` · `textColor`(`types.ts:217-224`) | **hex 색 문자열이다 — CSS 변수가 아니다.** 수신함에는 우리 스타일시트가 없다(`store.ts:65-68`) |
| `SenderProfile` | `id` · `name` · `phoneNumbers[]` · `emails[]`(`types.ts:51-58`) | **이 리소스가 소유하지 않는다** — 운영진 그룹(BE-005)의 투영이다. §7.1 |

**상수·규칙 정본 (프론트가 강제하는 것 = 서버가 재검증해야 하는 것)**

| 규칙 | 값·함수 | 서버 재검증 |
|---|---|---|
| 템플릿명 길이 | `TEMPLATE_NAME_MAX = 60`(`types.ts:252`) · `requiredText('템플릿명', 60)`(`validation.ts:69,169`) | 1–60자(trim 후) |
| 발행 상태 | `z.enum(['draft','active','inactive'])`(`validation.ts:74,170`) | 열거. **전이 규칙은 §7.2** |
| 발신 프로필 | 비어 있지 않을 것(`validation.ts:83-90,178-185`) | **존재 + 발신 자격(`usableAsSender`) 확인** — §7.1 |
| 문자 발신번호 | 비어 있지 않을 것(`validation.ts:91-98`) | **그 프로필이 보유한 번호인지** 확인 — §7.1 |
| 문자 대행사 | `z.enum(['SureM','NHN','Solapi'])`(`validation.ts:77`) | 열거 |
| 문자 본문 | 비어 있지 않을 것 + `length <= TEXT_BODY_MAX(2000)` — **문자 수 기준**(`types.ts:75` · `validation.ts:100-121`) | **바이트 기준을 추가로 강제한다 — §7.4** |
| 문자 첨부 | `/\.jpe?g$/i`(`validation.ts:32-38`) · 500KB(`types.ts:78`) · 1000×1000px(`:79`) | JPG·용량·픽셀 전부. **용량·픽셀은 클라이언트 스키마에 없다**(고르는 순간에만 판정 — `validation.ts:41-52,58-63`) → 서버가 유일 판정자다 |
| 이메일 제목 | 비어 있지 않을 것(`validation.ts:190-197`) | 1자 이상. **길이 상한이 프론트에 없다** — 서버가 정한다(§7.4) |
| 이메일 발신 주소 | 비어 있지 않을 것(`validation.ts:198-205`) | 그 프로필이 보유한 주소인지 — §7.1 |
| 이메일 블록 | `blocks.length > 0`(`validation.ts:207-214`) | **길이만 본다 — 블록 내부는 검증하지 않는다**(§7.5) |
| 이메일 블록 본문 | `BLOCK_CONTENT_MAX = 10_000`(`email/blocks.ts:68`) | 블록당 0–10,000자 |
| 이메일 이미지 폭 | `IMAGE_MAX_WIDTH = 800`(`types.ts:170`) | **프론트는 경고만 한다**(`email/InspectPanel.tsx:58,614`) — 저장을 막지 않는다 |
| SMS 등급 | `byteLengthOf`(EUC-KR 근사: 비ASCII 2byte — `_shared/messaging.ts:282-289`) · `classifySms`(`:304-307`) · SMS 90byte(`:278`) / LMS 2000byte(`:279`) | **프론트는 표시만 한다** — §7.4 |
| 치환변수 | 카탈로그 한 벌 — `shared/domain/template-variable-catalog.ts` 6도메인 213항목 · 키 규칙 `#{namespace.field}` | **어휘 분열은 해소됐다(§7.6). 서버 화이트리스트는 여전히 필요 — §7.6** |

## 4. 엔드포인트 명세

### BE-036-EP-01 · 템플릿 목록 조회
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-001, EL-002, EL-003, EL-006, EL-008, EL-010 |
| 메서드·경로 | `GET /api/marketing/message-templates` |
| 권한 | `admin`, `operator` |
| 멱등성 | 멱등(GET) |
| 페이징 | **현재 없음 — 전량 반환**. 프론트가 검색·필터를 클라이언트에서 수행한다(FS-036 §1.1). §7.12 |
| 레이트리밋 | 분당 120회 |

**쿼리**: **없다.** 어댑터 시그니처가 `fetchAll(signal)` 이다.

**응답 200** — `readonly MessageTemplate[]`. **정렬 규칙이 계약에 없다** — 프론트가 받은 순서 그대로 그린다(FS-036 §7 #4). 계약으로 **`lastEditedAt` 내림차순**을 정한다(최근 수정이 위) — 배열 순서에 의존하는 현재 동작을 명시적 계약으로 대체한다.

**이 응답의 두 번째 소비자**: SMS·이메일 발송 화면이 `selectableTemplates(kind)`(`store.ts:252-256`)로 같은 데이터를 걸러 **삽입 후보**를 만든다 — EP-08 · §7.7.

**에러**: 401 · 403 · 429 · 500 · 504.

---

### BE-036-EP-02 · 템플릿 상세 조회
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-030, EL-031, EL-080, EL-086, EL-089 |
| 메서드·경로 | `GET /api/marketing/message-templates/:id` |
| 권한 | `admin`, `operator`. 읽기 권한 없음 → 404 은닉 |
| 멱등성 | 멱등(GET) |

**응답 200** — `MessageTemplate` + `ETag`(또는 `version`)를 헤더에 실어 수정 시 `If-Match` 로 되돌려받는다(§7.3).

> **§7.3 판정 필수 — 404 는 status 404 로 내려야 한다.** 프론트 편집기는 `isNotFound(cause)`(= `HttpError.status === 404`)로 '찾을 수 없음'(재시도 없음) 갈래를 고른다(`TextTemplateEditor.tsx:250-271`). **store 자체는 여전히 status 없는 generic `Error` 를 던지지만**(`store.ts:273`) 어댑터가 `crud.ts:217-219` 에서 먼저 `HttpError(404)` 를 던져 그 갈래가 산다. 실 HTTP 어댑터로 갈아탈 때 **이 승격을 잃지 않는다**.

**에러**: 400(id 형식) · 401 · **404 `TEMPLATE_NOT_FOUND`** · 429 · 500 · 504.

---

### BE-036-EP-03 · 템플릿 등록
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-033 ~ EL-052(문자) · EL-060 ~ EL-071(이메일) · EL-035, EL-041 |
| 메서드·경로 | `POST /api/marketing/message-templates` |
| 권한 | `admin` 만. `operator` → 403 |
| 멱등성 | 비멱등이나 `Idempotency-Key` 로 중복 생성을 막는다(§7.11) |
| 레이트리밋 | 분당 30회 |

**바디**(`MessageTemplateDraft`): `name`(1–60자) · `status`(`draft`\|`active`\|`inactive`) · `senderProfileId` · `content`(판별 유니온 — §3).

**서버가 정하는 것**: `id` · `createdBy` · `createdAt` · `lastEditedBy` · `lastEditedAt`.

> **§7.8 판정 — 이력 4필드는 클라이언트가 보내지 않고 서버가 채운다.** 현재 픽스처는 `CURRENT_EDITOR = '홍성보'` 상수를 찍고(`store.ts:212,288-291`) 그 자리에 `TODO(backend): 서버가 인증 주체로 채운다 — 화면이 보낸 이름을 그대로 믿지 않는다`(`:210`)가 있다. **타입이 이미 이 계약을 강제한다** — `MessageTemplateDraft` 에 이력 필드가 없다(`:201-204`).

> **§7.2 판정 — 등록 요청의 `status` 는 신뢰한다(단 `inactive` 는 거절한다).** 헤더의 '초안 저장' 은 `draft` 를, '발행' 은 `publishedStatusOf('draft')` = `active` 를 실어 보낸다(`TextTemplateEditor.tsx:234,243`). **즉 등록 시점에 올 수 있는 값은 `draft` 와 `active` 뿐이다.** `inactive` 로 시작하는 템플릿은 '발행한 적 없는데 꺼져 있는 것' 이라 의미가 없다 → **422 `INVALID_INITIAL_STATUS`**.

**응답 201** — 생성된 `MessageTemplate`.

**에러**: 400 `VALIDATION_FAILED`(`error.fields`: `name`·`senderProfileId`·`senderPhone`·`content.*`) · 401 · 403 · 403 CSRF · 409 `TEMPLATE_NAME_DUPLICATED`(§7.7) · 422 `INVALID_INITIAL_STATUS`(§7.2) · 422 `SENDER_NOT_ALLOWED`(§7.1) · 422 `SMS_BYTE_LIMIT_EXCEEDED`(§7.4) · 422 `INCOMPLETE_BLOCK`(§7.5) · 422 `UNKNOWN_VARIABLE`(§7.6) · 429 · 500 · 504.

---

### BE-036-EP-04 · 템플릿 수정
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-033 ~ EL-071, EL-035(저장), EL-039 |
| 메서드·경로 | `PUT /api/marketing/message-templates/:id` |
| 권한 | `admin` 만 |
| 멱등성 | 멱등(PUT 전체 치환) + `If-Match` |
| 레이트리밋 | 분당 30회 |

**바디**: `MessageTemplateDraft`(EP-03 동일). **헤더**: `If-Match: <etag>` · `Idempotency-Key`.

**서버가 정하는 것**: `lastEditedBy` · `lastEditedAt`. **`createdBy`/`createdAt` 은 건드리지 않는다** — 누가 처음 만들었는지는 편집으로 바뀌지 않는다(`store.ts:305`).

> **§7.2 판정 필수 — 종류(`content.kind`)는 불변이다.** 프론트에는 종류를 바꾸는 표면이 아예 없고(FS-036 §1.1), 라우트도 저장된 내용에서 종류를 읽어 편집기를 고른다(`MessageTemplateEditorPage.tsx:66`). **서버는 저장된 kind 와 다른 kind 가 오면 422 `KIND_IMMUTABLE`** 로 거절한다. 프론트의 `toValues` 가 종류 불일치를 만나면 **빈 폼을 준다**(`TextTemplateEditor.tsx:89-101` · `EmailTemplateEditor.tsx:64-72`) — 주소를 손으로 고쳐 이메일 id 를 문자 편집기에 넣은 뒤 저장하면 **본문이 통째로 날아간 채 kind 가 뒤집힌 요청이 나간다.** 이 422 가 그 사고를 막는 지점이다.

> **§7.2 판정 — 수정 요청은 `status` 를 실어 오지만 전이를 만들지는 않는다.** 발행본 수정 시 프론트는 `loaded.status` 를 그대로 되싣고(`TextTemplateEditor.tsx:222`), 초안 수정 시에는 두 버튼이 각각 `draft`/`active` 를 싣는다. **서버는 이 값을 §7.2 의 전이표에 비추어 검증한다** — 표에 없는 전이는 **422 `INVALID_STATUS_TRANSITION`**.

> **§7.3 판정 필수 — 없는 id 에 조용히 성공하지 않는다.** store 자체는 `map` 이라 없는 id 를 통과시키지만(`store.ts:297`) 어댑터가 먼저 409 를 던진다(`crud.ts:256-258`). 서버는 **404** 로 거절한다(삭제됐다는 사실이 정보이므로 은닉하지 않는다 — 읽기 권한이 있는 사용자다).

> **§7.2 판정 — Active 템플릿의 수정을 서버가 막을지는 정하지 않는다.** 프론트는 상세 헤더에서 '수정' 을 숨기지만(`status.ts:72`) **라우트에 가드가 없어 주소를 직접 치면 열린다**(App.tsx:339 · FS-036 §7 #7). 서버가 `active` 편집을 422 `TEMPLATE_ACTIVE_LOCKED` 로 막으면 그 구멍이 닫히지만, **'끄지 않고 오타만 고치기' 도 함께 막힌다.** 어느 쪽이 옳은지는 운영 판단이므로 **§7.12 로 이관한다** — 다만 **프론트가 이 규칙의 유일한 집행자여서는 안 된다**는 것만 여기 못 박는다.

**응답 200/204**.

**에러**: 400 `VALIDATION_FAILED` · 401 · 403 · 403 CSRF · **404 `TEMPLATE_NOT_FOUND`** · **409/412** 동시 수정(§7.3) · 409 `TEMPLATE_NAME_DUPLICATED` · **422 `KIND_IMMUTABLE`** · 422 `INVALID_STATUS_TRANSITION` · 422 `SENDER_NOT_ALLOWED` · 422 `SMS_BYTE_LIMIT_EXCEEDED` · 422 `INCOMPLETE_BLOCK` · 422 `UNKNOWN_VARIABLE` · 429 · 500 · 504.

---

### BE-036-EP-05 · 상태 변경 (발행 · Active 토글)
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-082, EL-083, EL-084 |
| 메서드·경로 | `PATCH /api/marketing/message-templates/:id/status` |
| 권한 | `admin` 만 |
| 멱등성 | **멱등** — 같은 상태를 다시 보내면 같은 결과 |
| 레이트리밋 | 분당 60회 |

**심 근거**: `data-source.ts:39` — '상태만 바꾸는 발행·Active 토글은 `PATCH /api/marketing/message-templates/:id/status`' · `store.ts:323` 같은 문구. **1.0 의 EP-05(알림톡 심사 제출)와 같은 번호를 쓰지만 전혀 다른 엔드포인트다.**

**바디**: `{ status: 'draft' | 'active' | 'inactive' }`.

> **§7.2 판정 — 이 엔드포인트가 존재하는 이유가 계약의 일부다.** 상세 화면에는 편집 폼이 없다. 토글 하나를 켜려고 `PUT`(EP-04)으로 본문 전체를 되보내면 **그 사이 다른 관리자가 고친 본문을 내가 들고 있던 옛 값으로 덮어쓴다**(`store.ts:319-322`). **바꾸는 것이 상태 하나면 보내는 것도 상태 하나여야 한다.** 서버는 이 요청으로 `content`·`name`·`senderProfileId` 를 **건드리지 않는다**.

**전이표** (정본은 `status.ts` — 서버가 같은 표를 강제한다):

| 현재 | 허용 목표 | 근거 |
|---|---|---|
| `draft` | `active`(발행) | `publishedStatusOf`(`status.ts:33-35`). **`draft → inactive` 는 없다** — 발행하지 않고 꺼진 상태는 draft/active 의 구분을 무너뜨린다(`status.ts:39-41`) |
| `active` | `inactive` | `toggledStatusOf`(`status.ts:43-47`) |
| `inactive` | `active` | 같음 |
| 아무 상태 | **`draft` 로 되돌리기는 없다** | 프론트에 그 표면이 없다. 발행을 취소하는 길은 토글이지 되돌리기가 아니다(`TextTemplateEditor.tsx:216`) |

표에 없는 전이 → **422 `INVALID_STATUS_TRANSITION`**. 같은 상태 재요청 → **200**(멱등, 무변화).

**서버가 갱신하는 것**: `lastEditedAt`. **`lastEditedBy` 는 갱신하지 않기를 권고한다** — 현재 픽스처는 갱신하지만(`store.ts:328`) 그러면 **본문을 고친 사람과 스위치를 누른 사람이 구분되지 않는다**(§7.8).

**응답 200** — 갱신된 `MessageTemplate`.

**에러**: 400 · 401 · 403 · 403 CSRF · 404 `TEMPLATE_NOT_FOUND` · 409/412 · 422 `INVALID_STATUS_TRANSITION` · 429 · 500 · 504.

> **⚠ 프론트가 이 계약을 지킬 준비가 되어 있지 않다 (§7.2 최우선).** 현재 이 경로는 **어댑터를 지나지 않는다** — `setMessageTemplateStatus` 를 mutationFn 안에서 직접 부른다(`MessageTemplateDetailPage.tsx:186-194`). 그래서 ⓐ 존재 검사 없음(없는 id 에 조용히 성공 — `store.ts:326` `map`) ⓑ `onError` 없음 → **실패 표면이 아예 없다**(FS-036-EL-082) ⓒ `signal`·`Idempotency-Key` 미전달 ⓓ `?fail=`/`?status=` 재현 스위치 미적용. **위 404·409·422 를 서버가 내려도 화면은 아무것도 보여 주지 못한다.** 연동 전에 이 호출을 어댑터 계약(또는 그에 준하는 mutation)으로 옮기는 프론트 작업이 선행되어야 한다 — §7.12 #1.

---

### BE-036-EP-06 · 템플릿 삭제 (단건·일괄 공용)
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-008.8, EL-021, EL-022, EL-088 |
| 메서드·경로 | `DELETE /api/marketing/message-templates/:id` |
| 권한 | `admin` 만 |
| 멱등성 | **멱등** — 이미 삭제 재요청 → 204 |
| 레이트리밋 | 분당 60회(일괄이 항목당 개별 요청) |

**응답 204**. 일괄 삭제는 프론트가 `settleAll` 로 항목마다 병렬 DELETE(§7.9).

> **§7.7 판정 — 참조 무결성을 강제하지 않는다.** 이 템플릿을 삽입해 쓴 발송 회차가 있어도 막지 않는다. 근거: 템플릿 삽입은 **값 복사**다 — 발송 화면은 `TemplateOption {id, name}`(`store.ts:266-269`)로 고르고 본문을 자기 폼에 채울 뿐 참조를 남기지 않는다. 이미 만들어진 회차는 템플릿이 사라져도 자기 본문을 갖는다. **단 `active` 템플릿 삭제는 경고 대상이다** — 지금 발송에 쓰이는 문구가 예고 없이 사라진다. **판정: 막지는 않되 응답에 `wasActive: true` 를 실어** 프론트가 확인 문구를 강화할 수 있게 한다(현재 확인 다이얼로그는 상태를 구분하지 않는다 — `MessageTemplateDetailPage.tsx:389-400`).

> **§7.3 — 픽스처와 서버 계약이 갈리는 자리.** 어댑터는 없는 id 에 **409 `'이미 삭제된 항목입니다.'`** 를 던지는데(`crud.ts:275-277`) 서버는 존재한 적 없는 id 에 **404**, 이미 삭제된 id 에 **204**(멱등)로 답한다. 연동 시 **204 를 받는 경로가 이 화면에 처음 생기고**, 그때 일괄 삭제의 '실패 건수' 집계가 달라진다(현재 재현 불가) — §7.12 #5.

**에러**: 400 · 401 · 403 · 403 CSRF · 404 `TEMPLATE_NOT_FOUND`(존재한 적 없는 id) · 429 · 500 · 504.

---

### BE-036-EP-07 · 첨부 파일 업로드
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-036-EL-049(문자 첨부), FS-036-EL-071(이메일 image·logo·avatar) |
| 메서드·경로 | `POST /api/uploads` |
| 권한 | `admin` 만 |
| 멱등성 | 비멱등 |

**심 근거 2곳**: `components/ImageAttachRow.tsx:142-143` — 'POST /api/uploads 로 파일을 보내고 **응답이 준 파일명**을 값으로 삼는다. 지금은 고른 파일의 이름만 저장한다 — 실제 바이트는 아직 어디에도 올라가지 않는다' · `render-html.ts:83` — '`POST /api/uploads` 가 응답 URL 을 주면 그 URL 로 `<img>` 를 낸다'.

**확정된 사실만 적는다**:
- 경로·메서드: `POST /api/uploads`(심 문구 그대로). **이 리소스(`/api/marketing/message-templates`) 아래가 아니라 앱 전역 경로다** — 두 심이 같은 경로를 가리킨다.
- 두 소비처가 **다른 것을 요구한다**: 문자 첨부는 **파일명**을, 이메일 블록은 **URL** 을 값으로 쓴다. 응답이 둘 다 실어야 한다.
- 현재 상태: **업로드가 일어나지 않는다.** 문자는 `file.name` 만 폼에 담고(`ImageAttachRow.tsx:143`), 이메일은 `[image: 파일명]` 이라는 **글자**를 HTML 에 낸다(`render-html.ts:77-86` — '파일명은 URL 이 아니다. 그대로 src 에 넣으면 수신자에게 깨진 이미지가 나간다').
- **미정**: 요청 형식(multipart vs presigned) · 응답 스키마 · 보존 정책 · 접근 제어(발송 메일의 `<img>` 는 **인증 없이 열려야 한다**) · 고아 파일 회수.

> **판정: 이 문서는 요청/응답 계약을 확정하지 않는다.** 업로드는 이 화면만의 관심사가 아니고(상품 이미지·배너 등 다른 화면도 같은 심을 갖는다) **앱 전역 리소스**로 별도 확정해야 한다 — §7.12 #6. **다만 이 화면의 검증 책임은 여기 못 박는다**: JPG(`validation.ts:32-38`) · 500KB(`types.ts:78`) · 1000×1000px(`:79`)는 **프론트가 파일을 고르는 순간에만** 판정하고 **스키마에는 없다**(`validation.ts:122-132` 는 확장자만 재검증한다). 즉 **폼 값에 파일명만 남은 상태로 오는 요청에는 용량·픽셀 제약이 전혀 걸려 있지 않다** — 업로드 엔드포인트가 유일한 판정자다.

---

### BE-036-EP-08 · 발송 화면 삽입 후보 — **별도 엔드포인트를 두지 않는다**

SMS 발송(`sms/SmsFormPage.tsx:41,200`)과 이메일 발송(`email/EmailFormPage.tsx:45,198`)이 `selectableTemplates(kind)`(`store.ts:252-256`)로 후보를 만든다 — **`status === 'active'` 이고 `content.kind` 가 그 화면의 종류인 것만**. `TODO(backend)` 심이 없다.

**판정**: **EP-01 로 충분하다.** `selectableTemplates` 는 EP-01 응답에 대한 순수 필터이므로 별도 계약을 만들지 않는다. 다만 **§7.7 의 서버 재검증**은 필요하다 — 후보 필터링은 UX 이고, 발송 시점의 사용 가능 여부는 서버가 판정한다.

**단, 재구조화 필요**: 현재 **동기 함수**라 발송 폼에 로딩·실패 경로가 없다. 백엔드 연결 시 이 호출부들도 비동기 조회로 바꿔야 한다. **그리고 뉴스레터가 아직 옮겨오지 않았다** — `newsletters/NewsletterFormPage.tsx:35,177` 이 여전히 알림톡 모델의 `_shared/store.ts:213 listSendableTemplates('email')` 을 본다. 즉 **이 화면에서 만든 이메일 템플릿이 뉴스레터에는 뜨지 않는다**(FS-036 §7 #13) — §7.12 #7.

---

### 4.9 파킹 — 카카오 알림톡 심사 제출 (**이 계약의 일부가 아니다**)

1.0 의 `BE-036-EP-05`(`POST /api/marketing/message-templates/:id/submit`)를 **라이브 계약에서 뺀다.**

**근거**: 그 엔드포인트는 알림톡 심사 모델(`pages/marketing/templates/**`)의 것이고, 그 화면은 `/marketing/templates/alimtalk*` 으로 밀려나 **사이드바에도 없고 어느 화면도 링크하지 않는다**(App.tsx:334-336 · nav-config.ts:179-181). App.tsx:320-330 가 그 결정을 명시한다 — '새 모델은 아직 그것을 덮지 못하므로, 그 화면들을 지우는 대신 /alimtalk 아래에 세워 둔다 … **사이드바에는 올리지 않는다(재구축 대기 중이다)**'.

**파킹의 뜻**: 계약을 확정하지 않고, 폐기하지도 않는다. **알림톡이 세 번째 종류로 이 모델에 들어올 때 함께 확정한다**(`types.ts:1-8`). 그때 다시 열어야 할 1.0 의 판정들 — 승인 상태 서버 정본화 · 본문 변경 시 승인 무효화 · 심사 결과 수신(웹훅 vs 폴링) · 심사 중 편집·삭제 잠금 — 은 **1.0 §7.1 에 그대로 남아 있으므로 재작성하지 않는다.** 이 문서는 그것들을 **닫힌 것으로 취급하지 않는다**(도달 불가일 뿐이다) — §7.12 #8.

## 5. 예외 매트릭스

| 엔드포인트 | 400 검증 | 401 인증 | 403 vs 404 | 404 대상없음 | 409 충돌 | 422 상태위반 | 429 과부하 | 500 오류 | 타임아웃 |
|---|---|---|---|---|---|---|---|---|---|
| EP-01 목록 | N/A — **쿼리 파라미터가 없다**(전량 반환) | 401 → 전역 인터셉터. 화면은 FS-036-EL-011 | **403** 컬렉션 | N/A — 0건이면 200 빈 배열 → FS-036-EL-010 | N/A 읽기 전용 | N/A — 상태 없는 조회 | 429 분당 120 → FS-036-EL-011 | 500 + `traceId` → FS-036-EL-011 | 5초 → 504 → FS-036-EL-011 |
| EP-02 상세 | id 형식 → 400 | 401 → 전역 인터셉터 | 읽기 권한 없음 → **404 은닉** | **404 `TEMPLATE_NOT_FOUND`** — **status 404 필수**(§7.3). 편집기는 404 갈래를 갖고(`TextTemplateEditor.tsx:250-271`) **상세는 갈래를 갖지 않는다**(`MessageTemplateDetailPage.tsx:234-245` — 한 문구 + 재시도 없음) | N/A | N/A | 429 | 500 + `traceId` → 상세는 **404 와 같은 문구**로 수렴한다(FS-036 §7 #7) | 5초 → 504 → 같은 갈래 |
| EP-03 등록 | `name`·`senderProfileId`·`senderPhone`·`content.*` → `error.fields` → 그 입력 인라인 + 첫 위반 포커스(`useCrudForm.ts:198`) | 401 → 전역 인터셉터. **작성 중 본문·블록이 사라진다**(FS-036 §7 #24) | **403** 컬렉션 쓰기 → FS-036-EL-039 배너 | N/A 생성 | **409 `TEMPLATE_NAME_DUPLICATED`**(§7.7). `Idempotency-Key` 재사용 시 최초 응답 재생(§7.11) | **422** `INVALID_INITIAL_STATUS`(§7.2) · `SENDER_NOT_ALLOWED`(§7.1) · `SMS_BYTE_LIMIT_EXCEEDED`(§7.4) · `INCOMPLETE_BLOCK`(§7.5) · `UNKNOWN_VARIABLE`(§7.6) | 429 분당 30 | 500 + `traceId` → FS-036-EL-039(오류 코드 표시) | 5초 → 504 → FS-036-EL-039 |
| EP-04 수정 | 위 + id → `error.fields` | 401 → 전역 인터셉터 | `operator` → **403** / 읽기 없음 → **404** | **404 `TEMPLATE_NOT_FOUND`** — 다른 관리자가 지운 템플릿. 픽스처는 같은 자리에서 **409** 를 던진다(`crud.ts:256-258`) → 충돌 다이얼로그 + 입력 보존 | **409/412** `If-Match` 불일치 → FS-036-EL-039 충돌 다이얼로그 · 409 `TEMPLATE_NAME_DUPLICATED` | **422 `KIND_IMMUTABLE`**(§7.2 — 가장 중요) · `INVALID_STATUS_TRANSITION` · `SENDER_NOT_ALLOWED` · `SMS_BYTE_LIMIT_EXCEEDED` · `INCOMPLETE_BLOCK` · `UNKNOWN_VARIABLE` | 429 분당 30 | 500 + `traceId` → FS-036-EL-039 | 5초 → 504 → FS-036-EL-039 |
| EP-05 상태 변경 | 바디 형식·열거 → 400 | 401 → 전역 인터셉터 | `operator` → **403** / 읽기 없음 → **404** | **404 `TEMPLATE_NOT_FOUND`**. **현재 프론트는 없는 id 에 조용히 성공한다**(`store.ts:326` `map` — 어댑터를 지나지 않는다) | **409/412** 동시 수정. **화면에 표시 수단 없음** | **422 `INVALID_STATUS_TRANSITION`** — 전이표 밖(§7.2). 같은 상태 재요청은 **200**(멱등) | 429 분당 60 | 500 + `traceId` | 5초 → 504 |
| | | | | | ⚠ **위 5열 전부 현재 화면에 표시 수단이 없다** — `changeStatus` 에 `onError` 가 없다(`MessageTemplateDetailPage.tsx:186-194`). §7.2 · §7.12 #1 | | | | |
| EP-06 삭제 | id 형식 → 400 | 401 → 다이얼로그 안 배너 | `operator` → **403** / 읽기 없음 → **404** | 404 = 존재한 적 없는 id. **이미 삭제 → 204(멱등)**. **픽스처는 둘 다 409 다**(`crud.ts:275-277`) → §7.12 #5 | N/A — 멱등 삭제 | N/A — 상태와 무관하게 삭제를 허용한다(§7.7). `active` 는 응답 `wasActive` 로만 알린다 | 429 분당 60(일괄이 항목당 요청) | 500 → 단건은 다이얼로그 배너 / 일괄은 부분 실패 건수 | 5초 → 504 → 같은 자리 |
| EP-07 업로드 | **미정 — 요청 형식 미확정**(§4 EP-07) | 앱 전역 인증 상속 | 앱 전역 상속 | N/A 생성 | 미정 | **422 — JPG·500KB·1000px 위반의 유일한 서버 판정자**(§7.4) | 미정 | 미정 | 미정 |
| EP-08 삽입 후보 | N/A — **별도 엔드포인트를 두지 않는다**(EP-01 의 순수 필터) | EP-01 과 동일 | EP-01 과 동일 | N/A | N/A 읽기 전용 | N/A — **발송 시점 재검증은 발송 엔드포인트 몫**(§7.7) | EP-01 과 동일 | EP-01 과 동일 | EP-01 과 동일 |

## 6. 프론트 연동 대조

| 호출부 | TODO(backend) 심 | 엔드포인트 | 응답 | 일치 |
|---|---|---|---|---|
| `messageTemplateAdapter.fetchAll(signal)` → `listMessageTemplates()`(`store.ts:218-220`) | `data-source.ts:38` `GET /api/marketing/message-templates` | EP-01 | `MessageTemplate[]` | O (**쿼리 파라미터 없음** — 전량. 정렬 계약 신설 필요) |
| `.fetchOne(id, signal)` → `getMessageTemplate(id)`(`store.ts:271-275`) | `data-source.ts:38` `GET …/:id` | EP-02 | `MessageTemplate` | **△ — store 가 status 없는 generic `Error` 를 던진다**(`:273`). 어댑터가 `crud.ts:217-219` 에서 먼저 `HttpError(404)` 를 던져 갈래는 살아 있으나, **실 HTTP 어댑터로 갈 때 이 승격을 잃지 않아야 한다** |
| `.create(input, context)` → `addMessageTemplate(draft)`(`store.ts:277-294`) | `data-source.ts:38` `POST …` | EP-03 | `void`(201) | **△ — 이력 4필드를 픽스처 상수로 찍는다**(`CURRENT_EDITOR` — `:212,288-291`). `TODO` 가 그 자리에 있다(`:210`) |
| `.update(id, input, context)` → `updateMessageTemplate(...)`(`store.ts:296-311`) | `data-source.ts:38` `PUT …/:id` | EP-04 | `void` | **△ — store 는 `map` 이라 없는 id 를 지나친다**(`:297`). 어댑터가 먼저 409(`crud.ts:256-258`). **`content.kind` 불변 검사가 프론트·픽스처 어디에도 없다** — §7.2 |
| `.remove(id, context)` → `removeMessageTemplate(id)`(`store.ts:313-315`) | `data-source.ts:38` `DELETE …/:id` | EP-06 | `void`(204) | **△ — store 는 `filter`**(`:314`). 어댑터가 먼저 409(`crud.ts:275-277`) — **서버의 204 멱등 계약과 갈린다**(§7.12 #5) |
| **`setMessageTemplateStatus(id, status)`**(`MessageTemplateDetailPage.tsx:188` → `store.ts:325-331`) | `data-source.ts:39` · `store.ts:323` `PATCH …/:id/status` | **EP-05** | `void` | **✗ — 어댑터를 지나지 않는다.** 존재 검사·멱등 ledger·`signal`·실패 표면·재현 스위치가 전부 없다. **이 문서의 최우선 프론트 이관 사항**(§7.2 · §7.12 #1) |
| `ImageAttachRow` 의 `onChange(file.name)`(`components/ImageAttachRow.tsx:143`) | `:142` `POST /api/uploads` | EP-07 | — | **✗ 심만 있고 업로드가 없다** — 파일명만 저장된다 |
| `render-html.ts` 의 `fileNote()`(`:84-86`) | `:83` `POST /api/uploads` | EP-07 | — | **✗ 심만 있다** — `<img>` 대신 `[image: 파일명]` 글자를 낸다 |
| `selectableTemplates(kind)`(`store.ts:252-256`) | **없음** | EP-08(= EP-01 필터) | `MessageTemplate[]` | **✗ 심 없음** — 발송 화면이 호출(동기). 비동기 재구조화 필요 |
| `listSendableTemplates('email')`(`newsletters/NewsletterFormPage.tsx:177`) | **없음** | **이 계약 밖** — 알림톡 모델(`_shared/store.ts:213`) | — | **✗ 뉴스레터만 옛 모델을 본다**(§7.12 #7) |

**어댑터 본문 요구사항(시그니처 불변)**: 쓰기 함수 전부 `X-CSRF-Token` + `Idempotency-Key`(등록·수정) + `If-Match`(수정·상태 변경) 헤더 · `fetchOne` 은 404 를 `HttpError(404)` 로 승격(**이미 그렇게 동작한다** — 잃지 말 것) · `update`/`remove` 는 서버 404/409 를 그대로 던진다 · 5xx 는 `traceId` 를 `HttpError.reference` 로 · 422 필드 위반은 `HttpError.violations` 로. **그리고 상태 변경(EP-05)을 어댑터 계약 안으로 들여온다** — 지금은 밖에 있다.

## 7. 핵심 판정

### 7.1 발신 프로필은 이 리소스가 소유하지 않는다 — 투영이며, 서버가 조합을 검증한다 【보안 판정】

**확인된 사실**:
- 이 화면의 발신 프로필 목록은 `listSenderProfiles()`(`store.ts:37-39`)인데, 그 본문은 `listSenderCapableAdminGroups()`(`shared/fixtures/admin-groups.ts`) 한 줄이다. **정본은 운영진 그룹(BE-005)이다.**
- 이 파일의 머리말이 그 경위를 남긴다(`store.ts:26-36`): 예전에는 이 파일이 발신 프로필 배열을 직접 들었고, **같은 실체가 관리자 관리 화면에서는 '운영진 그룹' 이라는 이름으로 따로 하드코딩돼 있었다** — 한쪽에서 만든 것이 다른 쪽에 나타나지 않았다.
- **전부가 아니라 `usableAsSender` 만** 노출한다(`:31-33`) — 조회·권한 필터 전용 그룹까지 뜨면 '고르면 발신번호 후보가 0개라 저장도 못 하는 항목' 이 드롭다운을 채운다.
- 조회는 자격이 꺼진 그룹을 **null 로 본다**(`store.ts:47-50`) — 목록·상세는 그 자리에 '—' 를 그린다(`:54-56`).

**판정**:
1. **`senderProfileId` 는 외래키다.** 서버는 EP-03/EP-04 에서 ⓐ 그 그룹이 존재하고 ⓑ `usableAsSender` 이며 ⓒ 요청자가 그 그룹으로 발송할 자격이 있는지를 확인한다. 아니면 **422 `SENDER_NOT_ALLOWED`**.
2. **채널 값이 그 프로필의 것인지 확인한다.** 문자의 `senderPhone` 은 그 프로필의 `phoneNumbers` 안에, 이메일의 `senderEmail` 은 `emails` 안에 있어야 한다. **프론트는 프로필을 바꾸면 번호를 비우지만**(`TextTemplateEditor.tsx:327-332`) 그것은 UX 다 — 직접 POST 하면 다른 프로필의 번호를 실을 수 있다. **문자 발신번호 사전등록제(전기통신사업법)라 미등록 번호로는 발송 자체가 불가하고**(`types.ts:45-50`), 서버가 이를 저장 시점에 막지 않으면 발송 시점에야 실패한다.
3. **그룹 삭제와의 경합**: 이 리소스가 그룹을 참조하므로 **삭제 가드가 반대 방향으로 필요하다**. 프론트는 이미 그 질문에 답할 함수를 갖고 있다 — `templateNamesBySenderProfile(id)`(`store.ts:231-235`, 상태를 가리지 않는다: 꺼 둔 템플릿도 그룹을 가리키고 그룹이 사라지면 다시 켤 수 없게 된다). **BE-005 의 그룹 삭제 계약이 이 참조를 읽어야 한다.**

### 7.2 상태는 별도 엔드포인트가 소유하고, 전이표를 서버가 강제한다 【최우선 판정】

**확인된 사실**:
- 전이 규칙의 정본이 `status.ts` 한 파일에 있고(`:1-5` — '같은 전이를 세 곳이 판단한다: 편집기 헤더, 상세 헤더, 저장소'), 화면은 그 결과를 그릴 뿐이다(`MessageTemplateDetailPage.tsx:250`).
- 상태만 바꾸는 경로가 `update` 와 **의도적으로 분리돼 있다**(`store.ts:317-324`) — 이 판단은 옳고 계약에 그대로 반영한다(EP-05).
- **그러나 그 경로가 공용 어댑터 계약 밖에 있다**(`MessageTemplateDetailPage.tsx:186-194`).

**판정**:
1. **EP-05 가 `draft → active`(발행)와 `active ↔ inactive`(토글)를 만드는 **유일한 문**이다.** EP-04(PUT)는 상태를 실어 받되 전이를 만들지 않는다 — 전이표 밖이면 **422 `INVALID_STATUS_TRANSITION`**.
2. **`draft` 로 되돌아가는 전이는 없다.** 프론트에 표면이 없고, 있다면 '발행을 없던 일로 한다' 는 뜻인데 이 모델은 그것을 `inactive` 로 표현한다(`types.ts:16-17`).
3. **`content.kind` 는 불변이다** — EP-04 의 `KIND_IMMUTABLE`. 이것이 §4 EP-04 에서 가장 중요한 422 인 이유: 프론트의 `toValues` 가 종류 불일치 시 **빈 폼**을 주므로(`TextTemplateEditor.tsx:89-101`), 서버가 막지 않으면 **한 번의 저장으로 본문이 통째로 사라진다.**
4. **이 계약이 지금 화면에 닿지 않는다.** EP-05 의 어떤 에러도 표시되지 않는다(`changeStatus` 에 `onError` 없음). **서버 계약을 먼저 확정하되, 프론트가 이 호출을 어댑터 계약 안으로 들여오기 전에는 연동을 시작하지 않는다** — §7.12 #1.
5. **1.0 과의 차이를 명시한다**: 1.0 §7.1 은 '클라이언트가 승인 상태를 보내는 것' 이 위험이었다. **여기서는 클라이언트가 상태를 보내는 것이 정상이다** — 심사 주체가 없고 상태의 주인이 운영자이기 때문이다. 위험한 것은 **어떤 상태로든 갈 수 있는 것**이지 상태를 보내는 것이 아니다. 그래서 판정이 '읽지 않는다'(1.0)가 아니라 **'전이표로 검증한다'**(2.0)로 바뀐다.

### 7.3 없는 id · 동시 수정 — 404/409 계약과 그 한계

`createStoreAdapter` 가 **존재 검사를 갖는다**(`crud.ts:196` — `const exists = (id) => spec.list().some((item) => item.id === id)`):

| 함수 | 현재 | 결과 |
|---|---|---|
| `fetchOne` | `:217-219` `HttpError(404, '항목을 찾을 수 없습니다.')` — store 위임보다 **먼저** | 편집기의 404 갈래가 산다(`TextTemplateEditor.tsx:256-257`). **상세는 그 갈래를 안 쓴다**(아래) |
| `update` | `:256-258` `HttpError(409, '다른 사용자가 먼저 삭제한 항목입니다.')` | 충돌 다이얼로그 + 입력 보존, 성공 토스트·이동 0건 |
| `remove` | `:275-277` `HttpError(409, '이미 삭제된 항목입니다.')` | 다이얼로그 안 실패 배너. 일괄 삭제에서 실패 건수에 포함 |
| 멱등 | `:193` ledger → `:232`(create) `:245`(update) `:272`(remove) `isReplay`. **기록은 적용에 성공한 뒤에만** | 같은 키의 재시도가 두 벌을 만들지 않는다 — §7.11 |

**판정**:
1. **서버 계약**: EP-02 는 **404 status**, EP-04/EP-05/EP-06 은 없는 id 에 **404**, 동시 수정에 **409/412**. 실 HTTP 어댑터는 이를 `HttpError` 로 승격해 그대로 던진다.
2. **⚠ 이것은 낙관적 동시성이 아니다.** 어댑터의 409 는 **'존재 여부' 기반**이지 `version`/`ETag` 토큰이 아니다. **둘 다 존재하는 동시 편집은 last-write-wins** 다 — `MessageTemplate`(`types.ts:238-250`)에 `version` 이 없고 `lastEditedAt`(`:249`)은 표시값일 뿐이다. **이메일 템플릿에서 이 손실이 특히 크다**: 블록 스택 전체가 한 덩어리로 치환되므로, 나중 저장이 **다른 사람이 추가한 블록을 통째로 지운다**. EP-04 의 `If-Match` 를 실제로 요구하려면 서버가 `version`/ETag 를 EP-02 응답에 실어야 한다.
3. **상세 화면이 404 갈래를 쓰지 않는다.** 편집기는 `loadFailure === 'not-found'` 를 가르는데(`TextTemplateEditor.tsx:250-271`) 상세는 한 문구로 합쳤고 재시도 수단도 없다(`MessageTemplateDetailPage.tsx:234-245`). 그 문구는 '이미 삭제되었을 수 있습니다' 라 **5xx·타임아웃일 때 사실이 아닌 말을 한다**. 서버가 404 와 500 을 정확히 갈라 내려도 화면이 합쳐 버린다 — 프론트 이관(§7.12 #2).
4. **EP-05 는 이 보호를 전혀 받지 않는다** — 어댑터 밖이다(§7.2).

### 7.4 길이 기준 — 문자 수와 바이트 수가 갈려 있고, 발송 불가능한 템플릿이 저장된다 【판정 필수】

| 표면 | 기준 | 값 | 근거 |
|---|---|---|---|
| 본문 `maxLength`·카운터·스키마 | **문자 수** | 2000 | `types.ts:75` · `components/ContentInputCard.tsx:108,122` · `validation.ts:113` |
| 편집기 등급 표시 | **EUC-KR 바이트** | SMS 90 / LMS 2000 | `TextTemplateEditor.tsx:305-307` · `_shared/messaging.ts:278-279,282-289,304-307` |
| 본문 콜아웃 문구 | **'자' 라고 적혀 있다** | `SMS : 90자 이내` | `copy.ts` |

**한글 본문 2000자 = 4000byte 로 LMS 한도(2000byte)를 두 배 넘긴다.** 바이트 표시는 **표시 전용**이라 저장도 발행도 막지 않는다. 콜아웃은 90 을 `자` 라 불러 **한글 45자에서 이미 SMS 를 넘긴다는 사실을 숨긴다**. 결과: **어떤 게이트웨이도 작성한 그대로 보낼 수 없는 템플릿이 `active` 로 발행될 수 있다.**

> 참고 — 이 결함은 새 화면이 만든 것이 아니다. 알림톡 모델의 옛 폼도 바이트 힌트를 **표시만** 했다(`pages/marketing/templates/TemplateFormPage.tsx:476-481`). 두 화면이 같은 뿌리를 물려받았다.

**판정**: 서버가 **종류별로 다른 기준을 강제**한다:
- `text`: `byteLengthOf(body)` ≤ **2000byte**(LMS 한도) → 초과 시 **422 `SMS_BYTE_LIMIT_EXCEEDED`**. 90byte 초과는 거절이 아니라 **LMS 승격**이다(발송 시 유형 자동 판정 — `classifySms`). 첨부가 있으면 MMS 이고 **MMS 본문 한도는 대행사마다 다르므로**(`vendor` 가 SureM/NHN/Solapi 로 갈린다 — `types.ts:63`) 회선별 한도표가 필요하다 — **현재 미정** · §7.12 #3.
- `email`: 제목·블록 본문 각각. **제목 길이 상한이 프론트에 없다**(`validation.ts:190-197` 은 빈값만 본다) — 서버가 정한다(권고: 998 옥텟 미만, RFC 5322 헤더 줄 길이).
- `EUC-KR 근사의 한계를 계약에 적는다**: `byteLengthOf`(`_shared/messaging.ts:282-289`)는 '코드포인트 > 0x7F 면 2byte' 라는 **근사**다. 실제 EUC-KR 에 없는 문자(이모지·일부 한자)는 대행사에 따라 UTF-8/EUC-KR 변환에서 다른 길이가 된다. **서버가 정본 계산기다** — 프론트 값과 다를 수 있고, 그때는 서버 값이 이긴다.

**프론트 이관**: 카운터를 바이트 기준으로 함께 보이고 **한도 초과를 검증으로 막는다**(지금은 표시만). 콜아웃의 `자` 를 `byte` 로 바로잡는다.

### 7.5 이메일 본문은 구조체다 — 블록 단위 검증과 저장형 XSS 【보안 판정】

**1.0 과 가장 크게 갈리는 지점**: 알림톡 모델의 `body` 는 문자열이었다. 여기서는 `blocks: EmailBlock[]` 이고 각 블록이 색·URL·파일명·폰트를 갖는다(`types.ts:91-193`). 그 배열이 그대로 저장되고, `render-html.ts` 가 발송 본문 HTML 로 옮긴다.

**확인된 사실**:
- **클라이언트 검증은 `blocks.length > 0` 뿐이다**(`validation.ts:207-214`). 얕게 둔 것은 의도지만(`:144-155`) 그 의도는 '이메일이 아닌 것이 이메일 폼에 들어오는 것' 을 막는 것이지 내용 보증이 아니다.
- **URL 없는 버튼, 파일 없는 이미지·로고·아바타, 빈 제목/본문 블록이 발행된다.** 캔버스는 `'이 블록의 설정이 아직 비어 있습니다.'`(`INCOMPLETE_MESSAGE` — `email/BlockView.tsx` · 판정 `types.ts:200-214`)를 그리지만 **안내일 뿐**이고, `isBlockIncomplete` 는 검증 스키마 어디에서도 호출되지 않는다.
- 이미지 폭 800 초과도 **경고만** 한다(`email/InspectPanel.tsx:58,614`).
- `render-html.ts` 는 사용자 입력을 **이스케이프한다** — 테스트가 '사용자가 친 태그는 글자로 남는다'(`message-templates.test.ts:359-368`)를 고정한다. **프론트 렌더는 안전하다.**

**판정**:
1. **서버가 블록을 판별자별 스키마로 검증한다.** 알 수 없는 `blockKind` 는 **400**. 그 종류에 없는 필드가 오면 **거절하거나 버린다**(택일하되 문서화한다).
2. **미완성 블록은 `active` 로 저장될 수 없다** — **422 `INCOMPLETE_BLOCK`**(위반 블록 id 를 `error.fields` 에 싣는다). `draft` 저장은 허용한다(작성 중이므로). 판정 함수는 프론트에 이미 있다(`isBlockIncomplete` — `types.ts:200-214`) — **서버가 같은 규칙을 갖되 그것이 정본이다.**
3. **URL 화이트리스트**: 버튼의 `url`(`types.ts:144`)과 이미지의 `clickThroughUrl`(`:160`)은 **http/https 만**. `javascript:`·`data:` 는 거절. 이 값들은 고객에게 나가는 링크다.
4. **색 값은 hex 문자열이다**(`#RRGGBB` 또는 `#RRGGBBAA` — `email/blocks.ts:22-24,28-34`). 자유 문자열로 두면 `style` 속성에 임의 CSS 가 주입된다 — **정규식으로 좁힌다**.
5. **`fontFamily` 는 열거다** — 10종(`email/blocks.ts:39-50`). 자유 문자열을 받으면 같은 주입 표면이 열린다.
6. **HTML 조립 시점에도 이스케이프한다.** 프론트가 이미 그렇게 하지만(`render-html.ts`) **발송 파이프라인이 프론트를 신뢰해서는 안 된다** — 서버가 자기 조립기를 갖는다면 그쪽이 다시 이스케이프한다.
7. **제목은 메일 헤더로 나간다** — **CR/LF 를 제거**해 헤더 인젝션(임의 헤더·수신자 추가)을 막는다. XSS 보다 이것이 먼저다.
8. **첨부·이미지 파일명은 URL 이 아니다**(EP-07). 업로드가 붙기 전까지 서버는 파일명을 **불투명 문자열**로만 다루고 `src` 에 넣지 않는다 — 넣으면 수신자에게 깨진 이미지가 나간다(`render-html.ts:79-82`).

### 7.6 치환변수 — 어휘는 한 벌로 통합됐다. 서버 화이트리스트는 여전히 필요하다 【보안 판정】

> **[해소 — 2026-07-19] 선행 조건이던 '어느 쪽을 화이트리스트로 삼을 것인가' 는 결정됐다.**
> 이 절이 기술하던 두 사전은 **둘 다 삭제됐다** — 문자의 `MESSAGE_VARIABLES`(`_shared/messaging.ts` 의 `[삭제됨]` 머리말)와 이메일의 `email/variables.ts`(파일 자체가 없다). 아래 표는 **그 시점의 기록**으로 남긴다.

| 편집기 | 어휘 (해소 전) | 근거 (당시) |
|---|---|---|
| 문자 | `#{이름}` `#{연락처}` `#{주문번호}` `#{적립금}` `#{쿠폰명}` (한글 키 · 표본값 보유) | `_shared/messaging.ts` `MESSAGE_VARIABLES` (삭제됨) |
| 이메일 | `#{CITY}` `#{GENDER}` `#{FIRST_NAME}` `#{MIDDLE_NAME}` `#{LAST_NAME}` `#{OCCUPATION}` `#{PREFERENCE}` (영문 키 · 표본값 없음) | `email/variables.ts` (삭제됨) |

**현재**: 정본은 `shared/domain/template-variable-catalog.ts` 하나다 — 6도메인 213항목, 키 규칙 `#{namespace.field}`(ASCII·점 하나). 고르는 층은 한국어 라벨, 꽂히는 층은 영문 토큰으로 분리됐다(FS-036 §3.5). 삭제 사유가 소스에 남아 있다: ① 목록의 주인이 마케팅 도메인이 아니었고 ② 한글 토큰은 대행사·백엔드와 주고받을 때 NFC/NFD 정규화에서 조용히 어긋난다.

**프론트는 이미 거절한다** — 카탈로그 밖 토큰이 남아 있으면 문자·이메일·알림톡·브랜드메시지 **네 스키마 전부**가 저장을 막는다(`validation.ts` `unknownVariableError`). **그래도 서버 판정은 그대로 필요하다** — 프론트 검증은 UX 이지 계약이 아니다.

**판정**:
1. **화이트리스트가 필요하다.** 서버는 **알려진 토큰만** 치환한다. 임의 `#{...}` 를 내부 필드 조회로 해석하면 관리자가 `#{password_hash}` 같은 토큰으로 **템플릿 인젝션**을 시도할 수 있다 — 템플릿은 관리자가 자유 텍스트로 쓰는 필드이므로 이 표면이 실재한다.
2. **미해석 변수는 저장 시점에 거절한다** — **422 `UNKNOWN_VARIABLE`**. 통과시키면 이 템플릿을 삽입한 모든 발송 회차가 오염되고, 고객이 `#{쿠폰명}` 을 날것으로 받는다. **템플릿 단계에서 막는 것이 가장 싸다.**
3. **[해소] 화이트리스트의 정본은 카탈로그다** — `shared/domain/template-variable-catalog.ts` 하나이고 종류별로 가르지 않는다(네 편집기가 같은 목록을 본다). 서버는 이 카탈로그와 **같은 키 집합**을 들고 판정한다. 키 규칙(`namespace.field` · ASCII · 점 하나)이 계약면이므로, 서버는 규칙 위반을 형태만으로도 거를 수 있다.
4. **치환값 자체를 정제한다**: 치환값(수신자 이름 등)은 **다른 사용자(회원)가 입력한 데이터**다. 회원이 이름을 `<script>…` 로 등록해 두면 치환이 그것을 HTML 메일에 주입한다 — **저장형 XSS 의 2차 경로**. 치환은 **HTML 이스케이프 후** 삽입한다.
5. **미리보기는 치환하지 않는다** — 문자 미리보기는 토큰을 강조색으로 그대로 드러내고(`components/VariableText.tsx:52-62`), 이메일도 같다(`email/VariableMenu.tsx` 머리말 — '미리보기가 실제 값을 아는 척하면 운영자가 검수를 건너뛴다'). **이 결정을 서버 계약이 되돌리지 않는다** — 발송 전용 치환기와 미리보기는 분리한다.

### 7.7 템플릿명 중복 · 삭제 · 발송 시점 재검증

**중복** — 발송 화면의 삽입 드롭다운이 템플릿을 **이름으로만 구분한다**(`TemplateOption {id, name}` — `store.ts:266-269`). 동명 템플릿 둘은 운영자가 어느 것을 고르는지 알 수 없게 만든다 — 잘못된 문구가 수천 명에게 나가는 경로다. 프론트에 중복 검사가 없다(FS-036 §7 #9).
**판정**: 앞뒤 공백 제거 + 대소문자 무시로 정규화한 이름의 중복을 **409 `TEMPLATE_NAME_DUPLICATED`** 로 막는다. **범위는 전역 유니크** — 드롭다운이 종류로 이미 걸러지지만 관리자가 목록에서 찾을 때는 종류를 넘나든다.

**삭제** — EP-06 참조. **막지 않는다**(값 복사라 고아가 생기지 않는다). `active` 삭제만 응답으로 알린다.

**발송 시점 재검증** — `selectableTemplates`(`store.ts:252-256`)가 드롭다운을 `active` + 종류로 거른다. **이것은 목록 필터일 뿐이다** — 발송 화면은 템플릿의 본문을 **자기 폼에 복사**하고 발송은 그 폼 값으로 나가므로, **발송 요청에 템플릿 id 가 실리지 않는다.** 관리자가 `active` 템플릿을 삽입한 뒤 본문을 고쳐서 보낼 수 있고, 삽입 후 템플릿이 `inactive` 로 바뀌어도 이미 복사된 본문은 나간다.
**판정**: 이 구조에서 '승인된 문구만 나간다' 를 서버가 보장할 방법은 **발송 요청에 템플릿 id 를 싣는 것**뿐이다. 발송 엔드포인트 계약이 아직 없으므로 **발송 계약 확정 시 함께 정한다** — §7.12 #9. **다만 이 모델에는 외부 심사가 없어 1.0 만큼 위험하지는 않다** — 발송되는 문구가 심사받은 문구와 달라도 규제 위반이 아니라 운영 실수다.

### 7.8 이력 · 감사 — 'lastEditedBy' 하나가 두 가지 행위를 덮는다

**확인된 사실**:
- 이력 필드는 4개다: `createdBy`·`createdAt`·`lastEditedBy`·`lastEditedAt`(`types.ts:245-249`). **입력 타입에 없으므로 서버가 채운다**(`store.ts:201-204`) — 구조적으로 옳다.
- 현재 픽스처는 상수를 찍고(`CURRENT_EDITOR` — `store.ts:212`) `TODO(backend)` 가 그 자리에 있다(`:210`).
- **상태 변경도 `lastEditedBy` 를 덮는다**(`store.ts:328`).
- 상세의 중앙 카드 제목이 '상태 이력'(`copy.ts:110`)인데 **내용은 현재값 8줄이다**(`MessageTemplateDetailPage.tsx:344-366`).

**판정**:
1. **이력 4필드는 서버가 인증 주체·서버 시각으로 채운다.** 클라이언트가 보낸 값을 읽지 않는다. `createdBy`/`createdAt` 은 수정으로 바뀌지 않는다(`store.ts:305` 가 이미 그렇다).
2. **`lastEditedBy` 는 '내용을 고친 사람' 으로 좁힌다.** EP-05(상태 변경)는 이 필드를 갱신하지 않기를 권고한다 — 갱신하면 스위치를 누른 사람이 본문 작성자로 기록된다. 대신 `lastStatusChangedBy`/`At` 를 두거나(필드 추가), 아래 3을 택한다.
3. **상태 전이 이력을 별도 리소스로 둘지는 미정이다.** 화면이 '상태 이력' 이라는 제목을 이미 쓰고 있으므로 **UI 는 그 표를 기대하는 모양이다.** 누가 언제 발행했고 언제 껐는지는 지금 어디에도 남지 않는다. **템플릿 자체의 버전 이력(본문 변경 이력)도 없다** — 발송에 쓰인 문구가 나중에 바뀌면 추적할 수 없다(다만 삽입이 값 복사라 이미 만들어진 회차는 자기 본문을 보존한다). §7.12 #10.
4. **`createdAt`/`lastEditedAt` 의 시간대**: 픽스처는 저장 시 `new Date().toISOString()`(UTC — `store.ts:214-216`)을 쓰고 시드는 로컬 표기 문자열이다(`:102` `'2026-05-02T09:12:00'`). **서버가 정본이며 ISO 8601 + 타임존을 일관되게 내린다.**

### 7.9 일괄 삭제 — 전용 엔드포인트를 만들지 않는다

프론트가 `settleAll` 로 단건 DELETE(EP-06)를 병렬 호출하고 부분 실패를 건수로 집계한다(FS-036-EL-021). 단건이 멱등이므로 재시도가 안전하다. BE-010 §7.1 · BE-033 §7.7 과 같은 근거.

**한계 기록**: 실패한 **id 를 돌려주지 않아** 재시도가 성공분까지 재실행한다(FS-036 §7 #11). 선택 건수 상한·동시성 제한이 없어 레이트리밋(분당 60)에 걸리면 실패 건수만 늘어난다. UI 기획 이관.

### 7.10 타입 이름 충돌 — 연동 전에 정리한다

`MessageTemplate` 이 두 곳에 있다: `message-templates/types.ts:238`(이 계약의 대상)과 `_shared/messaging.ts:224`(알림톡 모델). `TEMPLATE_NAME_MAX = 60` 도 두 벌이다(`types.ts:252` · `messaging.ts:238`).

**판정**: **API 계약에는 영향이 없지만 연동 작업의 사고 표면이다.** 두 모델이 공존하는 동안 import 를 잘못 집으면 타입 검사는 통과하는데 필드가 다르다(한쪽은 `channel`/`approvalStatus`, 다른 쪽은 `status`/`content`). **알림톡이 파킹된 지금이 정리하기 가장 싼 시점이다** — 옛 타입에 접두사를 붙이거나 네임스페이스를 가른다. §7.12 #11.

### 7.11 등록·수정 멱등키

프론트가 제출 **시도** 단위로 `Idempotency-Key` 를 만들고(`useCrudForm.ts:126-129`) 성공하면 버린다(`:228`). 동기 제출 락도 있다(`:210-211`). 키는 `WriteContext.idempotencyKey` 로 실려 `createStoreAdapter` 의 ledger(`crud.ts:193`)가 `:232`(create) · `:245`(update) · `:272`(remove) 에서 재생 판정한다. **기록은 적용에 성공한 뒤에만** 한다.

**판정**: `POST`(EP-03)는 `Idempotency-Key` 를 **필수**로 받는다 — 같은 키의 재요청은 **최초 응답을 재생**한다. 보존 기간 24시간. `PUT`(EP-04)은 본래 멱등이지만 키를 받아 재시도 안전성을 높인다. **서버도 ledger 의 순서 계약을 지킨다**: 키는 **적용에 성공한 뒤에만** 기록한다 — 미리 태우면 실패한 첫 시도가 재시도를 영원히 no-op 으로 만들어 사용자에게 '저장했습니다' 를 보이고 아무것도 저장하지 않는다. **EP-05(상태 변경)는 이 배선을 지나지 않는다** — §7.2.

### 7.12 후속 이관

| # | 내용 | 이관 |
|---|---|---|
| 1 | **상태 변경(EP-05) 호출이 어댑터 계약 밖에 있다** — 존재 검사·멱등·abort·**실패 표면**·재현 스위치가 전부 없다(`MessageTemplateDetailPage.tsx:186-194`). 서버가 404/409/422 를 내려도 화면이 아무것도 보여 주지 못한다. **연동 선행 조건**(§7.2) | **프론트 구현(최우선)** · 백엔드 명세 |
| 2 | **상세 화면이 404 와 5xx 를 가르지 않는다** — 한 문구('이미 삭제되었을 수 있습니다')로 합쳤고 재시도 수단도 없다(`MessageTemplateDetailPage.tsx:234-245`). 편집기는 가른다(§7.3) | 프론트 구현 · UI 기획 |
| 3 | **길이 기준이 문자/바이트로 갈렸고 SMS/LMS 한도를 넘겨도 저장된다.** MMS 본문 한도가 대행사(SureM·NHN·Solapi)별로 미정. 이메일 제목 상한 미정(§7.4) | UI 기획 · 백엔드 명세 |
| 4 | **[해소 — 2026-07-19]** ~~치환변수 어휘가 두 벌이다~~ — 두 목록이 모두 삭제되고 `shared/domain/template-variable-catalog.ts` 한 벌로 통합됐다. 화이트리스트의 정본이 정해졌으므로 §7.6(422 `UNKNOWN_VARIABLE`)의 선행 조건은 풀렸다 — 남은 것은 서버가 **같은 키 집합**을 들고 판정하는 일뿐이다(아키텍처 판정 불요) | **백엔드 명세** (아키텍처 판정 해소) |
| 5 | **삭제 멱등 계약이 픽스처와 갈린다** — 서버는 이미 삭제된 id 에 **204**(멱등), 픽스처는 **409**(`crud.ts:275-277`). 연동 시 일괄 삭제의 '실패 건수' 집계가 달라진다(§7.3 · EP-06) | 백엔드 명세 · UI 기획 |
| 6 | **업로드 계약 미정**(EP-07) — 심만 있고 업로드가 없다. 두 소비처가 다른 것(파일명 vs URL)을 요구하며, **JPG·500KB·1000px 제약의 유일한 서버 판정자**가 이 엔드포인트다. 앱 전역 리소스로 확정해야 한다 | **아키텍처 · 백엔드 명세** |
| 7 | **뉴스레터만 옛 모델을 본다** — `newsletters/NewsletterFormPage.tsx:35,177` 이 `_shared/store.ts:213` 을 쓴다. 이 화면의 이메일 템플릿이 뉴스레터에 뜨지 않는다(EP-08) | 프론트 구현 |
| 8 | **알림톡 계약이 파킹됐다**(§4.9) — 1.0 §7.1 의 판정들(승인 상태 서버 정본화 등)은 **닫힌 것이 아니라 도달 불가**다. 알림톡이 세 번째 종류로 들어올 때 함께 확정한다 | 아키텍처 · 백엔드 명세 |
| 9 | **발송 시점 재검증 방식 미정** — 값 복사 구조라 발송 요청에 템플릿 id 가 없다. 발송 계약 확정 시 함께 정한다(§7.7) | 백엔드 명세 |
| 10 | **상태 전이 이력·본문 버전 이력이 없다** — 상세의 '상태 이력' 표가 현재값 8줄이고, `lastEditedBy` 하나가 '고친 사람' 과 '스위치를 누른 사람' 을 같이 덮는다(§7.8) | 백엔드 명세 · UI 기획 |
| 11 | **`MessageTemplate` 타입 이름이 두 곳에서 충돌한다**(§7.10). 알림톡이 파킹된 지금이 정리하기 가장 싼 시점 | 프론트 리팩터 · 아키텍처 |
| 12 | **낙관적 동시성 토큰이 없다** — 409 는 '존재 여부' 기반이다. 이메일은 블록 스택 전체가 치환되므로 last-write-wins 의 손실이 크다(§7.3-2) | 백엔드 명세 · 프론트 리팩터 |
| 13 | 목록 정렬 계약 신설(`lastEditedAt` 내림차순) + 페이징·서버 검색(EP-01). **목록 응답이 이메일 블록 스택 전체를 싣는다** — 검색은 이름과 (문자)본문/(이메일)제목만 쓰므로(`MessageTemplateListPage.tsx:102-113`) **블록은 목록에서 쓰이지 않는다.** 서버 검색을 도입할 때 목록 응답에서 `blocks` 를 빼는 것을 함께 검토한다 | UI 기획 · 백엔드 명세 |
| 14 | **`active` 편집을 서버가 막을지 미정**(EP-04) — 프론트의 `canEdit` 은 UI 규칙일 뿐이고 라우트에 가드가 없다(App.tsx:339) | 백엔드 명세 · UI 기획 |
| 15 | 템플릿명 전역 유니크(409) — 프론트에 중복 검사 없음(§7.7) | 백엔드 명세 |
| 16 | 일괄 삭제가 실패 id 를 돌려주지 않고 선택 상한·동시성 제한이 없다(§7.9) | UI 기획 |
| 17 | 쓰기 권한 게이팅 미배선 — **발행·Active 토글도 권한 축으로 막히지 않는다**(§2). `useRouteWritePermissions` 를 `pages/marketing/**` 에서 쓰는 코드가 0건이다 | UI 기획 · 프론트 구현 |
| 18 | 401 감지 시 작성 중 폼(본문·블록 스택)이 사라진다 · 프론트 타임아웃 상한 없음 · 오프라인 감지 없음 | 프론트 구현 · 백엔드 명세 |

## 8. 자기 점검

- [x] **대상 화면이 바뀌었다는 사실**을 §1 머리에 명시하고, 1.0 의 어느 판정이 빠지고 어느 것이 파킹되는지(§4.9) 밝혔다
- [x] FS-036 §5 요소가 전부 엔드포인트로 커버됐다 — 심 있는 **6개**(EP-01·02·03·04·**05 상태 변경**·06) + 심 있으나 계약 미확정 **1개**(EP-07 업로드) + 심 없음 **1개**(EP-08 삽입 후보 = EP-01 필터)
- [x] 모든 엔드포인트가 FS 요소를 역참조한다
- [x] §5 예외 9축 빈칸 0건, 모든 `N/A`·`미정` 에 사유 (8행 × 9열)
- [x] 에러 봉투·권한 모델을 BE-003 상속으로 선언, 재정의 안 함
- [x] 멱등성 판정 — 조회 GET / 등록 비멱등 + `Idempotency-Key` / 수정 PUT + If-Match + 키 / **상태 변경 PATCH 멱등** / 삭제 204 멱등
- [x] **보안 판정 4건** — 발신 프로필 조합 검증(§7.1) · **상태 전이표 강제 + `KIND_IMMUTABLE`**(§7.2) · 이메일 블록 검증 + URL/색/폰트 화이트리스트 + 헤더 인젝션(§7.5) · 치환변수 화이트리스트 + 치환값 이스케이프(§7.6)
- [x] **심에 없는 엔드포인트를 지어내지 않았다** — 심 5곳(`data-source.ts:38-39` · `store.ts:210,323` · `ImageAttachRow.tsx:142` · `render-html.ts:83`)만 계약으로 옮겼고, 업로드는 '계약 미확정' 으로, 삽입 후보는 'EP-01 의 필터' 로 판정했다
- [x] **알림톡 심사 제출을 라이브 계약에서 뺐다** — §4.9 에 파킹으로 기록하고, 1.0 §7.1 의 판정들을 '닫힘' 이 아니라 '도달 불가' 로 명시했다
- [x] **API 경로를 라우트에 맞춰 고쳐 쓰지 않았다** — `/api/marketing/message-templates` 를 그대로 쓰고, 라우트(`/marketing/templates`)와의 갈림 및 옛 라우트의 리다이렉트(App.tsx:341-348)를 §1 에 설명했다
- [x] **브리핑을 그대로 옮기지 않고 코드로 재확인했다** — 옛 폼이 SMS 바이트를 강제했다는 서술을 쓰지 않았다(`TemplateFormPage.tsx:476-481` 은 표시 전용이다 · §7.4 참고). `createStoreAdapter` 의 줄번호를 `crud.ts:196,217-219,256-258,275-277` 로 실측했다
- [x] `types.ts` 의 존재와 타입 정본 위치(이 폴더)를 §1·§3 에 명시하고, `_shared/messaging.ts` 와의 이름 충돌을 §7.10 으로 다뤘다
- [x] 서버 코드·저장소 설계를 쓰지 않았다
