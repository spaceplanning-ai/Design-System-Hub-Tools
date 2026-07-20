// 프리셋 — 왼쪽 레일이 고르는 시작 블록 묶음
//
// [왜 데이터 파일로 두나] 프리셋은 '무엇을 그리는가' 가 아니라 '무엇으로 시작하는가' 다. 화면
// 컴포넌트 안에 흩어 두면 프리셋을 하나 더하는 일이 JSX 수정이 되고, 어떤 프리셋이 어떤 블록을
// 갖는지 한눈에 볼 수 없다. 여기 목록 하나만 늘리면 레일에 항목이 생긴다.
//
// [라벨과 예시 문구는 한국어다] 이 화면은 한국어 관리자다. 초기에는 목업을 그대로 옮겨 영문
// 라벨을 썼는데, 그 결과 같은 모달 안에 'Add a block' 과 '취소' 가 나란히 앉는 반쪽 번역이 됐다.
// 어느 한쪽으로 통일하는 것이 맞고, 이 제품의 언어는 한국어다.
//
// [지운 프리셋 — Reservation reminder]
// 예약 알림 프리셋이 있었지만 제거했다. 이 관리자에서 **예약/신청 관리 자체가 사라졌기** 때문이다.
// 예약 데이터가 없는 제품에서 예약 알림 템플릿은 운영자가 채울 수 없는 빈 껍데기이고, 남겨 두면
// '이 기능이 아직 있다' 고 잘못 알린다. 사라진 기능의 흔적은 지우는 편이 정직하다.
//
// ─────────────────────────────────────────────────────────────────────────────
// [트랜잭션 6종으로 재편 — 이름을 합친 근거]
//
// 커머스가 실제로 보내는 트랜잭션 메일 6종(회원가입·이메일 인증코드·구매 완료·배송 시작·
// 배송 완료·프로모션)을 레일의 축으로 삼는다. **같은 목적의 프리셋을 두 벌 두지 않는다** —
// 운영자가 '환영 메일' 과 '회원가입 이메일' 중 무엇을 골라야 하는지 판단할 근거가 없으면 그
// 목록은 도움이 아니라 방해다. 그래서 다음 셋은 개칭·통합했다.
//
//   welcome(환영 메일)            → signup(회원가입)      : 같은 메일이다. 가입 직후 1통.
//   otp(인증번호(OTP))            → verify-code(이메일 인증코드)
//   ecommerce-receipt(주문 영수증) → purchase-complete(구매 완료)
//
// 한국 커머스의 실제 발송은 **결제 승인 시점의 1통**이고 그 한 통이 주문번호·상품·결제금액을
// 함께 싣는다. 순수 금액 명세형 영수증이 필요한 자리는 **구독 영수증**이 이미 맡고 있다
// (정기결제는 주문 접수라는 사건이 없어 금액 명세만 남는다).
//
// ─────────────────────────────────────────────────────────────────────────────
// [디자인 — 정렬 레이아웃(카카오디벨로퍼스 계열 트랜잭션 메일)]
//
// 12종 전부가 하나의 골격을 공유한다. 이전 라운드의 '주황 글자 링크 CTA + 라벨-값 2열' 계열은
// 폐기했다 — 그쪽은 정보가 좌우로 흩어져 스캔 동선이 지그재그였고, 정보 덩어리의 경계가
// 여백뿐이라 어디까지가 한 묶음인지 눈으로 잡히지 않았다. 새 골격은 **덩어리를 색과 선으로
// 끊고, 정보를 한 열로 세로로 흘린다**:
//
//   ┌────────────────────────────────────┐
//   │ [상단 밴드]  진한 남색 · 로고        │  ← 브랜드가 서는 자리. 본문과 색으로 끊긴다
//   ├────────────────────────────────────┤
//   │  큰 제목 한 줄                       │
//   │  본문 문단                           │
//   │  ┌──────────────────────────────┐  │
//   │  │ 굵은 라벨                     │  │  ← 정보 패널. 옅은 면으로 한 덩어리임을 표시
//   │  │ · 항목 : 값                   │  │
//   │  │ · 항목 : 값                   │  │
//   │  └──────────────────────────────┘  │
//   │  파란 글자 링크                      │  ← 부차 행동
//   │           [ 진한 각진 버튼 ]         │  ← 최종 행동 하나. 가운데 정렬
//   ├────────────────────────────────────┤  ← 가는 선이 본문과 푸터를 끊는다
//   │  발신전용 안내 · 사업자 정보 · 수신거부 │
//   └────────────────────────────────────┘
//
// [레퍼런스와 다르게 간 세 곳 — 전부 근거가 있다]
//
// (1) **폭 600px** (레퍼런스는 640). 본문 폭의 주인은 프리셋이 아니라 렌더러다
//     (render-html.ts 의 EMAIL_BODY_WIDTH). 그 값은 Outlook 유령 표의 칸 폭 계산에까지 쓰여서
//     프리셋 하나 때문에 바꿀 수 있는 숫자가 아니다. 좌우 40px 여백은 그대로 지켜 안폭 520px 을
//     쓴다 — 한국어 본문이 한 줄에 30자 안팎 들어가는 읽기 좋은 폭이다.
//
// (2) **정보 패널이 '테두리 박스' 가 아니라 '옅은 면'**. 블록 모델에 테두리 필드가 없고
//     (types.ts 의 어느 블록에도 border 가 없다), 배경색은 언제나 `<td>` 에 얹혀 폭을 꽉 채운다
//     (render-html.ts 의 row). 안쪽으로 들여 넣은 상자를 만들려면 단일 칸 컨테이너가 필요한데
//     ColumnRatio 는 최소가 2칸이다('1:1'). **테두리를 흉내 내려고 새 필드나 새 blockKind 를
//     만들지 않았다** — 옅은 면은 같은 일(‘여기까지가 한 덩어리’)을 하면서 메일 클라이언트
//     어디서나 똑같이 그려진다. 테두리는 Word 엔진에서 자주 굵기가 달라진다.
//
// (3) **작은 소제목(레퍼런스의 h3 14px)은 heading 이 아니라 굵은 text**. heading 의 글자 크기는
//     단계가 정한다(h1 32 · h2 24 · h3 20 — render-html.ts HEADING_FONT_SIZE). 14~15px 소제목을
//     heading 으로 넣으면 20px 로 나가 본문과 구별이 흐려진다. 굵기로 위계를 만드는 편이 맞다.
//
// [블록 종류를 늘리지 않았다 — 판별 유니온은 그대로 14종이다]
//   · 상단 색 밴드      → `columns` 블록의 backgroundColor + 칸 안의 `logo`.
//                        (로고 블록 자체에는 배경색 필드가 없다. 컬럼 행은 갖고 있다.)
//   · 정보 패널        → 같은 배경색을 가진 `text`(굵은 라벨) + `list`(불릿) 두 장.
//   · 파란 글자 링크    → `menu` 블록(항목 1개). 메뉴는 태생이 '색 있는 글자 링크의 줄' 이다.
//   · 본문/푸터 경계선  → 좌우 여백 0 의 `divider` — 카드 폭을 가로지르는 선이 된다.
//   · 큰 인증코드      → `heading` h1 을 가운데 정렬하고 옅은 면을 깐다.
//
// [이미지로 때우지 않는다] 프리셋은 편집 가능한 블록 조합이다. 프로모션조차 '배너 한 장' 이
// 아니라 이미지 + 제목 + 가격이 든 2단 그리드로 짠다 — 운영자가 상품 하나만 바꿔 끼울 수 있어야
// 프리셋이지, 통이미지는 디자인이 아니라 첨부다.
//
// [12벌이 껍데기만 같지 않게] 골격은 공유하되 가운데가 다르다: 회원가입은 가입정보,
// 인증코드는 큰 코드판과 만료시간(링크·버튼 없음 — 코드 복사와 시선을 경쟁시키지 않는다),
// 구매 완료는 결제 명세, 배송 시작은 운송장·택배사·조회, 배송 완료는 수령확인·반품기한·리뷰,
// 프로모션은 상품 그리드·기간·쿠폰. 나머지 다섯도 각자 나르는 정보로 가운데를 채웠다.
import {
  isTemplateVariableKey,
  templateVariableToken,
} from '../../../../shared/domain/template-variables';
import {
  applyColumnRatio,
  COLUMN_CHILD_PADDING,
  createBlock,
  createLeafBlock,
  DEFAULT_CANVAS,
  hexColor,
  ZERO_PADDING,
} from './blocks';
import type {
  BlockPadding,
  ColumnRatio,
  EmailBlock,
  EmailCanvasStyle,
  EmailLeafBlock,
} from '../types';

