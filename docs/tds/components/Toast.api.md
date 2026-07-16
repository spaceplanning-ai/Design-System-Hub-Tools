<!-- AUTO-GENERATED from contracts/Toast.contract.json — DO NOT EDIT (pnpm codegen) -->

# Toast API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/Toast.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

토스트 1건 — 아이콘 + 문구 + (실패면) '다시 시도' + 닫기(×). 결과 통지의 시각 단위다. 큐/위치/최대 개수는 조립하는 쪽(ToastProvider)이 소유한다 (ADR-0003).

[kind 가 톤·아이콘·라이브·자동소멸을 정한다] success=4초 자동소멸/status · cancelled=2초/status · info=4초/status · error=**자동소멸 없음**/alert. 실패를 조용히 삼키지 않기 위해 error 는 사용자가 닫거나 재시도할 때까지 남는다.

[a11y] success/cancelled/info 는 role="status" + aria-live="polite"(하던 일을 끊지 않는다), error 는 role="alert" + aria-live="assertive"(즉시 읽는다). 닫기 버튼으로 키보드로 닫을 수 있다. 등장 모션은 prefers-reduced-motion 에서 꺼진다.

[imperative props — 계약 밖 컴포넌트 경계] id(큐 키·onDismiss 인자)·onDismiss·onRetry 는 명령형 배선이라 Figma 대응이 없다. 계약 props(kind·message)는 디자인이 보는 표면만 기술한다 (Alert 와 동일 판정). onRetry 를 주면 '다시 시도' 버튼이 나타난다 — 별도 boolean 이 아니라 핸들러 유무로 결정한다 (Alert.onClose 선례).

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 상태 | `beta` |
| 소유 | code `A30` · design `A14` · figma `A51` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `kind` | `'success'` \| `'cancelled'` \| `'error'` \| `'info'` | `"info"` | — | `Kind` | 토스트의 의미 — 톤(feedback 토큰)·아이콘·라이브 리전 시맨틱(error=alert/assertive · 그 외=status/polite)·자동소멸 시간(success/info 4초 · cancelled 2초 · error 없음)을 함께 결정한다 |
| `message` | `string` | — | ✅ | — | 표시 문구. 아이콘 옆 <span> 으로 렌더된다 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onDismiss` | `string` | — | 토스트를 닫는다 — 자동소멸 타이머·닫기(×) 버튼·재시도 버튼이 이 토스트의 id 를 인자로 부른다. 큐에서 제거하는 것은 호출부(ToastProvider)의 책임이다 |
| `onRetry` | `void` | — | **핸들러를 주면 '다시 시도' 버튼이 나타나고, 주지 않으면 나타나지 않는다** (해제 가능 여부가 아니라 복구 경로 유무를 핸들러로 표현 — Alert.onClose 선례). 누르면 이 토스트를 닫고(onDismiss) 재시도를 실행한다. 실패(error) 토스트에만 실제로 붙는다 |

## States

`default`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 A77(축2)이 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `status` |
| 키보드 | `Tab`, `Enter`, `Space` |
| focus-visible | 필수 |
| `role` | kind=error 는 role="alert" (즉시 통지). kind=success\|cancelled\|info 는 role="status" (대기 통지). 이 계약의 role 필드값 status 는 비-error 기준이다 |
| `aria-live` | role 과 짝: error=assertive, 그 외=polite |
| `close-button` | 닫기(×) — aria-label="알림 닫기". 아이콘만 있으므로 접근 가능한 이름을 aria-label 로 준다 |
| `reduced-motion` | 등장 모션은 prefers-reduced-motion: reduce 에서 꺼진다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `surfaceSuccess` | `color.feedback.success.surface` | `--tds-color-feedback-success-surface` |
| `borderSuccess` | `color.feedback.success.border` | `--tds-color-feedback-success-border` |
| `textSuccess` | `color.feedback.success.text` | `--tds-color-feedback-success-text` |
| `surfaceInfo` | `color.feedback.info.surface` | `--tds-color-feedback-info-surface` |
| `borderInfo` | `color.feedback.info.border` | `--tds-color-feedback-info-border` |
| `textInfo` | `color.feedback.info.text` | `--tds-color-feedback-info-text` |
| `surfaceDanger` | `color.feedback.danger.surface` | `--tds-color-feedback-danger-surface` |
| `borderDanger` | `color.feedback.danger.border` | `--tds-color-feedback-danger-border` |
| `textDanger` | `color.feedback.danger.text` | `--tds-color-feedback-danger-text` |
| `radius` | `radius.md` | `--tds-radius-md` |
| `paddingX` | `space.4` | `--tds-space-4` |
| `paddingY` | `space.3` | `--tds-space-3` |
| `gap` | `space.3` | `--tds-space-3` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `typography` | `typography.label.md` | `--tds-typography-label-md` |
| `motion` | `motion.duration.normal` | `--tds-motion-duration-normal` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
