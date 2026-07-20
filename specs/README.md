# 화면 명세 색인

이 폴더는 관리자(admin) 앱의 **화면 단위 명세**를 담는다. 화면 하나가 폴더 하나이고,
그 안에 최대 세 종류의 문서가 있다. 처음 오는 사람은 이 문서에서 시작해
**화면 이름 → 라우트 → 명세 문서 → 구현 경로** 순으로 따라가면 된다.

기준일: 2026-07-18 · 대상 앱: `apps/admin`

## 1. 문서 세 종류

| 종류 | 무엇을 적는가 | 표준 구성 |
|---|---|---|
| **FS** (기능 명세) | 화면·영역·요소·상태·예외. '무엇이 보이고 무엇이 일어나는가' | §1 화면 개요 / §1.1 이 화면에 없는 기능 / §2 영역 구성(`FS-nnn-SEC-nn`) / §3 요소 명세(`FS-nnn-EL-nnn`) / §4 예외 명세 / §5 서버 연동 지점 / §6 자기 점검 / §7 미결 사항 |
| **BE** (백엔드 기능 명세) | 엔드포인트 계약. 요청·응답·에러·권한·멱등성 | §1 범위 / §2 에러 봉투 / §3 권한·CSRF·타임아웃 / §4 엔드포인트(`BE-nnn-EP-nn`) / §5 호출부↔엔드포인트 대조 / §7 판정 |
| **NFR** (비기능 명세) | `quality-bar.md` 의 축을 이 화면에 대고 pass/gap 을 판정한 결과 | 7축 예외 표 + P0 판정 표 + 잔여 gap 목록 |

**핵심 규칙 — 명세는 코드를 따라간다.** 모든 행동 주장은 `파일:줄` 로 근거를 댄다.
구현되지 않은 것은 '없다' 고 적고 이관 대상으로 표시한다. 바람은 적지 않는다.

## 2. 번호 체계

번호는 화면마다 하나씩 고정이며 FS·BE·NFR 이 같은 번호를 공유한다(`FS-036` ↔ `BE-036` ↔ `NFR-036`).
번호는 **재사용하지 않는다** — 화면이 사라지면 그 번호는 결번으로 남는다.

| 번호대 | 영역 |
|---|---|
| 001–002 | 로그인 · 대시보드 |
| 003–008 | 사용자 관리 |
| 009–014 | 콘텐츠 관리 |
| 015–022 | 기업 관리 |
| 023–025 | 포트폴리오 관리 |
| 026–030 | 고객센터 |
| 031–036 | 마케팅 관리 |
| 041–047 | 상품 관리 |
| 048–053 | 영업 관리 |
| 054–059 | 통계 |
| 060–063 | 로그 관리 |
| 067–070 | 시스템 설정 |

**결번**

| 번호 | 사유 |
|---|---|
| 037 · 038 · 039 · 040 | **예약/신청 관리 삭제**(2026-07-18). 예약·신청·상담·일정 네 화면을 코드(`pages/reservations/**`)와 명세(`specs/reservations/**`)에서 함께 걷어냈다 |
| 064 · 065 · 066 | 미할당 — 이 번호로 확정된 화면이 없다 |
| 068 | **언어 관리 삭제**(2026-07-18). `pages/settings/languages/**` 와 `specs/settings/languages/**` 를 함께 걷어냈다 |

## 3. 화면 색인

라우트는 `apps/admin/src/App.tsx` 의 `APP_ROUTES` 와 사이드바 정의 `shared/layout/nav-config.ts` 를 대조해 확인했다.
아래 표에 실린 화면은 **모두 구현돼 있다**(`implemented: true`). 목록 하위의 등록·수정·상세 라우트는 각 FS 문서가 기술한다.

### 로그인

| 화면 | 라우트 | 명세 |
|---|---|---|
| 로그인 | `/login` | [FS-001](login/FS-001-login.md) · [BE-001](login/BE-001-login.md) · NFR-001 **없음** |

### 대시보드

