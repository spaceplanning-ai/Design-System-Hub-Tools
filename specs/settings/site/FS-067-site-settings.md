---
id: FS-067
title: "사이트 설정"
screen: SCR-067               # ⚠ 시스템 설정 SCR 미작성 — §7 미결 사항 참조
route: /settings/site
owner: 기능 명세
reviewer: 명세 리뷰
gate: G9
status: draft
confirmedAt: 2026-07-18
version: 1.1
date: 2026-07-18
---

# FS-067. 사이트 설정

> **1.1 갱신 요지 (2026-07-18)** — 이 화면은 워킹 트리에서 **전면 재작성**됐다(HEAD 미커밋). 필드 집합이 통째로 바뀌었다: `baseUrl`·`contactEmail`·`contactPhone`·`timezone`·`signupEnabled`·`maintenanceMode`·`maintenanceMessage` 가 **사라졌고**, 표시 이미지 3종(파비콘·대표·비공개용)·공개 범위·이용 옵션 3종·메일/SMS 전용 이름이 **들어왔다**. 그 필드에 매달려 있던 요소(EL-005·006·007·007.1·008·009·010·012)는 **폐지**하고 번호를 재사용하지 않는다 — 재사용하면 NFR·BE 의 역참조가 조용히 다른 것을 가리키게 된다. 반면 **화면을 가로지르는 판정**(revision 토큰 동시성 · 충돌 3-액션 · `useSubmitLock` · abort-는-실패가-아니다 · 권한 게이팅 · 감사 위조 · 403-not-404 · 서버 재검증)은 표면이 그대로 살아 있어 **전부 유지**한다. 위험 값 경고는 유지보수 모드에서 **비공개 전환**으로 옮겨 붙었다(EL-011 · EL-021.1).

## 1. 화면 개요

