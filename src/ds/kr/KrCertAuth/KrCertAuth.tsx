import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from '../../Button/Button'
import fieldStyles from '../../TextField/TextField.module.css'
import { KrStepIndicator } from '../KrStepIndicator/KrStepIndicator'
import styles from './KrCertAuth.module.css'

// 인증서 인증 목(mock) 플로우 (공동인증서/금융인증서).
// 목 규칙: 비밀번호 'password' 이면 성공, 그 외 실패. 만료된 인증서는 선택 시 진행 불가.
// 실서비스는 각 인증기관 SDK/API를 연동한다.

const MOCK_PASSWORD = 'password'

type Cert = {
  id: string
  purpose: string
  issuer: string
  expiry: string
  expired?: boolean
}

// 종류별 인증서 목록 목데이터 — 각 목록에 만료 인증서 1건 포함
const CERTS: Record<KrCertAuthProps['kind'], Cert[]> = {
  joint: [
    { id: 'j1', purpose: '전자거래(범용)', issuer: 'yessign', expiry: '2027-05-14' },
    { id: 'j2', purpose: '은행/신용카드/보험용', issuer: 'KICA', expiry: '2026-11-30' },
    { id: 'j3', purpose: '전자세금계산서용', issuer: 'yessign', expiry: '2025-01-10', expired: true },
  ],
  finance: [
    { id: 'f1', purpose: '금융인증서', issuer: '금융결제원', expiry: '2027-08-22' },
    { id: 'f2', purpose: '금융인증서(이전)', issuer: '금융결제원', expiry: '2024-12-01', expired: true },
  ],
}

export type KrCertAuthProps = {
  kind: 'joint' | 'finance'
  onComplete?: () => void
}

const HEAD = ['용도', '발급자', '만료일']

export function KrCertAuth({ kind, onComplete }: KrCertAuthProps) {
  const noun = kind === 'joint' ? '공동인증서' : '금융인증서'
  const certs = CERTS[kind]
  const pwId = useId()

  const [step, setStep] = useState(1)
  const [selectedId, setSelectedId] = useState('')
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)

  const selected = certs.find((c) => c.id === selectedId)
  const canProceed = selected != null && !selected.expired

  // 방향키로 인증서 선택 이동 (라디오 그룹 관례)
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const backward = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    if (!forward && !backward) return
    const index = certs.findIndex((c) => c.id === selectedId)
    const from = index >= 0 ? index : 0
    const next = certs[(from + (forward ? 1 : -1) + certs.length) % certs.length]
    setSelectedId(next.id)
    event.preventDefault()
  }

  function verifyPassword() {
    if (password === MOCK_PASSWORD) {
      setStep(3)
      onComplete?.()
      return
    }
    setPwError(true)
  }

  return (
    <div className={styles.flow}>
      <KrStepIndicator steps={[`${noun} 선택`, '비밀번호 입력', '완료']} current={step - 1} />

      {step === 1 && (
        <>
          <div className={styles.list} role="radiogroup" aria-label={`${noun} 선택`} onKeyDown={handleKeyDown}>
            <div className={styles.head} aria-hidden="true">
              {HEAD.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {certs.map((cert, index) => {
              const isSelected = cert.id === selectedId
              const rovingSelected = isSelected || (selectedId === '' && index === 0)
              return (
                <button
                  key={cert.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={rovingSelected ? 0 : -1}
                  className={[
                    styles.row,
                    isSelected ? styles.selected : '',
                    cert.expired ? styles.rowExpired : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedId(cert.id)}
                >
                  <span className={[styles.cell, styles.cellPurpose].join(' ')}>
                    {cert.purpose}
                    {cert.expired && <span className={styles.expiredTag}>만료</span>}
                  </span>
                  <span className={[styles.cell, styles.cellSub].join(' ')}>{cert.issuer}</span>
                  <span className={[styles.cell, styles.cellSub].join(' ')}>{cert.expiry}</span>
                </button>
              )
            })}
          </div>
          {selected?.expired && <p className={styles.error}>만료된 인증서입니다</p>}
          <Button
            variant="primary"
            size="md"
            label="다음"
            disabled={!canProceed}
            onClick={() => setStep(2)}
          />
        </>
      )}

      {step === 2 && (
        <>
          {/* KrField는 type=text 고정이라 실제 비밀번호 마스킹을 위해 동일 필드 스타일 + native
              password input 을 사용한다(부적절한 재구성 없이 브라우저 마스킹 활용). */}
          <div
            className={[fieldStyles.field, pwError ? fieldStyles.error : ''].filter(Boolean).join(' ')}
          >
            <label className={fieldStyles.label} htmlFor={pwId}>
              {noun} 비밀번호
            </label>
            <input
              id={pwId}
              type="password"
              className={fieldStyles.input}
              placeholder="비밀번호를 입력하세요"
              autoComplete="off"
              value={password}
              aria-invalid={pwError || undefined}
              onChange={(e) => {
                setPassword(e.target.value)
                setPwError(false)
              }}
            />
            <div className={fieldStyles.meta}>
              <span className={fieldStyles.messages}>
                <span className={fieldStyles.helperText}>
                  {pwError ? '비밀번호가 일치하지 않습니다' : `${selected?.purpose ?? noun} 인증서`}
                </span>
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            label="인증"
            disabled={password === ''}
            onClick={verifyPassword}
          />
        </>
      )}

      {step === 3 && (
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
          <p className={styles.doneDesc}>{noun}로 인증되었습니다</p>
        </div>
      )}
    </div>
  )
}
