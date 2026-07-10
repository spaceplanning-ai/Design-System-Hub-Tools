import { useState } from 'react'
import { Button } from '../../Button/Button'
import { SocialLoginButton } from '../../SocialLoginButton/SocialLoginButton'
import { KrAuthMethodSelect, AUTH_METHODS } from '../KrAuthMethodSelect/KrAuthMethodSelect'
import { KrPhoneAuth } from '../KrPhoneAuth/KrPhoneAuth'
import { KrCertAuth } from '../KrCertAuth/KrCertAuth'
import { KrStepIndicator } from '../KrStepIndicator/KrStepIndicator'
import styles from './KrIdentityVerification.module.css'

// 통합 본인인증 플로우 (§9) — 수단 선택 → 선택 수단별 인증 → 완료.
// 휴대폰(PASS)=KrPhoneAuth, 공동/금융=KrCertAuth, 카카오/네이버=SocialLoginButton 목 완료.

const STEPS = ['수단 선택', '인증', '완료']

type FlowStep = 'select' | 'auth' | 'done'

type Result = { label: string; name?: string; phone?: string }

function methodLabel(id: string): string {
  return AUTH_METHODS.find((m) => m.id === id)?.label ?? id
}

export function KrIdentityVerification() {
  const [flowStep, setFlowStep] = useState<FlowStep>('select')
  const [method, setMethod] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const currentIndex = flowStep === 'select' ? 0 : flowStep === 'auth' ? 1 : 2

  function reset() {
    setMethod('')
    setResult(null)
    setFlowStep('select')
  }

  function renderAuth() {
    if (method === 'pass') {
      return (
        <KrPhoneAuth
          onComplete={(r) => {
            setResult({ label: methodLabel(method), name: r.name, phone: r.phone })
            setFlowStep('done')
          }}
        />
      )
    }
    if (method === 'joint' || method === 'finance') {
      return (
        <KrCertAuth
          kind={method}
          onComplete={() => {
            setResult({ label: methodLabel(method) })
            setFlowStep('done')
          }}
        />
      )
    }
    // 카카오/네이버 — 기존 SocialLoginButton 재사용, 클릭 시 목 완료 처리
    const provider = method === 'kakao' ? 'kakao' : 'naver'
    return (
      <div className={styles.social}>
        <p className={styles.socialDesc}>
          {methodLabel(method)}으로 진행합니다. 아래 버튼을 눌러 인증을 완료하세요.
        </p>
        <SocialLoginButton
          provider={provider}
          size="lg"
          onClick={() => {
            setResult({ label: methodLabel(method) })
            setFlowStep('done')
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.flow}>
      <KrStepIndicator steps={STEPS} current={currentIndex} />

      {flowStep === 'select' && (
        <div className={styles.stepBody}>
          <p className={styles.prompt}>본인인증 수단을 선택하세요</p>
          <KrAuthMethodSelect value={method} onChange={setMethod} />
          <Button
            variant="primary"
            size="md"
            label="계속"
            disabled={method === ''}
            onClick={() => setFlowStep('auth')}
          />
        </div>
      )}

      {flowStep === 'auth' && (
        <div className={styles.stepBody}>
          {renderAuth()}
          <div className={styles.linkRow}>
            <button type="button" className={styles.linkBtn} onClick={reset}>
              다른 수단으로 인증
            </button>
          </div>
        </div>
      )}

      {flowStep === 'done' && (
        <div className={styles.done}>
          <span className={styles.successMark} aria-hidden="true">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h3 className={styles.doneTitle}>본인인증이 완료되었습니다</h3>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>인증 수단</span>
              <span className={styles.summaryVal}>{result?.label}</span>
            </div>
            {result?.name && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>이름</span>
                <span className={styles.summaryVal}>{result.name}</span>
              </div>
            )}
            {result?.phone && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryKey}>휴대폰</span>
                <span className={styles.summaryVal}>{result.phone}</span>
              </div>
            )}
          </div>
          <button type="button" className={styles.linkBtn} onClick={reset}>
            처음으로
          </button>
        </div>
      )}
    </div>
  )
}
