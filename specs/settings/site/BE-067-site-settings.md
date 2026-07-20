---
id: BE-067
title: "사이트 설정 백엔드 기능 명세"
functionalSpec: FS-067
owner: 백엔드 명세
reviewer: 명세 리뷰
gate: G9
status: draft
version: 1.1
date: 2026-07-18
---

# BE-067. 사이트 설정 백엔드 기능 명세

> **1.1 갱신 요지 (2026-07-18)** — 대상 화면이 워킹 트리에서 전면 재작성됐다(HEAD 미커밋). 값 계약이 **9필드 → 12필드**로 바뀌었고(`baseUrl`·`contactEmail`·`contactPhone`·`timezone`·`signupEnabled`·`maintenanceMode`·`maintenanceMessage` 삭제 / 표시 이미지 3종·공개 범위·이용 옵션 3종·메일·SMS 전용 이름 신설), **엔드포인트가 하나 늘었다**(`POST /api/uploads` — 심이 실재한다). 반면 **계약을 가로지르는 판정**(§7.1 서버 재검증·XSS · §7.2 토큰 기반 동시성 · §7.3 감사 위조 · §7.4 멱등성 · §7.5 403-not-404 · §7.7 `operator` 쓰기 차단)은 표면이 그대로라 **전부 유지**한다. `maintenanceMessage` 에 걸려 있던 XSS·교차 규칙 판정은 **`siteName`·`siteDescription`·자산 URL** 로 옮겨 붙었다.

## 1. 개요

