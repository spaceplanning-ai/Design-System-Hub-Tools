# Storybook 정보구조(IA) 표준 — 전 컴포넌트 통일 (2026-07-21)

오너 확정 규격에 따라 Design System Storybook 의 **전 컴포넌트(55 계약 · 79 스토리 파일)** 를
하나의 고정 IA 로 통일했다. **Button 이 기준 파일**이다. 정본 지침은 메모리
`storybook-authoring-standard` 와 이 문서가 함께 소유한다.

## 대원칙
- Story 는 **API 문서가 아니라 사용 시나리오 문서**다. 이름은 prop 값(`variant=danger`)이 아니라
  사용자가 이해하는 상태/상황(`Danger`·`Disabled`·`With Icon`).
- **조합 폭발 금지.** 대표 상태만 남기고 나머지 조합은 **Playground 의 Controls** 로 넘긴다.
- 사이드바 위계: `Design System / {Foundations · Components · Patterns · Templates · Catalog}`.
  하위 그룹은 story `name` 의 `/` 로 만든다(예: `name: 'States/Disabled'`).

## 고정 카테고리 어휘 (순서 고정)
```
Component
├─ Docs            autodocs — 모든 컴포넌트 필수
├─ Overview        대표 사용 예제(= 대표 Default 상태)
├─ Playground      Controls 조합 — props/조합 多 컴포넌트만
├─ Variants/       Primary·Secondary·Danger·Success·Warning·Info·Neutral
├─ Sizes/          Tiny·Small·Medium·Large  (한 화면 비교)
├─ States/         Hover·Focus Visible·Disabled·Loading·Error·Selected·Checked·Open·Empty
├─ Types/          Text·Email·Password·Number·Date
├─ Content/        Minimal·Long·Rich·Leading/Trailing Content·Helper Text — 콘텐츠 형태
├─ Examples/       실제 사용 사례: With Icon·Custom Labels·Single/Many Items
├─ Form/           Required·Optional·Validation·Error Message·Form Surface·Counter
├─ Icons/          Leading·Trailing·Icon Only·Icon Gallery
├─ Accessibility/  RTL·Keyboard·ARIA·Focus·Screen Reader
└─ Interaction/    이벤트 검증 play — 짧은 이름: Enabled Change·Disabled Change·Escape Close
```
- 해당 없는 영역은 생략한다.
- **금지어**: story 이름에 `Behavior`(→Interaction) · `Slot`(→Content) · 컴포넌트명 · 테스트 문장.
- **Content = 콘텐츠 형태, Examples = 실제 사용 사례**로 구분.
- 상태 조합은 대표만: `States/Off·On·Disabled·Busy`. 세부 조합은 Playground Controls.
- **RTL 은 한국어**로만(`dir="rtl"` 컨테이너). 아랍어 라벨 전면 제거.

## 계열별 카테고리 세트
| 계열 | 세트 |
|---|---|
| **Button** | Docs·Overview·Playground·Variants·Sizes·States·Icons·Accessibility·Interaction |
| **Form** (TextField·PasswordField·TextareaField·SelectField·DateRangeField·RichTextField·FormField·SearchField·이미지필드류) | Docs·Overview·Playground·Types·States·Form·Content·Accessibility·Interaction |
| **Data** (Table·DataTable·ListCard·Pagination·LineAreaChart) | Docs·Overview·Playground·States·**Features**·Content·Accessibility·Interaction |
| **Overlay** (Modal·ConfirmDialog·Menu·HelpTip·Toast) | Docs·Overview·Playground·States·Content·Examples·Accessibility·Interaction |

`Icon` 은 특수 규칙: Playground(iconName·size·color Controls)·Gallery·Sizes(한 스토리)·Color
Inherit·Decorative·Labelled·Accessibility/RTL·Docs.

## 게이트 안전
- 스토리를 줄여도 커버리지 초록 — `contract-states`(축2)는 `*.test.tsx` 가 소유한다.
- `contract-test` 의 storybook 축은 조합 수가 아니라 **enum 리터럴 존재 + 스토리 ≥2 + argTypes
  spread** 를 검사한다(2026-07-20 이후). 조합 접기는 enum 리터럴이 소스에 남아 있으면 안전하다.
- **`verify:all` 에 `sb:build` 가 없다.** 대량 변경 후 `pnpm sb:build` 로 별도 확인한다 —
  mdx `<Story of>` 파손·JSX 주석 파손 같은 유형은 오직 sb:build 만 잡는다.

## 실행 결과
- **7 배치 · 병렬 fan-out** 으로 55 컴포넌트를 정합. 각 배치마다 중앙 게이트
  (typecheck · lint · contract-test 55/55 · coverage 165/165·26/26 · sb:build) 초록 후 커밋.
- 최종 상태: story 이름 중 `Behavior/` **0건**, 스토리 아랍어 **0건**, `Slot` 이름 **0건**.
- 이전 세션이 남긴 깨진 mdx `<Story of>` 참조 대량 정정(SegmentedControl 15·IconButton 3·
  Divider 2·Checkbox·TableReorder·Spinner·LineAreaChart 등).

## 남은 트랙(별도)
- **Templates = 어드민 전 페이지**(`Design System/Templates/<메뉴>/<페이지>`) — 현재 0/132.
- **미승격 로컬 요소 → DS 승격** + 분류표 커버리지.
