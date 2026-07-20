# 어드민 정보 구조 (IA)

이 문서는 **무엇이 어디에 있는가**를 정한다 — 섹션 계층, 라우트, URL 규약, 화면 유형.
**어떻게 생겨야 하는가**(제목 모델·목록 템플릿·폼 전달 방식·URL 상태)는 여기서 다시 쓰지 않는다.
그 규칙은 [specs/quality-bar.md](../../../specs/quality-bar.md) 의 `IA-01 ~ IA-14` 가 단일 원천이다.

| | |
|---|---|
| 라우트 단일 원천 | [App.tsx](../../../apps/admin/src/App.tsx) `APP_ROUTES` |
| 사이드바 단일 원천 | [nav-config.ts](../../../apps/admin/src/shared/layout/nav-config.ts) |
| 권한 해석 | [shared/permissions/route-resource.ts](../../../apps/admin/src/shared/permissions/route-resource.ts) |
| 플로우 차트 | [docs/flow/](../../flow/admin-flowchart.md) |

---

## 1. 계층 — 2단 고정

```
AppShell
└── 섹션 (13)          사이드바 그룹. 자체 화면이 없다 — 펼침/접힘만 한다.
    └── 메뉴 (62)      사이드바 리프. 라우트를 갖는다. = 권한 단위.
        └── 하위 라우트  상세 /:id · 등록 /new · 수정 /:id/edit. 사이드바에 없다.
```

**3단 섹션은 만들지 않는다.** 사이드바가 세 번 접히면 운영자가 메뉴를 눈이 아니라 기억으로 찾게 된다.
분류가 더 필요하면 섹션을 늘리지 말고 그 메뉴 안의 탭이나 필터로 내린다.

**하위 라우트는 사이드바에 올리지 않는다.** 사이드바 리프 = 권한 단위 = `IMPLEMENTED` 집합의 원소다.
상세·폼을 리프로 만들면 권한이 세 벌로 갈라진다. 대신 `findCoveringLeaf` 가 하위 라우트를 자기 잎으로
되돌려, 상세와 목록이 **같은 권한 한 벌**로 덮인다.

---

## 2. URL 규약

### 2.1 경로

| 목적 | 형태 | 예 |
|---|---|---|
| 목록 | `/{섹션}/{메뉴}` | `/content/notices` |
| 상세 | `/{섹션}/{메뉴}/:id` | `/content/notices/42` |
| 등록 | `/{섹션}/{메뉴}/new` | `/content/notices/new` |
| 수정 | `/{섹션}/{메뉴}/:id/edit` | `/content/notices/42/edit` |

- 등록과 수정은 **한 컴포넌트**가 `:id` 유무로 겸한다 (IA-05). create 전용 화면을 따로 만들지 않는다.
- `new` 는 선언에서 `:id` **위에** 둔다. react-router 는 정적 세그먼트를 먼저 고르므로 순서와 무관하게
  동작하지만, 읽는 사람에게는 순서가 곧 규칙으로 보인다. 아래에 두면 누군가 고치려 든다.
- 예외 하나: 상품은 섹션이 곧 메뉴다 — `/products` (not `/products/items`). 사이드바 라벨도 '상품'이다.

### 2.2 쿼리스트링 — 화면 상태의 단일 원천 (IA-13, P0)

**라우트는 "무엇을 보는가"이고 쿼리스트링은 "어떻게 보는가"다.** 조회 조건을 컴포넌트 `useState` 에 두면
상세를 열었다 Back 했을 때 필터가 사라진다. 그래서 아래는 전부 URL 에 실린다.

| 화면군 | URL 파라미터 | 소유 |
|---|---|---|
| 목록 전반 | `page` · `size` · `q` · `sort` · 화면별 필터 | `shared/crud/useListState` |
| 통계 6종 | `preset` · `start` · `end` · `compare` · `segment` · `view` · `metric` · `sort` · `page` | `pages/stats/_shared/useStatsParams` |
| 로그 4종 | 기간 · 종류 · 검색어 | `pages/logs/list-state.ts` |
| AI 대화 | `?c=<대화id>` | 대화는 **라우트가 아니다** — 같은 화면의 상태다 |

기본값과 같은 값은 URL 에서 지운다 — 공유 링크가 짧아야 실제로 공유된다.

### 2.3 옛 경로

`/marketing/message-templates` 와 그 하위는 `/marketing/templates` 로 `Navigate replace` 한다.
저장해 둔 북마크가 404 를 만나지 않게 한동안 유지한다.

---

## 3. 화면 유형 — 6종

모든 메뉴가 목록+상세+폼인 것은 아니다. **유형이 라우트 모양을 결정한다.**