export type PresetId =
  | 'blank'
  | 'signup'
  | 'verify-code'
  | 'purchase-complete'
  | 'shipping-started'
  | 'delivery-complete'
  | 'promotion'
  | 'reset-password'
  | 'subscription-receipt'
  | 'post-metrics'
  | 'respond-inquiry'
  | 'two-column-feature';

/** 블록 id 를 만들어 주는 쪽 — 빌더가 자기 카운터를 넘긴다(전역 카운터를 두지 않는다) */
export type IdFactory = () => string;

export interface EmailPreset {
  readonly id: PresetId;
  /** 레일에 보이는 이름 */
  readonly label: string;
  /** 시작 블록 묶음. 빈 템플릿은 빈 배열이다 */
  readonly build: (nextId: IdFactory) => readonly EmailBlock[];
  /** 프리셋이 제안하는 제목 — 비면 제목을 건드리지 않는다 */
  readonly subject: string;
}

/* ── 치환 변수 ────────────────────────────────────────────────────────────────
 *
 * [왜 본문에 직접 적지 않고 한 표를 거치나] 트랜잭션 메일은 값이 사람마다 다르다 — 주문번호가
 * 고정 문자열인 프리셋은 시작점이 아니라 잘못된 예시다. 그래서 본문은 전부 토큰을 쓴다.
 *
 * 그 토큰의 **정본은 여기가 아니라 변수 카탈로그**(shared/domain/template-variable-catalog.ts)다.
 * 프리셋이 문자열을 직접 적으면 카탈로그에 없는 이름이 조용히 섞이고, 발송 시점에 치환되지 않은
 * `#{ORDER_NO}` 가 그대로 수신자에게 간다. 프리셋이 무엇에 의존하는지를 표 하나로 드러내
 * **카탈로그와 대조할 수 있는 자리**를 만든다.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * [대조가 끝났다 — 그리고 절반은 토큰이 될 수 없었다]
 *
 * (가) **실재하는 값** — 회원·쿠폰·상품·정책·게시물·문의에서 근거를 찾았다. 카탈로그 키를
 *      그대로 쓴다. 표기는 `#{namespace.field}` 다.
 *
 * (나) **이 관리자에 없는 값** — 주문·배송추적·인증코드·구독결제. `[주문번호]` 처럼 **평문
 *      자리표시**로 둔다.
 *
 *      왜 토큰으로 두지 않는가: 이 관리자에는 주문(Order) 도메인이 아예 없다. 등록·수정 화면도,
 *      타입도, 픽스처도 없다. 없는 필드에 이름을 붙여 카탈로그에 넣으면 그 토큰은 발송 시점에
 *      **영원히 치환되지 않고** `#{order.no}` 라는 글자가 그대로 수신자에게 간다 — 이 기능이
 *      막으려던 바로 그 사고다. 그래서 `validation.ts` 의 알 수 없는 토큰 검사가 저장 자체를
 *      거절한다. 자리표시로 두면 저장은 통과하고, 운영자는 그 대괄호를 보고 손으로 채우거나
 *      프리셋을 고른 뒤 지운다 — **치환되는 척하지 않는 것**이 핵심이다.
 *
 *      비슷하지만 다른 이유로 빠진 것: 일회용 인증코드는 도메인 필드가 아니라 발송 시점
 *      파라미터이고, 카탈로그에 올리면 아무 템플릿에서나 꺼내 쓸 수 있게 되어 마케팅 메일에도
 *      꽂힌다(카탈로그 머리말 (가)).
 *
 * 주문·배송 도메인이 생기면 (나)의 항목을 카탈로그에 넣고 이 표의 값만 키로 바꾸면 된다 —
 * 본문 수십 군데는 손대지 않는다. 아래 `v()` 가 둘을 표기로 구분한다.
 * ───────────────────────────────────────────────────────────────────────────── */
const V = {
  /* 회원 — shared/domain/member.ts */
  firstName: 'member.name',
  loginId: 'member.account',
  /** 이 관리자에서 계정이 곧 이메일이다 — 별도 필드가 없어 같은 키를 가리킨다 */
  email: 'member.account',
  signedUpAt: 'member.joinedAt',
  memberTier: 'member.tier',
  receiverName: 'member.name',
  shippingAddress: 'member.address',

  /* 상품 — 상품·쿠폰·배송정책·적립정책 */
  carrierName: 'shippingPolicy.carrier',
  returnFee: 'shippingPolicy.returnFee',
  freeShippingThreshold: 'shippingPolicy.freeThreshold',
  earnRate: 'pointsPolicy.earnRate',
  signupBonus: 'pointsPolicy.signupBonus',
  pointsExpireMonths: 'pointsPolicy.expireMonths',
  promotionName: 'coupon.name',
  /** 정률/정액/무료배송을 알아서 표기한다 — 숫자만 쓰면 유형이 섞일 때 문구가 깨진다 */
  discountRate: 'coupon.discountLabel',
  couponCode: 'coupon.code',
  couponMinOrder: 'coupon.minOrderAmount',
  promotionStart: 'coupon.startAt',
  promotionEnd: 'coupon.endAt',

  /* 게시물 — 콘텐츠 관리의 공지 */
  postTitle: 'notice.title',
  postViews: 'notice.views',
  postPublishedAt: 'notice.publishedAt',
  postAuthor: 'notice.author',

  /* 문의 — 영업 문의 */
  inquiryNo: 'inquiry.inquiryNo',
  inquiryTitle: 'inquiry.title',
  inquiryReceivedAt: 'inquiry.receivedAt',
  inquiryAssignee: 'inquiry.assignee',

  /* ── 아래는 (나) 자리표시다 — 토큰이 아니라 평문이다 ────────────────────── */

  /* 인증 — 발송 시점 파라미터 */
  verifyCode: '[인증코드]',
  verifyCodeTtl: '[유효시간]',
  requestedAt: '[요청일시]',

  /* 주문 — 이 관리자에 Order 도메인이 없다 */
  orderNo: '[주문번호]',
  orderedAt: '[주문일시]',
  orderItemSummary: '[주문상품]',
  paymentMethod: '[결제수단]',
  orderTotal: '[결제금액]',

  /* 배송 추적 — 송장/운송장 필드가 어디에도 없다 */
  trackingNo: '[운송장번호]',
  deliveryEta: '[도착예정일]',
  deliveredAt: '[배송완료일시]',
  deliveryPlace: '[수령장소]',

  /* 구독 결제 — 정기결제 도메인이 없다(회원의 단건 결제만 있다) */
  planName: '[구독상품]',
  billedAt: '[결제일시]',
  billingAmount: '[결제금액]',
  nextBillingAt: '[다음결제일]',
} as const;

