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

// 근사 단색 SVG (currentColor) — 정확한 브랜드 로고는 각사 배포본으로 교체 (README 고지)
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
