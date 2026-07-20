// AUTO-GENERATED from contracts/ColorField.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)
// 레벨: atom · 카테고리: Inputs · 상태: beta

/** 계약에 선언된 상호작용 상태 */
export type ColorFieldState = 'default' | 'focus-visible' | 'disabled';

/**
 * 색 스와치 + hex 텍스트 — 같은 값을 보는 두 개의 창. 출처: apps/admin/src/pages/marketing/message-templates/email/controls/ColorField.tsx (이메일 빌더 STYLE/INSPECT 패널의 배경·캔버스·테두리·글자 색 등 12곳).
 *
 * [왜 hex 텍스트도 같이 두나] <input type="color"> 만 두면 값을 눈으로 확인할 수 없고, 브랜드 색을 코드로 받아 적는 실무 흐름(디자이너가 hex 를 준다)이 막힌다. 반대로 텍스트만 두면 색을 고를 수 없다. 어느 쪽을 바꿔도 같은 onChange 로 나간다.
 *
 * [입력 도중에는 올리지 않는다] '#6B4' 까지 친 순간을 그대로 올리면 캔버스가 엉뚱한 색으로 한 번 깜빡인다. **유효한 hex 가 됐을 때만** onChange 를 발화하고 그 전까지는 지역 초안(draft)으로 들고 있는다. 유효하지 않은 채로 포커스를 떠나면 마지막 유효값으로 되돌린다 — 반쯤 친 값이 화면에 남지 않는다.
 *
 * [스와치 정규화] <input type="color"> 는 #RRGGBB 만 받는다 — 3자리/8자리(알파)를 주면 검정으로 떨어진다. 스와치에 넘길 때만 6자리로 정규화하고 데이터는 원본 그대로 둔다(toSwatchValue).
 *
 * [해소 · Figma 스와치가 빈 흰 사각형이었다 (2026-07-20)] 증상: 플러그인 실행 결과 Swatch 가 아무 색 없는 흰 사각형으로 나왔다. 원인: anatomy.Swatch 가 size·stroke·strokeWidth·radius 만 선언하고 **fill 을 아예 선언하지 않았다.** React 에서는 <input type="color"> 를 브라우저가 네이티브로 칠하므로 CSS 에 background 가 없어도 색이 보이지만, Figma 레이어에는 그 네이티브 페인터가 없어 계약이 지시하지 않으면 기본값(흰색)으로 태어난다. 플러그인은 옳았고 계약이 비어 있었다. 해소: tokens.swatchFill = color.chart.series-1 을 추가하고 anatomy.Swatch.styles.fill 로 걸었다.
 *
 * [왜 스와치 fill 이 표본일 수밖에 없나] value 는 런타임 값이고 Figma 컴포넌트 셋은 정적이다 — 유한한 변형 축으로 만들 수 있는 집합이 아니므로 어떤 토큰을 걸든 **표본(sample)** 이다. 그래서 '어느 표본이 옳은가' 만 남고, 답은 위의 '두 개의 창' 정의가 준다: 다른 한 창인 Hex Value 텍스트가 이미 정적 표본 #2563EB 를 들고 있으므로 스와치도 **같은 색을 보여야** 두 창이 같은 값을 본다. color.chart.series-1 은 light 에서 그 #2563EB(primitive.color.blue.600)로 풀리면서, 동시에 **UI 크롬의 의미가 붙지 않은 유일한 색 계열**이다 — 그 계열의 존재 이유가 '임의의 값을 대신하는 색' 이며 그것이 정확히 스와치가 하는 일이다. color.action.primary.default 도 light 값은 같지만 계약 18건이 체크박스 채움·토글 트랙·탭 인디케이터에 쓰고 있어, 스와치가 그 색을 쓰면 라이브러리 안에서 '체크된 체크박스' 와 같은 그림이 되어 표본이 아니라 **상태로 오독된다.** color.border.focus 는 이미 이 계약의 focusRing 이라 의미가 겹친다. 검사: packages/ui/src/atoms/ColorField/ColorField.test.tsx 의 '계약 anatomy — Figma 스와치가 칠할 것을 갖는다' 블록이 fill 의 존재·키 실존·두 표본 일치를 못박는다.
 */
export interface ColorFieldProps {
  /**
   * 현재 색 — #RGB · #RRGGBB · #RRGGBBAA 를 받는다. 제어 값이며 유효한 hex 로 확정된 onChange 로만 바뀐다
   */
  value: string;
  /**
   * 스크린 리더용 이름(aria-label) — 보이는 <label> 이 없는 자리(패널 상자 안)에서 무슨 색인지 알린다('Canvas color' 등). 스와치에는 '<label> swatch' 로 별도 이름을 준다(한 값에 컨트롤이 둘이라 이름이 갈려야 한다)
   */
  label: string;
  /**
   * hex 텍스트 입력의 DOM id — 한 화면에 색 필드가 여럿일 때 호출부가 유니크 id 를 주입한다. 비우면 id 속성을 렌더하지 않는다
   * @default ""
   */
  id?: string;
  /**
   * 비활성 — 스와치와 텍스트를 함께 잠그고 흐리게 표시한다. onChange 발화 없음
   * @default false
   */
  disabled?: boolean;

  // --- events (계약 events 블록에서 생성) ---
  /**
   * **유효한 hex 일 때만** 새 색 문자열을 발화한다 — 입력 도중의 부분 문자열은 올리지 않는다(캔버스 깜빡임 방지). disabled 에서는 발화 금지 — <input disabled> 가 네이티브로 막는다 (Storybook Play Function 이 전수 검증)
   * 발화 차단 상태: disabled (Storybook Play Function 이 전수 검증)
   */
  onChange?: (payload: string) => void;
}