/**
 * 프리셋 본문이 의존하는 **카탈로그 키** — 자리표시는 빼고 실재하는 것만.
 *
 * 목록을 손으로 또 적지 않고 표에서 뽑는다. 두 곳에 적으면 반드시 한쪽만 갱신된다.
 *
 * [왜 중복을 제거하나] 표의 서로 다른 칸이 같은 카탈로그 키를 가리킬 수 있다 — '수령인 이름'
 * 과 '회원 이름' 은 본문에서 다른 뜻이지만 이 관리자에는 수령인 필드가 따로 없어 둘 다
 * `member.name` 이다. 이 목록이 답하는 질문은 '본문에 몇 칸이 있나' 가 아니라 '카탈로그의
 * 무엇에 의존하나' 이므로 집합이 맞다.
 */
export const PRESET_VARIABLE_KEYS: readonly string[] = [
  ...new Set(Object.values(V).filter(isTemplateVariableKey)),
];

/**
 * 표의 한 칸을 본문에 넣을 글자로 바꾼다.
 *
 * [왜 분기가 여기 있는가] 표에는 두 종류가 섞여 있다 — 카탈로그 키(`member.name`)와 평문
 * 자리표시(`[주문번호]`). 호출부 수십 군데가 그 차이를 알아야 한다면 표를 고칠 때마다 본문도
 * 같이 고쳐야 하고, 그러면 '표 한 곳만 고치면 된다' 는 이 구조의 이유가 사라진다.
 *
 * 구분은 **모양**이 한다: 카탈로그 키는 `namespace.field` 규칙을 만족하고(정본 판정은
 * `shared/domain/template-variables` 의 isTemplateVariableKey), 자리표시는 만족하지 않는다.
 * 그래서 주문 도메인이 생겨 `orderNo` 를 `'order.orderNo'` 로 바꿔 적는 순간, 이 함수가
 * 자동으로 토큰으로 감싸기 시작한다 — 본문은 한 글자도 건드리지 않는다.
 */
function v(key: string): string {
  return isTemplateVariableKey(key) ? templateVariableToken(key) : key;
}

/**
 * 배송 조회 주소 — **주소 칸에는 토큰만 넣지 않는다**.
 *
 * [왜 `#{TRACKING_URL}` 이 아닌가 — 렌더러가 조용히 지운다] render-html 의 safeUrl 은 스킴이
 * 없고 도메인 꼴도 아닌 문자열을 빈 값으로 돌려보낸다(`http(s)`·`mailto`·`tel` 또는 `a.com/…`
 * 만 통과). 토큰 하나만 적은 주소는 그 어느 쪽도 아니라 `href` 가 통째로 빠지고, **버튼은
 * 그대로 그려지는데 눌러도 아무 데도 가지 않는다** — 미완성 표시도 뜨지 않는다(isBlockIncomplete
 * 는 '비어 있는지' 만 보고 렌더 결과를 모른다).
 *
 * 그래서 주소는 실재하는 https 로 두고 **토큰은 질의 문자열에 싣는다**. 스킴이 있으니 링크가
 * 살아남고, 발송 시점 치환은 문자열 어디에 있든 똑같이 일어난다. (같은 함정이 운영자에게도
 * 열려 있다 — 명세 §7 #28 에 남겼다.)
 */
const TRACKING_URL = `https://example.com/delivery/track?invoice=${v(V.trackingNo)}`;

/* ── 팔레트 (블록 데이터의 초기값 — 토큰이 아니다) ───────────────────────────
 *
 * blocks.ts 머리말과 같은 이유로 `#` 를 코드로 붙인다: 이 값들은 화면 크롬의 색이 아니라
 * **운영자가 컬러 피커로 바꾸는 데이터의 초기값**이다. 수신자의 메일함에는 우리 스타일시트가
 * 없어 `var(--tds-…)` 는 아무것도 해석되지 않는다(render-html.ts 의 CANVAS_BORDER_WIDTH 머리말).
 *
 * 값은 레퍼런스 메일의 실제 수치를 그대로 옮겼다 — 눈대중으로 근처 색을 고르면 밴드와 버튼이
 * '거의 같은 남색' 두 개가 되어 같은 화면에서 서로를 흐린다. */

/** 상단 밴드의 진한 남색 */
const BAND_NAVY = hexColor('19234B');

/** 하단 주 버튼 — 밴드보다 아주 조금 밝다. 같은 계열임을 유지하면서 면이 앞으로 나온다 */
const BUTTON_NAVY = hexColor('1D2249');

/** 제목의 잉크 — 레퍼런스는 h3 에 순검정을 쓴다 */
const TITLE_INK = hexColor('000000');

/** 본문 잉크 */
const BODY_INK = hexColor('191919');

/** 정보 패널의 옅은 면 — '여기까지가 한 덩어리' 를 말하는 유일한 장치다(테두리 필드가 없다) */
const PANEL_FILL = hexColor('F7F8FA');

/** 본문과 푸터를 끊는 선 · 패널 아래 경계 — 레퍼런스의 `1px solid #eeeeee` */
const HAIRLINE = hexColor('EEEEEE');

/**
 * 글자 링크의 파랑.
 *
 * [왜 브랜드색이 아닌가] 이 자리는 '버튼이 아닌 CTA' 다 — 면적으로 눈에 띄지 못하므로 색 하나로
 * '누를 수 있다' 를 말해야 한다. 본문·제목이 전부 무채색인 레이아웃에서 유일한 유채색이 되도록
 * 채도가 높은 파랑을 둔다(레퍼런스의 목록 안 링크 색이다).
 */
const LINK_BLUE = hexColor('2D50FF');

/** 푸터 잔글씨 — 레퍼런스의 `color:#888` */
const MUTED_INK = hexColor('888888');

/** 상단 밴드 위의 글자 — 진한 남색 위에서 읽혀야 한다 */
const ON_BAND = hexColor('FFFFFF');

/* ── 치수 ─────────────────────────────────────────────────────────────────────
 *
 * 본문 폭은 600px 고정이다(render-html.ts 의 EMAIL_BODY_WIDTH — 머리말 (1) 참조). 좌우 40px 을
 * 비우면 글자가 서는 폭이 520px 다. */

const GUTTER = 40;
const BODY_WIDTH_INNER = 520;

function pad(top: number, bottom: number, side: number = GUTTER): BlockPadding {
  return { top, bottom, left: side, right: side };
}

/* ── 골격 조각 ───────────────────────────────────────────────────────────────
 *
 * createBlock 이 만든 기본 블록에 프리셋의 문구·색·여백만 덮어쓴다 — 기본값을 프리셋마다 다시
 * 적지 않기 위해서다(기본값의 주인은 blocks.ts 하나).
 *
 * 세로 리듬은 여백으로만 만든다. spacer 블록을 끼워 넣는 방식도 있지만, 그러면 운영자가 제목
 * 하나를 지웠을 때 정체 모를 빈 블록이 남는다 — 여백은 그것을 가진 블록과 함께 사라지는 편이 낫다. */

