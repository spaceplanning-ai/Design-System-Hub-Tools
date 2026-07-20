# Figma 플러그인 조립 규칙 (plugin-build-rules)

Figma 플러그인(`tools/figma-plugin/**`)이 계약을 **실제 Figma 노드**로 조립할 때 지키는 규칙의
단일 규격이다. 이 문서는 설명서가 아니라 **지뢰 지도**다 — 아래 항목은 전부 실제 실행에서 한 번씩
터졌고, 사용자가 화면을 보고 찾아내야 했던 것들이다. 규칙이 문서로 없었던 것이 그 실패의 근본
원인이므로, 새 규칙을 만들 때는 여기 먼저 적고 그다음 코드를 고친다.

- 담당: Figma 플러그인 (`tools/figma-plugin/**` + 이 문서)
- 검수: Figma 리뷰 (G7)
- 관련: `tds-doc-style.md`(문서 페이지 규격), `contracts/schemas/component.v1.json`(계약 스키마)

---

## 0. 규칙 #1 — 겹치지 않게, 잘리지 않게

아래 규칙은 전부 **겹침과 잘림을 구조적으로 불가능하게** 만들기 위해 있다.

1. **오토레이아웃 자식에게 `x`/`y` 를 직접 쓰지 않는다.** 위치는 `layoutMode` + `itemSpacing` +
   패딩 + 자식 크기에서 저절로 나온다. 좌표를 쓰는 곳은 페이지 루트 프레임의 캔버스 위치뿐이다.
2. **모든 프레임은 여섯 가지 사실을 전부 선언한다**: `layoutMode`, `primaryAxisSizingMode`,
   `counterAxisSizingMode`, 폭 의도(FIXED/FILL/HUG), `itemSpacing`, 패딩 4개.
   하나라도 기본값으로 남기면 그 자리의 간격이 어디서 왔는지 아무도 모른다.
   → 구현: `render/apply.ts` `applyLayout` 이 패딩·간격을 항상 명시한다(0 이라도 쓴다).

## 1. 세 가지 사이징 의도 — 레시피를 **섞지 않는다**

| 의도 | 방법 | 비고 |
|---|---|---|
| **FIXED px** | `counterAxisSizingMode='FIXED'` + `resize(W, h)` | 문서 루트만 하드 폭을 갖는다 |
| **FILL(부모 채움)** | `layoutAlign='STRETCH'` — **`resize` 로 폭을 주지 않는다** | 부모의 교차축이 FIXED 여야 성립 |
| **HUG(내용만큼)** | `primaryAxisSizingMode='AUTO'` + `counterAxisSizingMode='AUTO'` | 기본값 |

> **[지뢰] STRETCH 와 `resize` 를 같이 쓰면 안 된다.** 고정 폭과 채움이 동시에 걸려
> hug/fill 모순이 되고, 카드 폭이 제각각이 된다. 실제로 이것이 "모든 컴포넌트 폭이 다르다"의 원인이었다.
> → 구현: `tds-doc.ts` 의 `fillWidth()` 가 **FILL 의 유일한 레시피**다.

### 고정 폭 사슬

```
root (FIXED 1248) → section (STRETCH → 1120) → 그 아래 (STRETCH → 1120)
```

> **[지뢰] 루트가 hug 면 사슬이 시작조차 하지 않는다.** 자식이 FILL 하려면 부모의 해당 축이
> FIXED 여야 하므로, 루트가 AUTO 면 **그 아래 모든 STRETCH 가 무효**가 되고 전부 hug 로 무너진다.
> → 검사: `render/__tests__/validation-page.test.ts` 가 루트 FIXED 와 사슬 단절을 막는다.

## 2. 텍스트 — `textAutoResize='NONE'` 금지

| 상황 | 값 |
|---|---|
| 폭이 정해진 텍스트(폭 제한/채움) | `'HEIGHT'` — 그 폭에서 줄바꿈, 높이만 늘어남 |
| 그 외 | `'WIDTH_AND_HEIGHT'` — 내용만큼 감싼다 |

> **[지뢰] `'NONE'` 은 내용이 길어지면 그 자리에서 자른다.** 컴포넌트 제목이 `Passwor…` 로
> 잘려 보인 원인이다. 텍스트에 **높이를 강제하지 않는 것**도 같은 이유다(자동 높이와 싸운다).

## 3. WRAP — 세 조건이 **전부** 필요

`layoutMode='HORIZONTAL'` + `layoutWrap='WRAP'` + **주축 고정 폭**.
고정 폭이 없으면 줄바꿈 대신 가로로 넘쳐 다음 요소와 겹친다. 줄 간격은 별도 속성
(`counterAxisSpacing`)이다.

