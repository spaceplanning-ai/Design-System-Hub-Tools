# 어드민 플로우 차트

App.tsx 의 `APP_ROUTES`, nav-config.ts 의 사이드바 정의, 각 도메인 `types.ts` 의 상태값·전이 규칙을
원천으로 그린 것이다. 다이어그램 본문은 [mmd/](mmd/) 아래에 **펜스 없는 `.mmd` 파일**로 따로 둔다.

## mermaid.live 에서 여는 법

1. https://mermaid.live/edit 를 연다
2. 아래 파일 **하나**를 열어 내용을 전부 복사한다
3. 에디터 좌측 패널의 기존 내용을 **지우고** 붙여넣는다

> `.mmd` 파일을 쓰는 이유가 이것이다. 마크다운의 ` ```mermaid ` 펜스나 `## 제목` 까지 함께 붙여넣으면
> mermaid.live 는 `UnknownDiagramError: No diagram type detected` 를 낸다 — 첫 줄이 `flowchart` 여야 한다.
> `.mmd` 파일은 통째로 복사해도 그 조건이 깨지지 않는다. `%%` 로 시작하는 첫 줄은 주석이라 무해하다.

### 붙여넣었는데 화면이 비어 있고 에러도 안 뜬다면

파싱·렌더가 다 되는데 안 보이는 것이라면 **도형이 미리보기 밖에 있는 것**이다. 이 다이어그램들은
가로 1200~2500px 라 미리보기 창보다 크다. 마우스 휠로 축소하거나 드래그해서 이동하면 나온다
(mermaid.live 는 자동으로 맞춰 주지 않는다).

그게 번거로우면 [html/index.html](html/index.html) 을 브라우저로 열면 된다 — 휠 확대·드래그 이동이 되고 mermaid.live 가 필요 없다.
서브그래프를 쓰는 06·08 은 `~~~` 보이지 않는 링크로 세로로 쌓아 뒀다. 이 줄을 지우면 서브그래프가
옆으로 늘어서 폭이 5000px 를 넘고, 그때부터 "빈 화면"으로 보이기 시작한다.

## 메뉴별 플로우 (전수 63장)

사이드바 메뉴 하나하나의 상세 플로우는 [menus.md](menus.md) 에 표로 있다.
아래 10장은 그 위를 덮는 **횡단 다이어그램**이다 — 전체 흐름과 도메인별 워크플로.

## 다이어그램

| # | 파일 | 내용 |
|---|------|------|
| 00 | [00-master-flow.mmd](mmd/00-master-flow.mmd) | **전체 플로우 한 장** — 진입·인증·셸 → 업무 10갈래 → 쓰기 공통 처리 → 로그 기록 → 복귀 |
| 01 | [01-auth-shell.mmd](mmd/01-auth-shell.mmd) | 진입·인증·권한·lazy·예외 경계 상세 (EXC-01/02/03) |
| 02 | [02-crud-common.mmd](mmd/02-crud-common.mmd) | 목록 → 상세 → 폼 공통 CRUD (조회 4상태 · 검증 · 무효화 · 삭제 확인) |
| 03 | [03-sales-pipeline.mmd](mmd/03-sales-pipeline.mmd) | 영업 — 문의 → 견적 → 계약·프로젝트, 상담 이력 |
| 04 | [04-support-ticket.mmd](mmd/04-support-ticket.mmd) | 고객센터 1:1 문의 티켓 — 전이표 · 담당자 게이트 · SLA |
| 05 | [05-returns-reviews.mmd](mmd/05-returns-reviews.mmd) | 교환·반품 처리(재고 이동 게이트) · 리뷰 노출 관리 |
| 06 | [06-content-publish.mmd](mmd/06-content-publish.mmd) | 콘텐츠 발행 — 공지 · 팝업/배너 · 약관/개인정보 버전 |
| 07 | [07-marketing-send.mmd](mmd/07-marketing-send.mmd) | 캠페인 발송 · 발송 템플릿 발행 · 알림톡 심사 |
| 08 | [08-users-permissions.mmd](mmd/08-users-permissions.mmd) | 회원 · 운영자 · 권한 역할 |
| 09 | [09-ia-sitemap.mmd](mmd/09-ia-sitemap.mmd) | IA 사이트맵 — 사이드바 13개 섹션 (플로우가 아닌 참고용) |