| 화면 | 라우트 | 명세 |
|---|---|---|
| 대시보드 | `/dashboard` | [FS-002](dashboard/FS-002-dashboard.md) · [BE-002](dashboard/BE-002-dashboard.md) · NFR-002 **없음** |

### 사용자 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 회원 관리 목록 | `/users/members` | [FS-003](users/members/FS-003-members.md) · [BE-003](users/members/BE-003-members.md) · NFR-003 **없음** |
| 회원 상세 | `/users/members/:id` | [FS-004](users/members/detail/FS-004-member-detail.md) · [BE-004](users/members/detail/BE-004-member-detail.md) · NFR-004 **없음** |
| 관리자(운영진) 관리 목록 | `/users/admins` | [FS-005](users/admins/FS-005-admins.md) · [BE-005](users/admins/BE-005-admins.md) · NFR-005 **없음** |
| 권한 관리 (역할 · 권한 매트릭스) | `/users/roles` | [FS-006](users/roles/FS-006-permissions.md) · [BE-006](users/roles/BE-006-permissions.md) · NFR-006 **없음** |
| 고객 설정 (회원 등급 정책) | `/users/settings` | [FS-007](users/settings/FS-007-customer-settings.md) · [BE-007](users/settings/BE-007-customer-settings.md) · NFR-007 **없음** |
| 로그인 이력 (읽기 전용 감사 로그) | `/users/login-history` | [FS-008](users/login-history/FS-008-login-history.md) · [BE-008](users/login-history/BE-008-login-history.md) · NFR-008 **없음** |

### 콘텐츠 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 공지사항 관리 (목록·상세·등록/수정) | `/content/notices` | [FS-009](content/notices/FS-009-notices.md) · [BE-009](content/notices/BE-009-notices.md) · NFR-009 **없음** |
| FAQ 관리 (목록·카테고리 모달·상세·등록/수정) | `/content/faq` | [FS-010](content/faq/FS-010-faq.md) · [BE-010](content/faq/BE-010-faq.md) · NFR-010 **없음** |
| 팝업 관리 (목록·등록/수정) | `/content/popups` | [FS-011](content/popups/FS-011-popups.md) · [BE-011](content/popups/BE-011-popups.md) · NFR-011 **없음** |
| 배너 관리 (목록·등록/수정) | `/content/banners` | [FS-012](content/banners/FS-012-banners.md) · [BE-012](content/banners/BE-012-banners.md) · NFR-012 **없음** |
| 약관 관리 (버전 이력·상세·새 버전) | `/content/terms` | [FS-013](content/terms/FS-013-terms.md) · [BE-013](content/terms/BE-013-terms.md) · NFR-013 **없음** |
| 개인정보 처리방침 관리 (버전 이력·상세·새 버전) | `/content/privacy` | [FS-014](content/privacy/FS-014-privacy.md) · [BE-014](content/privacy/BE-014-privacy.md) · NFR-014 **없음** |

### 기업 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 회사 정보 (단일 문서 편집 폼) | `/company/profile` | [FS-015](company/profile/FS-015-company-profile.md) · [BE-015](company/profile/BE-015-company-profile.md) · [NFR-015](company/profile/NFR-015-company-profile.md) |
| CEO 인사말 (단일 문서 편집 폼) | `/company/ceo-message` | [FS-016](company/ceo-message/FS-016-ceo-message.md) · [BE-016](company/ceo-message/BE-016-ceo-message.md) · [NFR-016](company/ceo-message/NFR-016-ceo-message.md) |
| 연혁 관리 (목록·등록/수정) | `/company/history` | [FS-017](company/history/FS-017-history.md) · [BE-017](company/history/BE-017-history.md) · [NFR-017](company/history/NFR-017-history.md) |
| 오시는 길 (단일 문서 편집) | `/company/directions` | [FS-018](company/directions/FS-018-directions.md) · [BE-018](company/directions/BE-018-directions.md) · [NFR-018](company/directions/NFR-018-directions.md) |
| 인증서/특허 관리 (목록·구분 필터·등록/수정) | `/company/certificates` | [FS-019](company/certificates/FS-019-certificates.md) · [BE-019](company/certificates/BE-019-certificates.md) · [NFR-019](company/certificates/NFR-019-certificates.md) |
| 파트너사 관리 (목록·등록/수정 모달·삭제) | `/company/partners` | [FS-020](company/partners/FS-020-partners.md) · [BE-020](company/partners/BE-020-partners.md) · [NFR-020](company/partners/NFR-020-partners.md) |
| 고객사 관리 (목록·등록/수정 모달·삭제) | `/company/clients` | [FS-021](company/clients/FS-021-clients.md) · [BE-021](company/clients/BE-021-clients.md) · [NFR-021](company/clients/NFR-021-clients.md) |
| ESG 활동 관리 (목록·분류 필터·등록/수정) | `/company/esg` | [FS-022](company/esg/FS-022-esg.md) · [BE-022](company/esg/BE-022-esg.md) · [NFR-022](company/esg/NFR-022-esg.md) |