/**
 * [상단 밴드] 진한 남색 띠 + 그 안의 로고.
 *
 * [왜 columns 인가 — logo 블록에는 배경색이 없다] LogoBlock 의 필드는 파일명·크기·모양·정렬이
 * 전부다(types.ts). 띠를 만들려면 배경색을 가진 무언가가 로고를 감싸야 하는데, 그 일을 할 수
 * 있는 컨테이너는 컬럼 행뿐이다. **밴드를 위해 blockKind 를 늘리지 않았다** — 컬럼 행은 이미
 * 배경색과 여백을 갖고 있고, 운영자가 밴드 색을 바꾸는 경로(INSPECT 의 배경색)도 이미 있다.
 *
 * [왜 비율이 '2:1' 인가] '1:1' 이 아닌 이유는 미학이 아니라 계약이다 — 프로모션 프리셋의
 * 상품 그리드가 '최상위의 1:1 컬럼 행' 으로 식별된다(presets.test.ts). 밴드가 1:1 이면 그
 * 검사가 밴드를 상품 그리드로 착각해 '이미지가 없다' 며 넘어진다. 로고는 왼쪽 넓은 칸에 선다.
 *
 * [왜 로고 옆에 흰 워드마크 글자를 두나 — 로고만 두면 발송 HTML 에서 띠가 빈 상자가 된다]
 * 컬럼 행의 `<td>` 에는 `font-size:0` 이 붙는다(칸 사이 4px 틈을 없애려는 조치 —
 * render-html.ts renderColumnsRow). 그런데 로고·이미지는 업로드 이음매가 없어 `[로고: logo.png]`
 * 라는 **맨 글자**로 렌더되고, 맨 글자는 자기 font-size 를 갖지 않아 그 0 을 그대로 물려받아
 * **사라진다**. 캔버스(BlockView)는 자리표시 상자를 그려서 멀쩡해 보이므로, 발송 HTML 을 직접
 * 열어 보기 전에는 띠가 비었다는 사실을 알 수 없다. 문단(`<p>`)은 자기 font-size 를 갖고
 * 나가므로 워드마크 글자가 두 세계 모두에서 살아남는다 — 로고를 지우는 대신 옆에 세운다.
 * (업로드가 붙어 로고가 진짜 `<img>` 로 나가면 이 글자는 운영자가 지우면 된다.)
 */
function brandBand(nextId: IdFactory): EmailBlock {
  const logo = createLeafBlock('logo', nextId());
  const mark: EmailLeafBlock =
    logo.blockKind === 'logo'
      ? {
          ...logo,
          // 파일명은 URL 이 아니다 — 캔버스는 자리표시 상자를, 메일 HTML 은 `[로고: …]` 를 낸다.
          // 외부 CDN 주소를 박으면 픽스처가 깨진 이미지를 참조하던 전례를 반복한다.
          fileName: 'logo.png',
          size: 24,
          shape: 'square',
          align: 'left',
          padding: ZERO_PADDING,
        }
      : logo;

  const word = createLeafBlock('text', nextId());
  const wordmark: EmailLeafBlock =
    word.blockKind === 'text'
      ? {
          ...word,
          content: 'SPACEPLANNING',
          fontSize: 15,
          fontWeight: 'bold',
          align: 'right',
          textColor: ON_BAND,
          padding: ZERO_PADDING,
        }
      : word;

  const base = createBlock('columns', nextId());
  if (base.blockKind !== 'columns') return base;
  const next = applyColumnRatio(base, '2:1');
  return {
    ...next,
    backgroundColor: BAND_NAVY,
    gap: 0,
    verticalAlign: 'middle',
    padding: pad(26, 26),
    columns: next.columns.map((column, index) => ({
      ...column,
      blocks: index === 0 ? [mark] : [wordmark],
    })),
  };
}

/** 큰 제목 한 줄 — 이 메일이 무슨 소식인지 여기서 끝난다 */
function title(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('heading', nextId());
  if (base.blockKind !== 'heading') return base;
  return {
    ...base,
    content,
    level: 'h2',
    align: 'left',
    textColor: TITLE_INK,
    padding: pad(36, 0),
  };
}

/** 본문 문단 — `**강조어**` 만 볼드로 나간다(render-html 의 parseInlineMarkdown) */
function body(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content,
    markdown: true,
    fontSize: 14,
    align: 'left',
    textColor: BODY_INK,
    padding: pad(14, 0),
  };
}

/**
 * 작은 굵은 소제목 — 레퍼런스의 `h3 14px/600`.
 *
 * heading 블록을 쓰지 않는 이유는 머리말 (3) 에 있다: heading 의 크기는 단계가 정해서
 * 가장 작은 h3 도 20px 이라 본문과의 위계가 크기로 벌어져 버린다. 여기서 필요한 것은
 * '조금 굵을 뿐 같은 크기' 다.
 */
function subhead(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content,
    fontSize: 15,
    fontWeight: 'bold',
    align: 'left',
    textColor: TITLE_INK,
    padding: pad(28, 0),
  };
}

/** 본문보다 작은 보조 문구 — 만료 안내·유의사항처럼 '읽으면 좋은' 줄 */
function note(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content,
    markdown: true,
    fontSize: 13,
    align: 'left',
    textColor: MUTED_INK,
    padding: pad(14, 0),
  };
}

/* ── 정보 패널 ────────────────────────────────────────────────────────────────
 *
 * 레퍼런스의 `blockquote` — 굵은 라벨 + 불릿 목록이 한 상자에 든다. 여기서는 두 블록이 **같은
 * 배경색**을 이어 받아 하나의 면으로 읽힌다(머리말 (2) 의 근거). 두 장으로 나눈 덕에 운영자가
 * 라벨만 고치거나 항목만 늘리는 편집이 각각 독립적이다.
 *
 * 여백은 위/아래를 나눠 갖는다: 라벨이 위쪽 24px 을, 목록이 아래쪽 24px 을 가져 두 장 사이에는
 * 틈이 없다 — 틈이 생기면 배경색이 끊겨 상자가 두 개로 보인다. */

/** 패널의 굵은 라벨 */
function panelLabel(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'left',
    textColor: TITLE_INK,
    backgroundColor: PANEL_FILL,
    padding: pad(24, 10),
  };
}

/** 패널의 불릿 목록 */
function panelList(nextId: IdFactory, texts: readonly string[]): EmailLeafBlock {
  const base = createLeafBlock('list', nextId());
  if (base.blockKind !== 'list') return base;
  return {
    ...base,
    items: texts.map((text, index) => ({ id: `${base.id}-item-${String(index + 1)}`, text })),
    ordered: false,
    fontSize: 14,
    textColor: BODY_INK,
    backgroundColor: PANEL_FILL,
    padding: pad(0, 24),
  };
}

/** 굵은 라벨 + 불릿 목록 한 덩어리 */
function panel(
  nextId: IdFactory,
  label: string,
  items: readonly string[],
): readonly EmailLeafBlock[] {
  return [panelLabel(nextId, label), panelList(nextId, items)];
}

/** 패널 항목 한 줄 — `항목 : 값`. 값이 그 메일의 핵심이면 호출부가 `**` 로 감싼다 */
function line(label: string, value: string): string {
  return `${label} : ${value}`;
}

/** 패널 밖의 맨 불릿 목록 — 안내·유의사항처럼 '값' 이 아닌 것들 */
function plainList(nextId: IdFactory, texts: readonly string[]): EmailLeafBlock {
  const base = createLeafBlock('list', nextId());
  if (base.blockKind !== 'list') return base;
  return {
    ...base,
    items: texts.map((text, index) => ({ id: `${base.id}-item-${String(index + 1)}`, text })),
    ordered: false,
    fontSize: 14,
    textColor: BODY_INK,
    padding: pad(12, 0),
  };
}

/**
 * 파란 글자 링크 — 부차 행동.
 *
 * [왜 button 이 아니라 menu 인가] 레퍼런스는 버튼과 글자 링크를 한 메일 안에서 구분해 쓴다 —
 * 부차 행동은 글자, 최종 행동은 하단 진한 버튼. button 블록으로 흉내 내려면 버튼 색을 투명으로
 * 두고 글자색만 바꿔야 하는데, 그러면 INSPECT 에 '버튼 색' 이 남아 운영자가 색을 넣는 순간
 * 의도가 무너진다. menu 는 태생이 '색 있는 글자 링크의 줄' 이다.
 */
function linkCta(nextId: IdFactory, label: string, url: string): EmailLeafBlock {
  const base = createLeafBlock('menu', nextId());
  if (base.blockKind !== 'menu') return base;
  return {
    ...base,
    items: [{ id: `${base.id}-item-1`, label, url }],
    separator: '·',
    align: 'left',
    textColor: LINK_BLUE,
    fontWeight: 'medium',
    fontSize: 14,
    padding: pad(20, 0),
  };
}