## 이 차트가 담고 있는 규칙 (코드에서 읽어 온 것)

플로우의 화살표보다 **막힌 곳**이 중요하다. 아래는 다이어그램에 게이트로 그려 넣은 실제 제약이다.

- **티켓** `STATUS_FLOW` 전이표가 있다. 처리중·답변완료는 담당자가 없으면 불가(`statusRequiresAssignee`),
  종결은 종착이라 나가는 전이가 없다.
- **문의** 견적은 한 번만 발행된다(`hasIssuedQuote`). 견적은 문의에서 상속한 필드가 잠긴다(`isInherited`).
- **견적** 수주 전환은 `accepted` 에서만 가능하다(`canConvertToOrder`). 반려·만료는 전환할 수 없다.
- **프로젝트** 단계마다 확률이 자동으로 채워지고(`defaultProbability`), 실주는 파이프라인 밖이다(`inFlow:false`).
- **교환·반품** 재고는 완료에서만, 그것도 한 번만 움직인다(`movesStock` + `isStockApplied`).
  `validateStockPlan` 이 통과해야 완료로 갈 수 있다.
- **캠페인** 발송완료는 수정 불가다 — 수신자가 받은 것과 화면이 달라지고 오픈율 귀속이 깨지기 때문이다.
  예약 취소는 `scheduled` 에서만 된다.
- **발송 템플릿** 발행은 `draft → active` 만, 토글은 `active ↔ inactive` 만. `active` 는 수정 액션이 없다 —
  지금 발송에 쓰이는 문구라 먼저 꺼야 한다.
- **알림톡** 발행 상태와 심사 상태는 **별개 축**이다. 한 번이라도 발송되면 콘텐츠가 영구 잠긴다 —
  승인을 취소해도 풀리지 않고 복제 후 재심사뿐이다.
- **팝업·배너** `enabled` 를 끄면 노출 기간 안이라도 노출되지 않는다.
- **권한** 시스템 역할(`role-super-admin`)은 편집·삭제 불가. 적용 중인 역할을 지우면 남은 첫 역할이 대신 적용된다.
- **로그·통계** 쓰기 라우트가 존재하지 않는다. 감사 기록은 불변이다.

## 검증

10개 파일 전부 mermaid 11.16(= mermaid.live 와 같은 엔진)으로 **파싱 + 실제 SVG 렌더**까지 확인했다.
결과물은 [html/](html/) 의 자립형 페이지로 들어 있다(SVG 를 인라인해 두어 외부 의존이 없다).
다이어그램을 고치면 아래로 다시 뽑는다.

```sh
npx -p @mermaid-js/mermaid-cli mmdc -i docs/flow/mmd/00-master-flow.mmd -o /tmp/00.svg
```

렌더 크기(폭 × 높이, px) — mermaid.live 에서 안 보이면 이 값을 먼저 의심한다. HTML 로 열면 '전체 보기'가 맞춰 준다.

| 파일 | 크기 |
|---|---|
| 00-master-flow | 2467 × 3492 |
| 01-auth-shell | 1212 × 2168 |
| 02-crud-common | 1480 × 2229 |
| 03-sales-pipeline | 1760 × 2967 |
| 04-support-ticket | 1707 × 1572 |
| 05-returns-reviews | 1178 × 1504 |
| 06-content-publish | 2209 × 1062 |
| 07-marketing-send | 2056 × 1939 |
| 08-users-permissions | 2250 × 2034 |
| 09-ia-sitemap | 1225 × 6694 |

## 원천

- 라우트: [App.tsx](../../apps/admin/src/App.tsx) 의 `APP_ROUTES`
- 사이드바: [nav-config.ts](../../apps/admin/src/shared/layout/nav-config.ts)
- 상태·전이: 각 도메인 `types.ts` — 티켓만 예외로 [support/_shared/domain.ts](../../apps/admin/src/pages/support/_shared/domain.ts) + `tickets/process.ts`

화면을 하나 완성하면 `APP_ROUTES` 에 한 줄을 추가하고, 09 사이트맵에 리프를, 상태가 있는 도메인이면
해당 워크플로 다이어그램에 노드를 더한다.
