// 이메일 빌더 아이콘 — **DS Icon 의 저작(authoring) 원천이다. 지우지 마라.**
//
// ⚠️ [이 파일은 더 이상 렌더 경로에 없지만 삭제하면 DS 가 무너진다]
//
//   tools/codegen/src/extract-icons.ts 의 findIconFiles() 가 `apps/admin/src/**` 아래
//   `icons.tsx`(정확히 이 파일명)를 전부 긁어 packages/ui/generated/icons/icon-geometry.ts 를
//   만든다. contracts/Icon.contract.json 의 name enum 59종 중 **48종이 여기 같은 앱 파일들에서
//   나온다**(나머지 11종만 assets/icons/ds-icon-geometry.json 에 저작돼 있다).
//   따라서 아래 export 를 지우면 그 아이콘이 계약 enum 에서 사라지고 `<Icon name="undo" />` 가
//   타입 에러가 된다. '아무도 import 하지 않으니 죽은 코드' 라는 판단은 **틀렸다** —
//   이 파일의 소비자는 컴포넌트가 아니라 codegen 이다.
//
// [호출부는 전부 DS 로 옮겼다] EmailToolbar · BlockPicker · InspectPanel 은 이제 이 파일의
// 컴포넌트를 쓰지 않고 `<Icon name="…" />` 을 쓴다. 기하가 바로 여기서 추출된 것이라
// 렌더 결과는 같다(같은 24 그리드·stroke 1.75·1.25em·currentColor).
// 새 아이콘이 필요하면 여기에 그리면 codegen 이 계약 enum 까지 자동으로 따라온다.
//
// 크기는 1em 기준 — 부모의 font-size 와 currentColor 를 따른다. px 리터럴 0건.
import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

const BASE = {
  width: '1.25em',
  height: '1.25em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

/** 미리보기 탭 — 눈 */
export function EyeIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

/** 되돌리기 — 왼쪽으로 도는 화살표 */
export function UndoIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a7 7 0 0 1 0 14H8" />
    </svg>
  );
}

/** 다시하기 — 오른쪽으로 도는 화살표 */
export function RedoIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9h-9a7 7 0 0 0 0 14h5" />
    </svg>
  );
}

/** 변수 — 반짝임(✨) */
export function SparkleIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8L12 3Z" />
      <path d="M18.5 16.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z" />
    </svg>
  );
}

/** 데스크톱 — 모니터 */
export function DesktopIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="2.5" y="4" width="19" height="12" rx="2" />
      <path d="M9 20h6" />
      <path d="M12 16v4" />
    </svg>
  );
}

/** 모바일 — 휴대폰 */
export function MobileIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </svg>
  );
}

/** 왼쪽 패널 접기 */
export function CollapseLeftIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="m16 10-2 2 2 2" />
    </svg>
  );
}

/** 오른쪽 패널 접기 */
export function CollapseRightIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M15 4v16" />
      <path d="m8 10 2 2-2 2" />
    </svg>
  );
}

/* ── 정렬 ────────────────────────────────────────────────────────────────── */

export function AlignLeftIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h13" />
    </svg>
  );
}

export function AlignCenterIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M5.5 18h13" />
    </svg>
  );
}

export function AlignRightIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 6h16" />
      <path d="M10 12h10" />
      <path d="M7 18h13" />
    </svg>
  );
}

export function AlignTopIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 4h16" />
      <path d="M12 8v12" />
      <path d="m8 12 4-4 4 4" />
    </svg>
  );
}

export function AlignMiddleIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 12h16" />
      <path d="M12 4v4" />
      <path d="M12 16v4" />
    </svg>
  );
}

export function AlignBottomIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 20h16" />
      <path d="M12 4v12" />
      <path d="m8 12 4 4 4-4" />
    </svg>
  );
}

/* ── 블록 종류 (피커의 글리프) ───────────────────────────────────────────── */

export function HeadingGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M6 4v16" />
      <path d="M18 4v16" />
      <path d="M6 12h12" />
    </svg>
  );
}

export function TextGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 6h16" />
      <path d="M4 11h16" />
      <path d="M4 16h11" />
    </svg>
  );
}

export function ButtonGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="3" y="8" width="18" height="8" rx="4" />
    </svg>
  );
}

export function LogoGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="5" y="5" width="14" height="14" rx="4" />
      <path d="M9.5 14.5 12 10l2.5 4.5Z" />
    </svg>
  );
}

export function AvatarGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function DividerGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3 12h18" />
    </svg>
  );
}

/** 다단 — 나란한 두 칸 */
export function ColumnsGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="3" y="5" width="7.5" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="7.5" height="14" rx="1.5" />
    </svg>
  );
}

/** 여백 — 위아래 경계와 그 사이의 빈 곳 */
export function SpacerGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3 5h18" />
      <path d="M3 19h18" />
      <path d="M12 9v6" />
      <path d="m9.5 11.5 2.5-2.5 2.5 2.5" />
      <path d="m9.5 12.5 2.5 2.5 2.5-2.5" />
    </svg>
  );
}

/** 소셜 — 이어진 세 점 */
export function SocialGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4.1" />
      <path d="m8.2 13.2 7.6 4.1" />
    </svg>
  );
}

/** 메뉴 — 가로로 늘어선 항목 */
export function MenuGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 12h3" />
      <path d="M10.5 12h3" />
      <path d="M17 12h3" />
    </svg>
  );
}

/** 비디오 — 재생 삼각형이 얹힌 상자 */
export function VideoGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10.5 9.5 5 2.5-5 2.5Z" />
    </svg>
  );
}

/** 목록 — 글머리표와 줄 */
export function ListGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 7h.01" />
      <path d="M4 12h.01" />
      <path d="M4 17h.01" />
      <path d="M8.5 7H20" />
      <path d="M8.5 12H20" />
      <path d="M8.5 17H20" />
    </svg>
  );
}

/** 법적 푸터 — 아래에 붙은 띠 */
export function FooterGlyph(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 15h18" />
      <path d="M7 18h6" />
    </svg>
  );
}