### 포트폴리오 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 포트폴리오 (목록·등록/수정) | `/portfolio/items` | [FS-023](portfolio/items/FS-023-portfolio.md) · [BE-023](portfolio/items/BE-023-portfolio.md) · [NFR-023](portfolio/items/NFR-023-portfolio.md) |
| 포트폴리오 카테고리 관리 (목록·등록/수정 모달·삭제) | `/portfolio/categories` | [FS-024](portfolio/categories/FS-024-portfolio-categories.md) · [BE-024](portfolio/categories/BE-024-portfolio-categories.md) · [NFR-024](portfolio/categories/NFR-024-portfolio-categories.md) |
| 성공 사례 (목록·등록/수정) | `/portfolio/case-studies` | [FS-025](portfolio/case-studies/FS-025-case-studies.md) · [BE-025](portfolio/case-studies/BE-025-case-studies.md) · [NFR-025](portfolio/case-studies/NFR-025-case-studies.md) |

### 상품 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 상품 (목록·등록·수정) | `/products` | [FS-041](products/items/FS-041-products.md) · [BE-041](products/items/BE-041-products.md) · [NFR-041](products/items/NFR-041-products.md) |
| 상품 카테고리 (목록·모달 등록/수정) | `/products/categories` | [FS-042](products/categories/FS-042-product-categories.md) · [BE-042](products/categories/BE-042-product-categories.md) · [NFR-042](products/categories/NFR-042-product-categories.md) |
| 배송 정책 (단일 문서 설정) | `/products/shipping` | [FS-043](products/shipping/FS-043-shipping.md) · [BE-043](products/shipping/BE-043-shipping.md) · [NFR-043](products/shipping/NFR-043-shipping.md) |
| 교환/반품 (목록·상세 처리) | `/products/returns` | [FS-044](products/returns/FS-044-returns.md) · [BE-044](products/returns/BE-044-returns.md) · [NFR-044](products/returns/NFR-044-returns.md) |
| 쿠폰 (목록·등록·수정) | `/products/coupons` | [FS-045](products/coupons/FS-045-coupons.md) · [BE-045](products/coupons/BE-045-coupons.md) · [NFR-045](products/coupons/NFR-045-coupons.md) |
| 적립금 정책 (단일 문서 설정) | `/products/points` | [FS-046](products/points/FS-046-points.md) · [BE-046](products/points/BE-046-points.md) · [NFR-046](products/points/NFR-046-points.md) |
| 리뷰 (목록·상세 노출/답변) | `/products/reviews` | [FS-047](products/reviews/FS-047-reviews.md) · [BE-047](products/reviews/BE-047-reviews.md) · [NFR-047](products/reviews/NFR-047-reviews.md) |