| 항목 | 내용 |
|---|---|
| 대상 화면 | FS-067 사이트 설정 (`/settings/site`) |
| 범위 | 사이트 설정 문서 1건의 조회·저장 + **표시 이미지 자산 업로드**. 낙관적 동시성(revision/ETag) · 감사 추적(누가 언제) |
| **범위 밖** | **저장된 값의 실제 집행** — 이 계약은 `visibility`·`copyProtection`·`mobileZoomAllowed`·`keepSignedIn` 을 **저장**할 뿐 방문자 요청을 막거나 우클릭을 잠그거나 뷰포트를 고정하는 주체가 아니다. 사이트 렌더러·게이트웨이가 이 값을 읽어 집행한다(별도 계약 — §7.6 #6). **도메인 연결** — `siteUrl` 은 이 화면이 고치지 않으며(FS-067-EL-043) **이 엔드포인트의 PUT 바디에도 없다**(§7.6 #7). **설정 이력 조회** — 이 계약은 '마지막 변경자·시각' 1건만 내려주며 변경 이력 목록은 로그 도메인 소관 |
| 전제 | BE-003 §2·§3 을 상속한다. 인증은 세션 쿠키 기반. 모든 경로는 `/api` 프리픽스. 응답 본문은 `application/json; charset=utf-8`. 시각은 ISO 8601(오프셋 포함) |
| 프론트 어댑터 | `apps/admin/src/pages/settings/site/data-source.ts` (`siteSettingsStore` = `createRevisionedStore<SiteSettingsValues>('site', …)` · `uploadSiteAsset(file, signal)`) |
| 도메인 타입 | `apps/admin/src/pages/settings/site/validation.ts` (`SiteSettingsValues` = `z.infer<typeof siteSettingsSchema>` · `SiteAsset`) · 봉투 타입은 `pages/settings/_shared/store.ts` (`Revisioned<T>` · `AuditInfo`) |
| 검증 정본 | **zod 스키마 `siteSettingsSchema`**(`validation.ts:116-184`) + **파일 규칙 순수 함수**(`validation.ts:54-82`). 서버는 이 규칙을 재현하되 **프론트 검증을 신뢰하지 않는다**(§7.1) |

### 1.1 코드 대조 근거표

| 계약 항목 | 코드 근거 | 확인 내용 |
|---|---|---|
| 엔드포인트 2건(설정) | `data-source.ts:77` `// TODO(backend): GET /api/settings/site · PUT /api/settings/site` | **심이 실재한다** — 이 문서는 심을 계약으로 옮길 뿐 발명하지 않았다 |
| PUT 요청 형태 | `data-source.ts:78-80` `PUT 요청: If-Match: <revision> 헤더 + 바디 { siteName, siteDescription, messagingNameEnabled, messagingName, favicon, ogImage, visibility, privateImage, copyProtection, mobileZoomAllowed, keepSignedIn }` | 헤더 + **바디 11필드**가 심에 명시돼 있다. ⚠ **값 타입은 12필드다** — `siteUrl` 이 심의 목록에서 빠져 있다(§7.6 #7) |
| 응답 형태 | `data-source.ts:81-82` `응답: 200 → { value, revision, audit } / 409·412 → 동시 편집 충돌(최신 문서를 실어 보낸다) / 422 → 필드 검증 실패` | 200·409·412·422 가 심에 명시돼 있다 |
| 엔드포인트 1건(업로드) | `data-source.ts:92` `TODO(backend): POST /api/uploads (multipart) → 응답 { name, size, url }` | **신설 심.** 응답 형태까지 명시돼 있다 |
| 업로드 응답의 한계 | `data-source.ts:94-96` `⚠ 지금 돌려주는 url 은 URL.createObjectURL(file) 이 만든 미리보기 핸들이다. 저장된 자산이 아니다 — 문서 세션이 끝나면 죽는다` | **심이 §7.6 #11 을 미리 선언한다** |
| 낙관적 동시성 | `_shared/store.ts:124-126` `if (input.force !== true && input.expectedRevision !== current.revision) throw new SettingsConflictError(current)` | **토큰 기반**(존재 여부 기반이 아니다) |
| revision → ETag | `_shared/store.ts:8` '백엔드가 붙으면 revision 은 ETag / If-Match 헤더가 되고, 이 파일의 본문만 교체된다' | 마이그레이션 경로가 코드에 선언돼 있다 |
| 감사 주체 | `_shared/store.ts:83` `// TODO(backend): 저장 주체는 서버가 세션에서 읽어 기록한다 — 프론트가 보내는 값을 신뢰하면 안 된다.` · `:84` `const CURRENT_ADMIN = '김운영'` | **심이 §7.3 을 미리 선언한다** |
| 서버 재검증 | `data-source.ts:82` `422 → 필드 검증 실패(프론트 검증은 UX 이지 보증이 아니다 — 서버가 다시 검증한다)` | §7.1 의 근거 |
| 실패 재현 | `_shared/store.ts:110,116` `failIfRequested(scope, 'load'\|'save')` · `:119` `conflictRequested(scope)` · `site/data-source.ts:100` `failIfRequested(SCOPE, 'upload')` | op **3종** + conflict 스위치 |

> **에러 봉투·권한 모델 상속**: BE-003 §2·§3 을 그대로 상속한다(BE-010 §1 과 동일 선언). 아래는 사이트 설정 고유 차이만 기술한다.

## 2. 공통 (상속)

- **에러 봉투**: BE-003 §2. 공통 에러코드 동일(`VALIDATION_FAILED` · `UNAUTHENTICATED` · `FORBIDDEN` · `CSRF_TOKEN_INVALID` · `NOT_FOUND` · `CONFLICT` · `UNPROCESSABLE` · `RATE_LIMITED` · `INTERNAL_ERROR` · `REQUEST_TIMEOUT`) + 업로드 고유 `PAYLOAD_TOO_LARGE` · `UNSUPPORTED_MEDIA_TYPE`(§4 EP-03).
- **권한**: `admin` = 조회 + 저장 + 업로드. **`operator` = 조회만** — 시스템 설정 쓰기는 열지 않는다(§7.7). BE-026(1:1 문의)이 `operator` 에게 쓰기를 연 것과 반대 판정이며, 그 근거는 §7.7 에 있다.
- **CSRF**: 쓰기(PUT · POST)에 `X-CSRF-Token`.
- **타임아웃**: 조회·쓰기 5초 → 504. **업로드는 예외** — 5MB 파일이 5초 안에 끝난다고 가정하지 않는다(§4 EP-03).
- **프론트 역할 분기**: 이 화면은 `useRouteWritePermissions().canUpdate` 로 **쓰기 컨트롤을 게이팅한다**(`SiteSettingsPage.tsx:130` · FS-067-EL-015). 그러나 그것은 UX 층이며 **권한 강제는 서버 책임**이다(`RequirePermission.tsx:8-11` 이 이 경계를 스스로 선언한다: '위조된 localStorage 로 이 가드는 우회된다').

## 3. 데이터 계약

| 타입 | 필드 | 비고 |
|---|---|---|
| `Revisioned<T>` | `value: T` · `revision: string` · `audit: AuditInfo` | 조회·저장 응답의 **봉투**. `_shared/store.ts:24-29` |
| `AuditInfo` | `updatedBy: string` · `updatedAt: string`(ISO) | 마지막으로 이 설정을 바꾼 사람과 시각. `store.ts:17-21` |
| `SiteAsset` | `{ name: string, size: number, url: string } \| null` | 업로드된 자산 1건. **nullable** — 자산이 없는 것이 정상 상태다. `validation.ts:87-93` |
| `SiteSettingsValues` | `siteName` · `siteDescription` · `messagingNameEnabled` · `messagingName` · `siteUrl` · `favicon` · `ogImage` · `visibility` · `privateImage` · `copyProtection` · `mobileZoomAllowed` · `keepSignedIn` | **12필드.** 최상위는 평면이나 **자산 3필드가 객체다** — 더 이상 완전 평면 문서가 아니다(§7.6 #12). `validation.ts:116-186` |

**필드 규칙 (`siteSettingsSchema` 대조 — 서버가 정본)**

| 필드 | 타입 | 규칙 | 코드 근거 |
|---|---|---|---|
| `siteName` | string | trim 후 비어 있지 않다 · trim 길이 ≤ **20** | `validation.ts:16,118-121` |
| `siteDescription` | string | 비어도 된다 · trim 길이 ≤ **100** | `validation.ts:19,122-125` |
| `messagingNameEnabled` | boolean | — | `validation.ts:127` |
| `messagingName` | string | **교차 규칙 대상**(아래 1·2). 스위치가 꺼져 있으면 **아무 규칙도 걸리지 않는다** | `validation.ts:128,150-167` |
| `siteUrl` | string | **형식 규칙 없음**(`z.string()`) — 이 화면이 고치지 않는 값이라 신뢰한다. ⚠ **PUT 바디 목록에 없다** | `validation.ts:130-134` · `data-source.ts:78-80` |
| `favicon` | `SiteAsset` | nullable 객체. 파일 규칙은 스키마 밖 순수 함수: **`.ico` 만** · **≤ 100KB** · **최소 변 16px** | `validation.ts:33,36,54-62,77-82` |
| `ogImage` | `SiteAsset` | nullable 객체. **png·jpg·jpeg·gif** · **≤ 5MB**. **해상도 규칙 없음** | `validation.ts:39,64-74` |
| `visibility` | enum | `'public'` \| `'private'` | `validation.ts:98,139` |
| `privateImage` | `SiteAsset` | `ogImage` 와 같은 파일 규칙 + **교차 규칙 3** | `validation.ts:140,172-183` |
| `copyProtection` | boolean | — | `validation.ts:142` |
| `mobileZoomAllowed` | boolean | — | `validation.ts:143` |
| `keepSignedIn` | boolean | — | `validation.ts:144` |

**교차 규칙 (`.check()` — 서버가 재판정)**

1. `messagingNameEnabled && messagingName.trim() === ''` → `messagingName` 에 위반. 근거: 전용 이름을 켜 놓고 비우면 **발송 본문의 접두사가 사라진다**(`validation.ts:149-157`).
2. `messagingNameEnabled && byteLengthOf(messagingName) > 40` → `messagingName` 에 위반(`validation.ts:158-166`). **글자 수가 아니라 바이트다** — SMS 본문은 EUC-KR 90byte 에서 LMS 로 승격되고, 접두사가 먹는 바이트가 곧 본문에 남는 여유다(`validation.ts:21-27`). ⚠ **프론트의 바이트 계산은 근사다** — §7.6 #10.
3. `visibility === 'private' && privateImage !== null && privateImage.url.trim() === ''` → `privateImage` 에 위반. 근거: 업로드가 중간에 끊기면 이름만 있고 주소가 빈 자산이 남고, **비공개 상태에서 그 값을 저장하면 방문자가 깨진 이미지를 본다**(`validation.ts:169-183`). **전체 공개면 판정하지 않는다** — 쓰지 않을 값을 막지 않는다(`site.test.ts:147-153`).

> ⚠ **1·2 와 3 의 비대칭에 주의**: 1·2 는 스위치가 꺼지면 통째로 면제되고, 3 은 자산이 `null` 이면 면제된다(`site.test.ts:162-166` — '비공개인데 이미지가 아예 없으면 통과한다. 기본 비공개 페이지가 대신 뜬다'). **서버는 이 면제까지 재현해야 한다** — 더 엄하게 걸면 정상 상태를 거절한다.

**길이 상한이 없는 필드**: `siteUrl` · 자산의 `name`·`url` 에는 스키마 길이 규칙이 **없다**. **서버는 자체 상한을 둔다**(예: `siteUrl` 2048 · `name` 255 · `url` 2048) — §7.6 #4.

## 4. 엔드포인트 명세

### BE-067-EP-01 · 사이트 설정 조회
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-067-EL-013, EL-018, EL-019, EL-026 |
| 근거 (심) | `data-source.ts:77` `GET /api/settings/site` |
| 메서드·경로 | `GET /api/settings/site` |
| 권한 | `admin`, `operator`(조회) |
| 멱등성 | 멱등(GET) |
| 레이트리밋 | 분당 120회 |

**쿼리**: 없다. 단일 문서다.

**응답 200** — `{ value: SiteSettingsValues, revision: string, audit: AuditInfo }`.
- `revision` 은 **불투명 문자열**이다 — 프론트는 이 값을 해석하지 않고 그대로 되돌려 보낸다(`queries.ts:23` '내가 읽은 문서의 토큰'). 서버는 ETag 를 그대로 써도 되고 버전 번호를 써도 된다.
- **`ETag: <revision>` 응답 헤더를 함께 준다** — 어댑터가 본문의 `revision` 을 쓰든 헤더를 쓰든 같은 값이어야 한다(`store.ts:8` 의 마이그레이션 선언).
- `audit.updatedBy` 는 **표시용 이름**이다(운영자가 읽는다). 계정 id 가 아니다 — `AuditNote.tsx:32` 가 그대로 렌더한다.
- **자산 3필드의 `url` 은 브라우저가 곧바로 `<img src>` 로 쓸 수 있어야 한다**(`Previews.tsx:129,236` · `FileChip`). 서명 URL 이라면 만료가 이 화면의 체류 시간(편집 세션)보다 길어야 한다 — 만료되면 미리보기만 깨지고 값은 멀쩡한, 설명하기 어려운 상태가 된다.

**에러**: 401 · 403 · 429 · 500 · 504.

---

### BE-067-EP-02 · 사이트 설정 저장
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-067-EL-015, EL-020, EL-022, EL-022.2, EL-024, EL-024.4 |
| 근거 (심) | `data-source.ts:77-82` `PUT /api/settings/site` + `If-Match` + 11필드 바디 + 200/409·412/422 |
| 메서드·경로 | `PUT /api/settings/site` |
| 권한 | **`admin` 만**(§7.7) |
| 멱등성 | **조건부 멱등** — `If-Match` 가 있으면 같은 요청의 재시도는 두 번째부터 412/409 로 거절된다(§7.4) |
| 레이트리밋 | 분당 30회 |

**요청 헤더**: `If-Match: <revision>` · `X-CSRF-Token: <token>`.

**요청 바디**: **부분 갱신(PATCH)이 아니라 전체 치환**이다 — 프론트가 `getValues()` 전량을 보낸다(`SiteSettingsPage.tsx:222-223,289`). 심이 나열한 필드는 11개이고 `siteUrl` 이 빠져 있다(§7.6 #7) — **계약은 `siteUrl` 을 받지 않는다**로 확정하고, 실려 오더라도 **무시**한다(도메인 연결은 다른 화면·다른 계약의 일이다).

**서버 검증 (요청을 그대로 믿지 않는다)**
1. **§3 의 필드 규칙·교차 규칙 3건을 전부 재판정**한다(§7.1). 위반 시 422(§5).
2. **`audit` 를 요청에서 받지 않는다** — 바디에 없고, 있어도 무시한다. 서버가 세션 주체와 서버 시각으로 찍는다(§7.3).
3. **`revision` 을 요청 바디에서 받지 않는다** — `If-Match` 헤더가 정본이다.
4. **자산 3필드의 `url` 을 그대로 저장하지 않는다** — 서버가 발행한 자산만 받는다(§7.1 · §7.6 #11). 클라이언트가 임의 URL 을 넣으면 방문자 페이지에 외부 리소스가 심긴다.
5. **`siteUrl` 을 이 엔드포인트로 바꿀 수 없다** — 위 요청 바디 절.

**`If-Match` 처리**
- 헤더가 **없으면 428 `PRECONDITION_REQUIRED`** — 토큰 없는 맹목적 덮어쓰기를 허용하지 않는다(§7.2).
- 헤더가 **현재 revision 과 다르면 412 `PRECONDITION_FAILED`** — 응답 본문에 **최신 문서를 실어 보낸다**(`{ value, revision, audit }`). 프론트가 '무엇이 달라졌는지'를 짚으려면 최신 값이 필요하다(FS-067-EL-024.2 · `store.ts:34-35`). **자산 3필드도 최신 값을 그대로 실어야 한다** — 빼면 프론트의 diff 가 더 크게 거짓말한다(§7.6 #12).
- **덮어쓰기(force)**: 사용자가 충돌 다이얼로그에서 '내 변경으로 덮어쓰기'를 고르면(FS-067-EL-024.4) 프론트가 `force: true` 로 다시 저장한다. **계약 표현은 `If-Match: *`** — '어떤 revision 이든 상관없다'는 HTTP 표준 표현이며 새 필드를 만들지 않는다. 서버는 `*` 일 때 토큰 검사를 건너뛴다.

**응답 200** — `{ value, revision, audit }` (새 revision + 새 audit). 프론트가 이것을 **캐시에 직접 심는다**(`_shared/queries.ts:45` `client.setQueryData(key, saved)`) — 그래서 **응답에 새 revision 이 반드시 실려야 한다.** 실리지 않으면 다음 저장이 낡은 토큰으로 412 를 맞는다(`queries.ts:43-44` 가 이 함정을 주석으로 못박는다).

**에러**: 400 · 401 · 403 `FORBIDDEN` · 403 `CSRF_TOKEN_INVALID` · **412 `PRECONDITION_FAILED`**(최신 문서 동봉) · 428 `PRECONDITION_REQUIRED` · **422 `VALIDATION_FAILED`**(`error.fields`) · 429 · 500 · 504.

---

### BE-067-EP-03 · 표시 이미지 업로드 【신설 — 1.1】
| 항목 | 내용 |
|---|---|
| 근거 (FS) | FS-067-EL-031, EL-033, EL-036, EL-041 |
| 근거 (심) | `site/data-source.ts:92` `TODO(backend): POST /api/uploads (multipart) → 응답 { name, size, url }` |
| 메서드·경로 | `POST /api/uploads` |
| 권한 | **`admin` 만** — 저장과 같은 축이다(§7.7). 업로드만 열면 쓰기 권한 없는 주체가 스토리지를 채울 수 있다 |
| 멱등성 | **비멱등** — 같은 파일을 두 번 올리면 자산이 두 건 생긴다. 프론트에 업로드 잠금이 없다(FS-067 §4.1) |
| 레이트리밋 | 분당 20회 · 시간당 총량 상한 별도 |

**요청**: `multipart/form-data` · 파일 1건 · `X-CSRF-Token`. **자산 자리(slot)를 보내지 않는다** — 어댑터 시그니처가 `uploadSiteAsset(file, signal)` 로 파일만 받는다(`data-source.ts:98`). 자리별 규칙은 **프론트가 업로드 전에** 판정한다(`useAssetUpload.ts:86,105-113`).

**서버 검증 (프론트 판정을 신뢰하지 않는다 — 이 엔드포인트는 slot 을 모른다)**
1. **MIME 을 확장자가 아니라 매직 넘버로 판정**한다. 프론트는 파일명 확장자만 본다(`validation.ts:48-51` `extensionOf`) — `evil.svg` 를 `evil.png` 로 바꾸면 통과한다.
2. **용량 상한은 가장 느슨한 자리 기준**(5MB)으로 걸되, 파비콘 100KB·최소 변 16px 같은 **자리별 규칙은 EP-02 저장 시점에 다시 판정**한다 — 업로드가 slot 을 모르기 때문이다. 이 비대칭이 계약의 약한 고리다(§7.6 #11).
3. **SVG 를 받지 않는다** — 프론트 화이트리스트에 없고(`validation.ts:64`), SVG 는 스크립트를 품는다(§7.1).
4. 업로드가 성공해도 **어느 설정에도 참조되지 않은 자산은 고아**다 — GC 정책이 필요하다(§7.6 #11).

**응답 201** — `{ name: string, size: number, url: string }`. `url` 은 **서버가 발행한 영구(또는 충분히 긴 서명) 주소**여야 한다. 현재 픽스처는 `URL.createObjectURL` 핸들을 돌려주며 코드가 그 사실을 스스로 적어 뒀다(`data-source.ts:94-96`).

**에러**: 400 · 401 · 403 `FORBIDDEN` · 403 `CSRF_TOKEN_INVALID` · **413 `PAYLOAD_TOO_LARGE`** · **415 `UNSUPPORTED_MEDIA_TYPE`** · 429 · 500 · 504.

> **어댑터 요구사항(시그니처 불변)**: `RevisionedStore<T>` 인터페이스(`store.ts:67-74`)는 `fetch(signal)` · `save(input, signal?)` 두 함수다. 백엔드 연결 시 **`createRevisionedStore` 의 본문만 fetch 로 교체**하면 되고 화면 코드는 바뀌지 않는다 — `store.ts:8` 이 그렇게 설계됐다고 선언한다. 다만 **412 를 `SettingsConflictError(latest)` 로 변환**해야 한다(현재는 클로저 비교로 던진다). `isSettingsConflict`(`store.ts:48-50`)가 화면의 분기 근거이므로 이 변환이 빠지면 충돌이 generic 배너로 뭉개진다(FS-067-EL-020). 업로드 쪽은 `uploadSiteAsset` 의 본문만 바뀐다 — 반환 타입 `SiteAsset` 가 응답 형태와 이미 같다.

## 5. 예외 매트릭스

| 엔드포인트 | 400 검증 | 401 인증 | 403 vs 404 | 404 대상없음 | 409 충돌 | 422 상태위반 | 429 과부하 | 500 오류 | 타임아웃 |
|---|---|---|---|---|---|---|---|---|---|
| EP-01 조회 | N/A — **쿼리 파라미터가 없다**(단일 문서 조회) | 401 → 전역 인터셉터가 재인증으로(FS-067 §4.1). 화면은 FS-067-EL-018 배너 | **403** — 시스템 설정 리소스의 **존재는 비밀이 아니다**(BE-003 §3.2 원칙 1). 사이드바에 메뉴가 있고 라우트가 공개돼 있다. 은닉할 개인정보가 아니다(§7.5) | N/A — **문서는 항상 존재한다.** 미설정 상태여도 기본값 문서를 200 으로 내려준다(빈 폼을 그릴 근거가 필요하다 — §7.6 #5) | N/A — 읽기 전용 | N/A — 읽기 전용 | 429 분당 120 + `Retry-After`. 화면은 FS-067-EL-018 배너(문구 구분 없음 — FS-067 §7 #2) | 500 + `traceId` → FS-067-EL-018 | 5초 → 504 → FS-067-EL-018 |
| EP-02 저장 | 400 — 바디가 JSON 이 아니거나 필드 타입이 스키마와 다름(예: `copyProtection` 이 문자열, `favicon` 이 문자열). **필드 규칙 위반은 400 이 아니라 422**(아래) | 401 → 전역 인터셉터. **미저장 입력은 유실된다**(FS-067 §4.1 · §7 #11) | **403 `FORBIDDEN`** — `operator` 가 저장을 시도한 경우(§7.7). 이 화면은 쓰기 컨트롤을 이미 숨기므로(FS-067-EL-015) 정상 UI 경로로는 도달하지 않는다 — **위조된 권한 스토어·직접 API 호출에서 발생한다**(`RequirePermission.tsx:8-11`). 404 은닉은 **하지 않는다**(§7.5) | N/A — 문서는 항상 존재한다. **'먼저 삭제됨' 경합이 구조적으로 없다** — 이 문서는 삭제되지 않는다(§7.2). ⚠ 단 **자산은 삭제될 수 있다** — 참조하는 `url` 이 죽은 자산이면 404 가 아니라 **422 로 거절**한다(깨진 이미지를 저장하지 않는다) | **412 `PRECONDITION_FAILED`** — `If-Match` 불일치. **최신 문서를 본문에 실어 보낸다**(자산 3필드 포함) → FS-067-EL-024 충돌 다이얼로그. **`409` 가 아니라 `412` 가 정확한 코드다** — 조건부 요청의 전제 실패이기 때문(§7.2). 어댑터의 `SettingsConflictError` 가 둘을 같은 화면 경로로 모은다. `If-Match` 부재 시 **428** | **422 `VALIDATION_FAILED`** — §3 규칙 위반. `error.fields` 로 필드별 문구를 내려보낸다: `siteName`(빈/20자 초과) · `siteDescription`(100자 초과) · **`messagingName`(스위치 ON + 빈 / 40byte 초과 — 교차 규칙 1·2)** · `visibility`(목록 밖) · **`privateImage`(비공개 + url 빈 — 교차 규칙 3, 또는 자리별 파일 규칙 위반)** · `favicon`·`ogImage`(확장자·용량·해상도 재판정). 프론트가 1차 차단하지만 **서버가 정본**이다(§7.1). ⚠ **현재 프론트에 `error.fields` → RHF `setError` 매핑이 없다** — 전부 FS-067-EL-020 배너로 뭉개진다(§7.6 #2) | 429 분당 30 + `Retry-After`. 화면은 FS-067-EL-020 배너 | 500 + `traceId` → FS-067-EL-020 배너, **입력 보존**(reset 하지 않는다) | 5초 → 504 → FS-067-EL-020. **프론트 타임아웃 상한이 없어** 서버가 먼저 끊는 구간에만 의존한다(FS-067 §7 #11) |
| EP-03 업로드 | 400 — multipart 가 아니거나 파일 파트가 없음 | 401 → 전역 인터셉터. **업로드 중이던 파일은 버려진다** — 화면은 자리별 인라인 오류를 띄우지도 못하고 로그인으로 이동한다 | **403 `FORBIDDEN`** — `operator` 의 업로드 시도. 정상 UI 경로로는 도달하지 않는다(드롭존이 `disabled`) | N/A — **생성 엔드포인트다.** 참조할 기존 대상이 없다 | N/A — **자산은 서로 충돌하지 않는다.** 같은 파일을 두 번 올리면 자산이 두 건 생길 뿐이다(비멱등 — §7.6 #11) | **415 `UNSUPPORTED_MEDIA_TYPE`**(매직 넘버 불일치·SVG) · **413 `PAYLOAD_TOO_LARGE`**(> 5MB). 프론트는 확장자·용량을 미리 거르지만(`useAssetUpload.ts:86`) **파일명만 보므로 위장 파일이 통과한다**(§4 EP-03). 화면은 두 코드를 구분하지 않고 '파일을 업로드하지 못했습니다…' 한 문구로 받는다(`useAssetUpload.ts:23,126`) | 429 분당 20 + `Retry-After` → 같은 인라인 오류 | 500 + `traceId` → 같은 인라인 오류 | **5초 상한을 적용하지 않는다** — 5MB 업로드가 정상적으로 그보다 오래 걸린다. 상한은 별도로 정한다(§7.6 #11). 프론트 상한은 **없다**(FS-067 §7 #11) |

## 6. 프론트 연동 대조

| data-source.ts / store.ts | TODO(backend) | 엔드포인트 | 응답 | 일치 |
|---|---|---|---|---|
| `siteSettingsStore.fetch(signal)` | `GET /api/settings/site` (`data-source.ts:77`) | EP-01 | `Revisioned<SiteSettingsValues>` | O |
| `siteSettingsStore.save({ value, expectedRevision, force? }, signal)` | `PUT /api/settings/site` + `If-Match: <revision>` (`data-source.ts:77-81`) | EP-02 | `Revisioned<SiteSettingsValues>` | **△ — 412 → `SettingsConflictError(latest)` 변환이 필요**(현재는 클로저 비교). `force: true` → `If-Match: *` 매핑 필요. **심의 바디 목록이 `siteUrl` 을 빠뜨린 것도 미해소**(§7.6 #7) |
| `uploadSiteAsset(file, signal)` (`data-source.ts:98-103`) | `POST /api/uploads` (`data-source.ts:92`) | EP-03 | `SiteAsset` = `{ name, size, url }` | **△ — 응답 타입은 일치하나 `url` 의 성질이 다르다.** 지금은 세션 수명의 objectURL 이며 코드가 그렇게 적는다(`:94-96`) |
| `SITE_FIELD_LABELS` (`data-source.ts:106-119`) | — | **없음(프론트 전용)** | 충돌 다이얼로그의 항목 라벨 12건 | O — 계약 밖이 정답(표시 문구) |

### 6.1 어댑터 함수 본문에 요구되는 사항 (시그니처 불변)

1. **쓰기(PUT · POST)에 `X-CSRF-Token` 헤더**를 싣는다.
2. **`If-Match: <expectedRevision>`** 을 싣는다. `force === true` 면 **`If-Match: *`**.
3. **412(또는 409) → `new SettingsConflictError(latest)`** 로 변환한다 — `latest` 는 응답 본문의 `{ value, revision, audit }`. 이 변환이 화면의 `isSettingsConflict` 분기를 살린다(`SiteSettingsPage.tsx:240`).
4. **200 응답의 `{ value, revision, audit }` 를 그대로 반환**한다 — `useSaveSettings.onSuccess` 가 이것을 캐시에 심는다(`queries.ts:45`).
5. **업로드는 `multipart/form-data` 로 파일을 싣고 `signal` 을 그대로 전달**한다 — 화면이 언마운트 시 abort 한다(`useAssetUpload.ts:71-77,117`). 응답을 `SiteAsset` 로 그대로 반환하면 호출부는 바뀌지 않는다.
6. `failIfRequested`/`conflictRequested`/`wait(LATENCY_MS)` 는 **개발용 재현 장치**이며 연동 시 사라진다(`store.ts:12,58` · `site/data-source.ts:99-100`).
7. **`CURRENT_ADMIN` 상수를 보내지 않는다** — 삭제한다. 감사 주체는 서버가 세션에서 읽는다(§7.3).

## 7. 핵심 판정

### 7.1 프론트 검증은 보증이 아니다 — 서버가 전부 재검증한다 【보안 판정】

`siteSettingsSchema`(`validation.ts:116-184`)와 파일 규칙 함수(`:54-82`)는 **브라우저에서만 돈다.** `PUT /api/settings/site` 를 직접 호출하면 이 규칙을 한 줄도 거치지 않는다. 그러므로 서버는 §3 의 규칙 전부를 재현한다. 이 원칙은 코드가 스스로 선언한다 — `data-source.ts:82` `'프론트 검증은 UX 이지 보증이 아니다 — 서버가 다시 검증한다'`. BE-007 §7.1 이 고객 설정에서 세운 것과 같은 판정이다.

**그중 셋은 보안 규칙이라 특히 중요하다:**

1. **자산 `url` 을 클라이언트가 정한다** — `SiteAsset` 는 그냥 `{ name, size, url }` 문자열 묶음이고(`validation.ts:87-93`) 스키마에 스킴 검사도, 도메인 검사도 **없다**. `PUT` 을 직접 호출해 `favicon.url = 'javascript:…'` 또는 `'https://attacker.example/track.gif'` 를 심으면, **그 값을 읽는 방문자 페이지가 그대로 렌더한다.** 서버는 **자기가 발행하지 않은 자산 주소를 거절**한다(§4 EP-02 검증 4). 이것이 이 계약의 가장 실제적인 신설 위험이다 — 이전 판의 `baseUrl` https 강제가 있던 자리를 이 규칙이 대신한다.
2. **파일 형식 판정을 확장자에 맡기지 않는다** — 프론트는 `name.lastIndexOf('.')` 뒤 문자열만 본다(`validation.ts:48-51`). `payload.svg` 를 `payload.png` 로 바꾸면 프론트를 통과한다. 서버가 매직 넘버로 다시 본다(§4 EP-03 검증 1). **SVG 는 스크립트를 품으므로 화이트리스트 밖이며**(`validation.ts:64`), 확장자만 믿으면 그 화이트리스트가 무력해진다.
3. **교차 규칙 3(비공개 + 빈 자산 url)** — 프론트는 막지만(`validation.ts:172-183`) 서버가 막지 않으면 API 호출로 **방문자에게 깨진 비공개 페이지**를 내보내는 상태를 만들 수 있다.

**`siteName`·`siteDescription` 은 방문자에게 렌더되는 문구다 → XSS 정제 대상**: BE-010 §7.2 · BE-026 §7.1 과 같은 판정이다. 어드민 화면은 `<input>` 값으로만 다루지만(그리고 미리보기는 텍스트 노드로만 그린다 — `Previews.tsx:131,239-242`), **방문자 사이트는 이 값을 `<title>`·`<meta name="description">`·OG 태그에 넣는다.** 그 소비자가 HTML 로 해석하면 저장형 XSS 이고, **속성 컨텍스트**(`<meta content="…">`·`<meta property="og:title">`)라 본문 이스케이프와 규칙이 다르다. 서버가 **저장 시** 허용 태그 밖의 마크업 · `javascript:`/`data:` 스킴 · 이벤트 핸들러 속성 · 따옴표를 정제한다. 정제는 저장 시 1회이며 렌더 시점 이스케이프에 의존하지 않는다 — 이 문구를 읽는 소비자(웹·공유 크롤러·메일·SMS)가 여럿이라 각자의 이스케이프를 신뢰할 수 없다. **`messagingName` 도 같은 처리를 받는다** — 문자 본문 앞에 접두로 붙어 발송 파이프라인으로 흘러간다.

> ※ 이전 판(v1.0)의 이 절은 `baseUrl` https 강제와 `maintenanceMessage` 교차 규칙을 다뤘다. **두 필드 모두 스키마에서 사라졌다** — 판정을 이월하지 않고, 같은 성질의 위험이 실재하는 자리(자산 URL · 파일 형식 · `siteName`/`siteDescription`/`messagingName`)로 옮겨 다시 세웠다.

### 7.2 낙관적 동시성은 **토큰 기반**이다 — 존재 여부 기반이 아니다 【정합 판정】

**이 판정은 이 섹션과 앱의 다른 섹션을 가르는 지점이므로 정확히 기록한다.**

`shared/crud/crud.ts` 의 `createStoreAdapter` 는 409 를 **'대상이 아직 존재하는가'** 로 판정한다 — 즉 '다른 사용자가 먼저 **삭제**한 항목'만 잡고, **둘 다 존재하는 동시 편집은 last-write-wins** 로 통과시킨다. 반면 이 섹션의 `createRevisionedStore` 는 다르다:

```
_shared/store.ts:124-126
if (input.force !== true && input.expectedRevision !== current.revision) {
  throw new SettingsConflictError(current);
}
```

**`revision` 이라는 진짜 동시성 토큰을 비교한다.** 문서가 존재하든 말든 상관없다 — **내가 읽은 뒤에 누가 저장했으면 무조건 거절**된다. 회귀 테스트가 이 계약을 못박는다(`store.test.ts:54-69`): '낡은 revision 으로 저장하면 덮어쓰지 않고 409 를 던진다' + '거절됐으므로 상대의 값이 그대로 살아 있다 — 내 값이 덮어쓰지 않았다'. 그 파일의 머리말(`store.test.ts:3-4`)이 이유를 적는다: '이것이 깨지면 마지막 저장이 이기고, 그 사실을 아무도 모른 채 설정이 사라진다.'

**왜 이 섹션만 다른가** — `store.ts:3-7` 이 스스로 답한다: `createDocumentStore`(회사 정보·적립금 정책)는 last-write-wins 로 충분하지만 '두 관리자가 동시에 편집하면 한쪽의 변경이 조용히 사라진다'. **공개 범위가 그 예다**: A 가 사이트를 비공개로 바꾸고 비공개용 이미지를 올리는 동안 B 가 사이트 이름을 고쳐 저장하면, last-write-wins 하에서 A 의 저장이 B 의 이름을 되돌린다 — 아무도 모른 채. (v1.0 은 같은 논거를 유지보수 모드로 들었다. 그 필드는 사라졌고 **논거는 공개 범위로 그대로 옮겨 온다** — 성질이 같기 때문이다.)

**판정**: 이 계약은 **`If-Match` 를 필수로 요구한다**(헤더 없으면 428). HTTP 표준 표현으로 옮기면 `409 CONFLICT` 가 아니라 **`412 PRECONDITION_FAILED`** 가 정확하다 — 조건부 요청의 전제가 깨진 것이지 리소스 상태 충돌이 아니기 때문이다. 심(`data-source.ts:81`)이 `409·412` 를 나란히 적은 것은 두 코드 중 하나를 고르라는 뜻이며, **이 문서는 412 를 고르고 409 도 어댑터가 같은 경로로 받도록 남긴다**(서버 구현이 409 를 쓰더라도 화면이 깨지지 않게).

**'유령 저장'이 구조적으로 불가능하다**: BE-026 §7.5 가 다룬 `tickets.map(...)` no-op 성공 문제는 여기 없다 — `createRevisionedStore` 는 `map` 이 아니라 클로저 1건을 통째로 교체하므로(`store.ts:128-132`) '없는 대상을 조용히 지나치는' 경로 자체가 없다. **문서는 항상 존재하고 항상 교체된다.**

**⚠ 그러나 충돌을 *설명하는* 쪽은 지금 고장 나 있다**: 412 응답을 받아도 화면이 '무엇이 달라졌는지'를 옳게 말하지 못한다 — 프론트 비교기가 객체 필드를 참조로 비교해 **자산 3필드를 항상 '달라졌다'로 보고**한다(FS-067 §7 #14 · §7.6 #12). 계약 쪽에서 할 수 있는 일은 **412 본문에 최신 문서 전체(자산 포함)를 반드시 싣는 것**뿐이며, 그것은 이미 요구돼 있다.

### 7.3 감사 주체·시각을 서버가 찍는다 — 프론트 값을 신뢰하지 않는다 【보안 판정】

**현재 클라이언트(픽스처)가 감사 정보를 만든다:**
- `updatedBy` = 하드코딩 `'김운영'`(`_shared/store.ts:84` `const CURRENT_ADMIN = '김운영'`) — **누가 사이트를 비공개로 돌렸는지 기록되지 않는다.**
- `updatedAt` = `new Date().toISOString()`(`store.ts:131`) — 클라이언트 시각.

**코드가 이 판정을 미리 선언해 뒀다** — `store.ts:83`: `// TODO(backend): 저장 주체는 서버가 세션에서 읽어 기록한다 — 프론트가 보내는 값을 신뢰하면 안 된다.`

**판정**: `audit` 는 **요청 바디에 존재하지 않는다.** 서버가 `updatedBy` 를 **세션 주체**에서, `updatedAt` 을 **서버 시각**에서 찍는다. 클라이언트가 보낸 `audit` 는 무시한다 — 신뢰하면 **인증된 아무 관리자나 다른 관리자 이름으로 사이트를 닫을 수 있다**(감사 위조). BE-026 §7.2 와 같은 뿌리다.

**이것이 UX 문제가 아닌 이유**: 사이트 설정의 감사 기록은 '왜 사이트가 안 열리지?'에 답하는 유일한 화면 단서다(`AuditNote.tsx:3-5` 가 그렇게 적는다). 그 답이 위조 가능하면 기록이 아니라 장식이다.

**추가**: `updatedBy` 는 표시용 이름이므로 **계정이 삭제·개명돼도 기록은 그 시점 이름을 유지**해야 한다(스냅샷) — 조인해서 현재 이름을 보이면 과거 기록이 소급 변조된다. 서버는 저장 시점 이름을 비정규화해 남긴다.

### 7.4 멱등성 판정 — `If-Match` 가 멱등키를 대신한다(부분적으로) 【정합 판정】

**프론트에 멱등키가 없다.** 방어는 `useSubmitLock`(`_shared/queries.ts:58-75`) 하나뿐이다 — 동기 ref 잠금이라 '클릭과 리렌더 사이 틈'(`queries.ts:54-55`)은 닫지만 **네트워크 재시도는 닫지 못한다.** 앱에 선례가 **둘** 있다: `pages/members/components/PointsCard.tsx:103,162-173`(`idempotencyKeyRef`, 성공해야 키를 버린다 · 심 `members/data-source.ts:271` `Idempotency-Key: <uuid>`, 24h)와 **같은 섹션의** `pages/settings/api-keys/ApiKeysPage.tsx:150,185-186`(픽스처가 실제로 재생까지 구현했다 — `api-keys/data-source.ts:110-147`).

**그러나 이 엔드포인트에서는 위험의 성질이 다르다.** PUT + `If-Match` 는 **재적용이 구조적으로 불가능**하다:
- 첫 요청이 성공 → revision 이 `rev-N` → `rev-N+1` 로 바뀐다.
- 응답이 유실돼 사용자가 재시도 → 같은 `If-Match: rev-N` → **412.** 두 번 적용되지 않는다.

**즉 `If-Match` 가 멱등키의 안전 목표(중복 적용 방지)를 이미 달성한다.** 남는 것은 **UX 문제**다: 사용자는 '저장이 안 됐나?' 하고 재시도했는데 **영문 모를 충돌 다이얼로그**를 본다(사실은 자기 저장이 이미 성공했다). 충돌 다이얼로그는 '다른 관리자가 저장했다'고 말하지만 그 '다른 관리자'가 자기 자신이다 — **거짓말이다.**

**판정**: 멱등키는 **선택**이되 도입하면 이 UX 를 고친다. 도입 시 `Idempotency-Key: <uuid>` 를 24h 보존하고, 같은 키의 재요청에는 **최초 응답을 재생**한다(412 가 아니라 200 + 새 revision). 그러면 사용자는 성공을 본다. 우선순위는 낮다(데이터는 이미 안전하다) — §7.6 #3.

**⚠ EP-03 업로드는 이 보호를 받지 못한다.** `If-Match` 도 없고 잠금도 없다(FS-067 §4.1) — 같은 파일을 두 번 올리면 자산이 두 건 생기고 하나는 즉시 고아가 된다. 여기서는 멱등키가 **선택이 아니라 실질적 필요**에 가깝다(§7.6 #11).

### 7.5 403 이지 404 가 아니다 — 시스템 설정은 은닉하지 않는다 【보안 판정】

BE-003 §3.2 의 원칙을 이 도메인에 적용하면 **은닉하지 않는 쪽**이 답이다.

1. **리소스의 존재가 비밀이 아니다** → 권한 부족 시 **403 `FORBIDDEN`**.
2. 근거: `GET /api/members/:id` 를 404 로 은닉하는 이유는 **개별 회원의 존재 자체가 개인정보**이기 때문이다(BE-003 §3.2 · BE-026 §7.6). 사이트 설정은 그 반대다 — **사이트에 설정이 있다는 사실은 누구나 안다.** 사이드바에 '사이트 설정' 메뉴가 있고(`nav-config.ts:214`), 라우트가 공개돼 있으며(`App.tsx:365`), 공개 범위의 결과는 방문자에게 그대로 보인다. 존재를 숨겨서 얻는 것이 없다.
3. **은닉이 오히려 해롭다**: 404 를 주면 정당한 `operator` 가 '설정 화면이 없어졌나?'로 오해한다. 403 은 '있지만 당신 권한이 아니다'를 정확히 말한다.

**대칭성**: `operator` 는 EP-01(조회)에 200, EP-02(저장)·EP-03(업로드)에 **403** 을 받는다 — 이미 문서의 존재를 아는 주체에게 존재를 숨기는 것은 무의미하다(BE-026 §7.6 의 같은 논리).

### 7.6 후속 이관

| # | 내용 | 이관 |
|---|---|---|
| 1 | **`siteName`·`siteDescription`·`messagingName` 저장 시 XSS 정제(§7.1)** — 방문자·크롤러·발송 파이프라인에 렌더되는 문구다. `siteDescription`·`siteName` 은 **속성 컨텍스트**(`<meta content>`·OG 태그) 이스케이프가 추가로 필요 | 백엔드 명세 |
| 2 | **422 `error.fields` 를 프론트가 필드 인라인 오류로 매핑하지 않는다** — 이 화면이 `useCrudForm` 을 쓰지 않아 그 훅의 422 처리(`shared/crud/useCrudForm.ts:190-205`)를 상속하지 못했다. 모든 저장 실패가 FS-067-EL-020 배너로 뭉개진다(quality-bar EXC-07 P1) | UI 기획 |
| 3 | 멱등키 부재(§7.4) — **EP-02 는 `If-Match` 로 이미 안전하다.** 남는 것은 '자기 저장에 대해 충돌 다이얼로그를 보는' UX 결함이다. 우선순위 낮음. **EP-03 은 별개다** — #11 참조(quality-bar EXC-08 P0) | UI 기획 · 백엔드 명세 |
| 4 | **길이 상한이 계약에 없다** — `siteUrl`·자산의 `name`·`url` 에 스키마 길이 규칙이 없다(§3). 서버가 자체 상한(예: 2048 / 255 / 2048)을 둔다. ⚠ **`siteUrl` 은 이 화면이 고치지 않지만 값 타입에는 있다** — 어느 계약이 그 형식(https 강제 · URL 파서 검증)을 소유하는지 정해야 한다. **같은 섹션의 OAuth 는 이미 `new URL()` 파서를 쓴다**(`oauth/validation.ts:282`) — 정규식이 아니라 파서가 옳다는 선례가 앱 안에 있다 | 백엔드 명세 · UI 기획 |
| 5 | **미설정 상태의 계약** — 이 문서는 '문서는 항상 존재한다'(§5 404 축)를 전제한다. 서버가 최초 배포 시 기본값 문서를 시딩하지 않으면 EP-01 이 404 를 낼 수 있고, 화면에는 그 분기가 **없다**(FS-067-EL-018 이 generic 배너로 받는다). 시딩을 계약에 포함하거나 EP-01 이 기본값을 합성해 200 을 줘야 한다 | 백엔드 명세 |
| 6 | **저장된 값의 집행 주체가 이 계약 밖이다**(§1 범위 밖) — `visibility`·`copyProtection`·`mobileZoomAllowed`·`keepSignedIn` 네 값 모두 **소비자 계약이 없다.** 저장은 되는데 사이트가 안 닫히면 이 화면은 거짓말이 된다. **'관리자는 접근할 수 있다'**(FS-067-EL-035 선택지 설명이 약속한다)는 예외 규칙도 그 계약이 보장해야 한다. **비공개용 이미지의 렌더 규칙**(HD 50% · 밝은 회색 배경 · 미등록 시 기본 페이지 — FS-067-EL-037 이 방문자에게 약속한다)도 마찬가지다 | 백엔드 명세 · 프론트 구현 |
| 7 | **심의 PUT 바디 목록이 값 타입과 어긋난다** — 값은 12필드인데 심(`data-source.ts:78-80`)은 11필드만 적고 `siteUrl` 을 뺐다. 프론트는 `getValues()` 전량을 보내므로 **실제로는 12필드가 나간다.** 이 문서는 '계약은 `siteUrl` 을 받지 않고 실려 와도 무시한다'로 확정했으나(§4 EP-02), **심 주석과 코드를 그 확정에 맞춰야 한다**(둘 중 하나는 틀린 채로 남아 있다) | 백엔드 명세 · 프론트 구현 |
| 8 | 설정 **변경 이력**(누가 언제 무엇을) 계약이 없다 — 현재는 '마지막 1건'만 있다(§1 범위 밖). '사이트가 지난주에 왜 비공개였나'는 답할 수 없다. 로그 도메인과의 경계를 정해야 한다 | 백엔드 명세 · 아키텍처 |
| 9 | `revision` 이 `rev-<seq>` 전역 단조 증가 문자열이라(`store.ts:86-91`) **모든 설정 문서가 시퀀스를 공유한다** — 픽스처 한정 구현 세부이며 서버는 문서별 ETag 를 쓴다. 연동 시 이 가정에 의존하는 코드가 없음을 확인할 것(현재 프론트는 revision 을 불투명 문자열로만 다룬다 — 의존 없음) | 백엔드 명세 |
| 10 | **⚠ 프론트의 바이트 계산이 진짜 EUC-KR 이 아니다 — 서버와 판정이 갈릴 수 있다.** `byteLengthOf`(`marketing/_shared/messaging.ts:282-289`)는 '코드포인트 > 0x7F 면 2byte' 라는 **근사**다. 그런데 `validation.ts:159` 와 `SiteSettingsPage.tsx:397` 는 둘 다 이것을 **'EUC-KR'** 이라고 단언한다. ASCII·한글에는 정확하지만 **이모지(EUC-KR 로 표현 불가 / UTF-8 로는 4byte)·라틴1 확장·전각 기호에서 어긋난다.** 서버가 실제 인코더로 40byte 를 재판정하면 **프론트가 통과시킨 이름을 서버가 422 로 거절**하고, 화면은 그 422 를 필드에 꽂지도 못한다(#2). **계약이 먼저 정해야 할 것**: 40byte 의 기준 인코딩이 EUC-KR 인가 UTF-8 인가, 그리고 표현 불가 문자를 어떻게 다루는가(거절 / 치환). 정한 뒤 프론트 주석과 구현을 그 기준에 맞춘다 | **백엔드 명세 (선결) · 프론트 구현** |
| 11 | **⚠ 업로드 계약(EP-03)이 통째로 미확정이다.** ① **비멱등 + 잠금 없음** — 같은 자리에 파일을 다시 고르면 요청이 하나 더 나가고 나중 응답이 이긴다. 앞선 자산은 그 자리에서 즉시 고아가 된다 ② **고아 자산 GC 정책 없음** — 업로드했으나 저장하지 않고 이탈한 자산, 교체로 밀려난 자산을 누가 언제 지우는가 ③ **자리별 규칙의 판정 위치가 갈린다** — 업로드는 slot 을 모르므로(어댑터 시그니처가 파일만 받는다) 파비콘의 100KB·16px 규칙은 EP-02 저장 시점에야 서버가 재판정할 수 있다 ④ **타임아웃 상한 미정** — 5MB 업로드에 공통 5초를 적용할 수 없다 ⑤ **현재 응답 `url` 이 세션 수명의 objectURL 이다**(`data-source.ts:94-96,102`) — 코드가 스스로 밝힌 픽스처 한정 사실이며, 호출부의 revoke 책임도 이행되지 않았다(FS-067 §7 #16) | **백엔드 명세 (신설 계약)** |
| 12 | **문서가 더 이상 평면이 아니다 — 프론트 비교기가 그것을 감당하지 못한다.** 자산 3필드가 객체이고(`validation.ts:87-93`), `_shared/diff.ts:13-20` 의 `sameValue` 는 배열만 내용 비교하며 나머지는 `Object.is` 다. 그래서 412 응답을 옳게 받아도 충돌 다이얼로그가 **파비콘·대표 이미지·비공개용 이미지를 항상 '달라졌다'고 보고**한다(FS-067 §7 #14). **계약 쪽 의무는 412 본문에 최신 문서 전체를 싣는 것**이며 그것은 §4 EP-02 에 이미 요구돼 있다 — **해소는 프론트 몫**이다. 이 항목은 '계약이 옳아도 화면이 거짓말한다'는 사실을 계약 문서가 알고 있음을 남기기 위해 적는다 | UI 기획 (프론트) · 기록 |

### 7.7 `operator` 에게 쓰기를 열지 않는다 — BE-026 과 반대 판정

BE-026(1:1 문의)은 `operator` 에게 쓰기를 **연다** — 문의 응대가 운영자의 본업이기 때문이다. **이 도메인은 반대다.**

**근거**:
1. **결과의 범위가 다르다.** 문의 답변은 '한 고객에게 보내는 응대'다. 사이트 설정 저장은 **사이트 전체를 닫고**(공개 범위) **방문자의 복사·확대·자동 로그인 기본값을 바꾸고**(이용 옵션 3종) **공유 카드와 브라우저 탭의 얼굴을 바꾼다**(이름·설명·이미지). 되돌릴 수 있더라도 되돌리는 동안 사이트는 닫혀 있다.
2. **빈도가 다르다.** 문의는 하루에도 여러 건 처리한다 — `admin` 만 할 수 있으면 역할 구분이 무의미해진다. 사이트 설정은 드물게 바뀐다 — `admin` 을 기다려도 업무가 막히지 않는다.
3. **화면이 이미 그렇게 말한다.** 읽기 전용 안내 문구가 '**시스템 설정 수정 권한**이 필요합니다'(`SiteSettingsPage.tsx:64-65`)라고 별도 권한을 전제하며, 권한 모델이 리소스를 `page:/settings/site` 로 분리해 둔다(`resources.ts:65-67` · `route-resource.ts:32-35`).

**결론**: EP-01 은 `admin` + `operator`. **EP-02·EP-03 은 `admin` 만.** 이 판정은 API Key(BE-069)·OAuth(BE-070)에도 동일하게 적용된다 — **세 화면이 같은 `시스템 설정` 권한 축을 공유한다**(v1.0 은 언어 설정을 포함해 네 화면으로 적었으나 **언어 관리 기능과 그 명세는 삭제됐다**).

## 8. 자기 점검

- [x] FS-067 §5 요소가 전부 엔드포인트로 커버됐다 — **심 있는 3건(EP-01·02·03) 매핑 완료. 심 없는 엔드포인트가 없다** — 이 화면은 모든 서버 호출이 `data-source.ts` 의 TODO 심에 대응한다
- [x] **엔드포인트를 발명하지 않았다** — `GET/PUT /api/settings/site` 는 `data-source.ts:77` 에, `POST /api/uploads` 는 `:92` 에 실재하고, `If-Match`·바디 11필드·200/409·412/422 도 `:78-82` 에 실재한다. §1.1 근거표가 각 항목의 file:line 을 댄다
- [x] 모든 엔드포인트가 FS 요소를 역참조한다
- [x] §5 예외 9축 빈칸 0건, 모든 `N/A` 사유 있음 (**3행** × 9열)
- [x] 에러 봉투·권한 모델을 BE-003 §2·§3 상속으로 선언, 재정의 안 함. **권한만 고유 차이**(`operator` 쓰기 **차단** — §7.7, BE-026 과 반대 판정)를 근거와 함께 기술
- [x] 멱등성 판정 — 조회 GET 멱등 / **저장은 `If-Match` 로 조건부 멱등이며 그것이 멱등키의 안전 목표를 이미 달성함을 §7.4 에 명시**하고, 남은 것이 UX 문제임을 구분했다. **업로드는 그 보호를 받지 못함을 별도로 못박았다**
- [x] **보안 판정 4건** — 서버 재검증 + 자산 URL·파일 형식 + XSS 정제(§7.1) · **낙관적 동시성 토큰 기반(§7.2)** · **감사 주체 위조(§7.3)** · **403 vs 404 은닉(§7.5)**
- [x] **낙관적 동시성이 '존재 여부'가 아니라 revision 토큰 기반임을 `store.ts:124-126` + `store.test.ts:54-69` 로 확인**하고 §7.2 에 `createStoreAdapter` 와의 차이를 명시했다. **회귀 테스트는 7건**(`store.test.ts`)이다
- [x] `validation.ts` 의 필드 규칙·**교차 규칙 3건**을 §3 표와 §5 의 422 축에 정확히 반영했다. 두 규칙의 **면제 조건**(스위치 OFF · 전체 공개)까지 적었다 — 더 엄한 서버는 정상 상태를 거절한다
- [x] **재작성으로 사라진 필드(`baseUrl`·`maintenanceMessage` 등)에 걸려 있던 판정을 이월하지 않았다** — 같은 성질의 위험이 실재하는 자리로 옮겨 다시 세웠고(§7.1), 옮길 자리가 없는 것은 폐기했다
- [x] 서버 코드·저장소 설계를 쓰지 않았다
