import './brand.css'
import styles from './SocialLoginButton.module.css'
import kakaoLogo from './logos/kakao.svg?raw'
import googleLogo from './logos/google.svg?raw'
import facebookLogo from './logos/facebook.svg?raw'
import naverLogo from './logos/naver.svg?raw'

export type SocialLoginButtonProps = {
  provider: 'kakao' | 'google' | 'facebook' | 'naver'
  size: 'md' | 'lg'
  label?: string
  showLogo?: boolean
}

// 부록 E 기본 문구 (변경 금지)
const DEFAULT_LABELS: Record<SocialLoginButtonProps['provider'], string> = {
  kakao: '카카오 로그인',
  google: 'Google로 로그인',
  facebook: 'Facebook으로 로그인',
  naver: '네이버 로그인',
}

// 각 사 공식 geometry SVG — Google 4색 G(공식 브랜딩 가이드라인 path), Facebook 공식 f 글리프,
// 네이버 공식 N, 카카오 공식 심볼(말풍선). 브랜드 컬러는 brand.css(부록 E)와 함께 각 사 규정 준수.
const LOGOS: Record<SocialLoginButtonProps['provider'], string> = {
  kakao: kakaoLogo,
  google: googleLogo,
  facebook: facebookLogo,
  naver: naverLogo,
}

export function SocialLoginButton({
  provider,
  size,
  label,
  showLogo = true,
}: SocialLoginButtonProps) {
  return (
    <button type="button" className={[styles.button, styles[provider], styles[size]].join(' ')}>
      {showLogo && (
        <span
          className={styles.logo}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: LOGOS[provider] }}
        />
      )}
      <span>{label ?? DEFAULT_LABELS[provider]}</span>
    </button>
  )
}
