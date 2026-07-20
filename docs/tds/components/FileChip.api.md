<!-- AUTO-GENERATED from contracts/FileChip.contract.json — DO NOT EDIT (pnpm codegen) -->

# FileChip API

> ⚠️ **자동 생성 문서** — 이 파일은 계약에서 생성됩니다. 직접 수정하지 마세요.
> 변경이 필요하면 `contracts/FileChip.contract.json` 을 수정한 뒤 `pnpm codegen` 을 실행하세요.

지금 걸려 있는 파일 한 건 — 썸네일 + 파일명 + 용량, 그리고 선택적 제거(×). 출처: apps/admin/src/shared/ui/FilePicker.tsx (사이트 설정의 파비콘·대표 이미지·비공개 이미지가 공유).

[FileDropzone 과 짝이다] 둘은 가로로 나란히 서고, 미리보기는 드롭존이 아니라 브라우저 탭 목업·OG 카드라는 **다른 자리**에 그려진다. 그래서 미리보기를 자기가 소유하는 ImageUploadField 로 대체할 수 없다 — 미리보기의 주인이 다르다.

[제거 버튼은 onRemove 를 준 만큼만 생긴다] 지울 수 없는 자리(필수 자산)에 죽은 버튼을 두지 않는다 — Alert.onClose 와 같은 판단이다.

[용량 표기] formatFileSize 순수 함수가 소유한다. 소수점은 MB 부터만 붙인다 — KB 단위의 '12.7KB' 는 정보가 아니라 소음이고, 칩이 보여줄 것은 '작다/크다' 이지 정확한 바이트가 아니다.

## 개요

| 항목 | 값 |
|---|---|
| 버전 | `1.0.0` |
| 레벨 | `molecule` |
| 카테고리 | `File` |
| 상태 | `beta` |
| 소유 | code `component-eng` · design `ui-design` · figma `figma-eng` |
| 의존 컴포넌트 | `ImageThumb` |

## Props

| 이름 | 타입 | 기본값 | 필수 | Figma Property | 설명 |
|---|---|---|---|---|---|
| `src` | `string` | `""` | — | — | 썸네일 URL. 비거나 로드 실패면 ImageThumb 가 placeholder 를 그린다 |
| `name` | `string` | — | ✅ | — | 파일명 — 한 줄로 자르고 넘치면 말줄임한다. 제거 버튼의 접근 가능한 이름('<name> 제거')도 여기서 온다 |
| `size` | `number` | — | ✅ | — | 바이트 수 — 표기는 formatFileSize 가 한다(1KB 미만 B · 1MB 미만 KB · 그 위 MB 소수 1자리). 음수/NaN 은 '-' |
| `disabled` | `boolean` | `false` | — | `Disabled` | 비활성 — 제거 버튼을 잠근다(칩 자체는 계속 읽힌다). onRemove 발화 없음 |

## Events

| 이름 | Payload | 발화 차단 상태 | 설명 |
|---|---|---|---|
| `onRemove` | `void` | `disabled` | 제거(×) 클릭. **주지 않으면 버튼이 렌더되지 않는다** — 지울 수 없는 자리에 죽은 버튼을 만들지 않는다. disabled 에서는 발화 금지 — <button disabled> 가 네이티브로 막는다 |

## States

`default` · `hover` · `focus-visible` · `disabled`

> Story 커버리지는 enum prop 값 곱 × boolean prop 당 2 조합 100%가 요구됩니다 (`combinationMatrix` 참조).
> states 는 이 행렬에 포함되지 않습니다 — state 커버리지는 커버리지 축2(contract-states)가 **단언을 가진 테스트**로 따로 강제합니다.

## A11y

| 항목 | 값 |
|---|---|
| role | `group` |
| 키보드 | `Tab`, `Enter`, `Space` |
| focus-visible | 필수 |
| `label` | 제거 버튼은 '<name> 제거' 를 aria-label 로 갖는다 — 칩이 여럿 서 있어도 어느 파일을 지우는지 알 수 있다 |
| `thumbnail` | 썸네일 alt 는 '<name> 썸네일' — ImageThumb 가 로드 실패 시 role=img placeholder 로 대체한다 |
| `locking` | disabled 이면 제거 <button disabled> 로 잠근다 — onRemove 발화가 네이티브로 차단된다 |
| 최소 대비 | 4.5:1 |

## Tokens

| 시각 속성 | 토큰 경로 | CSS 변수 |
|---|---|---|
| `gap` | `space.3` | `--tds-space-3` |
| `paddingX` | `space.3` | `--tds-space-3` |
| `paddingY` | `space.2` | `--tds-space-2` |
| `border` | `color.border.default` | `--tds-color-border-default` |
| `borderWidth` | `border-width.thin` | `--tds-border-width-thin` |
| `radius` | `radius.md` | `--tds-radius-md` |
| `surface` | `color.surface.default` | `--tds-color-surface-default` |
| `nameText` | `color.text.default` | `--tds-color-text-default` |
| `nameTypography` | `typography.label.md` | `--tds-typography-label-md` |
| `sizeText` | `color.text.muted` | `--tds-color-text-muted` |
| `sizeTypography` | `typography.caption.md` | `--tds-typography-caption-md` |
| `removeSize` | `space.6` | `--tds-space-6` |
| `removeRadius` | `radius.full` | `--tds-radius-full` |
| `removeText` | `color.text.muted` | `--tds-color-text-muted` |
| `focusRing` | `color.border.focus` | `--tds-color-border-focus` |
| `focusRingWidth` | `border-width.medium` | `--tds-border-width-medium` |

> 하드코딩 색상/치수 금지 — 시각 속성은 반드시 위 토큰만 참조합니다.

## Responsive

| 브레이크포인트 | 동작 |
|---|---|
| `sm`, `md`, `lg` | `size-fixed` |
