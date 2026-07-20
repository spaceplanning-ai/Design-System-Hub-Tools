// 메시지 템플릿 편집기 전용 아이콘 — **DS 에 없는 것만 남았다**
//
// 예전에는 실행취소·다시실행·변수·패널 접기·미리보기도 여기 있었으나 전부 DS Icon 으로 옮겼다
// (아래 삭제 주석 참고). 지금 남은 둘은 contracts/Icon.contract.json 의 59종에 대응이 없다:
//   · SaveGlyph — 플로피(저장). DS 의 download 는 '아래로 내려받기' 라 뜻이 다르다. 근사치로
//     바꾸면 조용한 시각 퇴행이므로 두었다. → Icon 계약 추가 후보(저장/플로피).
//   · InfoGlyph — 느낌표 원(안내). DS 에는 x-circle·plus-circle 만 있고 정보/경고 원이 없다.
//     → Icon 계약 추가 후보(info-circle).
//
// 새로 그리기 전에 반드시 계약 enum 을 먼저 확인한다 — 같은 뜻의 글리프를 두 번 그리면
// 화면마다 모양이 갈린다(실제로 undo 가 그렇게 세 벌이 됐다).
//
// 크기는 1em 기준 — 부모의 font-size 와 color(currentColor)를 따라간다. raw px 리터럴 0건.
import type { SVGProps } from 'react';

type GlyphProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

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

/* [삭제됨 — DS Icon 으로 이관] 실행취소·다시실행·치환변수·좌우 패널 접기·미리보기 6종은
   contracts/Icon.contract.json 이 undo · redo · sparkle · collapse-left · collapse-right · eye
   로 이미 갖고 있어 `<Icon name="…" />` 로 바꿨다(EditorToolbar.tsx).

   [왜 이쪽이 지워지는 쪽인가] 이 파일은 codegen 의 추출 대상이 **아니다** —
   extract-icons.ts 의 findIconFiles() 가 보는 것은 `icons.tsx` 라는 파일명뿐이고
   `glyphs.tsx` 는 걸리지 않는다. 그래서 여기 있던 글리프는 DS 에 반영된 적이 없는
   **순수한 사본**이었고, 실제로 표류하고 있었다: undo 가 `M4 9h10a6 6`(호 반지름 6)인데
   DS 는 `M4 9h9a7 7`(반지름 7)이다. 같은 뜻의 아이콘이 화면마다 다르게 그려지고 있었다.
   반대로 email/icons.tsx 는 추출 대상이라 지우면 계약 enum 이 줄어든다 — 그쪽은 남겼다. */

/** 초안 저장 — 플로피(저장) */
export function SaveGlyph(props: GlyphProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M5 3h11l3 3v15H5Z" />
      <path d="M8 3v6h7V3" />
      <path d="M8 14h8v7H8Z" />
    </svg>
  );
}

/** 안내 콜아웃의 좌측 아이콘 — 느낌표 원 */
export function InfoGlyph(props: GlyphProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}
