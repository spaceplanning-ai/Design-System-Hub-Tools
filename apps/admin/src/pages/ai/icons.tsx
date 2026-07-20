// AI 에이전트 화면 전용 아이콘
//
// [왜 shared/icons.tsx 가 아닌가] 그 파일의 규칙을 따른다 — "여러 화면이 쓰는 것만 여기 두고,
// 한 화면 전용은 그 화면 폴더의 icons.tsx 에 남긴다". 아래 셋은 입력줄에서만 쓴다.
// (ChevronDownIcon 은 사이드바와 공유하므로 shared/icons.tsx 에서 가져온다.)
//
// 크기는 1em 기준 — 부모의 font-size 와 color(currentColor)를 따라간다. raw px 리터럴 0건.
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

/** 내용 첨부 — 더하기 */
export function PlusIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/** 음성 입력 — 마이크 */
export function MicIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
    </svg>
  );
}

/**
 * 보내기 — 위쪽 화살표.
 *
 * [왜 파형(waveform)이 아닌가] 참조 디자인의 이 자리에는 음성 파형이 있다. 그러나 이 제품에는
 * 음성 입력이 없다 — 파형을 그리면 **없는 기능을 약속하는 그림**이 된다. 같은 자리·같은 모양의
 * 원형 버튼을 쓰되 글리프는 실제 동작(보내기)을 가리킨다. 음성 자리는 옆의 마이크 버튼이
 * '연결되지 않음' 상태로 정직하게 차지한다.
 */
export function SendIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}
