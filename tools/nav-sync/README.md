# @tds/nav-sync — nav-config 파생물 동기화 게이트

> 담당: 어드민 IA(정보구조) 정합성
> 차단 조건: **표류 1건 이상 → exit 1**

어드민 메뉴의 정본은 `apps/admin/src/shared/layout/nav-config.ts` 하나다.
여기서 파생된 사본 두 개가 정본과 어긋나지 않았는지 **값으로** 대조한다.

## 실행

```bash
pnpm nav:check          # 루트 스크립트 (= pnpm --filter @tds/nav-sync run check)
```

## 검사 항목

| id | 대상 | 파생 방식 | 고치는 법 |
|---|---|---|---|
| `pages-ts-sync` | `packages/ui/pages/_data/pages.ts` | **사람이 손으로 옮겨 적은 값 사본** | 손으로 맞춘다 (생성물이 아니다) |
| `tds-pages-fresh` | `tools/figma-plugin/generated/tds-pages.json` | `tools/figma-plugin/build.mjs` 생성물 | `node tools/figma-plugin/build.mjs` |

`pages-ts-sync` 는 경로 집합뿐 아니라 **한국어 라벨 · 메뉴 · 섹션까지** 본다.
경로만 대조하면 라벨만 바뀐 표류를 놓치는데, 그것이 실제로 벌어진 표류의 한 종류다
(`/settings/api-keys` — 'API Key 관리' ↔ 'API Key 설정').

## 왜 별도 도구인가

기존 축에 자리가 없다. 신설 전에 전부 읽고 판단했다 (`work-cycle.md` §3).

- **`tools/contract-test/src/axes/*`** — 축은 전부 **계약 1건 단위**로 돈다
  (`AxisContext` 가 `Contract` 를 요구한다). nav 는 계약이 아니라 앱 IA 다.
- **`codegen --check`** — 두 파일 다 codegen 산출물이 아니다. `OUTPUT_PATTERNS` 에 넣으면
  codegen 이 만들지도 않는 파일을 **고아로 판정해 지운다.**
- **`@tds/drift`** — 설계상 차단하지 않는 알림 도구다(exit 2 = Fix PR 트리거).
  표류를 막아야 하는 검사를 여기 두면 게이트가 장식이 된다.

그리고 `pages.ts` 는 eslint `boundaries` 의 `banApps`(packages/ui → apps/admin 역방향 의존
금지)로 import 가 **구조적으로 금지**돼 있어 타입 검사로는 원리적으로 잡을 수 없다.
값을 실제로 읽어 대조하는 도구가 `tools/` 에 따로 있어야 하는 이유다.

## 검사가 생성기와 갈라지지 않게 하는 법

`tds-pages-fresh` 는 파생 규칙을 **여기서 다시 구현하지 않는다.** 생성기와 같은 모듈
(`tools/figma-plugin/scripts/pages-source.ts`)을 import 해 다시 만든 뒤 바이트 비교한다.
규칙을 양쪽이 각자 구현하면 검사가 생성기와 다른 답을 내는 순간 **게이트가 거짓말**을 한다.

`pages-source.ts` 가 `$generatedAt` 을 넣지 않는 것도 이 때문이다 — 결정론이 없으면
"다시 만들어 비교" 라는 검사 방식 자체가 성립하지 않는다.

## 리포트를 쓰지 않는 이유

`codegen --check` 와 같은 부류다 — 판정이 이진(동기/표류)이고 처방이 한 줄이라
콘솔 출력이 곧 전부다. `reports/` 에 새 폴더를 만들면 그 폴더의 README 규약이 따라붙는데
담을 내용이 없다.

## 종료 코드

| 코드 | 의미 |
|---|---|
| 0 | 파생물 2종 모두 정본과 동기 |
| 1 | 표류 1건 이상 — 차단 |
| 2 | NOT_VERIFIED — 정본에서 화면을 한 건도 읽지 못했다 (대조 0건에 표류 0건은 공집합 위의 참이다) |

## 알려진 함정

- **`pnpm codegen` 은 `tds-pages.json` 을 만들지 않는다.** `build.mjs` 가 만든다.
  그래서 `codegen:check` 가 "생성물 207건 모두 최신 ✔" 을 내면서 이 파일이 낡아 있을 수 있다
  (2026-07-20 실측 — 사보타주로 재현 확인).
- **정본을 사본에 맞추지 마라.** 표류가 나오면 고칠 곳은 항상 사본 쪽이다.