| 유형 | 라우트 | 쓰기 | 해당 메뉴 |
|---|---|---|---|
| **A. 표준 CRUD** | 목록 + `:id` + `new` + `:id/edit` | 폼 페이지 | 공지·FAQ·약관·개인정보·상품·거래처·계약·견적·프로젝트·이벤트·프로모션·자료실·성공사례 등 |
| **B. 목록 + 폼** | 목록 + `new` + `:id/edit` (상세 없음) | 폼 페이지 | 팝업·배너·연혁·인증서·ESG·포트폴리오·쿠폰·문의답변·SMS·이메일·뉴스레터 |
| **C. 단일 문서** | 목록 개념 없음 — 한 화면 | 그 화면에서 편집·저장 | 회사정보·CEO인사말·오시는길·배송정책·적립금정책·사이트설정·고객설정 |
| **D. taxonomy** | 목록 1개 | **모달** (IA-06) | 상품/포트폴리오/문의 카테고리 · 권한 역할 · FAQ 카테고리 |
| **E. 처리 워크플로** | 목록 + `:id` (폼 없음) | 상세에서 **인라인** 상태 전이 | 1:1문의·영업문의·상담이력·리뷰·교환반품 |
| **F. 조회 전용** | 목록만 | **쓰기 라우트가 존재하지 않는다** | 통계 6종 · 로그 4종 · 로그인 이력 |

**유형 D 와 A 를 섞지 않는다** (IA-06). 짧은 taxonomy 를 폼 페이지로 열면 이름 한 줄 고치려고 화면을
떠나야 하고, 반대로 무거운 엔티티를 모달에 넣으면 필드가 스크롤 안에 갇힌다.

**유형 F 에는 쓰기 경로를 추가하지 않는다.** 감사 기록은 불변이다 — 이건 화면 편의의 문제가 아니라
로그의 존재 이유다. 로그 상세도 라우트가 아니라 목록 위 다이얼로그(`LogPayloadDialog`)다.

---

## 4. 사이트맵

`유형` 열은 3장의 A~F. `하위` 열은 목록 외에 존재하는 라우트.

### 대시보드
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 대시보드 | `/dashboard` | — | 루트 `/` 의 리다이렉트 대상 |

### 회원 관리
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 회원 관리 | `/users/members` | E | `:id` |
| 고객 설정 | `/users/settings` | C | — |
| 관리자 관리 | `/users/admins` | A | `:id` · `new` · `:id/edit` |
| 권한 관리 | `/users/roles` | D | — |
| 로그인 이력 | `/users/login-history` | F | — |

### 콘텐츠 관리
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 공지사항 | `/content/notices` | A | `:id` · `new` · `:id/edit` |
| FAQ | `/content/faq` | A | `:id` · `new` · `:id/edit` |
| 팝업 관리 | `/content/popups` | B | `new` · `:id/edit` |
| 배너 관리 | `/content/banners` | B | `new` · `:id/edit` |
| 약관 관리 | `/content/terms` | A | `:id` · `new` · `:id/edit` |
| 개인정보 처리방침 | `/content/privacy` | A | `:id` · `new` · `:id/edit` |

### 기업 정보
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 회사 정보 | `/company/profile` | C | — |
| CEO 인사말 | `/company/ceo-message` | C | — |
| 연혁 | `/company/history` | B | `new` · `:id/edit` |
| 오시는 길 | `/company/directions` | C | — |
| 인증서/특허 | `/company/certificates` | B | `new` · `:id/edit` |
| 파트너사 | `/company/partners` | B | 로고형 · 드래그 정렬 |
| 고객사 | `/company/clients` | B | 로고형 · 드래그 정렬 |
| ESG | `/company/esg` | B | `new` · `:id/edit` |

### 포트폴리오
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 포트폴리오 | `/portfolio/items` | B | `new` · `:id/edit` |
| 카테고리 | `/portfolio/categories` | D | — |
| 성공 사례 | `/portfolio/case-studies` | B | `new` · `:id/edit` |

### 상품 관리
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 상품 | `/products` | B | `new` · `:id/edit` |
| 카테고리 | `/products/categories` | D | — |
| 배송 | `/products/shipping` | C | — |
| 교환/반품 | `/products/returns` | E | `:id` |
| 쿠폰 | `/products/coupons` | B | `new` · `:id/edit` |
| 적립금 | `/products/points` | C | — |
| 리뷰 | `/products/reviews` | E | `:id` |

### 영업 관리
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 거래처 | `/sales/accounts` | B | `new` · `:id/edit` |
| 계약 | `/sales/contracts` | B | `new` · `:id/edit` |
| 견적 | `/sales/quotes` | B | `new` · `:id/edit` |
| 문의 | `/sales/inquiries` | E | `:id` |
| 프로젝트 | `/sales/projects` | B | `new` · `:id/edit` |
| 상담 이력 | `/sales/consultations` | F | `:id` (읽기 전용) |