## 4. 테두리

- `strokeAlign='INSIDE'` — 보더가 레이아웃 footprint 를 밀지 않게.
- **[지뢰] `strokeWeight` 는 획이 실제로 있을 때만 바인딩된다.** 테두리 **색이 없으면**
  그릴 획이 없어 Figma 가 두께 바인딩을 받지 않는다. 계약이 `strokeWidth` 만 선언하고
  `stroke` 를 빼면 그 바인딩은 조용히 실패한다.
  → 순수 계층이 이 경우 바인딩을 **요청하지 않고** `unbound` 로 보고한다(계약 결함으로 드러남).

## 5. 폰트 — 계약이 아니라 **환경 변수**

폰트는 파일·환경마다 다르다. 계약처럼 다루면 안 되고, 실행할 때마다 확인해야 한다.

1. **실행(①②③)마다 처음에 전부 다시 로드한다.**
   > **[지뢰] 플러그인 메시지가 나뉘면 폰트 로드 상태도 나뉜다.** ②가 로드했으니 ③도 되겠지 하고
   > 가정해서 ③이 `in appendChild: unloaded font "Pretendard SemiBold"` 로 중단됐다.
   > (자기 검사 기록을 `figma.root` 플러그인 데이터로 넘겨야 했던 것과 같은 이유다.)
2. **철자 함정**: Inter 는 `Semi Bold`(공백 있음), Pretendard 는 `SemiBold`(공백 없음).
   같은 굵기라도 패밀리마다 표기가 다르다.
3. **런타임 폴백까지 로드한다.** 우리가 Inter 를 지정해도 Inter 에 글리프가 없는 문자
   (한글 `대시보드`, 기호 `‹ › ✕ ⓘ •`)는 Figma 가 **다른 폰트로 폴백**한다. 그 폴백 폰트가
   미로드면 이후 그 노드의 모든 쓰기(`fontWeight` 바인딩·`fontSize`·`appendChild`·재부모화)가 터진다.
   → 구현: `render/fonts.ts` 가 Inter·Pretendard + 폴백 후보(Noto Sans/KR/Symbols/Symbols2 등)를
   개별 실패 허용으로 로드하고, **로드에 성공한 폰트만** 노드에 지정한다.
4. **미로드 폰트를 노드에 지정하지 않는다.** 지정 자체가 예외의 원인이다.
5. 기호를 텍스트로 넣는 것보다 `kind: "vector"` 가 근본적이다(폴백이 아예 생기지 않는다).
6. **[지뢰] 굵기는 `fontWeight` 필드가 아니라 `fontName.style` 이 정한다.** 굵기 Variable 을
   바인딩해도 스타일이 Regular 면 화면은 Regular 이고, 대상 스타일이 미로드면 바인딩이
   `unloaded font "…"` 로 던진다. 그래서 **노드를 만들 때** 굵기를 알아야 한다.
   > 실제로 `main.ts` 가 `loadAllFonts()` 결과에서 `.primary` 하나만 남기고 나머지를 버려,
   > 어댑터에 '이 굵기로 쓸 수 있는 스타일이 무엇인가'를 물을 통로가 아예 없었다. 계약이
   > 타이포 토큰을 건 텍스트 레이어 108개 중 **84개가 font-weight 500 이상인데 전부
   > Inter Regular 로 태어났다.** 라이브러리 전체의 글자가 굵기 없이 똑같아 보인 원인이다.
   → 구현: 순수 계층이 `NodeSpec.fontWeight` 로 **해석값**을 넘기고(줄 높이와 같은 방식),
   어댑터가 `fonts.ts` `fontForWeight()` 로 **로드된** 스타일만 골라 지정한다.
   → 검사: `render/__tests__/adapter.test.ts` 의 '타이포 배관' 블록이 44개 전부에서
   굵기 600+ 레이어가 Regular 로 태어나지 않는 것을 본다.

## 6. `repeat` 규약 — `samples` / `uniformRepeat`

`repeat: N` 은 같은 부위를 N번 그린다. **표본이 하나뿐이면 N개가 전부 같은 글자로 나온다.**

> **[지뢰] 이 기능이 18곳을 망쳤다.** 툴바가 `B` 여덟 개, 탭이 `대시보드` 네 개,
> 페이지 번호가 `1` 다섯 개로 보였다. Tabs·SegmentedControl·Pagination 이 여섯 라운드 동안
> "비어 보인다"로 오진된 것도 실제로는 **비어 있던 게 아니라 N개가 같았던 것**이다.

