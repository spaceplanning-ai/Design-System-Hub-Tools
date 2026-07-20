# 메뉴별 플로우 차트

사이드바 메뉴 **전수**. 각 장이 그 메뉴의 진입 → 조회 상태 → 액션 → 게이트·검증 → mutation → 성공·실패 → 복귀를 담는다.
코드(페이지 컴포넌트·types.ts·data-source.ts·queries.ts)를 읽고 그린 것이라 상태값과 가드 이름이 실제와 일치한다.

**[전체 목차(HTML)](html/index.html)** — 브라우저로 열면 휠 확대·드래그 이동이 된다.
`.mmd` 는 mermaid.live 에 붙여넣는 원본이다(펜스 없이 통째로 복사).

| 메뉴 | 경로 | 보기 | mermaid 원본 |
|---|---|---|---|
| 새 채팅 | `/ai/chat` | [HTML](html/menus/ai-chat.html) | [mmd](mmd/menus/ai-chat.mmd) |
| 대화 목록 | `/ai/conversations` | [HTML](html/menus/ai-conversations.html) | [mmd](mmd/menus/ai-conversations.mmd) |
| CEO 인사말 | `/company/ceo-message` | [HTML](html/menus/company-ceo-message.html) | [mmd](mmd/menus/company-ceo-message.mmd) |
| 인증서/특허 | `/company/certificates` | [HTML](html/menus/company-certificates.html) | [mmd](mmd/menus/company-certificates.mmd) |
| 고객사 | `/company/clients` | [HTML](html/menus/company-clients.html) | [mmd](mmd/menus/company-clients.mmd) |
| 오시는 길 | `/company/directions` | [HTML](html/menus/company-directions.html) | [mmd](mmd/menus/company-directions.mmd) |
| ESG | `/company/esg` | [HTML](html/menus/company-esg.html) | [mmd](mmd/menus/company-esg.mmd) |
| 연혁 | `/company/history` | [HTML](html/menus/company-history.html) | [mmd](mmd/menus/company-history.mmd) |
| 파트너사 | `/company/partners` | [HTML](html/menus/company-partners.html) | [mmd](mmd/menus/company-partners.mmd) |
| 회사 정보 | `/company/profile` | [HTML](html/menus/company-profile.html) | [mmd](mmd/menus/company-profile.mmd) |
| 배너 관리 | `/content/banners` | [HTML](html/menus/content-banners.html) | [mmd](mmd/menus/content-banners.mmd) |
| FAQ | `/content/faq` | [HTML](html/menus/content-faq.html) | [mmd](mmd/menus/content-faq.mmd) |
| 공지사항 | `/content/notices` | [HTML](html/menus/content-notices.html) | [mmd](mmd/menus/content-notices.mmd) |
| 팝업 관리 | `/content/popups` | [HTML](html/menus/content-popups.html) | [mmd](mmd/menus/content-popups.mmd) |
| 개인정보 처리방침 | `/content/privacy` | [HTML](html/menus/content-privacy.html) | [mmd](mmd/menus/content-privacy.mmd) |
| 약관 관리 | `/content/terms` | [HTML](html/menus/content-terms.html) | [mmd](mmd/menus/content-terms.mmd) |
| 대시보드 | `/dashboard` | [HTML](html/menus/dashboard.html) | [mmd](mmd/menus/dashboard.mmd) |
| 관리자 로그 | `/logs/admin` | [HTML](html/menus/logs-admin.html) | [mmd](mmd/menus/logs-admin.mmd) |
| API 로그 | `/logs/api` | [HTML](html/menus/logs-api.html) | [mmd](mmd/menus/logs-api.mmd) |
| 오류 로그 | `/logs/errors` | [HTML](html/menus/logs-errors.html) | [mmd](mmd/menus/logs-errors.mmd) |
| 회원 활동 로그 | `/logs/member-activity` | [HTML](html/menus/logs-member-activity.html) | [mmd](mmd/menus/logs-member-activity.mmd) |
| 알림톡 템플릿 | `/marketing/templates/alimtalk` | [HTML](html/menus/marketing-alimtalk.html) | [mmd](mmd/menus/marketing-alimtalk.mmd) |
| 이메일 발송 | `/marketing/email` | [HTML](html/menus/marketing-email.html) | [mmd](mmd/menus/marketing-email.mmd) |
| 이벤트 | `/marketing/events` | [HTML](html/menus/marketing-events.html) | [mmd](mmd/menus/marketing-events.mmd) |
| 뉴스레터 | `/marketing/newsletters` | [HTML](html/menus/marketing-newsletters.html) | [mmd](mmd/menus/marketing-newsletters.mmd) |
| 프로모션 | `/marketing/promotions` | [HTML](html/menus/marketing-promotions.html) | [mmd](mmd/menus/marketing-promotions.mmd) |
| SMS 발송 | `/marketing/sms` | [HTML](html/menus/marketing-sms.html) | [mmd](mmd/menus/marketing-sms.mmd) |
| 발송 템플릿 | `/marketing/templates` | [HTML](html/menus/marketing-templates.html) | [mmd](mmd/menus/marketing-templates.mmd) |
| 성공 사례 | `/portfolio/case-studies` | [HTML](html/menus/portfolio-case-studies.html) | [mmd](mmd/menus/portfolio-case-studies.mmd) |
| 포트폴리오 카테고리 | `/portfolio/categories` | [HTML](html/menus/portfolio-categories.html) | [mmd](mmd/menus/portfolio-categories.mmd) |
| 포트폴리오 | `/portfolio/items` | [HTML](html/menus/portfolio-items.html) | [mmd](mmd/menus/portfolio-items.mmd) |
| 상품 카테고리 | `/products/categories` | [HTML](html/menus/products-categories.html) | [mmd](mmd/menus/products-categories.mmd) |
| 쿠폰 | `/products/coupons` | [HTML](html/menus/products-coupons.html) | [mmd](mmd/menus/products-coupons.mmd) |
| 상품 | `/products` | [HTML](html/menus/products-items.html) | [mmd](mmd/menus/products-items.mmd) |
| 적립금 | `/products/points` | [HTML](html/menus/products-points.html) | [mmd](mmd/menus/products-points.mmd) |
| 교환/반품 | `/products/returns` | [HTML](html/menus/products-returns.html) | [mmd](mmd/menus/products-returns.mmd) |
| 리뷰 | `/products/reviews` | [HTML](html/menus/products-reviews.html) | [mmd](mmd/menus/products-reviews.mmd) |
| 배송 | `/products/shipping` | [HTML](html/menus/products-shipping.html) | [mmd](mmd/menus/products-shipping.mmd) |
| 거래처 | `/sales/accounts` | [HTML](html/menus/sales-accounts.html) | [mmd](mmd/menus/sales-accounts.mmd) |
| 상담 이력 | `/sales/consultations` | [HTML](html/menus/sales-consultations.html) | [mmd](mmd/menus/sales-consultations.mmd) |
| 계약 | `/sales/contracts` | [HTML](html/menus/sales-contracts.html) | [mmd](mmd/menus/sales-contracts.mmd) |
| 문의 | `/sales/inquiries` | [HTML](html/menus/sales-inquiries.html) | [mmd](mmd/menus/sales-inquiries.mmd) |
| 프로젝트 | `/sales/projects` | [HTML](html/menus/sales-projects.html) | [mmd](mmd/menus/sales-projects.mmd) |
| 견적 | `/sales/quotes` | [HTML](html/menus/sales-quotes.html) | [mmd](mmd/menus/sales-quotes.mmd) |
| API Key 설정 | `/settings/api-keys` | [HTML](html/menus/settings-api-keys.html) | [mmd](mmd/menus/settings-api-keys.mmd) |
| OAuth 설정 | `/settings/oauth` | [HTML](html/menus/settings-oauth.html) | [mmd](mmd/menus/settings-oauth.mmd) |
| 사이트 설정 | `/settings/site` | [HTML](html/menus/settings-site.html) | [mmd](mmd/menus/settings-site.mmd) |
| 검색어 분석 | `/stats/keywords` | [HTML](html/menus/stats-keywords.html) | [mmd](mmd/menus/stats-keywords.mmd) |
| 회원 통계 | `/stats/members` | [HTML](html/menus/stats-members.html) | [mmd](mmd/menus/stats-members.mmd) |
| 주문 통계 | `/stats/orders` | [HTML](html/menus/stats-orders.html) | [mmd](mmd/menus/stats-orders.mmd) |
| 매출 통계 | `/stats/revenue` | [HTML](html/menus/stats-revenue.html) | [mmd](mmd/menus/stats-revenue.mmd) |
| 유입 분석 | `/stats/traffic` | [HTML](html/menus/stats-traffic.html) | [mmd](mmd/menus/stats-traffic.mmd) |
| 방문자 통계 | `/stats/visitors` | [HTML](html/menus/stats-visitors.html) | [mmd](mmd/menus/stats-visitors.mmd) |
| 문의 유형 | `/support/categories` | [HTML](html/menus/support-categories.html) | [mmd](mmd/menus/support-categories.mmd) |
| 자료실 | `/support/downloads` | [HTML](html/menus/support-downloads.html) | [mmd](mmd/menus/support-downloads.mmd) |
| 자주 묻는 질문 | `/support/faq` | [HTML](html/menus/support-faq.html) | [mmd](mmd/menus/support-faq.mmd) |
| 문의 답변 | `/support/replies` | [HTML](html/menus/support-replies.html) | [mmd](mmd/menus/support-replies.mmd) |
| 1:1 문의 | `/support/tickets` | [HTML](html/menus/support-tickets.html) | [mmd](mmd/menus/support-tickets.mmd) |
| 관리자 관리 | `/users/admins` | [HTML](html/menus/users-admins.html) | [mmd](mmd/menus/users-admins.mmd) |
| 로그인 이력 | `/users/login-history` | [HTML](html/menus/users-login-history.html) | [mmd](mmd/menus/users-login-history.mmd) |
| 회원 관리 | `/users/members` | [HTML](html/menus/users-members.html) | [mmd](mmd/menus/users-members.mmd) |
| 권한 관리 | `/users/roles` | [HTML](html/menus/users-roles.html) | [mmd](mmd/menus/users-roles.mmd) |
| 고객 설정 | `/users/settings` | [HTML](html/menus/users-settings.html) | [mmd](mmd/menus/users-settings.mmd) |