### 영업 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 거래처 (목록·등록·수정) | `/sales/accounts` | [FS-048](sales/accounts/FS-048-accounts.md) · [BE-048](sales/accounts/BE-048-accounts.md) · [NFR-048](sales/accounts/NFR-048-accounts.md) |
| 계약 (목록·등록·수정) | `/sales/contracts` | [FS-049](sales/contracts/FS-049-contracts.md) · [BE-049](sales/contracts/BE-049-contracts.md) · [NFR-049](sales/contracts/NFR-049-contracts.md) |
| 견적 (목록·등록·수정) | `/sales/quotes` | [FS-050](sales/quotes/FS-050-quotes.md) · [BE-050](sales/quotes/BE-050-quotes.md) · [NFR-050](sales/quotes/NFR-050-quotes.md) |
| 문의 (목록·상세 처리·견적 발행) | `/sales/inquiries` | [FS-051](sales/inquiries/FS-051-inquiries.md) · [BE-051](sales/inquiries/BE-051-inquiries.md) · [NFR-051](sales/inquiries/NFR-051-inquiries.md) |
| 프로젝트 (영업 기회 — 목록·등록/수정) | `/sales/projects` | [FS-052](sales/projects/FS-052-projects.md) · [BE-052](sales/projects/BE-052-projects.md) · [NFR-052](sales/projects/NFR-052-projects.md) |
| 상담 이력 (영업 — 목록·읽기 전용 상세) | `/sales/consultations` | [FS-053](sales/consultations/FS-053-sales-consultations.md) · [BE-053](sales/consultations/BE-053-sales-consultations.md) · [NFR-053](sales/consultations/NFR-053-sales-consultations.md) |

### 고객센터

| 화면 | 라우트 | 명세 |
|---|---|---|
| 1:1 문의 (목록·상세 처리) | `/support/tickets` | [FS-026](support/tickets/FS-026-tickets.md) · [BE-026](support/tickets/BE-026-tickets.md) · [NFR-026](support/tickets/NFR-026-tickets.md) |
| 문의 유형 관리 (목록·등록/수정 모달·삭제) | `/support/categories` | [FS-027](support/categories/FS-027-support-categories.md) · [BE-027](support/categories/BE-027-support-categories.md) · [NFR-027](support/categories/NFR-027-support-categories.md) |
| 문의 답변 — 답변 템플릿 관리 (목록·등록/수정) | `/support/replies` | [FS-028](support/replies/FS-028-replies.md) · [BE-028](support/replies/BE-028-replies.md) · [NFR-028](support/replies/NFR-028-replies.md) |
| 고객노출 FAQ 큐레이션 | `/support/faq` | [FS-029](support/faq/FS-029-customer-faq.md) · [BE-029](support/faq/BE-029-customer-faq.md) · [NFR-029](support/faq/NFR-029-customer-faq.md) |
| 자료실 (목록 · 등록/수정) | `/support/downloads` | [FS-030](support/downloads/FS-030-downloads.md) · [BE-030](support/downloads/BE-030-downloads.md) · [NFR-030](support/downloads/NFR-030-downloads.md) |

### 마케팅 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 이벤트 (목록 · 등록/수정) | `/marketing/events` | [FS-031](marketing/events/FS-031-events.md) · [BE-031](marketing/events/BE-031-events.md) · [NFR-031](marketing/events/NFR-031-events.md) |
| 프로모션 (목록 · 등록/수정) | `/marketing/promotions` | [FS-032](marketing/promotions/FS-032-promotions.md) · [BE-032](marketing/promotions/BE-032-promotions.md) · [NFR-032](marketing/promotions/NFR-032-promotions.md) |
| 뉴스레터 (발송회차 목록·등록/수정) | `/marketing/newsletters` | [FS-033](marketing/newsletters/FS-033-newsletters.md) · [BE-033](marketing/newsletters/BE-033-newsletters.md) · [NFR-033](marketing/newsletters/NFR-033-newsletters.md) |
| SMS 발송 (목록·등록/수정) | `/marketing/sms` | [FS-034](marketing/sms/FS-034-sms.md) · [BE-034](marketing/sms/BE-034-sms.md) · [NFR-034](marketing/sms/NFR-034-sms.md) |
| 이메일 발송 (목록·등록/수정) | `/marketing/email` | [FS-035](marketing/email/FS-035-email.md) · [BE-035](marketing/email/BE-035-email.md) · [NFR-035](marketing/email/NFR-035-email.md) |
| 메시지 템플릿 (목록·상세·편집기) | `/marketing/templates` | [FS-036](marketing/templates/FS-036-templates.md) · [BE-036](marketing/templates/BE-036-templates.md) · [NFR-036](marketing/templates/NFR-036-templates.md) |