/**
 * 가운데 정렬된 진한 각진 버튼 — 이 메일의 최종 행동 하나.
 *
 * 레퍼런스의 `padding:15px 40px · font-size:16 · font-weight:700 · 모서리 각짐` 을 옮겼다.
 * 크기는 `lg`(16/32px)가 가장 가깝고, `shape: 'rectangle'` 이 각진 모서리다.
 */
function primaryButton(nextId: IdFactory, content: string, url: string): EmailLeafBlock {
  const base = createLeafBlock('button', nextId());
  if (base.blockKind !== 'button') return base;
  return {
    ...base,
    content,
    url,
    buttonColor: BUTTON_NAVY,
    shape: 'rectangle',
    size: 'lg',
    width: 'auto',
    align: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    padding: pad(30, 8),
  };
}

/**
 * 큰 코드판 — 인증코드 전용.
 *
 * 별도 블록 종류를 만들지 않고 heading 을 가운데 정렬해 쓴다. 코드는 '읽어서 옮겨 적는 값' 이라
 * 제목만큼 커야 하고, h1(32px)이 이미 그 크기다. 옅은 면을 깔아 복사할 영역임을 알린다.
 */
function codePanel(nextId: IdFactory, code: string): EmailLeafBlock {
  const base = createLeafBlock('heading', nextId());
  if (base.blockKind !== 'heading') return base;
  return {
    ...base,
    content: code,
    level: 'h1',
    align: 'center',
    textColor: TITLE_INK,
    backgroundColor: PANEL_FILL,
    padding: pad(30, 30, 24),
  };
}

/** 상품 한 칸 — 이미지 + 이름 + 가격. 프로모션 그리드의 최소 단위다 */
function productCell(
  nextId: IdFactory,
  fileName: string,
  alt: string,
  name: string,
  price: string,
): readonly EmailLeafBlock[] {
  const image = createLeafBlock('image', nextId());
  const cover: EmailLeafBlock =
    image.blockKind === 'image'
      ? {
          ...image,
          fileName,
          alt,
          // 2단 그리드의 한 칸 — 본문 안폭의 절반에서 칸 여백을 뺀 값
          width: Math.floor(BODY_WIDTH_INNER / 2) - 16,
          horizontalAlign: 'left',
          padding: { ...COLUMN_CHILD_PADDING, bottom: 0 },
        }
      : image;

  const label = createLeafBlock('text', nextId());
  const caption: EmailLeafBlock =
    label.blockKind === 'text'
      ? {
          ...label,
          content: `${name}\n**${price}**`,
          markdown: true,
          fontSize: 14,
          align: 'left',
          textColor: BODY_INK,
          padding: COLUMN_CHILD_PADDING,
        }
      : label;

  return [cover, caption];
}

/* ── 컬럼 안에 들어가는 조각 ──────────────────────────────────────────────────
 *
 * 칸은 260px 안팎이라 최상위와 같은 40px 여백을 쓰면 글자가 설 자리가 없다. 칸 안 블록의 여백은
 * blocks.ts 의 COLUMN_CHILD_PADDING(8px)이 정본이다 — 여기서 다시 정하지 않는다. */

/** 칸 안의 굵은 소제목 */
function columnSubhead(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content,
    fontSize: 15,
    fontWeight: 'bold',
    align: 'left',
    textColor: TITLE_INK,
    padding: COLUMN_CHILD_PADDING,
  };
}

/** 칸 안의 본문 */
function columnBody(nextId: IdFactory, content: string): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content,
    markdown: true,
    fontSize: 14,
    align: 'left',
    textColor: BODY_INK,
    padding: COLUMN_CHILD_PADDING,
  };
}

/** 2단 행 하나 — 왼쪽/오른쪽 칸에 넣을 블록을 그대로 받는다 */
function twoColumn(
  nextId: IdFactory,
  ratio: ColumnRatio,
  cells: readonly (readonly EmailLeafBlock[])[],
): EmailBlock {
  const base = createBlock('columns', nextId());
  if (base.blockKind !== 'columns') return base;
  const next = applyColumnRatio(base, ratio);
  return {
    ...next,
    // 칸 안 블록이 이미 8px 을 갖는다 — 행의 좌우는 그만큼 덜 줘 합이 GUTTER 가 되게 한다
    padding: { top: 0, bottom: 0, left: GUTTER - 8, right: GUTTER - 8 },
    columns: next.columns.map((column, index) => ({ ...column, blocks: cells[index] ?? [] })),
  };
}

/* ── 푸터 덩어리 ──────────────────────────────────────────────────────────────
 *
 * 레퍼런스의 푸터는 세 문단이다: (1) 발신전용 + 수신설정, (2) 사업자 정보 잔글씨,
 * (3) Copyright. 여기서는 (1)(2)를 작은 text 로, (3)의 자리를 **법적 푸터 블록**이 맡는다 —
 * 전송자 명칭·주소·연락처와 **수신거부 링크**가 그 블록의 필드라서, 저작권 표기만 있는 줄보다
 * 법이 요구하는 것을 실제로 담는다.
 *
 * 그 위의 가는 선이 본문 카드와 푸터를 끊는다. 좌우 여백을 0 으로 두어 카드 폭을 가로지르게
 * 하면 레퍼런스의 `border-top` 과 같은 자리를 차지한다. */

/** 본문과 푸터를 끊는 선 — 좌우 여백 0 이라 카드 폭을 가로지른다 */
function footerRule(nextId: IdFactory): EmailLeafBlock {
  const base = createLeafBlock('divider', nextId());
  if (base.blockKind !== 'divider') return base;
  return {
    ...base,
    height: 1,
    color: HAIRLINE,
    padding: { top: 40, bottom: 0, left: 0, right: 0 },
  };
}

/** 발신전용 안내 — 수신자가 답장해도 아무도 읽지 않는다는 사실을 먼저 밝힌다 */
function footerNotice(nextId: IdFactory): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content:
      '본 메일은 발신전용으로 회신되지 않습니다. 문의는 고객센터를 이용해 주세요.\n수신 설정은 아래 링크에서 언제든 변경하실 수 있습니다.',
    fontSize: 13,
    align: 'left',
    textColor: MUTED_INK,
    padding: pad(30, 0),
  };
}

/**
 * 사업자 정보 잔글씨.
 *
 * [왜 실명·실제 번호가 아닌가] 프리셋은 시작점이지 완성본이 아니다. 그럴듯한 가짜 사업자번호를
 * 박아 두면 운영자가 '이미 채워져 있다' 고 믿고 그대로 발행한다 — 0 으로 채운 자리는 눈에 띄어
 * 반드시 고치게 된다. (저장소 전반의 규약이기도 하다: 더미에 실명·실제 회사명을 쓰지 않는다.)
 */
function footerBusinessInfo(nextId: IdFactory): EmailLeafBlock {
  const base = createLeafBlock('text', nextId());
  if (base.blockKind !== 'text') return base;
  return {
    ...base,
    content:
      '사업자등록번호 000-00-00000 · 통신판매업신고 제0000-서울-00000호\n대표이사 000 · 개인정보보호책임자 000 · 팩스 02-0000-0000',
    fontSize: 12,
    align: 'left',
    textColor: MUTED_INK,
    padding: pad(12, 0),
  };
}