| 항목 | 내용 |
|---|---|
| 목적 | 사이트의 **이름·설명·표시 이미지·공개 범위·이용 옵션**을 한 폼에서 정하고 저장한다. 화면 제목은 '사이트 설정'(nav 잎)이나 카드 제목은 **'기본 설정'** 이다(`SiteSettingsPage.tsx:314`) |
| 역할(주 사용자) | 관리자 (구현에 역할 분기 없음 — 권한은 `useRouteWritePermissions` 로 게이팅한다. §4.1) |
| 진입 경로 | 좌측 GNB > 시스템 > 시스템 설정 > 사이트 설정 (`nav-config.ts:214` `['사이트 설정', '/settings/site']`) |
| 포함 화면 | 단일 라우트 `/settings/site` — **하위 라우트가 없다(잎)** (`App.tsx:365`) |
| **범위 밖** | **저장한 값의 실제 집행** — 이 화면은 값을 저장할 뿐 방문자 사이트를 닫거나(공개 범위) 우클릭을 막거나(복사 방지) 뷰포트를 고정하거나(모바일 확대) 자동 로그인 기본값을 적용하는 주체가 **아니다**. 그 소비자는 이 앱 밖(사이트 렌더러·게이트웨이)에 있다 — §7 #6. **사이트 주소(도메인) 연결** — `siteUrl` 은 폼에 실려 다니지만 이 화면에서 **고치지 않는다**(`validation.ts:130-134` 가 '도메인 연결은 별도 화면의 일' 이라고 적는다). **파일의 실제 저장** — 업로드는 픽스처이며 `URL.createObjectURL` 핸들을 돌려준다(§7 #16) |
| 구현 경로 | `apps/admin/src/pages/settings/site/**` (`SiteSettingsPage.tsx` · `data-source.ts` · `validation.ts` · `useAssetUpload.ts` · `site.test.ts` · `components/{AssetField,CountedInput,Previews,SettingLayout}.tsx`) · 공유 `pages/settings/_shared/**` |
| 대응 SCR | SCR-067 (미작성 — §7 #1) |
| 공통 컴포넌트 | `settings/_shared/{SettingsFormShell,ConflictDialog,AuditNote,useSettingsQuery,useSaveSettings,useSubmitLock,createRevisionedStore,divergedLabels,formatAuditAt,requiredText,optionalText}` · `shared/ui/{Alert,ConfirmDialog,HelpTip,RadioCardGroup,ToggleSwitch,FileChip,FileDropzone,Card,CardTitle,Button,Modal,useToast,useUnsavedChangesDialog,controlStyle,errorTextStyle}` · `shared/permissions/RequirePermission(useRouteWritePermissions)` · `shared/form/zodResolver` · `shared/async(isAbort)` · `marketing/_shared/messaging(byteLengthOf)` |

> **검증의 정본은 화면이 아니라 zod 스키마다**(`validation.ts` `siteSettingsSchema` — `:116-184`) — FS-007 §1.1 이 고객 설정에서 세운 원칙을 그대로 따른다. 화면은 입력을 막지 않고, 제출 시점에 스키마가 판정한다. **파일 규칙(확장자·용량·해상도)도 같은 파일이 소유**하되 zod 밖의 순수 함수다(`validation.ts:54-82`) — File 객체가 아니라 그 속성만 받아 테스트가 jsdom 을 흉내 내지 않는다.

### 1.1 이 화면의 설계 원칙 (요구사항 — 명세에 고정한다)

| 원칙 | 내용과 이유 (코드 근거) |
|---|---|
| **결과를 값 옆에 그린다** | 파비콘·이름·설명은 **이 화면 밖에서만** 눈에 띈다(브라우저 탭 · 카카오톡/Facebook 공유 카드). 그래서 입력칸 옆에 목업을 함께 그린다 — `BrowserTabPreview`(`Previews.tsx:119-137`) · `OgCardPreview`(`:222-248`). OG 카드는 위 섹션의 이름·설명을 `watch` 로 **실시간** 받는다(`SiteSettingsPage.tsx:477-482`). 목업 본체는 `aria-hidden`(`Previews.tsx:124,232`) — 같은 문장을 두 번 듣게 하지 않는다 |
| **비공개 전환은 두 겹으로 막는다** | ① 값이 `private` 이면 그 자리에서 warning `Alert`(`SiteSettingsPage.tsx:326-333`) ② 저장이 확인 다이얼로그를 거치고 문구가 **전환 방향**을 명시한다(`:116-124` `saveConfirmMessage`). 저장하는 즉시 관리자를 뺀 방문자가 사이트에 못 들어오기 때문이다. **유지보수 모드 시절의 3겹 중 '빈 안내문 거부'는 표면이 사라져 폐지**됐다 |
| **바이트를 세는 자리를 한 벌만 둔다** | 메일·SMS 전용 이름만 글자가 아니라 **바이트**로 센다(`MESSAGING_NAME_MAX_BYTES = 40` — `validation.ts:28`). 계산은 마케팅 도메인의 `byteLengthOf`(`marketing/_shared/messaging.ts:282-289`)를 **그대로 쓴다** — 같은 규칙이 두 벌이면 발송 화면과 설정 화면의 판정이 갈라진다. ⚠ 그 함수는 진짜 EUC-KR 인코더가 아니라 근사다(§7 #15) |
| **잠그되 숨기지 않는다** | 비공개용 이미지는 전체 공개 상태에서 효과가 없지만 **자리를 없애지 않는다**(`SiteSettingsPage.tsx:517,531`, 근거 `:505-510` · `validation.ts:102-111`). 숨기면 '비공개로 바꾸면 무엇을 더 정해야 하는지'를 미리 알 수 없다. **이미 올린 값도 지우지 않는다** |
| **동시 편집을 덮어쓰지 않는다** | 저장은 내가 읽은 `revision`(낙관적 동시성 토큰)을 함께 보내고, 어긋나면 409 로 거절돼 충돌 다이얼로그가 뜬다(`_shared/store.ts:124-126`). **입력은 그대로 살아 있다** — FS-067-EL-024 |
| **권한이 없으면 저장 컨트롤이 없다** | `canUpdate` 가 false 면 저장 버튼·상태 문구를 **렌더하지 않는다**(`_shared/SettingsFormShell.tsx:166-184`) — 눌러 보고 403 을 받는 자리를 만들지 않는다 |
| **첫 로딩과 재조회를 구분한다** | `loading = isFetching && data === undefined`(`SiteSettingsPage.tsx:179`) — 재조회 중에는 이전 값을 유지한다(STATE-01) |

## 2. 영역 구성

| 영역번호 | 이름 | 설명 |
|---|---|---|
| FS-067-SEC-01 | 화면 안내문 | 카드 위 muted 문구(`SettingsFormShell.tsx:142`) |
| FS-067-SEC-02 | 설정 카드 | 제목 + (저장 실패 배너 · 읽기전용 안내 · 비공개 경고) + **네 개의 하위 섹션** + 푸터 |
| FS-067-SEC-02.1 | 하위 섹션 · 사이트 기본 정보 | 이름 · 설명 · 메일/SMS 전용 이름 (`SiteSettingsPage.tsx:337`) |
| FS-067-SEC-02.2 | 하위 섹션 · 사이트 표시 이미지 | 파비콘 + 탭 목업 · 대표 이미지 + OG 목업 (`:410`) |
| FS-067-SEC-02.3 | 하위 섹션 · 공개 범위 | 라디오 카드 2종 + 비공개용 이미지 (`:487`) |
| FS-067-SEC-02.4 | 하위 섹션 · 사이트 이용 옵션 | 복사 방지 · 모바일 확대 허용 · 로그인 상태 유지 (`:544`) |
| FS-067-SEC-03 | 카드 푸터 | 감사 기록 + 저장 상태 문구 + 저장 버튼 |
| FS-067-SEC-04 | 조회 실패 배너(비표시 기본) | 폼 전체를 대체 |
| FS-067-SEC-05 | 첫 로딩 스켈레톤(비표시 기본) | 필드 자리를 대체 |
| FS-067-SEC-06 | 저장 확인 다이얼로그(비표시 기본) | 공개↔비공개 전환이면 문구가 그 사실을 앞세운다 |
| FS-067-SEC-07 | 동시 편집 충돌 다이얼로그(비표시 기본) | 3-액션(불러오기·덮어쓰기·닫기) |
| FS-067-SEC-08 | 미저장 이탈 가드(비표시 기본) | 3경로 discard 확인 |

## 3. 요소 명세

> **폐지된 요소 번호**: EL-005(기본 URL) · EL-006(대표 이메일) · EL-007·007.1(대표 전화번호·blur 정규화) · EL-008(표시 시간대) · EL-009(회원가입 허용) · EL-010(유지보수 모드) · EL-012(유지보수 안내 문구). **대상 필드가 스키마에서 사라졌다**(`validation.ts:116-186` 12필드). 번호를 재사용하지 않는다.

| 요소번호 | 영역 | 이름 | 유형 | 동작 | [서버] | 비고 |
|---|---|---|---|---|---|---|
| FS-067-EL-001 | FS-067-SEC-01 | 화면 안내문 | 텍스트 | `<p>` '사이트 정보와 관련된 기본적인 설정을 합니다. 검색엔진 최적화를 위해 사이트 설명을 입력해 주세요.'(`SiteSettingsPage.tsx:62-63` → `SettingsFormShell.tsx:142`) | — | **in-content `<h1>` 이 없다** — 화면 제목은 AppHeader 가 nav 잎 라벨('사이트 설정')로 그린다(`AppHeader.tsx:101`). IA-02 pass 근거 — NFR-067 §2. ⚠ **필수 표기(별표) 안내가 사라졌다** — 이 화면에 required 표기 자체가 0건이기 때문이다(EL-003 비고) |
| FS-067-EL-002 | FS-067-SEC-02 | 카드 제목 | 텍스트 | `CardTitle` **'기본 설정'**(`SiteSettingsPage.tsx:314` → `SettingsFormShell.tsx:146`) | — | `<h1>` 이 아니다 — 카드 제목 시맨틱. **nav 라벨('사이트 설정')과 카드 제목('기본 설정')이 다르다** — 의도인지 미확인(§7 #19) |
| FS-067-EL-042 | FS-067-SEC-02 | 섹션·행 골격 | 텍스트 | `SettingSection`(`SettingLayout.tsx:59-68`)이 `<section aria-labelledby>` + `<h3>` 제목을, `SettingRow`(`:140-172`)가 왼쪽 라벨·설명 / 오른쪽 컨트롤 2열 그리드를 그린다. 두 층이 **같은 그리드 축**(`LABEL_COLUMN` — `:16`)을 공유해 섹션이 달라도 라벨 왼쪽 모서리가 한 줄로 맞는다 | — | 비표시 규칙. `htmlFor` 를 주면 `<label>`, 안 주면 `<span>` 이다(`:153-159`) — **토글·라디오·업로드는 자기 라벨을 가지므로 주지 않는다**(이름이 두 번 읽히지 않게) |
| FS-067-EL-003 | FS-067-SEC-02.1 | 사이트 이름 입력 | 입력 | `CountedInput id="site-name"`(`SiteSettingsPage.tsx:344-353`). 라벨 '사이트 이름'(`:339`) · 힌트 '브라우저 탭이나 소셜 미디어에 공유할 때 표시됩니다.'(`:342`). `maxLength=20`(`SITE_NAME_MAX` — `validation.ts:16`), 카운터 `N/20`, placeholder '예: TDS 스페이스플래닝' | O | 비면 '사이트 이름을 입력하세요.' · 20자 초과 시 '사이트 이름은 20자를 넘을 수 없습니다.'(`validation.ts:118-121`). **`required` 표기가 없다** — 스키마는 필수인데 화면은 그렇게 말하지 않는다(§7 #20). `aria-invalid` ↔ `aria-describedby` 는 `CountedInput.tsx:69-71,82-83` 이 짝으로 세운다 |
| FS-067-EL-004 | FS-067-SEC-02.1 | 사이트 설명 입력 | 입력 | `CountedInput id="site-description"`(`:362-371`). 라벨 '사이트 설명' · 힌트 '사이트를 대표하는 문장이나 키워드 사용을 추천합니다.' `maxLength=100`(`SITE_DESCRIPTION_MAX` — `validation.ts:19`), 카운터 `N/100` | O | 빈 값 허용(`optionalText` — `validation.ts:122-125`). 100자 초과만 거절 |
| FS-067-EL-029 | FS-067-SEC-02.1 | 전용 이름 사용 스위치 | 입력 | `ToggleSwitch` 접근 이름 '메일·SMS 전용 사이트 이름 사용'(`:380-390`). 행 라벨 '메일·SMS 전용 사이트 이름' + 힌트 '전용 이름을 지정하지 않으면 사이트 이름으로 적용됩니다.' `onChange` → `setValue('messagingNameEnabled', next, { shouldDirty: true, shouldValidate: true })` | O | **`shouldValidate: true`** — 켜는 즉시 '이름이 필요하다'는 교차 규칙이 걸려야 하기 때문(`validation.ts:150-167`). 이용 옵션 3종(EL-038~040)과 다른 점이 이것이다 |
| FS-067-EL-030 | FS-067-SEC-02.1 | 전용 이름 입력 | 입력 | **스위치가 켜졌을 때만 렌더된다**(`:394-405`). `CountedInput id="messaging-name"`, placeholder '예: TDS 스페이스플래닝 고객센터'. 카운터가 **`N/40 byte`**(`:398`) — 글자가 아니라 바이트다 | O | **`maxLength` 를 주지 않는다** — 바이트 상한은 `maxLength` 로 표현할 수 없다(`CountedInput.tsx:48-52`). 검증이 판정하고 카운터가 미리 보여 준다. 위반 문구 2종: '전용 이름을 켰다면 이름을 입력하세요. 끄면 사이트 이름이 그대로 쓰입니다.' / '전용 이름은 40byte 를 넘을 수 없습니다. 한글은 1자가 2byte 입니다.'(`validation.ts:156,164`). **꺼져 있으면 자리를 차지하지 않고 값도 판정하지 않는다**(`site.test.ts:132-138`) |
| FS-067-EL-043 | FS-067-SEC-02 | 사이트 주소(비편집) | 텍스트 | `siteUrl` 은 폼에 실려 다니지만 **입력 컨트롤이 없다**(`watch('siteUrl')` — `:167`). 두 미리보기의 주소 줄에만 쓰인다(`:447,481`) | O | 비표시 규칙. 근거는 스키마 주석(`validation.ts:130-134`): '도메인 연결은 별도 화면의 일이다'. ⚠ **PUT 바디 목록(`data-source.ts:78-80`)이 `siteUrl` 을 빼고 있다** — 폼은 들고 다니는데 계약은 안 보낸다(BE-067 §3 이 이 갈림을 명시한다) |
| FS-067-EL-031 | FS-067-SEC-02.2 | 파비콘 업로드 | 입력 | `AssetField label="파비콘"`(`:428-441`). 드롭존 '파일 선택 또는 끌어다 놓기' / '최소 16x16 / ICO', `accept=".ico,image/x-icon,image/vnd.microsoft.icon"`. 값이 있으면 `FileChip`(이름·용량·미리보기·제거)이 앞에 선다(`AssetField.tsx:68-76`) | O | **`.ico` 만**(`validation.ts:54-62`) · **100KB 상한**(`FAVICON_MAX_BYTES` — `:36`) · **최소 변 16px**(`FAVICON_MIN_EDGE` — `:33`, 판정 `:77-82`). 해상도는 파일을 실제로 디코드해야 알 수 있어 비동기다(`useAssetUpload.ts:27-44`). 힌트에 도움말 링크가 붙는다(`SiteSettingsPage.tsx:414-426`) — 주소는 아직 **자리표시자**(`:71-72` `TODO(content)`) |
| FS-067-EL-032 | FS-067-SEC-02.2 | 브라우저 탭 미리보기 | 표시 | `BrowserTabPreview`(`:443-447` → `Previews.tsx:119-137`). 파비콘 + 사이트 이름 + 주소창을 목업으로 그린다. 파비콘이 없으면 회색 사각형(`:126-127`) · 이름이 비면 '사이트 이름'(`:131`) | — | 비표시 아님(항상 보인다). 본체는 `aria-hidden="true"`(`:124`) — 위 입력값의 되풀이라 두 번 읽히지 않게. 무엇을 보여 주는 자리인지는 **바깥의 `<figcaption>`** 이 말한다(`:122` '브라우저 탭 미리보기') |
| FS-067-EL-033 | FS-067-SEC-02.2 | 대표 이미지 업로드 | 입력 | `AssetField label="대표 이미지"`(`:461-474`). 드롭존 '파일을 선택 하거나 끌어다 놓기' / 'PNG, JPG, GIF', `accept="image/png,image/jpeg,image/gif"`(`:74`). 라벨 옆 `HelpTip`(`:454-459`)이 권장 비율(가로 ≒ 세로 2배)과 잘림을 설명한다 | O | png·jpg·jpeg·gif 만 · **5MB 상한**(`IMAGE_MAX_BYTES` — `validation.ts:39`, 판정 `:66-74`). **해상도 규칙이 없다** — 어떤 크기든 잘라서 쓴다(`useAssetUpload.ts:104-105`) |
| FS-067-EL-034 | FS-067-SEC-02.2 | 공유 카드 미리보기 | 표시 | `OgCardPreview`(`:477-482` → `Previews.tsx:222-248`). 이미지 + 이름 + 설명 + 주소를 카드로 그린다. 빈 값에 각각 자리 문구('대표 이미지가 없습니다' · '사이트 이름' · '사이트 설명이 비어 있습니다.') | — | **위 섹션의 이름·설명을 `watch` 로 실시간 받는다** — 이 연결이 목업의 존재 이유다(`SiteSettingsPage.tsx:476` 주석). 본체 `aria-hidden`(`Previews.tsx:232`) + `<figcaption>` '공유 카드 미리보기 (카카오톡 · Facebook 등)'(`:230`) |
| FS-067-EL-035 | FS-067-SEC-02.3 | 공개 범위 선택 | 입력 | `RadioCardGroup name="site-visibility-choice"` legend '사이트 접근 범위'(`:488-497`). 선택지 2개(`:76-79`): **전체 공개** '누구나 내 사이트에 접속할 수 있어요' · **비공개** '관리자만 접근할 수 있어요'. `onChange` → `setValue('visibility', next, { shouldDirty: true, shouldValidate: true })` | O | `z.enum(VISIBILITY_VALUES)`(`validation.ts:98,139`) — 목록 밖 값은 파싱 실패(`site.test.ts:175-178`). **`shouldValidate: true`** — 비공개로 바꾸는 순간 비공개용 이미지의 교차 규칙이 걸려야 한다 |
| FS-067-EL-011 | FS-067-SEC-02 | 비공개 경고 배너 | 배너 | `visibility === 'private'` 이면 카드 상단(필드 위) **warning** `Alert`: '사이트가 비공개로 설정되어 있습니다. 저장하면 관리자를 제외한 방문자는 사이트에 접속할 수 없습니다.'(`SiteSettingsPage.tsx:326-333` → 셸의 `warning` 슬롯 `SettingsFormShell.tsx:150`) | — | 비표시 기본. **저장 전에** 무슨 일이 일어날지 알린다 — 저장된 상태가 아니라 **드래프트** 값을 따른다. ⚠ 유지보수 모드 시절 tone 은 `danger` 였다 — 지금은 `warning` 이다 |
| FS-067-EL-036 | FS-067-SEC-02.3 | 비공개용 이미지 업로드 | 입력 | `AssetField label="비공개용 이미지"`(`:511-524`). 규칙은 EL-033 과 같다. **`disabled = disabled \|\| !privateImageEditable`**(`:517`) — 행 라벨도 함께 흐려진다(`:503` → `SettingLayout.tsx:95-103`) | O | **단일 소유자 판정** `isPrivateImageEditable(visibility) => visibility === 'private'`(`validation.ts:112-114`) — 화면이 규칙을 따로 갖지 않는다. **숨기지 않고 잠근다**(근거 `SiteSettingsPage.tsx:505-510`). 저장 검증도 조건부다: 비공개 + 자산이 있는데 `url` 이 비면 '비공개용 이미지를 다시 올려 주세요. 업로드가 끝나지 않았습니다.'(`validation.ts:172-183`) — **전체 공개면 판정하지 않는다**(`site.test.ts:147-153`) |
| FS-067-EL-037 | FS-067-SEC-02.3 | 비공개용 이미지 안내 | 텍스트 | ① 잠김 문구 — `!privateImageEditable` 일 때만 '공개 범위를 비공개로 바꾸면 설정할 수 있습니다. 지금 올려 둔 이미지는 그대로 보관됩니다.'(`:526-531`) ② info `Alert` 3항목 콜아웃(HD 50% 적용 · 밝은 회색 배경 · 미등록 시 기본 페이지)(`:533-539`) | — | ①은 비표시 기본, ②는 **항상 표시**. ①이 '왜 지금 못 만지는가'와 '내 값이 사라지지 않는다'를 동시에 말한다 — 잠그기만 하고 이유를 안 대지 않는다 |
| FS-067-EL-038 | FS-067-SEC-02.4 | 복사 방지 스위치 | 입력 | `ToggleSwitch` 접근 이름 '복사 방지'(`:556-563`). 힌트가 우클릭·복사 단축키 차단과 안드로이드 앱의 길게 눌러 저장/캡처 차단을 함께 설명한다(`:548-552`) | O | `setValue(..., { shouldDirty: true })` — **`shouldValidate` 를 주지 않는다**(교차 규칙이 없는 순수 불리언). 기본값 **ON**(`data-source.ts:72`) |
| FS-067-EL-039 | FS-067-SEC-02.4 | 모바일 확대 허용 스위치 | 입력 | `ToggleSwitch` 접근 이름 '모바일 확대 허용'(`:572-579`). 힌트 '방문자 브라우저 설정에 따라 확대 허용 방지가 동작하지 않을 수 있습니다.' | O | 위와 동일. 기본값 **OFF**(`data-source.ts:73`). **힌트가 집행의 한계를 스스로 밝힌다** — 이 값이 항상 지켜지는 것이 아님을 화면이 인정한다 |
| FS-067-EL-040 | FS-067-SEC-02.4 | 로그인 상태 유지 스위치 | 입력 | `ToggleSwitch` 접근 이름 '로그인 상태 유지'(`:588-595`). 힌트 '사이트 로그인시 자동 로그인에 대한 기본값을 설정 할 수 있습니다.' | O | 위와 동일. 기본값 **ON**(`data-source.ts:74`). **어드민이 아니라 방문자 사이트의 기본값**이다 — 이 화면의 세션에는 영향이 없다 |
| FS-067-EL-041 | FS-067-SEC-02 | 업로드 실행 규칙 | 텍스트 | `useAssetUpload(onUploaded)`(`useAssetUpload.ts:59-138`)가 세 자리의 **같은 순서**를 소유한다: ① 파일 규칙(확장자·용량) — 네트워크 전에 끝낸다(`:86-90`) ② 해상도(파비콘만 · `probeImageSize`)(`:104-114`) ③ `uploadSiteAsset`(`:117`) → 성공하면 `setValue(field, asset, { shouldDirty: true, shouldValidate: true })`(`SiteSettingsPage.tsx:190-195`) | O | 비표시 규칙. **오류·진행 상태를 자리별로 따로 들고 있어 서로를 지우지 않는다**(`useAssetUpload.ts:46-48,62-67`). 실패 5경로 전부 **그 항목 옆 인라인 오류**다(`:6-12`) — 토스트로 흘려보내지 않는다. 언마운트 시 진행 중 업로드를 전부 abort 한다(`:71-77`) |
| FS-067-EL-013 | FS-067-SEC-03 | 감사 기록 | 텍스트 | `AuditNote` — '마지막 변경: 박관리 · 3시간전'. 본문은 상대 시각(`formatRelativeOrDate`), `title` 속성은 절대 시각(`formatDateTime`)(`AuditNote.tsx:31-32`). `audit !== null && !loading` 일 때만(`SettingsFormShell.tsx:163`) | O | 상대만 쓰면 감사 정확도가 없고, 절대만 쓰면 '최근인가'를 즉시 알 수 없다 — 둘 다 준다 |
| FS-067-EL-014 | FS-067-SEC-03 | 저장 상태 문구 | 텍스트 | `canUpdate` 일 때만. 3분기: 저장 중 '저장하는 중입니다…' / dirty '저장하지 않은 변경 사항이 있습니다.' / 그 외 '변경 사항이 없습니다.'(`SettingsFormShell.tsx:168-174`) | — | 비활성 버튼이 '왜' 비활성인지 문구가 말한다 |
| FS-067-EL-015 | FS-067-SEC-03 | 저장 버튼 | 버튼 | `type="submit"` · `primary` · `size="md"`. 라벨 '저장 중…'/'저장'. **비활성 조건**: `!dirty \|\| saving \|\| loading`(`SettingsFormShell.tsx:175-182`) | O | **`canUpdate` 가 false 면 이 버튼과 EL-014 가 아예 렌더되지 않는다**(EXC-03 — `:166`) |
| FS-067-EL-016 | FS-067-SEC-02 | 읽기 전용 안내 | 배너 | `!canUpdate` 면 카드 상단 info `Alert`: '조회 권한만 있습니다. **기본 설정**을 바꾸려면 시스템 설정 수정 권한이 필요합니다.'(`SiteSettingsPage.tsx:68-69` → `SettingsFormShell.tsx:149`) | — | 비표시 기본. 버튼을 감추기만 하지 않고 **이유**를 말한다 |
| FS-067-EL-017 | FS-067-SEC-02 | 필드 일괄 비활성 규칙 | 텍스트 | `disabled = saving \|\| loading \|\| !canUpdate`(`SiteSettingsPage.tsx:181`) 를 **11개 컨트롤 전부**에 넘긴다(입력 3 · 토글 4 · 라디오 1 · 업로드 3) | — | 비표시 규칙. 읽기 전용 역할에게는 값이 **보이되 편집되지 않는다**. 비공개용 이미지만 여기에 `!privateImageEditable` 이 한 번 더 곱해진다(EL-036) |
| FS-067-EL-018 | FS-067-SEC-04 | 조회 실패 배너 | 배너 | 조회 실패 시 **폼 대신** danger `Alert` '설정을 불러오지 못했습니다.' + '다시 시도'(`refetch`)(`SettingsFormShell.tsx:125-138` · `SiteSettingsPage.tsx:317-318`) | O | 비표시 기본. 토스트로 알리지 않는다(STATE-02). 이때 안내문·카드·푸터가 전부 사라진다 |
| FS-067-EL-019 | FS-067-SEC-05 | 첫 로딩 스켈레톤 | 스켈레톤 | `loading` 이면 필드 자리에 `tds-ui-skeleton` **4행 고정** + `aria-busy="true"`(`SettingsFormShell.tsx:152-157`) | — | 비표시. **`isFetching && data === undefined` 기준** — 재조회에서는 뜨지 않고 이전 값이 유지된다(STATE-01 pass). 행 수는 하드코딩 `[0,1,2,3]`(`:154`) — 실제 컨트롤 11개·섹션 4개와 무관하다(§7 #8) |
| FS-067-EL-020 | FS-067-SEC-02 | 저장 실패 배너 | 배너 | 카드 상단 danger `Alert` '기본 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'(`SiteSettingsPage.tsx:246` → `SettingsFormShell.tsx:148`) | O | 비표시. 표시 조건 `saveError !== null && pending === null`(`:319`) — 확인 다이얼로그가 떠 있는 동안에는 다이얼로그 안에만 보인다. ⚠ **`conflict === null` 을 검사하지 않아** 충돌 다이얼로그가 떠 있을 때 **배너가 중복 표시**된다 — 형제 화면 OAuth 는 검사한다(§7 #5) |
| FS-067-EL-021 | FS-067-SEC-06 | 저장 확인 다이얼로그 | 모달 | 제출이 검증을 통과하면 **저장하지 않고** 이 다이얼로그를 세운다(`onValid` → `setPending(values)` — `:255-258`). `ConfirmDialog intent="update"` 제목 **'기본 설정 저장'**(`:601-611`) | — | 비표시. `busy={saving}` · `error={saveError}` — **실패해도 닫지 않는다**(재클릭이 곧 재시도) |
| FS-067-EL-021.1 | FS-067-SEC-06 | 확인 문구 분기 규칙 | 텍스트 | `saveConfirmMessage(pending, savedPrivate)`(`:116-124`) 3분기: **닫는 중**(드래프트 private + 저장값 public) → '사이트를 비공개로 바꿉니다. 저장하는 즉시 관리자를 제외한 방문자는 사이트에 접속할 수 없습니다. 저장할까요?' · **여는 중** → '사이트를 전체 공개로 바꿉니다. 저장하는 즉시 누구나 사이트에 접속할 수 있습니다. 저장할까요?' · **그 외** → '기본 설정을 저장하면 사이트 전반에 즉시 반영됩니다. 저장할까요?' | — | 비표시 규칙. 기준은 `data?.value.visibility === 'private'`(`:176`) — **서버가 아는 상태**이지 폼 초기값이 아니다 |
| FS-067-EL-021.2 | FS-067-SEC-06 | 확인 취소 | 버튼 | `cancelSave`(`:266-273`) → `controllerRef.current?.abort()` · `save.reset()` · `lock.release()` · `saveError`·`pending` 을 비운다 | — | 비표시. **진행 중이던 저장도 함께 취소한다** — busy 중에도 취소는 살아 있다(`ConfirmDialog.tsx:144`) |
| FS-067-EL-022 | FS-067-SEC-02 | 저장 실행 규칙 | 텍스트 | `runSave(values, force)`(`:209-252`): ① `data?.revision` 이 없으면 아무것도 하지 않는다(`:211-212`) ② `lock.acquire()` 가 false 면 중단(`:215` · EXC-08) ③ `saveError` 를 비우고 새 `AbortController` 로 `save.mutate({ value, expectedRevision, force, signal })`(`:217-223`) | O | 비표시 규칙 |
| FS-067-EL-022.1 | FS-067-SEC-02 | 동기 제출 잠금 | 텍스트 | `useSubmitLock()`(`_shared/queries.ts:58-75`) — `useRef` 잠금이라 **렌더를 기다리지 않는다**. `disabled={saving}` 만으로는 클릭과 리렌더 사이 틈으로 두 번째 클릭이 통과한다(`queries.ts:54-55`) | — | 비표시 규칙. **멱등키는 없다** — 응답 유실 후 재시도는 새 요청이 된다(§7 #4) |
| FS-067-EL-022.2 | FS-067-SEC-02 | 저장 성공 처리 | 텍스트 | `lock.release()` → `controller.signal.aborted` 면 중단 → `reset(values)`(저장한 값이 새 기준선 = dirty 해제 = 이탈 가드 내려감) → `pending`·`conflict` 비움 → 토스트 '기본 설정을 저장했습니다.'(`:225-233`) | O | 비표시. `useSaveSettings` 의 `onSuccess` 가 **저장 응답을 캐시에 직접 심는다**(`_shared/queries.ts:45`) — invalidate 만 하면 재조회 전 낡은 revision 으로 두 번째 저장이 409 를 맞는다(`queries.ts:43-44`) |
| FS-067-EL-023 | FS-067-SEC-02 | 언마운트 abort | 텍스트 | `useEffect(() => () => controllerRef.current?.abort(), [])`(`:157`). 업로드 쪽은 별도 컨트롤러 배열이 같은 일을 한다(`useAssetUpload.ts:71-77`) | — | 비표시 규칙 |
| FS-067-EL-023.1 | FS-067-SEC-02 | abort 는 실패가 아니다 | 텍스트 | `onError` 에서 `isAbort(cause) \|\| controller.signal.aborted` 면 즉시 return — 배너·토스트를 띄우지 않는다(`:237`). `onSuccess` 도 `aborted` 면 아무것도 하지 않는다(`:227`). 업로드도 같은 규칙(`useAssetUpload.ts:125`) | — | 비표시 규칙(EXC-09). 공유 predicate `isAbort`(`shared/async.ts`)를 쓴다 — 로컬 판정을 재발명하지 않는다 |
| FS-067-EL-024 | FS-067-SEC-07 | 충돌 다이얼로그 | 모달 | 저장이 `SettingsConflictError` 로 실패하면(`isSettingsConflict(cause)` — `:240`) `pending` 을 비우고 **최신 문서를 쥔 채** `ConflictDialog` 를 세운다(`:240-243` · `:613-625`). 제목 '기본 설정이 이미 변경되었습니다'(`ConflictDialog.tsx:92`) | O | 비표시. **입력은 그대로 살아 있다** — 사용자가 고르기 전에는 아무것도 사라지지 않는다(`ConflictDialog.tsx:11-13`) |
| FS-067-EL-024.1 | FS-067-SEC-07 | 충돌 본문 | 텍스트 | '내가 이 화면을 연 뒤에 다른 관리자가 기본 설정을 저장했습니다. 그대로 저장하면 그 변경이 사라집니다.' + '마지막 저장: `<updatedBy>` · `<formatAuditAt(updatedAt)>`' + 하단 안내 1문단. `useId` 로 만든 id 가 `Modal` 의 `aria-describedby` 로 연결된다(`ConflictDialog.tsx:88,93,107`) | O | 비표시. A11Y-02 pass 근거 |
| FS-067-EL-024.2 | FS-067-SEC-07 | 달라진 항목 목록 | 텍스트 | `divergedLabels(getValues(), conflict.value, SITE_FIELD_LABELS)`(`:300-303`)로 값이 갈린 필드의 **라벨**만 `<ul>` 로 나열한다. 빈 배열이면 목록을 그리지 않는다(`ConflictDialog.tsx:115`) | — | 비표시. 라벨 정본은 `data-source.ts:106-119`(필드 키와 1:1, 12건). ⚠⚠ **비교기가 이 문서를 감당하지 못한다** — `diff.ts:13-20` 은 배열만 특수 처리하고 나머지는 `Object.is` 다. `favicon`·`ogImage`·`privateImage` 는 **객체**라 항상 '달라졌다'로 보고된다(§7 #14) |
| FS-067-EL-024.3 | FS-067-SEC-07 | '최신 내용 불러오기' | 버튼 | `secondary`. `reset(latest.value)` → `conflict` 비움 → `refetch()` → 토스트 '최신 기본 설정을 불러왔습니다.'(`:278-285`) | O | **내 입력을 버리는 선택** — 라벨이 그렇게 말한다 |
| FS-067-EL-024.4 | FS-067-SEC-07 | '내 변경으로 덮어쓰기' | 버튼 | **`danger`**. `runSave(getValues(), true)`(`:288-290`) — `force: true` 로 토큰 검사를 건너뛴다(`_shared/store.ts:124`) | O | **상대의 변경을 버리는 선택.** 파괴적일수록 라벨이 결과를 말한다(`ConflictDialog.tsx:9-10`). `busy` 중 두 액션 버튼이 잠긴다(`:97,100`) |
| FS-067-EL-024.5 | FS-067-SEC-07 | 충돌 다이얼로그 닫기 | 버튼 | `onClose`(딤·Esc·×) → abort · `save.reset()` · `lock.release()` · `conflict` 비움(`:292-298`) | — | 비표시. **아무것도 하지 않고 그대로 두는 세 번째 갈래** — 그래서 `ConfirmDialog`(이지선다)가 아니다 |
| FS-067-EL-025 | FS-067-SEC-08 | 미저장 이탈 가드 | 모달 | `useUnsavedChangesDialog(dirty && !saving, { message })`(`SettingsFormShell.tsx:122`). 문구 '**기본 설정**에 저장하지 않은 변경 사항이 있습니다. 이 화면을 벗어나면 입력한 내용이 사라집니다.'(`SiteSettingsPage.tsx:65-66`) | — | 비표시. 3경로: beforeunload · 앱 내 링크 capture · popstate sentinel. **저장 중에는 가드하지 않는다**(곧 not-dirty 가 된다) |
| FS-067-EL-026 | FS-067-SEC-02 | 폼 초기값·리셋 규칙 | 텍스트 | `DEFAULT_FORM_VALUES`(`:631-644`)로 시작해 데이터 도착 시 `reset(data.value)`(`:160-163`). 이 값이 **dirty 판정의 기준선**이다 | O | 비표시. `useEffect([data, reset])` — **편집 중 재조회가 오면 입력이 덮인다**(§7 #7) |
| FS-067-EL-027 | FS-067-SEC-02 | dirty 판정 | 텍스트 | RHF `formState.isDirty`(`:144` → `:321`) — 기준선 대비 비교 | — | 비표시. 업로드 성공·토글·라디오는 전부 `shouldDirty: true` 로 dirty 를 만든다 |
| FS-067-EL-028 | FS-067-SEC-02 | 제출 경로 | 텍스트 | `<form onSubmit={handleSubmit(onValid)} noValidate>`(`SiteSettingsPage.tsx:334` → `SettingsFormShell.tsx:144`) — 브라우저 기본 검증을 끄고 zod 가 판정한다. 검증 실패 시 `onValid` 가 불리지 않고 각 필드에 오류가 꽂힌다 | — | 비표시. **`onInvalid` 핸들러가 없다** — 첫 오류 필드로 포커스가 가지 않는다(§7 #3) |

## 4. 예외 명세

| 요소번호 | 빈 상태 | 로딩 | 실패 | 유효성 | 권한없음 | 경합 | 대량 |
|---|---|---|---|---|---|---|---|
| FS-067-EL-001 | N/A — 정적 문구 | 로딩 중에도 표시(카드 밖) | 조회 실패 시 EL-018 이 화면을 대체해 함께 사라진다 | N/A — 입력 없음 | 권한과 무관하게 표시 | N/A — 정적 | 고정 문구 |
| FS-067-EL-002 | N/A — 정적 문구 | 로딩 중에도 표시 | 조회 실패 시 사라진다 | N/A — 입력 없음 | 권한과 무관 | N/A — 정적 | 고정 문구 |
| FS-067-EL-042 | N/A — 골격 | 로딩 중에는 children 대신 스켈레톤이 들어가 섹션이 그려지지 않는다 | 조회 실패 시 폼째 사라진다 | N/A — 표시 전용 | 권한과 무관(라벨은 `disabled` 를 받아 흐려질 수 있다 — EL-036) | N/A — 골격 | 섹션 4 · 행 11 고정 |
| FS-067-EL-003 | 초기값 `''`, 도착 시 서버 값으로 reset | `disabled`(EL-017) + 스켈레톤이 자리를 대체 | 저장 실패는 EL-020. 입력 보존 | 비면 missing · 20자 초과 시 tooLong(**trim 후 판정** — `_shared/validation.ts:21-22`). `maxLength=20` 이 입력을 먼저 자른다 | `!canUpdate` 면 값이 보이되 비활성 | 재조회가 오면 입력이 덮인다(EL-026 · §7 #7). 충돌 시 EL-024.2 가 '사이트 이름'을 짚는다 | 20자 상한 + 카운터 |
| FS-067-EL-004 | 초기값 `''`. 빈 값이 정상 | 위와 동일 | 위와 동일 | **비어도 통과**(`optionalText`). 100자 초과만 거절 | 위와 동일 | 위와 동일 | 100자 상한 + 카운터 |
| FS-067-EL-029 | N/A — 불리언(초기값 `false`, 픽스처 `true`) | `disabled` | 저장 실패는 EL-020 | `z.boolean()` — 위반 값이 없다. **교차 규칙**(이름 필수)이 EL-030 에 오류를 꽂는다 | 비활성 | 충돌 시 '메일·SMS 전용 사이트 이름 사용'으로 짚힌다 | N/A — 불리언 |
| FS-067-EL-030 | 초기값 `''`. **스위치가 꺼져 있으면 렌더되지 않는다** | `disabled` | 저장 실패는 EL-020 | 켠 채 trim 이 비면 missing · 40byte 초과면 tooLong. **꺼져 있으면 아무 판정도 하지 않는다**(`site.test.ts:132-138`) | 비활성 | 충돌 시 '메일·SMS 전용 사이트 이름'으로 짚힌다 | **`maxLength` 가 없다** — 초과 입력이 제출 전까지 막히지 않고 카운터만 넘어간다(의도 — 바이트는 `maxLength` 로 표현 불가) |
| FS-067-EL-043 | 초기값 `''` — 미리보기 주소 줄이 빈다 | 스켈레톤에 덮여 미리보기가 없다 | N/A — 이 화면이 쓰기를 하지 않는다 | `z.string()` — 형식 규칙이 **없다**(고칠 수 없는 값이라 신뢰한다) | N/A — 컨트롤이 없어 권한과 무관 | 충돌 시 '사이트 주소'로 짚힐 수 있다 — **이 화면이 바꾸지 않았는데도** | 단건. **PUT 바디에서 빠진다**(EL-043 비고) |
| FS-067-EL-031 | `favicon === null` 이면 칩 없이 드롭존만(브라우저 탭 목업은 회색 자리) | `disabled`(업로드 중에는 `busy` 로도 잠긴다 — `AssetField.tsx:73,82`) | 5경로 전부 인라인 오류(EL-041). `?fail=upload` 로 재현 | 확장자·용량은 고르는 즉시, 해상도는 디코드 후 판정 | 비활성 | 업로드 결과가 폼 값일 뿐이라 재조회가 오면 덮인다(§7 #7) | 1건. 100KB 상한 |
| FS-067-EL-032 | 파비콘·이름이 비면 각각 회색 사각형·'사이트 이름' 자리 문구 | 스켈레톤이 자리를 대체해 그려지지 않는다 | N/A — 표시 전용 | N/A — 표시 전용 | 권한과 무관하게 표시 — **읽기 전용 역할도 결과를 본다** | 드래프트 값을 그린다 — 재조회로 값이 덮이면 목업도 함께 바뀐다 | 1건 |
| FS-067-EL-033 | `ogImage === null` 이면 칩 없이 드롭존만 | 위 EL-031 과 동일 | 위와 동일 | 확장자·5MB 만. **해상도 규칙 없음** | 비활성 | 위와 동일 | 1건. 5MB 상한 |
| FS-067-EL-034 | 이미지·이름·설명이 비면 각각 자리 문구 3종 | 스켈레톤이 자리를 대체 | N/A — 표시 전용 | N/A — 표시 전용 | 권한과 무관하게 표시 | 드래프트 값을 그린다 | 1건 |
| FS-067-EL-035 | N/A — 항상 한 값이 선택돼 있다(초기값 `'public'`) | `disabled` | 저장 실패는 EL-020 | `z.enum(['public','private'])` — 목록 밖 값은 파싱 실패. 화면에 그 선택지가 없어 실현되지 않는다 | 비활성 | 충돌 시 '공개 범위'로 짚힌다. **다른 관리자가 먼저 비공개로 바꿨다면 EL-024 가 그것을 알린다** | 선택지 2개 고정 |
| FS-067-EL-011 | N/A — 비공개여야 성립 | 로딩 중에는 폼이 스켈레톤이나 **배너는 카드 상단이라 함께 뜬다**(`SettingsFormShell.tsx:150` 이 스켈레톤 분기 밖이다) | 조회 실패 시 미표시(폼째 사라진다) | N/A — 표시 전용 | `!canUpdate` 면 값을 바꿀 수 없어 실질적으로 저장된 값이 `private` 일 때만 뜬다 | 드래프트 기준이라 재조회와 무관 | 1건 |
| FS-067-EL-036 | `privateImage === null` 이면 드롭존만 | `disabled` | 위 EL-031 과 동일 | **비공개일 때만 판정한다** — 전체 공개면 반쯤 올라간 값도 통과(`site.test.ts:147-153`) | 비활성 | 충돌 시 '비공개용 이미지'로 짚힌다 | 1건. 5MB 상한 |
| FS-067-EL-037 | ① 은 전체 공개일 때만 · ② 는 항상 | 스켈레톤이 자리를 대체 | 조회 실패 시 폼째 사라진다 | N/A — 표시 전용 | 권한과 무관하게 표시 | 공개 범위 드래프트를 따른다 | 고정 문구 |
| FS-067-EL-038 | N/A — 불리언(기본 ON) | `disabled` | 저장 실패는 EL-020 | `z.boolean()` — 위반 값이 없다 | 비활성 | 충돌 시 '복사 방지'로 짚힌다 | N/A — 불리언 |
| FS-067-EL-039 | N/A — 불리언(기본 OFF) | `disabled` | 저장 실패는 EL-020 | `z.boolean()` | 비활성 | 충돌 시 '모바일 확대 허용'으로 짚힌다 | N/A — 불리언 |
| FS-067-EL-040 | N/A — 불리언(기본 ON) | `disabled` | 저장 실패는 EL-020 | `z.boolean()` | 비활성 | 충돌 시 '로그인 상태 유지'로 짚힌다 | N/A — 불리언 |
| FS-067-EL-041 | N/A — 파일을 골라야 성립 | 자리별 `busy` 문구 '올리는 중입니다…'(`AssetField.tsx:94-98`)와 드롭존 잠금 | **5경로 전부 인라인 오류**. abort 는 오류로 치지 않는다(`useAssetUpload.ts:125`) | 확장자·용량은 네트워크 전, 해상도는 디코드 후 | `disabled` 면 드롭존을 누를 수 없다 | 세 자리가 서로의 오류·busy 를 지우지 않는다(자리별 상태) | 동시 업로드 3자리까지. 배치 업로드는 없다(자리당 파일 1개) |
| FS-067-EL-013 | `audit === null`(도착 전)이면 렌더되지 않는다 | `loading` 이면 렌더되지 않는다(`SettingsFormShell.tsx:163`) | 조회 실패 시 폼째 사라진다 | N/A — 표시 전용 | 권한과 무관하게 표시 — **읽기 전용 역할도 누가 바꿨는지 본다** | 저장 성공 시 캐시가 갱신돼 새 감사 정보로 바뀐다 | 1건 |
| FS-067-EL-014 | N/A — 항상 3분기 중 하나 | '저장하는 중입니다…' | N/A — 실패는 EL-020 | N/A — 표시 전용 | **`!canUpdate` 면 렌더되지 않는다** | 재조회로 기준선이 바뀌면 dirty 판정이 바뀐다 | 고정 문구 |
| FS-067-EL-015 | N/A — 항상 표시(권한 있으면) | 요청 중 '저장 중…' + 비활성 | 실패 시 EL-020 배너, 버튼 재활성, 이동 없음, **입력 보존** | 미변경·로딩 중이면 비활성. 검증 실패는 제출을 막고 필드에 오류를 꽂는다 | **`!canUpdate` 면 렌더되지 않는다**(EXC-03) | 저장 성공이 새 revision 을 캐시에 심어 다음 저장이 곧바로 최신을 쓴다 | 단건 저장 |
| FS-067-EL-016 | N/A — 권한이 없어야 성립 | 로딩 중에도 표시(카드 상단) | 조회 실패 시 폼째 사라진다 | N/A — 표시 전용 | **이것이 권한없음 표현** | 권한 스토어가 바뀌면 재렌더된다(`RequirePermission.tsx:23-25` — 강등 reconcile) | 1건 |
| FS-067-EL-017 | N/A — 규칙 | `loading` 이 이 규칙의 입력 | `saving` 이 이 규칙의 입력 | N/A — 규칙 | `!canUpdate` 가 이 규칙의 입력 | N/A — 파생 규칙 | 11개 컨트롤 일괄 |
| FS-067-EL-018 | N/A — 실패 상태 | 재시도 시 배너가 사라지고 스켈레톤으로 | **이것이 조회 실패 표현.** 문구 1종 + '다시 시도'. **401/403/404/500 을 구분하지 않는다**(§7 #2) | N/A — 입력 없음 | 라우트 read 권한 부족은 여기 오지 않는다 — `RequirePermission` 이 `<Outlet>` 밖에서 403 화면을 그린다(§4.1) | 재시도는 같은 조회를 재발행 | N/A — 표시 전용 |
| FS-067-EL-019 | N/A — 도착 전 상태 | **이것이 로딩 표현.** 4행 고정 + `aria-busy` | 조회 실패 시 EL-018 로 바뀐다 | N/A — 입력 없음 | 권한과 무관 | **재조회에서는 뜨지 않는다**(`data !== undefined`) — 이전 값 유지 | 행 수가 실제 컨트롤 수(11)·섹션 수(4)와 무관하게 4 고정(§7 #8) |
| FS-067-EL-020 | N/A — 오류가 있어야 성립 | 재저장 시 `setSaveError(null)` 로 먼저 지운다(`:217`) | **이것이 저장 실패 표현.** 문구 1종 — 403/422/500 을 구분하지 않는다(§7 #2). abort 는 표시하지 않는다 | 검증 실패는 여기 오지 않는다(필드 오류로 간다) | 서버 403 도 이 문구로 뭉개진다 | **409 는 여기 오지 않는다** — EL-024 로 갈린다(`isSettingsConflict`). ⚠ 다만 **충돌 다이얼로그와 동시에 뜬다**(§7 #5) | 1건 |
| FS-067-EL-021 | N/A — 제출이 있어야 성립 | `busy={saving}` → 확인 버튼이 '처리 중…' + 잠김. **취소는 살아 있다** | 실패해도 **닫지 않는다** — 다이얼로그 안 danger 배너(`ConfirmDialog` `error`) | **검증을 통과한 값만 여기 온다** — `handleSubmit(onValid)` 이 게이트다 | 권한 없으면 저장 버튼이 없어 도달 불가 | 확인 중 다른 관리자가 저장하면 확인 후 409 → EL-024 | 1건 |
| FS-067-EL-021.1 | N/A — 규칙 | N/A — 순수 조립(동기) | N/A — 서버 호출 없음 | N/A — 규칙 | N/A | **기준이 `data?.value.visibility` 라 재조회가 오면 문구가 바뀐다** — 확인 다이얼로그가 떠 있는 동안 갱신될 수 있다 | 3분기 고정 |
| FS-067-EL-021.2 | N/A — 다이얼로그가 떠야 성립 | 저장 중에도 누를 수 있다 — 그것이 abort 경로다 | abort 는 실패로 통지되지 않는다(EL-023.1) | N/A — 입력 없음 | N/A | 취소해도 서버 도달 여부는 보장되지 않는다(§7 #9) | 단건 |
| FS-067-EL-022 | N/A — 규칙 | `loading` 중에는 revision 이 없어 아무것도 하지 않는다 | 실패는 EL-020 또는 EL-024 로 갈린다 | N/A — 검증은 상류에서 끝났다 | N/A | **`expectedRevision` 이 이 규칙의 핵심** — 낡으면 409 | 단건 |
| FS-067-EL-022.1 | N/A — 규칙 | 잠금은 렌더와 무관하게 즉시 건다 | 성공·실패 어느 쪽이든 `lock.release()`(`:226,235`) | N/A | N/A | **연타의 2번째가 여기서 멈춘다** | **멱등키가 없다** — 응답 유실 후 재시도는 새 요청이 되고 낡은 revision 때문에 409 가 된다(§7 #4) |
| FS-067-EL-022.2 | N/A — 성공이 있어야 성립 | N/A — 결과 처리 | N/A — 성공 경로 | N/A | N/A | **`setQueryData(key, saved)`** 로 새 revision 을 즉시 심는다 — 연속 저장이 409 를 맞지 않는다 | 단건 |
| FS-067-EL-023 | N/A — 진행 요청이 있어야 성립 | 이것이 취소 규칙 | abort 는 실패가 아니다 | N/A | N/A | 이탈 시 진행 중 저장·업로드 취소 — **서버 도달 여부는 보장하지 않는다**(§7 #9) | 저장 1건 + 업로드 최대 3건 |
| FS-067-EL-023.1 | N/A — 규칙 | N/A | **이것이 abort 판정 규칙**(EXC-09) | N/A | N/A | `signal.aborted` 를 성공·실패 양쪽에서 본다 | 저장·업로드 공통 |
| FS-067-EL-024 | N/A — 충돌이 있어야 성립 | `busy={saving}` — 덮어쓰기 중 두 액션이 잠긴다 | 덮어쓰기 실패 시 다이얼로그 안 danger 배너(`error={saveError}`). ⚠ 동시에 EL-020 배너도 뜬다(§7 #5) | N/A — 입력 없음 | 권한 없으면 저장 불가라 도달 불가 | **이것이 경합 표현.** 토큰 기반 — '존재 여부'가 아니라 **revision 불일치**로 판정한다(BE-067 §7.2) | 1건 |
| FS-067-EL-024.1 | N/A — 충돌이 있어야 성립 | N/A | N/A — 표시 전용 | N/A | N/A | 최신 문서의 `audit` 를 그대로 보인다 | 고정 문구 |
| FS-067-EL-024.2 | **갈린 항목이 0개면 목록을 그리지 않는다** — ⚠ 이미지 3필드 때문에 **0개가 사실상 나오지 않는다**(§7 #14) | N/A — 순수 계산 | N/A | N/A | N/A | `getValues()`(내 입력) vs `conflict.value`(최신) 비교 | 최대 12개 라벨. **그중 3개는 거짓 양성**(§7 #14) |
| FS-067-EL-024.3 | N/A | `busy` 면 잠김 | `refetch()` 가 실패하면 EL-018 이 폼을 대체한다 — **불러온 값은 폼에 이미 들어가 있다** | N/A | N/A | reset 후 refetch 라 최신 revision 을 다시 받는다 | 단건 |
| FS-067-EL-024.4 | N/A | `busy` 면 잠김 + '처리 중…' | 실패 시 다이얼로그 유지 + 배너. **재클릭이 재시도** | N/A | N/A | **`force: true` 라 토큰 검사를 건너뛴다** — 상대 변경이 사라진다(사용자가 알고 고른 것) | 단건 |
| FS-067-EL-024.5 | N/A | 진행 중 저장을 abort 한다 | abort 는 통지하지 않는다 | N/A | N/A | 닫아도 내 입력은 그대로 — 다시 저장하면 또 409 를 맞는다(revision 이 여전히 낡음) | 단건 |
| FS-067-EL-025 | N/A — dirty 여야 성립 | **저장 중에는 가드가 꺼진다**(`dirty && !saving`) | N/A — 서버 호출 없음 | N/A — 입력 없음 | `!canUpdate` 면 편집이 불가해 dirty 가 되지 않는다 | 저장 성공 후 `reset(values)` 로 dirty 가 풀려 가드가 내려간다 | N/A — 표시 전용 |
| FS-067-EL-026 | 도착 전에는 `DEFAULT_FORM_VALUES` 가 보인다(스켈레톤에 덮여 사실상 안 보인다) | `data === undefined` 면 reset 하지 않는다 | 조회 실패 시 폼이 렌더되지 않는다 | N/A — 규칙 | N/A | **`useEffect([data, reset])` 가 편집 중 재조회에서도 돈다** — 입력이 덮인다(§7 #7) | 단건 문서 |
| FS-067-EL-027 | 기준선과 같으면 not-dirty | N/A — 동기 판정 | N/A | N/A | N/A | 기준선이 바뀌면 판정도 바뀐다 | N/A — 순수 판정 |
| FS-067-EL-028 | N/A — 제출이 있어야 성립 | 저장 중 버튼이 비활성이라 재제출이 막힌다(+ EL-022.1) | N/A — 검증은 로컬 | **이것이 유효성 게이트.** `noValidate` 로 브라우저 검증을 끄고 zod 가 판정 | 권한 없으면 submit 버튼이 없다(Enter 제출은 가능 — §7 #10) | N/A | 12필드 일괄 검증 |

### 4.1 공통 예외 규칙

| 규칙 | 내용 |
|---|---|
| 네트워크 단절 | 조회 실패는 폼을 대체하는 인라인 배너(EL-018), 저장 실패는 카드 배너(EL-020), 업로드 실패는 자리별 인라인 오류(EL-041). **오프라인 감지·복귀 재조회가 앱 전역에 없다**(`navigator.onLine` grep 0건) — §7 #11 |
| 세션 만료 | 401 은 **앱 전역 인터셉터**(`shared/query/queryClient.ts` 의 `QueryCache`/`MutationCache` `onError`)가 받아 `notifySessionExpired()` 를 쏘고, `RequireAuth` 가 세션을 폐기한 뒤 `/login?returnUrl=/settings/site&reason=session_expired` 로 보낸다. **미저장 입력은 그때 사라진다** — 프로그램적 이동이라 EL-025 가드가 발화하지 않는다(§7 #11) |
| 요청 타임아웃 | 프론트 상한 없음(`AbortSignal.timeout` 앱 전역 grep 0건). abort 는 언마운트(EL-023)·확인 취소(EL-021.2)·충돌 닫기(EL-024.5)에서만 발생한다 — §7 #11 |
| 중복 제출 | `disabled={!dirty \|\| saving \|\| loading}` + **동기 잠금 `useSubmitLock`**(EL-022.1). **멱등키는 없다** — 다만 `expectedRevision` 이 있어 응답 유실 후 재시도는 **중복 적용이 아니라 409** 가 된다(§7 #4). **업로드에는 잠금이 없다** — 같은 자리에 파일을 다시 고르면 요청이 하나 더 나가고 나중 응답이 이긴다 |
| 실패 통지의 자리 | ① 조회 실패 = 폼을 대체하는 인라인 배너 ② 저장 실패 = 카드 배너(확인 다이얼로그가 떠 있으면 다이얼로그 안) ③ 업로드 실패 = 그 항목 옆 인라인 오류 ④ 저장 **성공** = 토스트 ⑤ 409 = 충돌 다이얼로그 ⑥ abort = 아무것도 띄우지 않는다 |
| 낙관적 업데이트 | **이 화면에 없다.** 저장은 비관적(응답 후 `reset` + 캐시 심기) — 롤백 경로가 필요 없다 |
| 동시 조회 | `useSettingsQuery` 가 `queryKey: ['settings','site']`(`data-source.ts:16`)로 1건만 유지한다. 전역 기본 `staleTime` 30초(`shared/query/queryClient.ts:70`) · `retry: false`(`:82`) · `refetchOnWindowFocus: false`(`:90`)를 따른다 — 이 화면이 재정의하지 않는다 |
| 권한 없음 | **read** — `RequirePermission` 이 AppShell `<Outlet>` 을 감싸(`AppShell.tsx:526-528`) 권한 없는 deep-link 에 `ForbiddenScreen` 을 렌더한다. 리소스는 라우트에서 파생된다(`route-resource.ts:32-35` → `navPageResourceId` `resources.ts:65-67` → `page:/settings/site`). **write** — `useRouteWritePermissions().canUpdate`(`SiteSettingsPage.tsx:130`)가 저장 컨트롤을 게이팅한다(EL-015·EL-016). 권한 스토어가 바뀌면 재렌더돼 **강등 reconcile 이 별도 코드 없이 성립한다**(`RequirePermission.tsx:23-25`). 서버 403 은닉 정책은 BE-067 §7.5 |
| 렌더 예외 | AppShell 이 `<Outlet>` 바로 바깥에 `ErrorBoundary` 를 둔다(`AppShell.tsx:520-529`, 근거 주석 `:514`) — 화면이 던져도 사이드바·헤더가 남고 `RouteErrorScreen` 이 뜬다 |
| 프론트 검증은 보증이 아니다 | zod 는 UX 다. 서버가 같은 규칙을 다시 검증한다(BE-067 §7.1) — `data-source.ts:82` 의 심이 `422 → 필드 검증 실패` 를 명시한다 |

## 5. 서버 연동 지점

| 요소번호 | 이름 | 읽기/쓰기 | 필요 데이터 | 프론트 어댑터 | 비고 |
|---|---|---|---|---|---|
| FS-067-EL-013 / EL-018 / EL-019 / EL-026 | 사이트 설정 조회 | R | `{ value: SiteSettingsValues, revision, audit }` | `siteSettingsStore.fetch(signal)` (`_shared/store.ts:108-112`) | `useSettingsQuery(siteSettingsKey, siteSettingsStore)`. **revision·audit 를 문서와 함께 나른다** |
| FS-067-EL-015 / EL-020 / EL-022 / EL-022.2 / EL-024 | 사이트 설정 저장 | W | `{ value, expectedRevision, force? }` | `siteSettingsStore.save(input, signal)` (`_shared/store.ts:114-134`) | `useSaveSettings`. **`expectedRevision` 불일치 → `SettingsConflictError`(최신 문서 동봉)**. `force: true` 면 토큰 검사를 건너뛴다 |
| FS-067-EL-031 / EL-033 / EL-036 / EL-041 | 자산 업로드 | W | `File` → `{ name, size, url }` | `uploadSiteAsset(file, signal)` (`site/data-source.ts:98-103`) | `useAssetUpload` 가 자리별로 부른다. **응답의 `url` 이 저장된 자산 주소가 되어야 한다** — 지금은 세션 수명의 objectURL 이다(§7 #16) |
| FS-067-EL-024.3 | 최신 내용 재조회 | R | 위 조회와 동일 | `refetch()` (react-query) | 충돌 해소 경로 |

> **현재 구현 상태 (백엔드 명세 참고)**: 백엔드는 없다. `siteSettingsStore` 는 `createRevisionedStore('site', DEFAULT_SITE_SETTINGS, { updatedBy: '박관리', updatedAt: '2026-07-09T02:14:00.000Z' })`(`data-source.ts:83-87`)로 만든 **브라우저 안 mutable 클로저 1건**에 400ms 지연(`LATENCY_MS` — `shared/crud/dev.ts:12`)과 개발용 실패 스위치(`failIfRequested('site', op)` — `dev.ts:90`)를 얹은 것이다 — 실제 네트워크 0건. `revision` 은 `rev-<seq>` 단조 증가 문자열(`store.ts:86-91`)이고, 저장 주체는 **하드코딩 `CURRENT_ADMIN = '김운영'`**(`store.ts:84`)이다. 새로고침하면 시드로 돌아간다. 픽스처 자산은 인라인 SVG data URI 다(`data-source.ts:28-53`) — 정적 이미지 파이프라인이 없고 미리보기가 **실제로 그림을 그려야** 정렬을 확인할 수 있기 때문이다.
>
> **TODO(backend) 심은 정확히 3곳이다** — ① `site/data-source.ts:77-82`(GET/PUT `/api/settings/site` · `If-Match` · 200/409·412/422. ⚠ **바디 목록이 `siteUrl` 을 빼고 있다** — 11필드다) ② `site/data-source.ts:92`(`POST /api/uploads` multipart → `{ name, size, url }`) ③ `_shared/store.ts:83`(저장 주체는 서버가 세션에서 읽는다). **`site/SiteSettingsPage.tsx:71` 의 `TODO(content)` 는 백엔드 심이 아니다** — 도움말 문서 주소 자리표시자다. BE-067 §4 는 이 세 심을 그대로 계약으로 옮긴 것이며 발명한 엔드포인트가 없다.

## 6. 자기 점검 (제출 전 확인)

- [x] 구현 소스를 전수 대조했다 — `SiteSettingsPage.tsx` · `data-source.ts` · `validation.ts` · `useAssetUpload.ts` · `site.test.ts` · `components/{AssetField,CountedInput,Previews,SettingLayout}.tsx` · `_shared/{SettingsFormShell,ConflictDialog,AuditNote,queries,store,diff,validation,fields}`
- [x] **재작성으로 사라진 필드에 매달린 요소 번호(EL-005·006·007·007.1·008·009·010·012)를 폐지하고 재사용하지 않았다** — §3 머리말에 명시. 살아남은 판정은 표면이 남아 있어 전부 유지했다
- [x] 보이지 않는 요소(스켈레톤·조회/저장 실패 배너·읽기전용 안내·비공개 경고·확인/충돌 다이얼로그·이탈 가드·업로드 흐름·동기 잠금·abort 규칙·dirty 판정·reset 규칙·필드 일괄 비활성·섹션 골격)에 번호를 줬다
- [x] §4 예외 7축 빈칸 0건. 모든 `N/A` 에 사유
- [x] `[서버]` = O 요소가 §5 에 전부 요약됐다 — 이 화면에 어댑터를 거치지 않는 호출이 **없다**
- [x] 엔드포인트·HTTP·에러코드·DB 스키마를 쓰지 않았다 (BE-067 영역)
- [x] **`in-content <h1>` 이 없음을 grep 으로 확인**(`grep -rn "h1" apps/admin/src/pages/settings/` → 0건, 2026-07-18)하고 EL-001 에 기록했다 — IA-02 판정의 근거. 섹션 제목은 `<h3>`(`SettingLayout.tsx:62`)이다
- [x] 낙관적 동시성이 **'존재 여부'가 아니라 revision 토큰 기반**임을 `store.ts:124-126` 로 확인하고 EL-024 에 명시했다
- [x] **`파일:줄` 을 전건 재확인했다**(2026-07-18 워킹 트리 기준, HEAD 보다 앞서 있다). 사라진 대상을 가리키던 인용은 폐지하거나 살아남은 등가물로 옮겼다
- [x] §7 의 미결 항목이 BE-067 §7.6 · NFR-067 §5 와 일치한다

## 7. 미결 사항 (UI 기획 / 아키텍처 / 백엔드 명세 / 프론트 구현 이관)

| # | 내용 | 이관 대상 |
|---|---|---|
| 1 | 대응 SCR 문서 부재 (시스템 설정 SCR 미작성) | UI 기획 / 아키텍처 |
| 2 | 조회 실패(EL-018)·저장 실패(EL-020)가 **status 를 구분하지 않는다** — 401/403/404/500 이 한 문구다. `createRevisionedStore` 가 `HttpError`(status 보유)가 아니라 일반 `Error`/`SettingsConflictError` 만 던져 화면이 분기할 근거가 없다(quality-bar EXC-06 · EXC-12 P1) | UI 기획 · 백엔드 명세 |
| 3 | **검증 실패 시 첫 오류 필드로 포커스가 가지 않는다** — `handleSubmit(onValid)`(`:334`)에 `onInvalid` 가 없다. `useCrudForm` 의 `onInvalid`/`setFocus` 경로(`shared/crud/useCrudForm.ts:254,268`)를 상속하지 못했다(quality-bar A11Y-13 P1) | UI 기획 쪽 변경 요청 |
| 4 | 저장에 **멱등키가 없다** — 동기 잠금(EL-022.1)은 연타를 막지만, 응답 유실 후 재시도는 새 요청이 된다. `expectedRevision` 덕에 **중복 적용이 아니라 409** 가 되므로 데이터는 안전하나, 사용자는 영문 모를 충돌 다이얼로그를 본다. 앱에 선례가 **둘** 있다(`pages/members/components/PointsCard.tsx:103,162-173` · **같은 섹션의** `pages/settings/api-keys/ApiKeysPage.tsx:150,185-186`)(quality-bar EXC-08 P0) | UI 기획 · 백엔드 명세 (BE-067 §7.4) |
| 5 | **저장 실패 배너가 충돌 다이얼로그와 중복 표시된다** — `serverError={saveError !== null && pending === null ? … }`(`SiteSettingsPage.tsx:331`)가 `conflict === null` 을 검사하지 않는다. **형제 화면 OAuth 는 검사한다**(`oauth/OAuthPage.tsx:277` `saveError !== null && pending === null && conflict === null`) — 이 화면만 빠졌다. 덮어쓰기가 실패하면 같은 문구가 다이얼로그와 그 뒤 카드에 동시에 뜬다. ※ 원래 이 항목은 언어 화면도 대조군으로 들었으나 **언어 관리 기능이 삭제돼 그 갈래는 폐기**했다 | UI 기획 쪽 변경 요청 |
| 6 | **이 화면이 저장하는 값의 집행 주체가 전부 이 앱 밖이다** — 공개 범위·복사 방지·모바일 확대 허용·로그인 상태 유지는 저장될 뿐 방문자 사이트가 읽어야 효력이 생긴다. 화면은 그 사실을 **알리지 않는다**(모바일 확대만 힌트가 '동작하지 않을 수 있습니다'로 에둘러 말한다 — EL-039). 저장은 됐는데 사이트가 안 닫히면 이 화면은 거짓말이 된다. **소비자 계약이 없다**(BE-067 §7.6 #6) | UI 기획 쪽 변경 요청 · 아키텍처 (도메인 경계) |
| 7 | 데이터 도착 시 `reset(data.value)` 하는 효과(EL-026 · `:160-163`)가 **편집 중 재조회에서도 돈다** — 저장 후 재조회는 정상이나, 그 밖의 재조회(수동 refetch·캐시 무효화)가 오면 입력이 덮인다. **업로드해 둔 자산 값도 함께 사라진다** | UI 기획 쪽 변경 요청 |
| 8 | 스켈레톤 행 수가 하드코딩 `[0, 1, 2, 3]`(`SettingsFormShell.tsx:154`) — 실제 컨트롤 11개·섹션 4개와 무관하다. 재작성으로 **화면이 훨씬 길어져 괴리가 커졌다**(quality-bar COMP-06 P2) | UI 기획 쪽 변경 요청 |
| 9 | 이탈·취소 시 abort 는 **클라이언트만 결과를 버릴 뿐** 서버 도달 여부를 보장하지 않는다 — 이미 반영된 저장이 화면에 안 보일 수 있다 | 백엔드 명세 (BE-067) |
| 10 | 읽기 전용 역할에게 저장 **버튼**은 없지만 `<form onSubmit>` 은 남아 있다 — 텍스트 입력에서 Enter 를 누르면 제출이 발화한다. 필드가 전부 `disabled` 라 실현되지 않으나(`disabled` 입력은 Enter 제출을 만들지 않는다) **방어가 구조가 아니라 우연**이다 | UI 기획 쪽 변경 요청 |
| 11 | 프론트 타임아웃 상한 없음(`AbortSignal.timeout` 0건) · 오프라인 감지 없음(`navigator.onLine` 0건) · 세션 만료 리다이렉트가 미저장 입력을 버린다(가드 미발화)(quality-bar EXC-05 · EXC-11 · EXC-19 P1) | UI 기획 · 프론트 구현 |
| 12 | **해소됨(기록 보존)** — 이전 판(v1.0)은 `SiteSettingsPage.tsx:15` 주석이 권한 게이트를 **존재하지 않는 `_shared/access.tsx`** 로 지목한다고 기록했다. **재작성된 헤더 주석(`:1-22`)에는 그 문장이 없다** — 권한은 `[권한]` 한 줄(`:20`)로만 언급되고 파일 경로를 대지 않는다. 실제 게이트는 여전히 `shared/permissions/RequirePermission`(`:38`)이다. **결함이 코드 변경으로 사라졌으므로 삭제하지 않고 이력으로 남긴다** | — (종결) |
| 13 | **메일·SMS 전용 이름 입력에 `maxLength` 가 없다**(EL-030) — 이는 **의도된 설계**다(바이트 상한을 `maxLength` 로 표현할 수 없다 — `CountedInput.tsx:48-52`). 다만 결과적으로 이 화면에서 **초과 입력이 입력 시점에 막히지 않는 유일한 필드**이고, 사용자는 제출해야 거절을 안다. 카운터가 넘어가는 것을 경고로 강조할지 미정 | UI 기획 쪽 변경 요청 |
| 14 | **⚠ 충돌 다이얼로그가 이미지 3필드를 거짓으로 '달라졌다'고 보고한다** — `divergedLabels` 의 비교기 `sameValue`(`_shared/diff.ts:13-20`)는 **배열만** 내용 비교하고 나머지는 `Object.is` 다. 그런데 `favicon`·`ogImage`·`privateImage` 는 **객체**(`validation.ts:87-93`)이고, RHF `reset` 이 값을 깊은 복사하므로 `getValues()` 의 객체는 `conflict.value` 의 객체와 **결코 참조가 같지 않다**. 결과: 두 관리자가 사이트 이름만 고쳐도 목록에 **파비콘·대표 이미지·비공개용 이미지 3건이 함께 뜬다**(자산이 `null` 인 자리만 우연히 맞는다). 세 줄의 거짓말이 운영자를 '다시 불러오기'로 밀어 **바꾸지 않은 것 때문에 바꾼 것을 잃게** 만든다. `diff.ts:22-27` 이 스스로 한계를 밝힌다: '평면 객체만 다룬다 … 중첩이 생기면 그 화면이 자기 비교기를 갖는 편이 낫다' — **이 화면의 문서는 이미 평면이 아니다.** 객체 필드를 덮는 테스트가 0건이다 | **UI 기획 쪽 변경 요청 (최우선)** |
| 15 | **`byteLengthOf` 는 EUC-KR 인코더가 아닌데 화면과 스키마가 'EUC-KR' 이라고 말한다** — 구현은 '코드포인트 > 0x7F 면 2byte'(`marketing/_shared/messaging.ts:282-289`)이고, 주석은 `validation.ts:159` 과 `SiteSettingsPage.tsx:397` 두 곳에서 EUC-KR 을 단언한다. ASCII·한글에는 정확하지만 **이모지(실제 4byte)·라틴1·전각 기호에서 어긋난다.** 서버가 진짜 인코더로 재검증하면 **프론트가 통과시킨 이름을 서버가 거절**한다(BE-067 §7.6 #10) | UI 기획 · 백엔드 명세 |
| 16 | **업로드가 돌려주는 `url` 이 세션과 함께 죽는다** — `uploadSiteAsset` 이 `URL.createObjectURL(file)` 핸들을 반환하고(`data-source.ts:98-103`) `useAssetUpload` 는 그것을 **회수하지 않는다**(해상도 측정용 임시 핸들만 회수한다 — `useAssetUpload.ts:33,38`). **픽스처 한정 누수이며 제품 결함이 아니다** — 코드가 그 사실을 스스로 적어 뒀다(`data-source.ts:94-96` '가짜 성공을 지어내지 않는 대신 이 사실을 여기 적어 둔다. 호출부는 revoke 책임을 함께 진다'). 백엔드가 붙으면 `url` 이 실제 자산 주소가 되어 사라지는 문제다. **다만 그때까지 호출부의 revoke 책임은 이행되지 않은 상태다** | 프론트 구현 (백엔드 연결 시 자연 소멸) |
| 17 | **이 화면이 의존하는 공유 모듈에 소비자 0건인 코드가 남았다** — ① `_shared/fields.tsx` 의 `TextInputField`(`:44-`) — 이 화면이 주 소비자였으나 `CountedInput` 으로 갈아탔고, **앱 전체 import 0건**(grep 히트는 정의 자신과 `CountedInput.tsx:3` 의 '왜 안 쓰는가' 주석뿐) ② `_shared/validation.ts` 의 `requiredEmail`(`:37-42`)·`requiredPhone`(`:47-52`)·`normalizePhone`(`:58-74`) — 대표 이메일·전화번호 필드가 사라지며 **import 0건**. 죽은 코드는 다음 사람에게 '이 관례를 따르라'고 잘못 말한다 | 프론트 구현 (정리) |
| 18 | **이 라우트의 e2e 커버리지가 0이다** — `e2e/` 에 있는 스펙은 dashboard · login · quality-bar · users · support · throwaway 뿐이다. 이 화면은 **업로드·미리보기·조건부 잠금·확인/충돌 2단 다이얼로그**를 한 화면에 얹고 있어 단위 테스트(`site.test.ts` 25건 — 전부 순수 검증 규칙)로는 조립을 검증할 수 없다 | 프론트 구현 · 명세 리뷰 |
| 19 | **nav 라벨('사이트 설정')과 카드 제목('기본 설정')이 다르다** — AppHeader `<h1>` 은 '사이트 설정'(`nav-config.ts:214`), 카드는 '기본 설정'(`SiteSettingsPage.tsx:314`), 안내 문구·토스트·이탈 가드·확인 다이얼로그도 전부 '기본 설정'이다. 한 화면이 자기를 두 이름으로 부른다 — 의도인지(‘시스템 설정 > 사이트 설정’ 아래 ‘기본 설정’ 카드) 잔재인지 미확인 | UI 기획 쪽 확인 요청 |
| 20 | **필수 필드가 필수라고 표시되지 않는다** — 사이트 이름은 스키마상 필수인데(`validation.ts:118-121`) 화면에 `required` 표기도 `aria-required` 도 **0건**이다(`grep -rn "required" pages/settings/site` 히트는 zod 헬퍼 이름뿐). 이전 판은 `FormField` 가 `aria-required` 를 주입했으나 `SettingRow`+`CountedInput` 조합에는 그 경로가 없다. 사용자는 비운 채 저장을 눌러야 필수임을 안다 | UI 기획 쪽 변경 요청 (A11Y) |
| 21 | **문서 heading 이 h1 → h3 로 건너뛴다** — AppHeader 가 `<h1>`(`AppHeader.tsx:101`), 섹션 제목이 `<h3>`(`components/SettingLayout.tsx:62`)이고 그 사이 `<h2>` 가 없다(카드 제목 `CardTitle` 은 heading 시맨틱이 아니다). 스크린리더의 heading 탐색에서 한 단계가 비어 보인다. 재작성으로 섹션 제목이 처음 생기며 나타난 사안이다 | UI 기획 쪽 변경 요청 (A11Y) · DS(`CardTitle` 시맨틱) |