### AI 에이전트

| 화면 | 라우트 | 명세 |
|---|---|---|
| 새 채팅 (멘션 조회 · 파싱 실패 안내 · 응답 모드) | `/ai/chat` | [FS-064](ai/chat/FS-064-ai-chat.md) · [BE-064](ai/chat/BE-064-ai-chat.md) · [NFR-064](ai/chat/NFR-064-ai-chat.md) |
| 대화 목록 (열기 · 삭제) | `/ai/conversations` | [FS-065](ai/conversations/FS-065-ai-conversations.md) · [BE-065](ai/conversations/BE-065-ai-conversations.md) · [NFR-065](ai/conversations/NFR-065-ai-conversations.md) |

> **언어 모델은 연결되어 있지 않다.** 답변은 결정적 파서(`pages/ai/_shared/parser.ts`)와 픽스처 조회로만 만들어지며,
> 알아듣지 못한 요청은 추측하지 않고 거절한다. 연동 자리는 `pages/ai/data-source.ts` 의 `askAgent` 머리말과
> BE-064 §7.1 에 명시돼 있다.

### 통계

| 화면 | 라우트 | 명세 |
|---|---|---|
| 방문자 통계 (기간 비교 · 유형 세그먼트 · 시간대/요일 드릴다운) | `/stats/visitors` | [FS-054](stats/visitors/FS-054-visitor-stats.md) · [BE-054](stats/visitors/BE-054-visitor-stats.md) · [NFR-054](stats/visitors/NFR-054-visitor-stats.md) |
| 회원 통계 (가입 경로 세그먼트 · 순증/누적 · 등급 구성) | `/stats/members` | [FS-055](stats/members/FS-055-member-stats.md) · [BE-055](stats/members/BE-055-member-stats.md) · [NFR-055](stats/members/NFR-055-member-stats.md) |
| 매출 통계 (결제·환불·순매출 · 결제수단 세그먼트 · 과세 구분) | `/stats/revenue` | [FS-056](stats/revenue/FS-056-revenue-stats.md) · [BE-056](stats/revenue/BE-056-revenue-stats.md) · [NFR-056](stats/revenue/NFR-056-revenue-stats.md) |
| 주문 통계 | `/stats/orders` | [FS-057](stats/orders/FS-057-order-stats.md) · [BE-057](stats/orders/BE-057-order-stats.md) · [NFR-057](stats/orders/NFR-057-order-stats.md) |
| 유입 분석 | `/stats/traffic` | [FS-058](stats/traffic/FS-058-traffic-stats.md) · [BE-058](stats/traffic/BE-058-traffic-stats.md) · [NFR-058](stats/traffic/NFR-058-traffic-stats.md) |
| 검색어 분석 | `/stats/keywords` | [FS-059](stats/keywords/FS-059-keyword-stats.md) · [BE-059](stats/keywords/BE-059-keyword-stats.md) · [NFR-059](stats/keywords/NFR-059-keyword-stats.md) |

### 로그 관리

| 화면 | 라우트 | 명세 |
|---|---|---|
| 관리자 로그 (읽기 전용 감사 로그) | `/logs/admin` | [FS-060](logs/admin/FS-060-admin-log.md) · [BE-060](logs/admin/BE-060-admin-log.md) · [NFR-060](logs/admin/NFR-060-admin-log.md) |
| 회원 활동 로그 (읽기 전용 감사 로그) | `/logs/member-activity` | [FS-061](logs/member-activity/FS-061-member-activity-log.md) · [BE-061](logs/member-activity/BE-061-member-activity-log.md) · [NFR-061](logs/member-activity/NFR-061-member-activity-log.md) |
| API 로그 (읽기 전용 감사 로그) | `/logs/api` | [FS-062](logs/api/FS-062-api-log.md) · [BE-062](logs/api/BE-062-api-log.md) · [NFR-062](logs/api/NFR-062-api-log.md) |
| 오류 로그 (읽기 전용 감사 로그) | `/logs/errors` | [FS-063](logs/errors/FS-063-error-log.md) · [BE-063](logs/errors/BE-063-error-log.md) · [NFR-063](logs/errors/NFR-063-error-log.md) |