/**
 * 법적 푸터 — **모든 프리셋의 마지막 블록**이다(Blank 제외).
 *
 * [왜 프리셋마다 붙이나] 정보통신망법 제50조가 요구하는 수신거부 안내는 '넣으면 좋은 것' 이
 * 아니라 빠지면 안 되는 것이다. 운영자가 프리셋에서 시작하면 그 자리가 이미 있어야 한다 —
 * 빈 상태에서 '푸터를 넣어야 한다' 는 사실을 스스로 떠올리기를 기대하지 않는다.
 * (Blank 는 말 그대로 백지라 붙이지 않는다. 대신 지울 수 없다는 규칙은 넣은 뒤부터 적용된다.)
 *
 * [트랜잭션 메일에도 붙이는 이유] 정보통신망법의 수신거부 의무는 **광고성 정보**에 걸리므로
 * 배송 안내 같은 순수 거래 정보 메일에는 법적으로 요구되지 않는다. 그럼에도 자리를 남겨 두는
 * 것은 (1) 실무에서 트랜잭션 메일에 혜택·추천이 한 줄이라도 섞이는 순간 광고성이 되고,
 * (2) 운영자가 그 경계를 매번 판정하기보다 이미 있는 블록을 지우지 않는 편이 안전하기 때문이다.
 *
 * [정렬을 왼쪽으로 바꿨다] 기본값은 가운데 정렬이지만, 새 골격의 푸터는 위 두 문단과 같은
 * 왼쪽 기준선 위에 서야 한 덩어리로 읽힌다 — 잔글씨 세 문단 중 하나만 가운데면 그 문단이
 * 딴 데서 온 것처럼 보인다.
 */
function legalFooter(nextId: IdFactory): EmailLeafBlock {
  const base = createLeafBlock('footer', nextId());
  if (base.blockKind !== 'footer') return base;
  return {
    ...base,
    companyName: '(주) 스페이스플래닝',
    companyAddress: '서울특별시',
    contactEmail: 'help@example.com',
    unsubscribeUrl: 'https://example.com/unsubscribe',
    fontSize: 12,
    align: 'left',
    textColor: MUTED_INK,
    linkColor: BODY_INK,
    padding: pad(14, 40),
  };
}

/** 푸터 덩어리 전체 — 선 · 발신전용 · 사업자 정보 · 법적 푸터 */
function footerStack(nextId: IdFactory): readonly EmailLeafBlock[] {
  return [
    footerRule(nextId),
    footerNotice(nextId),
    footerBusinessInfo(nextId),
    legalFooter(nextId),
  ];
}

/* ── 프리셋 목록 ───────────────────────────────────────────────────────────
 *
 * 순서는 **고객의 시간 순**이다: 가입 → 인증 → 구매 → 배송 시작 → 배송 완료 → 재구매(프로모션).
 * 알파벳순이나 추가된 순으로 두면 레일이 목록일 뿐이지만, 여정 순으로 두면 운영자가 '지금
 * 만들려는 메일이 어디쯤인지' 를 스크롤만으로 찾는다. 그 뒤에 여정 밖의 나머지가 붙는다. */