- `samples: [...]` — 회차마다 다른 표본. 회차 수보다 짧으면 순환한다. **기본은 이것을 쓰는 것이다.**
- `uniformRepeat: true` — 회차가 같은 것이 **옳은** 경우만(갤러리 타일마다 붙는 동일한 삭제 버튼,
  차트 격자선, 표의 행 골격). 예외를 선언하는 것이지 게이트를 끄는 것이 아니다.
- 검사: `render/__tests__/render-quality.test.ts` 가 44개 전부에서 회차 동일을 막는다.

## 7. Figma 표현 전용 플래그 — React 를 오염시키지 않는다

React 와 Figma 는 **부재와 고정값을 다르게 다룬다.** React 는 빈 슬롯을 그냥 렌더하지 않지만
Figma 레이어는 항상 존재한다. React 는 고정 라벨을 컴포넌트가 그리지만 Figma 에서는 디자이너가
그것을 바꿔 시안을 만들어야 한다. 그래서 **Figma 표현만 바꾸는 플래그** 계열을 둔다.
전부 React 타입·prop·스토리를 바꾸지 않는다.

| 플래그 | 위치 | 뜻 |
|---|---|---|
| `figmaVariant` | boolean prop | BOOLEAN 대신 Variant 축(true/false)으로 만든다 |
| `figmaToggle` | slot prop | INSTANCE_SWAP 과 함께 표시/숨김 BOOLEAN 을 만든다 |
| `figmaText` | anatomy 텍스트 | 고정 라벨을 TEXT 속성으로 노출(편집 가능) |
| `figmaToggle` | anatomy 텍스트 | 그 라벨의 표시/숨김 BOOLEAN. **없는 형태가 실제로 존재할 때만** |
| `figmaStateAxis` | 계약 루트 | 상태를 단일 VARIANT 축으로. 값은 **시각적으로 구분되는 것만** |
| `svgFrom` | anatomy 벡터 | prop 값마다 실제 SVG 로 벡터 노드를 만든다 |

> **원칙: 면제가 아니라 학습이다.** 이 플래그로 생긴 속성은 `contract-test` 의 역방향 parity 검사에
> **계약 파생으로 인정**시킨다. 검사에서 빼는 것이 아니다.

> **[지뢰] `figmaText` 를 `repeat` 안에 쓰지 않는다.** 회차들이 한 속성을 공유해
> `samples` 로 만든 차이가 도로 사라진다(§6 의 결함으로 되돌아간다).

> **[지뢰] 상태 축에 구분 안 되는 값을 넣지 않는다.** 토큰도 `when` 조건도 없는 상태를 축에 넣으면
> 픽셀이 같은 변형이 생긴다 — 아이콘 59종이 전부 같은 글리프였던 것과 같은 부류다.
> 검사: 같은 계약의 서로 다른 state 변형은 최소 한 개 바인딩·부위가 달라야 한다.

### 7.1 `variantProperties` 는 **축 선언이 아니라 페이로드 필수 필드**다 — 지우지 마라

이 절(§7)은 "어떤 prop 이 Figma **Variant 축**이 되는가"를 정한다. `<Name>.figma.json` 의
`variantProperties` **필드**와는 다른 것이다. 둘을 같은 것으로 읽으면 다음 오판에 이른다:

> "축은 `properties[]` 의 VARIANT 로만 만드는데 `toVariantProperties` 는 BOOLEAN 까지 넣는다 →
> 35/44 계약이 아무도 안 읽는 죽은 필드를 지고 있다 → codegen 에서 걷어내자"

**앞 문장은 맞고 결론은 틀리다.** 2026-07-20 전수 grep 결과 이 필드에는 소비자가 최소 6곳 있다:

| 소비자 | 하는 일 | 지우면 |
|---|---|---|
| `figma-plugin/src/spec/component-spec.ts:48` | `ComponentFigmaSpec` 의 **필수(non-optional)** 필드 | 타입 불합격 |
| 〃 `:207` `deriveAnatomy` | 축 값 집합으로 토큰 키의 값 토막을 환원(`surfaceDanger`→`surface`) | anatomy 파생이 바뀐다 |
| 〃 `:349` `fallbackProps` | `properties[]` 가 빈 구형 페이로드를 여기서 복원 | 구형 페이로드 조립 불가 |
| `figma-plugin/src/ui.html:662` | 업로드 파일을 `'contract'` 로 **판별하는 조건** | 44개 파일이 계약으로 인식되지 않는다 |
| 〃 `:1010` | `Object.keys(...).length` 로 드롭다운 라벨 | TypeError |
| `codegen/src/generate-figma-manifest.ts:108` | 없으면 **throw**, `variantPropertyCount` 산출 | codegen 자체가 실패 |
| `figma-plugin/src/spec/__tests__/contracts.test.ts:135` | 44건 전수 축 값 검사 | 검사 붕괴 |

