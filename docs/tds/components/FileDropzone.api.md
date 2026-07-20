<!-- AUTO-GENERATED from contracts/FileDropzone.contract.json — DO NOT EDIT (pnpm codegen) -->

# FileDropzone API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/FileDropzone.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

가로형 파일 드롭존 — 클릭하면 탐색기가 열리고, 끌어다 놓아도 된다. 출처: apps/admin/src/shared/ui/FilePicker.tsx (사이트 설정의 파비콘·대표 이미지·비공개 이미지가 공유).

[왜 ImageUploadField 가 아닌가] 그 필드는 미리보기를 자기가 소유하는 큰 정사각 드롭존이다. 이쪽은 FileChip 과 가로로 나란히 서는 **한 줄짜리 조각**이고, 미리보기는 완전히 다른 자리(브라우저 탭 목업·OG 카드)에 그려진다.

[진짜 <input type="file"> 은 감춘다] 파일 입력의 기본 UI 는 스타일링이 되지 않는다. 그래서 <button> 이 AT 에 보이는 컨트롤이고 숨은 입력은 탐색기를 여는 트리거일 뿐이다(aria-hidden + tabIndex -1) — ImageUploadField 와 같은 판정이다.

[검증하지 않는다] 파일을 고르는 일까지만 한다. 확장자·용량·해상도 검증과 업로드는 호출부가 소유한다 — 화면마다 규칙이 다르고(파비콘은 ICO 16x16, 비공개 이미지는 PNG/JPG/GIF) 해상도 검사는 비동기라 여기서 삼키면 호출부가 실패를 알 수 없다. accept 는 탐색기의 1차 필터일 뿐 **보증이 아니다**.

[같은 파일 재선택] change 후 입력 값을 비운다 — 그러지 않으면 검증 실패 뒤 같은 파일을 다시 고르는 경로가 조용히 막힌다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `File` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `label` | `string` | — | ✅ | — | 접근 가능한 이름의 뿌리 — 문구만 있는 버튼이라 무엇을 고르는 자리인지 여기서 밝힌다. 실제 aria-label 은 '<label> — 클릭하거나 파일을 끌어다 놓으세요' |
| `title` | `string` | — | ✅ | — | 1차 안내 문구 — '파일 선택 또는 끌어다 놓기'. 한국어 어절이 갈리지 않게 word-break: keep-all 로 그린다 |
| `meta` | `string` | `""` | — | — | 형식·크기 안내 — '최소 16x16 / ICO'. 비우면 둘째 줄이 없다 |
| `accept` | `string` | `""` | — | — | <input type="file"> 의 accept — 탐색기의 1차 필터일 뿐 보증이 아니다(호출부가 다시 검증한다) |
| `describedBy` | `string` | `""` | — | — | 오류/힌트 문단의 id — 문단 자체는 호출부가 소유한다. 비우면 aria-describedby 를 렌더하지 않는다 |
| `disabled` | `boolean` | `false` | — | `Disabled` | 비활성 — 클릭·드롭을 함께 막고 흐리게 표시한다. onSelect 발화 없음 |
| `isInvalid` | `boolean` | `false` | — | `Invalid` | 오류 상태 — 테두리를 danger 색으로 바꾼다. **문구는 그리지 않는다**(호출부가 describedBy 로 잇는 문단이 소유한다) |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onSelect` | `File` | `disabled` | 고른 파일 1건을 발화한다(탐색기 선택·드롭 모두 같은 경로). 검증은 호출부가 한다. disabled 에서는 발화 금지 — <button disabled> 와 드롭 핸들러의 조기 반환이 함께 막는다 (Storybook Play Function 이 전수 검증) |

## States

`default` · `hover` · `focus-visible` · `disabled` · `error`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `button` |
| 키보드 | `Tab`, `Enter`, `Space` |
| focus-visible | 필수 |
| `label` | '<label> — 클릭하거나 파일을 끌어다 놓으세요' — 두 조작 경로를 이름 안에서 함께 알린다 |
| `aria-describedby` | describedBy 가 비어 있지 않으면 호출부의 오류/진행 문단을 잇는다 |
| `hidden-input` | 진짜 <input type=file> 은 aria-hidden + tabIndex -1 이다 — AT 에는 버튼 하나만 보인다(중복 탭 정지점 없음) |
| `locking` | disabled 이면 <button disabled> 로 잠그고 drop 핸들러도 조기 반환한다 — 드래그 경로가 잠금을 우회하지 못한다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `gap` | `space.1` | `--tds-space-1` |
| `padding` | `space.4` | `--tds-space-4` |
| `borderDefault` | `color.border.default` | `--tds-color-border-default` |
| `borderActive` | `color.action.primary.default` | `--tds-color-action-primary-default` |
| `borderInvalid` | `color.feedback.danger.border` | `--tds-color-feedback-danger-border` |
| `borderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `borderWidthActive` | `border-width.medium` | `--tds-border-width-medium` |
| `radius` | `radius.md` | `--tds-radius-md` |
| `surface` | `color.surface.default` | `--tds-color-surface-default` |
| `surfaceActive` | `color.surface.raised` | `--tds-color-surface-raised` |
| `titleText` | `color.text.default` | `--tds-color-text-default` |
| `titleTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `metaText` | `color.text.muted` | `--tds-color-text-muted` |
| `metaTypography` | `typography.caption.md` | `--tds-typography-caption-md` |
| `textDisabled` | `color.text.disabled` | `--tds-color-text-disabled` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `focusRingWidth` | `border-width.medium` | `--tds-border-width-medium` |
| `transitionDuration` | `motion.duration.fast` | `--tds-motion-duration-fast` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `fluid` |