### 시스템 설정

| 화면 | 라우트 | 명세 |
|---|---|---|
| 사이트 설정 | `/settings/site` | [FS-067](settings/site/FS-067-site-settings.md) · [BE-067](settings/site/BE-067-site-settings.md) · [NFR-067](settings/site/NFR-067-site-settings.md) |
| API Key 관리 | `/settings/api-keys` | [FS-069](settings/api-keys/FS-069-api-keys.md) · [BE-069](settings/api-keys/BE-069-api-keys.md) · [NFR-069](settings/api-keys/NFR-069-api-keys.md) |
| OAuth 설정 | `/settings/oauth` | [FS-070](settings/oauth/FS-070-oauth.md) · [BE-070](settings/oauth/BE-070-oauth.md) · [NFR-070](settings/oauth/NFR-070-oauth.md) |

## 4. 명세 공백 (이 색인의 본론)

색인의 값어치는 '무엇이 있는가' 보다 **'무엇이 없는가'** 에 있다. 아래 네 항목은 판정된 공백이다.

### 4.1 NFR 문서가 없는 화면 — 14개

`quality-bar.md` 판정을 아직 받지 않은 화면들이다. **001–014 번대 전체**가 여기 해당한다 —
NFR 문서는 015(회사 정보)부터 쓰이기 시작했고, 그 앞 번호대는 소급되지 않았다.

| 번호 | 화면 | 라우트 |
|---|---|---|
| 001 | 로그인 | `/login` |
| 002 | 대시보드 | `/dashboard` |
| 003 | 회원 관리 목록 | `/users/members` |
| 004 | 회원 상세 | `/users/members/:id` |
| 005 | 관리자(운영진) 관리 목록 | `/users/admins` |
| 006 | 권한 관리 | `/users/roles` |
| 007 | 고객 설정 | `/users/settings` |
| 008 | 로그인 이력 | `/users/login-history` |
| 009 | 공지사항 관리 | `/content/notices` |
| 010 | FAQ 관리 | `/content/faq` |
| 011 | 팝업 관리 | `/content/popups` |
| 012 | 배너 관리 | `/content/banners` |
| 013 | 약관 관리 | `/content/terms` |
| 014 | 개인정보 처리방침 관리 | `/content/privacy` |

이들 중 **003·005 는 이번 세션에 FS·BE 가 개정됐다**(v1.1) — NFR 만 여전히 없다.
`/users/roles`(006)는 권한 모델 자체를 다루는 화면이라 NFR 부재의 위험이 가장 크다:
다른 화면의 NFR 이 EXC-03(권한 게이팅) 판정을 내릴 때 근거로 삼는 화면인데 정작 자신은 판정을 받지 않았다.

### 4.2 코드는 있으나 살아 있는 명세가 없는 화면 — 1개

| 라우트 | 구현 | 상태 |
|---|---|---|
| `/marketing/templates/alimtalk` · `/alimtalk/new` · `/alimtalk/:id/edit` | `pages/marketing/templates/**` | **재구축 대기.** 사이드바에 없고(`nav-config.ts:179-181`) 어느 화면도 링크하지 않는다. 옛 FS/BE-036 이 기술하던 화면이지만, 036 번호는 새 화면이 가져갔다. 카카오 알림톡 심사 모델을 어떤 형태로 되살릴지가 미정이라 새 번호를 배정하지 않았다 — FS-036 §7 #14 참조 |

도달 불가 상태로 남은 그 화면의 결함들(승인 상태를 클라이언트가 지정하는 문제 등)은
**닫힌 것이 아니라 닿을 수 없게 된 것**이다. 재구축 시 다시 열린다.