**규칙: `variantProperties` 는 sync-component 페이로드 규격의 일부다. 축으로 쓰이는지와 무관하게
항상 내보낸다.** BOOLEAN 승격이 만드는 실제 효과는 "죽은 필드"가 아니라 `variantPropertyCount`
가 축 수보다 크게 잡히는 것뿐이며, 이는 매니페스트의 집계 값이라 축 생성에 영향이 없다.

**[지뢰] `fallbackProps` 는 지금 잠들어 있을 뿐 죽지 않았다.** 현행 44/44 계약이 `properties[]` 를
비우지 않아 호출되지 않는다(2026-07-20 실측). 그러나 `properties[]` 가 빈 계약이 하나라도 생기면
그 순간 BOOLEAN 이 **진짜 VARIANT 축으로 승격**돼 조합이 폭발한다(Button 8×). BOOLEAN 승격을
정말 걷어내야 한다면 지울 곳은 페이로드 필드가 아니라 **이 폴백 경로의 타입 매핑**이다.

## 8. 자기 검사 항목 — 각 항목이 어느 증상에서 왔는가

`render/self-check.ts` 가 **실제 Figma 런타임에서** 자기 산출물을 읽어 대조한다.
목은 근사일 뿐이므로 이것이 최종 심판이다.

| 항목 | 검사 | 출처가 된 실제 증상 |
|---|---|---|
| 텍스트 | `characters` 비어 있지 않음, `fontName` ≠ mixed | 라벨 없는 파란 버튼(TEXT 속성 기본값이 덮어씀) |
| 변형 | 선언한 조합이 전부 존재, `variantProperties` 일치 | 아이콘 11종이 전부 같은 글리프 |
| 레이아웃 | `layoutMode` 일치, `grow` 가 실제 FILL 로 적용 | 긴 문구가 늘어나지 않고 잘림(hug/fill 모순) |
| 토큰 | 요청한 바인딩이 전부 실제 `boundVariables` 에 있음 | 하드코딩 색·두께 |
| 슬롯 | slot 부위가 INSTANCE (프레임 폴백 아님) | INSTANCE_SWAP 이 붙지 못함 |
| 구조 | 선언된 부위가 트리에 존재 | 조립 도중 유실 |

결과는 `figma.root` 플러그인 데이터에 남고 **① Validation 페이지**가 그것을 읽어 보여 준다.

## 9. 실행 순서 — ① → ② → ③

| 단계 | 하는 일 | 왜 이 순서인가 |
|---|---|---|
| ① 토큰 Variables 동기화 | tokens.json → Figma Variables | ②가 바인딩할 대상이 먼저 있어야 한다 |
| ② Component Set 동기화 | 계약 anatomy → 실제 노드 | ①의 Variable 이 없으면 조립이 무의미하다 |
| ③ TDS 문서 생성 | 문서 페이지 + 검증 페이지 | ②가 남긴 자기 검사 기록과 실제 컴포넌트를 읽는다 |

> **[지뢰] 상태가 단계 사이로 이어지지 않는다.** 폰트 로드도, 메모리도 이어지지 않는다.
> 단계 간에 넘겨야 하는 것은 `figma.root` 플러그인 데이터처럼 **문서에 저장**해야 한다.
> ③만 단독 실행하면 검증 페이지가 `검사 기록 없음` 을 표시한다 — 버그가 아니라 설계다.

## 10. `resize()` 는 **사이징 모드를 바꾼다** — 폭만 주려던 호출이 높이를 100 에 못박는다

`figma.createFrame()` 이 돌려주는 프레임은 **100×100** 이다. `stack()` 이 두 축을 `AUTO` 로 놓아도,
그 뒤에 오는

```ts
frame.resize(W, frame.height); // ← frame.height 는 아직 100 이다
```

한 줄이 **두 축의 사이징 모드를 전부 `FIXED` 로 뒤집는다.** 폭만 주려던 관용구인데 실제로는
높이를 **100px 에 고정**하고, 프레임의 `clipsContent` 기본값이 `true` 이므로 그 아래 내용이
**바닥에서 잘린다.** WRAP 행에서는 다음 줄이 +100px 에 배치되어 윗줄의 넘친 내용과 **겹친다.**