export const EMAIL_PRESETS: readonly EmailPreset[] = [
  {
    id: 'blank',
    label: '빈 템플릿',
    subject: '',
    build: () => [],
  },

  /* ── 1. 회원가입 ─────────────────────────────────────────────────────────
   * 가입 직후 1통. 계정이 실제로 생겼다는 사실(아이디·가입일·등급)을 눈으로 확인시키는 것이 이
   * 메일의 일이다 — '환영합니다' 만 있는 메일은 읽고 나서 확인할 것이 남지 않는다. */
  {
    id: 'signup',
    label: '회원가입',
    subject: '회원가입에 감사드립니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '회원가입에 감사드립니다'),
      body(nextId, `${v(V.firstName)}님, 가입이 완료되었습니다.\n아래 가입 정보를 확인해 주세요.`),
      ...panel(nextId, '가입 정보', [
        line('아이디', v(V.loginId)),
        line('가입일', v(V.signedUpAt)),
        line('회원 유형', v(V.memberTier)),
      ]),
      subhead(nextId, '이제부터 받으실 혜택'),
      body(nextId, `가입 축하 적립금 **${v(V.signupBonus)}** 을 지급해 드렸습니다.`),
      plainList(nextId, [
        `구매 금액의 ${v(V.earnRate)} 적립`,
        `적립금 유효기간 ${v(V.pointsExpireMonths)}개월`,
        '생일 축하 쿠폰 발급',
        '신상품 우선 구매 안내',
      ]),
      linkCta(nextId, '내 적립금 확인하기', 'https://example.com/mypage/points'),
      primaryButton(nextId, '쇼핑 시작하기', 'https://example.com/'),
      ...footerStack(nextId),
    ],
  },

  /* ── 2. 이메일 인증코드 ──────────────────────────────────────────────────
   * 이 메일에서 수신자가 하는 일은 단 하나 — 숫자를 옮겨 적는 것이다. 그래서 코드가 제목보다
   * 먼저 눈에 들어와야 하고, 링크·버튼처럼 시선을 나누는 것을 **하나도 넣지 않는다**. 코드를
   * 복사하러 온 사람에게 버튼을 내밀면 둘 중 하나를 고르게 만드는 셈이다.
   * 대신 만료 시간과 '요청하지 않았다면' 안내를 반드시 남긴다(코드 메일의 안전장치). */
  {
    id: 'verify-code',
    label: '이메일 인증코드',
    subject: '이메일 인증코드를 안내드립니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '인증코드를 입력해 주세요'),
      body(nextId, '아래 코드를 인증 화면에 입력하시면 이메일 인증이 완료됩니다.'),
      codePanel(nextId, v(V.verifyCode)),
      note(nextId, `이 코드는 발송 시점부터 **${v(V.verifyCodeTtl)}** 동안만 유효합니다.`),
      ...panel(nextId, '요청 내역', [
        line('요청 계정', v(V.email)),
        line('요청 일시', v(V.requestedAt)),
      ]),
      subhead(nextId, '안전하게 사용하시려면'),
      plainList(nextId, [
        '코드는 고객센터를 포함해 누구에게도 알려주지 마세요',
        '본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다',
        '코드가 만료되면 인증 화면에서 다시 요청하실 수 있습니다',
      ]),
      ...footerStack(nextId),
    ],
  },

  /* ── 3. 구매 완료 ────────────────────────────────────────────────────────
   * 주문 접수 확인과 결제 명세를 한 통에 싣는다. 패널이 주문번호·결제수단·결제금액을 나르고,
   * 그 아래 목록은 '다음에 무슨 일이 일어나는지' 를 알린다 — 구매 직후 문의의 대부분이
   * '언제 오나요' 라서 그 답을 메일이 먼저 해 둔다. */
  {
    id: 'purchase-complete',
    label: '구매 완료',
    subject: '주문이 정상적으로 접수되었습니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '주문이 완료되었습니다'),
      body(
        nextId,
        `${v(V.firstName)}님, 결제가 정상적으로 처리되었습니다.\n상품은 **영업일 기준 1~2일 내** 출고됩니다.`,
      ),
      ...panel(nextId, '주문 내역', [
        line('주문번호', v(V.orderNo)),
        line('주문일시', v(V.orderedAt)),
        line('주문상품', v(V.orderItemSummary)),
        line('결제수단', v(V.paymentMethod)),
        line('결제금액', `**${v(V.orderTotal)}**`),
      ]),
      subhead(nextId, '다음 단계'),
      plainList(nextId, [
        '상품 준비가 끝나면 배송 시작 안내를 보내드립니다',
        '출고 전까지는 주문 상세에서 취소하실 수 있습니다',
        '현금영수증·세금계산서는 주문 상세에서 신청하세요',
      ]),
      linkCta(nextId, '영수증 발급하기', 'https://example.com/orders/receipt'),
      primaryButton(nextId, '주문 상세 보기', 'https://example.com/orders'),
      ...footerStack(nextId),
    ],
  },

  /* ── 4. 배송 시작 ────────────────────────────────────────────────────────
   * 이 메일의 값어치는 **운송장 번호 하나**다. 수신자는 그것을 들고 택배사 조회 화면으로 간다.
   * 그래서 글자 링크도 하단 버튼도 조회로 수렴한다 — 다른 곳으로 데려가지 않는다. */
  {
    id: 'shipping-started',
    label: '배송 시작',
    subject: '주문하신 상품이 출발했습니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '상품이 출발했습니다'),
      body(
        nextId,
        `${v(V.firstName)}님이 주문하신 상품이 배송을 시작했습니다.\n도착 예정일은 **${v(V.deliveryEta)}** 입니다.`,
      ),
      ...panel(nextId, '배송 정보', [
        line('운송장번호', `**${v(V.trackingNo)}**`),
        line('택배사', v(V.carrierName)),
        line('받는 분', v(V.receiverName)),
        line('배송지', v(V.shippingAddress)),
      ]),
      linkCta(nextId, '배송 조회하기', TRACKING_URL),
      subhead(nextId, '배송 안내'),
      plainList(nextId, [
        '운송장 정보는 택배사 접수 후 최대 6시간 뒤부터 조회됩니다',
        '부재 시 경비실 또는 무인택배함에 보관될 수 있습니다',
        '출고 후에는 배송지를 변경하기 어렵습니다',
      ]),
      primaryButton(nextId, '배송 조회하기', TRACKING_URL),
      ...footerStack(nextId),
    ],
  },

  /* ── 5. 배송 완료 ────────────────────────────────────────────────────────
   * 배송 시작과 같은 골격을 쓰면 두 통이 구별되지 않는다. 이 메일이 나르는 것은 운송장이 아니라
   * **수령 사실**이고, 그다음에 요청하는 행동은 조회가 아니라 리뷰다. 그래서 패널이 짧고
   * (수령 일시·장소·주문번호) 목록 자리를 '문제가 있을 때 무엇을 하면 되는지' 로 바꿨다 —
   * 수령 직후가 파손·오배송을 발견하는 시점이라 반품 기한을 여기서 알리는 것이 맞다. */
  {
    id: 'delivery-complete',
    label: '배송 완료',
    subject: '상품이 안전하게 도착했습니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '배송이 완료되었습니다'),
      body(
        nextId,
        `${v(V.firstName)}님, 주문하신 상품이 도착했습니다.\n사용해 보시고 후기를 남겨 주시면 **적립금 500원**을 드립니다.`,
      ),
      ...panel(nextId, '수령 확인', [
        line('수령일시', v(V.deliveredAt)),
        line('수령장소', v(V.deliveryPlace)),
        line('주문번호', v(V.orderNo)),
      ]),
      subhead(nextId, '받으신 뒤 확인해 주세요'),
      plainList(nextId, [
        '상품을 받지 못하셨다면 고객센터로 알려주세요',
        '파손·오배송은 수령일로부터 7일 이내에 접수해 주세요',
        '단순 변심 반품은 수령일로부터 7일 이내에 가능하며 반품비가 발생합니다',
        line('반품 배송비', v(V.returnFee)),
      ]),
      linkCta(nextId, '반품·교환 신청하기', 'https://example.com/orders/returns'),
      primaryButton(nextId, '후기 쓰고 적립금 받기', 'https://example.com/reviews/write'),
      ...footerStack(nextId),
    ],
  },

  /* ── 6. 프로모션 ─────────────────────────────────────────────────────────
   * 유일한 **광고성** 메일이다. 나머지 다섯은 사건이 일어나서 보내지만 이것은 우리가 팔고 싶어
   * 보낸다. 그래서 구조가 다르다: 값을 확인시키는 패널 대신 **상품 그리드**가 본문의 가운데를
   * 차지하고, 패널은 '기간' 과 '쿠폰' 만 남는다 — 기간이 없는 프로모션 메일은 지금 눌러야 할
   * 이유를 주지 못한다.
   *
   * [통이미지를 쓰지 않는다] 상품 칸은 이미지 + 이름 + 가격의 블록 조합이다. 배너 한 장이면
   * 만들기는 쉽지만 운영자가 상품 하나를 바꾸려면 디자이너에게 가야 하고, 이미지를 차단하는
   * 클라이언트에서는 메일이 통째로 빈 상자가 된다. */
  {
    id: 'promotion',
    label: '프로모션',
    subject: `${v(V.promotionName)} — 지금 만나보세요`,
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, v(V.promotionName)),
      body(
        nextId,
        `${v(V.firstName)}님을 위한 기간 한정 혜택입니다.\n인기 상품을 **최대 ${v(V.discountRate)}** 할인된 가격에 준비했습니다.`,
      ),
      twoColumn(nextId, '1:1', [
        productCell(nextId, 'product-1.jpg', '기획전 대표 상품 1', '상품명 1', '00,000원'),
        productCell(nextId, 'product-2.jpg', '기획전 대표 상품 2', '상품명 2', '00,000원'),
      ]),
      twoColumn(nextId, '1:1', [
        productCell(nextId, 'product-3.jpg', '기획전 대표 상품 3', '상품명 3', '00,000원'),
        productCell(nextId, 'product-4.jpg', '기획전 대표 상품 4', '상품명 4', '00,000원'),
      ]),
      ...panel(nextId, '혜택 안내', [
        line('행사기간', `${v(V.promotionStart)} ~ ${v(V.promotionEnd)}`),
        line('쿠폰코드', `**${v(V.couponCode)}**`),
        line('최소 주문금액', v(V.couponMinOrder)),
        line('무료배송 기준', v(V.freeShippingThreshold)),
      ]),
      note(nextId, '쿠폰은 결제 화면에서 직접 입력하셔야 적용됩니다. 일부 상품은 제외됩니다.'),
      linkCta(nextId, '내 쿠폰함 보기', 'https://example.com/mypage/coupons'),
      primaryButton(nextId, '기획전 바로가기', 'https://example.com/promotions'),
      ...footerStack(nextId),
    ],
  },

  /* ── 여정 밖의 나머지 ────────────────────────────────────────────────────
   *
   * 앞선 여섯과 **같은 골격**을 쓴다. 예전에는 이 다섯이 '가운데 정렬 로고 + 가운데 제목 +
   * 브랜드색 알약 버튼' 이라는 다른 계열이었는데, 그러면 같은 레일에서 고른 두 프리셋이 서로
   * 다른 브랜드의 메일처럼 보였다. 운영자가 프리셋을 바꿔 가며 비교하는 자리에서 골격까지
   * 달라지면 무엇이 내용의 차이이고 무엇이 껍데기의 차이인지 구분할 수 없다. */

  /* 비밀번호 재설정 — 이 메일의 위험은 '내가 요청하지 않았는데 왔다' 는 경우다. 그래서 요청
   * 내역(계정·일시)을 패널로 먼저 보여 주고, 링크 만료를 눈에 띄게 남긴다. */
  {
    id: 'reset-password',
    label: '비밀번호 재설정',
    subject: '비밀번호 재설정 안내',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '비밀번호를 재설정하세요'),
      body(
        nextId,
        `${v(V.firstName)}님의 비밀번호 재설정 요청을 받았습니다.\n아래 버튼을 눌러 새 비밀번호를 등록해 주세요.`,
      ),
      ...panel(nextId, '요청 내역', [
        line('요청 계정', v(V.email)),
        line('요청 일시', v(V.requestedAt)),
        line('링크 유효시간', `**${v(V.verifyCodeTtl)}**`),
      ]),
      subhead(nextId, '요청하지 않으셨다면'),
      plainList(nextId, [
        '아무것도 바뀌지 않았습니다 — 이 메일을 무시하셔도 됩니다',
        '같은 메일이 반복해서 온다면 고객센터로 알려주세요',
        '비밀번호는 다른 서비스와 다르게 설정하시는 것이 안전합니다',
      ]),
      linkCta(nextId, '고객센터 문의하기', 'https://example.com/support'),
      primaryButton(nextId, '비밀번호 재설정하기', 'https://example.com/reset'),
      ...footerStack(nextId),
    ],
  },

  /* 구독 영수증 — 사건(주문 접수)이 없는 메일이라 남는 것은 **금액 명세**뿐이다. 그래서 패널이
   * 이 메일의 본체이고, 그 아래는 '다음 결제 전에 무엇을 할 수 있는지' 다. */
  {
    id: 'subscription-receipt',
    label: '구독 영수증',
    subject: '구독 결제 영수증입니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '구독이 갱신되었습니다'),
      body(
        nextId,
        `${v(V.firstName)}님의 구독이 정상적으로 갱신되었습니다.\n결제 내역을 확인해 주세요.`,
      ),
      ...panel(nextId, '결제 내역', [
        line('구독 상품', v(V.planName)),
        line('결제일시', v(V.billedAt)),
        line('결제수단', v(V.paymentMethod)),
        line('결제금액', `**${v(V.billingAmount)}**`),
        line('다음 결제일', v(V.nextBillingAt)),
      ]),
      subhead(nextId, '다음 결제 전에'),
      plainList(nextId, [
        '결제 수단은 구독 관리에서 언제든 변경하실 수 있습니다',
        '해지하시면 남은 이용 기간까지는 그대로 이용하실 수 있습니다',
        '세금계산서는 구독 관리에서 신청하세요',
      ]),
      linkCta(nextId, '결제 수단 변경하기', 'https://example.com/billing/payment-method'),
      primaryButton(nextId, '구독 관리하기', 'https://example.com/billing'),
      ...footerStack(nextId),
    ],
  },

  /* 게시물 통계 — 숫자를 읽으러 오는 메일이다. 패널이 지표를 나르고, 그 아래는 '그 숫자로
   * 무엇을 하면 되는지' 를 제안한다. 숫자만 있는 리포트 메일은 읽고 나서 할 일이 남지 않는다. */
  {
    id: 'post-metrics',
    label: '게시물 통계',
    subject: '이번 주 게시물 통계',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '숫자로 보는 이번 주'),
      body(nextId, `${v(V.firstName)}님, 지난 7일 동안 게시물이 어떤 성과를 냈는지 정리했습니다.`),
      ...panel(nextId, '가장 많이 읽힌 게시물', [
        line('제목', `**${v(V.postTitle)}**`),
        line('조회수', v(V.postViews)),
        line('게시일', v(V.postPublishedAt)),
        line('작성자', v(V.postAuthor)),
      ]),
      subhead(nextId, '이번 주에 해보면 좋을 것'),
      plainList(nextId, [
        '조회수가 높은 게시물을 배너나 팝업으로 한 번 더 노출해 보세요',
        '반응이 없던 게시물은 제목만 바꿔 다시 게시해 볼 수 있습니다',
        '자주 들어온 문의는 FAQ 로 옮기면 문의 수가 줄어듭니다',
      ]),
      linkCta(nextId, '게시물 목록 보기', 'https://example.com/contents/notices'),
      primaryButton(nextId, '대시보드 열기', 'https://example.com/analytics'),
      ...footerStack(nextId),
    ],
  },

  /* 문의 답변 — 수신자가 가장 먼저 확인하는 것은 '내가 넣은 그 문의가 맞나' 다. 그래서 패널이
   * 문의번호·제목·접수일·담당자를 나른다. 답변 본문은 운영자가 채울 자리를 비워 둔다. */
  {
    id: 'respond-inquiry',
    label: '문의 답변',
    subject: '문의하신 내용에 답변드립니다',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '문의해 주셔서 감사합니다'),
      body(
        nextId,
        `${v(V.firstName)}님, 문의 주신 내용을 확인했습니다.\n아래와 같이 안내드립니다.`,
      ),
      ...panel(nextId, '문의 접수 내역', [
        line('문의번호', v(V.inquiryNo)),
        line('문의 제목', v(V.inquiryTitle)),
        line('접수일시', v(V.inquiryReceivedAt)),
        line('담당자', v(V.inquiryAssignee)),
      ]),
      subhead(nextId, '답변 내용'),
      body(
        nextId,
        '이 문단에 답변을 적어 주세요. 문의 하나에 답 하나가 원칙이고, 근거가 되는 규정이나 화면 경로를 함께 적으면 재문의가 줄어듭니다.',
      ),
      plainList(nextId, [
        '추가로 궁금한 점은 이 문의번호로 다시 문의해 주세요',
        '답변이 충분하지 않다면 언제든 재문의하실 수 있습니다',
      ]),
      linkCta(nextId, '자주 묻는 질문 보기', 'https://example.com/support/faq'),
      primaryButton(nextId, '문의 내역 보기', 'https://example.com/support/inquiries'),
      ...footerStack(nextId),
    ],
  },

  /* 2단 소개 — 다단이 무엇을 할 수 있는지 보여 주는 시작점이다. '왼쪽 설명 / 오른쪽 설명' 은
   * 한 줄 스택으로는 만들 수 없던 배치이고, 프리셋 하나가 기능의 존재를 알리는 가장 빠른 길이다.
   * 나머지 열한 개와 골격을 공유하되 **가운데가 2단 비교**라는 점이 이 프리셋의 내용이다. */
  {
    id: 'two-column-feature',
    label: '2단 소개',
    subject: '이번 달 새로운 소식',
    build: (nextId) => [
      brandBand(nextId),
      title(nextId, '이번 달 새로운 소식'),
      body(nextId, '이번 업데이트에서 바뀐 것 중 자주 쓰실 두 가지를 먼저 소개합니다.'),
      twoColumn(nextId, '1:1', [
        [
          columnSubhead(nextId, '더 빨라진 검색'),
          columnBody(nextId, '이제 결과가 **1초 안에** 돌아옵니다. 상품이 많아도 마찬가지입니다.'),
        ],
        [
          columnSubhead(nextId, '저장한 보기'),
          columnBody(nextId, '자주 쓰는 필터를 고정해 두고 한 번에 되돌아올 수 있습니다.'),
        ],
      ]),
      ...panel(nextId, '이번 업데이트 요약', [
        '검색 응답 속도 개선',
        '목록 필터 저장 기능 추가',
        '내보내기 형식에 CSV 추가',
        '알림 설정 화면 정리',
      ]),
      subhead(nextId, '더 알아보기'),
      body(nextId, '바뀐 내용 전체는 릴리스 노트에서 확인하실 수 있습니다.'),
      linkCta(nextId, '릴리스 노트 보기', 'https://example.com/changelog'),
      primaryButton(nextId, '새 기능 사용해 보기', 'https://example.com/'),
      ...footerStack(nextId),
    ],
  },
];

export const DEFAULT_PRESET_ID: PresetId = 'blank';

export function findPreset(id: PresetId): EmailPreset | undefined {
  return EMAIL_PRESETS.find((preset) => preset.id === id);
}

/**
 * 프리셋이 캔버스 스타일까지 바꾸지는 않는다 — 운영자가 STYLE 탭에서 맞춰 둔 배경·폰트를
 * 프리셋을 고를 때마다 되돌리면 '블록만 갈아끼우려던' 의도를 배신한다. 캔버스는 그대로 둔다.
 *
 * (레퍼런스의 '회색 배경 위 흰 카드' 는 이미 DEFAULT_CANVAS 가 그 모양이라 프리셋이 손댈 것이
 * 없다 — backdropColor 가 회색, canvasColor 가 흰색이다. 카드 모서리의 둥글기도 캔버스의 것이라
 * 상단 밴드가 그 반경에 맞춰 잘린다.)
 */
export function presetCanvas(): EmailCanvasStyle {
  return DEFAULT_CANVAS;
}