### 4.3 명세는 있으나 코드가 없는 화면 — 0개

사이드바 잎(leaf) 전수와 FS 문서의 `route` 를 대조한 결과 **불일치가 없다**.
모든 FS 문서가 실재하는 라우트를 가리키고, 모든 사이드바 잎이 FS 문서를 갖는다.

### 4.4 SCR(화면 설계서) 미작성 — 61개 문서가 참조 중

`docs/plan/ui/` 에는 **SCR-001·002·003 세 개만** 있다. 나머지 FS 문서는 전부
`screen: SCR-0nn` 을 선언해 두고 본문에 '⚠ 미작성' 을 달아 두었다.
FS 문서의 `screen` 필드는 **아직 대응물이 없는 약속**이며, 그 사실이 각 문서 §7 에 기록돼 있다.
`SCR-003` 은 이름이 겹친다 — 회원 관리(FS-003)가 아니라 상품 등록 설계서다(FS-003 §7 참조).

## 5. 이번 세션(2026-07-18)에 삭제된 기능

되살리려면 **삭제 판단을 먼저 뒤집어야 한다.** 명세만 되돌리면 코드가 없다.

| 기능 | 지운 것 | 남은 흔적 |
|---|---|---|
| 예약/신청 관리 | `pages/reservations/**` · `specs/reservations/**` (037–040) | 없음. 다른 문서가 인용하던 감사 근거는 현존 사례로 재고정했다 |
| 언어 관리 | `pages/settings/languages/**` · `specs/settings/languages/**` (068) | 없음. 쓰기 권한 게이팅 사례 목록에서 해당 항목을 걷어내고 개수를 다시 셌다 |

두 기능을 삭제하며 **다른 화면의 명세가 인용하던 근거**가 함께 사라졌다.
그 판정들은 지우지 않고 현존하는 동등 사례로 다시 고정했다 — 근거가 낡는 것보다 판정이 사라지는 것이 나쁘다.

## 6. 이 색인을 유지하는 법

- 화면을 **추가**하면: 다음 빈 번호를 잡고(§2 결번은 재사용하지 않는다) FS·BE 를 쓰고, 가능하면 NFR 까지 쓴 뒤 §3 표에 한 줄 넣는다.
- 화면을 **삭제**하면: 명세를 지우고 §2 결번 표와 §5 에 사유를 남긴다. 그리고 **그 화면을 인용하던 다른 명세를 전수 검색해** 근거를 옮긴다.
- 라우트를 **바꾸면**: FS 의 `route` 프론트매터와 §3 표를 함께 고친다. 옛 경로를 리다이렉트로 남겼다면 그 사실도 FS 에 적는다.

## 부록 A. 전수조사 배치 기록 — 쓰기 권한 게이팅의 공통 층 이관 (2026-07-20)

**왜 여기에 적는가**: 이 변경은 화면 하나의 것이 아니라 **`CrudListShell` 을 쓰는 30개 목록 전부**에
동시에 적용된다. 화면별 FS 에 30번 적으면 어느 것도 정본이 아니게 되므로 색인에 남긴다.

### A.1 조사 결과 (근거: 라우트 133개 기계적 열거 + 5개 도메인 병렬 감사)

`quality-bar.md` **EXC-03 (P0)** 은 '`can(resource, action)` 가 false 면 create/update/delete 컨트롤을
렌더하지 않는다' 를 요구한다. 인프라(`shared/permissions/RequirePermission.tsx` 의 `useRouteWritePermissions`)는
**이미 완성돼 있었다.** 그런데 소비처를 세어 보니:

| 사실 | 수치 |
|---|---|
| `CrudListShell`/`useCrudList` 기반 목록 화면 | **30** |
| 그중 쓰기 권한을 묻던 화면 | **3** (`ProductListPage` · `ProductCategoriesPage` · `ReturnDetailPage`) |
| 그 3개조차 게이팅하던 액션 | **`canCreate` 뿐** — 행 수정·행 삭제·일괄 삭제는 **어디에서도** 게이팅되지 않았다 |