> **[지뢰] 이것이 문서 페이지에서 관측된 네 증상의 단일 원인이었다.**
> ① 속성 매트릭스 카드의 `없음`/`있음` 캡션이 카드 바닥에서 잘림 (`sampleCell`)
> ② ConfirmDialog 카드 제목이 윗 카드 내용과 겹쳐 `취소를 그 제할까요?` 로 합성됨 (`componentCard`)
> ③ 긴 라벨이 글자 중간에서 `…` 로 잘림 — 문자열을 자르는 코드는 **없다.** 고정 크기 조상이
>    Figma 로 하여금 자르게 한 것이다(`apply.ts:194` 가 경고한 그 증상의 다른 경로).
> ④ preview `stage` 가 폭·높이 모두 고정이라 인스턴스가 잘림 (`instanceOf` 는 폭만 줄인다)

- **처방**: 폭만 주고 싶으면 `resize` 뒤에 **주축 사이징 모드를 되돌린다.**
  → 구현: `tds-doc.ts` 의 `setWidth()` 가 **폭 고정의 유일한 레시피**다(`fillWidth()` 가 FILL 의
  유일한 레시피인 것과 같은 자리). 세로 스택은 `primaryAxisSizingMode='AUTO'`, 가로 스택은
  `counterAxisSizingMode='AUTO'` 로 되돌려 **내용만큼 자란다**.
- **의도적으로 높이를 고정하는 자리**(체커보드·아트보드·스크린 스켈레톤)는 `resize(W, H)` 로
  **두 값을 다 적는다** — `frame.height` 를 그대로 되먹이는 호출은 전부 결함이다.
- 검사: `render/__tests__/doc-geometry.test.ts` 가 문서 트리 전체에서 '내용이 프레임보다 큰'
  자리를 0 건으로 못박는다. **목이 먼저 실제 API 를 흉내내야 한다** — `figma-mock.ts` 의
  `resize()` 가 사이징 모드를 뒤집고 프레임이 자식에서 높이를 계산하도록 고쳤다. 그 전의 목은
  `resize` 를 폭·높이 대입으로만 처리해 **이 결함을 구조적으로 볼 수 없었다.**

## 11. 문서 매트릭스의 칸은 **칸마다 다른 그림**이어야 한다

`doc-layout.ts` 의 prop 섹션은 값마다 칸을 만든다. 변형축(VARIANT)인 prop 은 칸이 실제 변형을
가리키지만, **BOOLEAN·TEXT·INSTANCE_SWAP 은 변형이 아니라 컴포넌트 속성**이라 가리킬 변형이 없다.

> **[지뢰] 예전에는 그 칸들이 전부 `variantName: null` 이었고, 렌더러가 전부 **같은 기본 변형**을
> 인스턴스로 찍었다. Checkbox 의 `checked: false` 칸과 `checked: true` 칸이 **픽셀까지 같은
> 파란 체크박스**로 나온 원인이다. `disabled` 도 마찬가지였고, 44개 계약 전부에서 BOOLEAN 축의
> 모든 칸이 같은 그림이었다. §6 의 `repeat` 표본 공유(N개가 같은 글자)와 **정확히 같은 부류**의
> 결함이며, 문서를 '만들다 만 것' 으로 보이게 한다.

- **처방**: 계획이 칸마다 **속성 덮어쓰기**(`propertyOverride`)를 싣고, 렌더러가 인스턴스에
  `setProperties` 로 적용한다. 값의 원천은 여전히 계약 하나이고 컴포넌트별 분기는 없다.
- BOOLEAN → `false`/`true`, TEXT·INSTANCE_SWAP(`없음`/`있음`) → 그 슬롯을 켜고 끄는 BOOLEAN 이
  있을 때만 덮어쓴다. 없으면 덮어쓸 것이 없으므로 **캡션만으로 구분**되고, 그건 결함이 아니라
  계약이 그 자리에 표현 축을 주지 않은 것이다(§7 `figmaToggle` 미선언).
- 검사: `spec/__tests__/doc-layout.test.ts` 가 BOOLEAN 섹션의 칸들이 **서로 다른 덮어쓰기**를
  싣는지 44건 전수로 본다.

## 12. 이 문서를 고치는 방법

새 결함을 찾으면 **먼저 여기에 지뢰로 적고**, 그다음 검사를 추가하고, 마지막에 코드를 고친다.
순서를 바꾸면 같은 지뢰를 다음 사람이 다시 밟는다 — 이번 세션이 그렇게 흘러갔다.
