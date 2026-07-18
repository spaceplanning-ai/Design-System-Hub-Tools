// 제공자 브랜드 글리프 (시스템 설정 섹션 소유 — apps/admin/src/pages/settings/**)
//
// [왜 모노크롬인가] Google 파랑·카카오 노랑·네이버 초록은 **브랜드 색**이고 디자인 토큰에 없다.
// 하드코딩 hex 는 TokenGuard 가 막는다(그리고 막아야 한다 — 토큰 밖 색이 새면 다크모드·대비가 깨진다).
// 그래서 currentColor 로 그린 단색 글리프만 쓴다 — 색이 아니라 **모양**으로 제공자를 구분한다.
// 식별 목적의 단색 표기는 브랜드 가이드가 일반적으로 허용하는 사용이다.
import type { OAuthProviderId } from '../validation';

interface ProviderBrandIconProps {
  readonly provider: OAuthProviderId;
  readonly size?: number;
}

/**
 * 제공자 식별 글리프. 장식이므로 `aria-hidden` — 이름은 옆의 텍스트 라벨이 전한다
 * (아이콘에 label 을 또 달면 스크린리더가 이름을 두 번 읽는다).
 */
export function ProviderBrandIcon({ provider, size = 20 }: ProviderBrandIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
    focusable: false,
  } as const;

  switch (provider) {
    case 'google':
      // 'G' 링 — 구글의 G 마크 실루엣을 단색으로
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 1 0 6.6 17.5l-2.1-2.1A7 7 0 1 1 19 12h-7v3h6.9A7 7 0 0 1 12 19V2z" />
          <path d="M12 10.5V13h9.5c.1-.7.2-1.4.2-2.2 0-.1 0-.2 0-.3H12z" />
        </svg>
      );
    case 'kakao':
      // 카카오톡 말풍선 — 둥근 몸통에 작은 꼬리
      return (
        <svg {...common}>
          <path d="M12 3C6.8 3 2.5 6.4 2.5 10.6c0 2.7 1.8 5 4.5 6.4l-1 3.7c-.1.3.3.6.5.4l4.4-2.9c.2 0 .4 0 .6 0 5.2 0 9.5-3.4 9.5-7.6S17.2 3 12 3z" />
        </svg>
      );
    case 'naver':
      // 네이버 'N' 마크
      return (
        <svg {...common}>
          <path d="M4 4h5.3l5 7.3V4H20v16h-5.3l-5-7.3V20H4V4z" />
        </svg>
      );
  }
}
