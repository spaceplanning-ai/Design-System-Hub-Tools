import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '../../ds/Button/Button'
import { Checkbox } from '../../ds/Checkbox/Checkbox'
import { EmailField } from '../../ds/EmailField/EmailField'
import { PasswordField } from '../../ds/PasswordField/PasswordField'
import { Snackbar } from '../../ds/Snackbar/Snackbar'
import { SocialLoginButton } from '../../ds/SocialLoginButton/SocialLoginButton'

const pageStyle: CSSProperties = {
  fontFamily: 'var(--ds-font-family)',
  minHeight: '100vh',
  background: 'var(--ds-color-bgSubtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--ds-spacing-6)',
}

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: 'var(--ds-color-bg)',
  border: '1px solid var(--ds-color-border)',
  borderRadius: 'var(--ds-radius-lg)',
  padding: 'var(--ds-spacing-6)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ds-spacing-4)',
}

const linkStyle: CSSProperties = {
  fontSize: 'var(--ds-font-size-sm)',
  color: 'var(--ds-color-secondary)',
  textDecoration: 'none',
}

const PROVIDERS = ['kakao', 'google', 'facebook', 'naver'] as const

/** Templates/Login — DS 컴포넌트로 조합한 로그인 페이지 */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)

  const canSubmit = email.trim() !== '' && password !== ''

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 'var(--ds-font-size-xl)',
              fontWeight: 'var(--ds-font-weight-bold)' as CSSProperties['fontWeight'],
              color: 'var(--ds-color-text)',
            }}
          >
            DS 서비스
          </h1>
          <p
            style={{
              margin: 'var(--ds-spacing-1) 0 0',
              fontSize: 'var(--ds-font-size-sm)',
              color: 'var(--ds-color-secondary)',
            }}
          >
            계정에 로그인하세요.
          </p>
        </div>

        <EmailField value={email} onChange={setEmail} required />
        <PasswordField value={password} onChange={setPassword} required />
        <Checkbox checked={remember} onChange={setRemember} label="로그인 상태 유지" />

        <Button
          variant="primary"
          size="lg"
          label="로그인"
          disabled={!canSubmit}
          onClick={() => setDoneOpen(true)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-spacing-3)' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--ds-color-border)' }} />
          <span style={{ fontSize: 'var(--ds-font-size-sm)', color: 'var(--ds-color-secondary)' }}>
            또는
          </span>
          <span style={{ flex: 1, height: 1, background: 'var(--ds-color-border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-spacing-2)' }}>
          {PROVIDERS.map((provider) => (
            <SocialLoginButton key={provider} provider={provider} size="lg" />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--ds-spacing-3)',
          }}
        >
          <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>
            회원가입
          </a>
          <span aria-hidden="true" style={{ color: 'var(--ds-color-border)' }}>
            |
          </span>
          <a href="#" style={linkStyle} onClick={(e) => e.preventDefault()}>
            비밀번호 찾기
          </a>
        </div>
      </div>

      <Snackbar
        open={doneOpen}
        variant="success"
        message="로그인되었습니다."
        onClose={() => setDoneOpen(false)}
      />
    </div>
  )
}