즉 조회 전용 역할이 **30개 화면 전부에서** 행의 연필·휴지통·체크박스와 '선택 N건 삭제' 를
그대로 보고 누를 수 있었다. 5개 도메인 감사가 독립적으로 같은 결론에 도달했다
(sales 0건 · users 0건 · support 0건 · content/company/portfolio 0건 · products 부분).

### A.2 결정 — 화면이 아니라 **껍데기**가 판정한다

화면마다 훅을 부르게 하는 방식은 이미 실패한 것이 위 수치로 증명됐다(30개 중 3개). 새 화면이 늘 때마다
빠뜨릴 수 있고, 빠뜨린 화면만 **조용히** 무방비가 된다. 그래서 판정을 공통 층으로 올렸다 —
`route-resource.ts` 가 라우트에서 리소스를 파생하므로 껍데기는 **자기가 어느 도메인인지 몰라도** 옳게 물을 수 있다.
(이는 `route-resource.ts` 머리말이 '화면마다 resourceId 를 받지 않는' 이유로 적은 논리와 같다.)

| 층 | 무엇을 가리는가 | 근거 |
|---|---|---|
| `CrudListShell` | `useRouteWritePermissions()` 호출 · `canRemove` 가 false 면 **선택 바(일괄 삭제)** 를 그리지 않는다 | `shared/crud/CrudListShell.tsx` |
| `CrudTable` | `canUpdate=false` → 연필 + **행 클릭 이동** 제거 · `canRemove=false` → 휴지통 + **선택 체크박스** 제거 · 둘 다 false → 액션 열 통째 제거 + 캡션이 '조회 전용입니다' | `shared/crud/CrudTable.tsx` |
| 화면 | **등록(create) CTA 만** 각자 가린다 — `toolbar`/`empty` 로 넘기는 `ReactNode` 라 껍데기가 붙잡을 손잡이가 없다 | 예: `ProductListPage.tsx` |

**설계 판단 두 가지**:
1. **연필만 숨기고 행 클릭을 남기면 게이팅이 무의미하다** — 행 아무 데나 누르면 폼이 열린다. 그래서 함께 끈다.
2. **삭제 권한이 없으면 체크박스도 지운다** — `CrudListShell` 에서 선택을 소비하는 것은 일괄 삭제뿐이라,
   남겨 두면 아무 일도 일어나지 않는 UI 를 고르게 된다.

`canUpdate`/`canRemove` 의 **기본값은 `true`** 다. 껍데기 밖에서 `CrudTable` 을 직접 쓰는 호출부는 도입 전과
동일하게 동작하며, 회귀가 나면 30개 화면이 한꺼번에 무방비가 되므로 그 기본값도 테스트가 못박는다
(`shared/crud/CrudTable.test.tsx` — 'CrudTable — 쓰기 권한 게이팅 (EXC-03)' 5건).

### A.3 남은 것 (이번 배치에서 **하지 않은** 것)

| # | 내용 | 이유 |
|---|---|---|
| A-1 | **등록(create) CTA 게이팅이 여전히 화면별 의무다** — 30개 중 2개만 가린다. 나머지 28개는 조회 전용 역할에게 '등록' 버튼을 보여 준다 | 껍데기가 `ReactNode` 를 붙잡을 수 없다. `CrudListShell` 이 `createAction` 을 **구조화된 형태로** 받도록 계약을 바꾸는 별도 결정 필요 |
| A-2 | **폼 화면(`/new`·`/:id/edit`)의 제출 버튼이 쓰기 권한을 묻지 않는다** — 목록에서 못 들어가도 deep-link 로 열린다 | `useCrudForm`/`FormPageShell` 층의 같은 이관이 필요하다. 이번 배치 범위 밖 |
| A-3 | 목록 밖 인라인 상태 토글(전시·발급·노출·수주 전환 등)이 무게이팅 | 각 화면 고유 액션이라 껍데기가 모른다 |