### 고객센터
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 1:1 문의 | `/support/tickets` | E | `:id` |
| 문의 유형 | `/support/categories` | D | — |
| 문의 답변 | `/support/replies` | B | `new` · `:id/edit` |
| 자주 묻는 질문 | `/support/faq` | D | 큐레이션 |
| 자료실 | `/support/downloads` | B | `new` · `:id/edit` |

### 마케팅
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 이벤트 | `/marketing/events` | B | `new` · `:id/edit` |
| 프로모션 | `/marketing/promotions` | B | `new` · `:id/edit` |
| 뉴스레터 | `/marketing/newsletters` | B | `new` · `:id/edit` |
| SMS 발송 | `/marketing/sms` | B | `new` · `:id/edit` |
| 이메일 발송 | `/marketing/email` | B | `new` · `:id/edit` |
| 발송 템플릿 | `/marketing/templates` | A | `:id` · `new?kind=text\|email` · `:id/edit` |
| _(사이드바 밖)_ 알림톡 | `/marketing/templates/alimtalk` | B | `new` · `:id/edit` |

발송 템플릿의 등록은 종류를 **쿼리(`?kind=`)로** 받는다. 라우트를 종류별로 가르면 수정 경로도 갈라야 한다.
알림톡은 심사 주체가 우리가 아니라 카카오다 — 생명주기가 달라 사이드바에 올리지 않고 경로만 남겼다.

### AI 에이전트
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 새 채팅 | `/ai/chat` | — | 대화는 `?c=` 쿼리 |
| 대화 목록 | `/ai/conversations` | — | — |

### 통계
| 메뉴 | 경로 | 유형 |
|---|---|---|
| 방문자 통계 | `/stats/visitors` | F |
| 회원 통계 | `/stats/members` | F |
| 매출 통계 | `/stats/revenue` | F |
| 주문 통계 | `/stats/orders` | F |
| 유입 분석 | `/stats/traffic` | F |
| 검색어 분석 | `/stats/keywords` | F |

### 로그 관리
| 메뉴 | 경로 | 유형 |
|---|---|---|
| 관리자 로그 | `/logs/admin` | F |
| 회원 활동 로그 | `/logs/member-activity` | F |
| API 로그 | `/logs/api` | F |
| 오류 로그 | `/logs/errors` | F |

### 시스템 설정
| 메뉴 | 경로 | 유형 | 하위 |
|---|---|---|---|
| 사이트 설정 | `/settings/site` | C | — |
| API Key 설정 | `/settings/api-keys` | B | `:providerId` (AI 연동 상세) |
| OAuth 설정 | `/settings/oauth` | B | `:provider` (제공자 상세) |

---

## 5. 라벨 · 제목 · 권한이 갈라지지 않게 하는 법

세 가지가 같은 질문("이 경로는 어느 메뉴인가")에 답하는데, 규칙이 두 벌이면 언젠가 갈라진다.
실제로 갈라졌었다 — 권한은 `/company/history` 로 옳게 풀면서 제목은 '기업 관리' 라고 말했다 (IA-02).

**그래서 잎 판정은 잎을 아는 모듈(nav-config)이 혼자 갖는다.**

```
경로  →  findCoveringLeaf  →  잎 경로  ┬→  findNavLabel  →  화면 제목 (AppHeader)
                                      └→  RequirePermission → 403 게이팅
```

화면은 자기 제목을 그리지 않는다 (IA-02). 130여 화면이 각자 `<h1>` 을 두면 사이드바 라벨과 제목이
서로 다른 날이 온다.

---

## 6. 미구현 메뉴

사이드바에 있는데 화면이 없는 경로는 `PlaceholderPage` 로 라우팅한다 — 죽은 링크를 만들지 않는다.
그 집합은 `APP_ROUTES` 의 `implemented: true` 플래그에서 **파생**한다. 목록을 따로 유지하지 않는다.

```
IMPLEMENTED = APP_ROUTES.filter(r => r.implemented).map(r => r.path)
pendingRoutes = collectNavRoutes().filter(leaf => !IMPLEMENTED.has(leaf.to))
```

화면을 완성하면 `implemented: true` 한 줄을 붙인다. 그러면 자리표시가 저절로 사라진다.

---

## 7. 메뉴를 추가할 때

1. `nav-config.ts` 의 섹션에 `['라벨', '/경로']` 를 넣는다 — 사이드바·제목·권한이 여기서 나온다
2. 3장에서 **유형 A~F 를 고른다** — 이게 만들 라우트를 결정한다
3. `APP_ROUTES` 에 목록 라우트(`implemented: true`)와 하위 라우트를 넣는다. `new` 를 `:id` 위에
4. 조회 조건은 `useListState` 로 URL 에 싣는다 (IA-13)
5. [docs/flow/mmd/menus/](../../flow/mmd/menus/) 에 그 메뉴의 플로우 차트를 추가하고,
   [09-ia-sitemap.mmd](../../flow/mmd/09-ia-sitemap.mmd) 와 이 문서 4장의 표에 한 줄을 더한다
