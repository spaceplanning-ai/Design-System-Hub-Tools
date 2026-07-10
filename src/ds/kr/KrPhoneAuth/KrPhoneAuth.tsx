import { useEffect, useState } from 'react'
import { Button } from '../../Button/Button'
import { Checkbox } from '../../Checkbox/Checkbox'
import { KrField } from '../KrField'
import { KrCarrierSelect } from '../KrCarrierSelect/KrCarrierSelect'
import { KrPhoneField } from '../KrPhoneField/KrPhoneField'
import { KrStepIndicator } from '../KrStepIndicator/KrStepIndicator'
import { digitsOnly, validatePhone } from '../format'
import styles from './KrPhoneAuth.module.css'

// 휴대폰 본인인증 목(mock) 플로우 (PASS/문자 경로).
// 목 규칙: 인증번호 '123456' 이면 성공, 그 외 실패. 실서비스는 PASS/통신사 API를 연동한다.
// 모든 상태를 컴포넌트 안에 두어(플로우), 스토리는 렌더만 한다.

const MOCK_CODE = '123456'
const AUTH_SECONDS = 180 // 03:00

export type KrPhoneAuthProps = {
  onComplete?: (result: { name: string; phone: string }) => void
}

const STEPS = ['정보 입력', '인증번호 확인', '완료']

// 주민번호 앞 7자리 표시 포맷 (생년월일 6 + 성별 1)
function formatRrnFront(digits: string): string {
  const d = digits.slice(0, 7)
  if (d.length <= 6) return d
  return `${d.slice(0, 6)}-${d.slice(6)}`
}

export function KrPhoneAuth({ onComplete }: KrPhoneAuthProps) {
  const [step, setStep] = useState(1)

  // step 1 — 정보 입력
  const [name, setName] = useState('')
  const [carrier, setCarrier] = useState('')
  const [phone, setPhone] = useState('')
  const [rrn, setRrn] = useState('') // 앞 7자리 숫자 원본
  const [agreed, setAgreed] = useState(false)

  // step 2 — 인증번호 확인
  const [code, setCode] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(AUTH_SECONDS)
  const [codeError, setCodeError] = useState(false)

  const rrnValid = rrn.length === 7 && /[1-8]/.test(rrn[6])
  const canRequest =
    name.trim() !== '' && carrier !== '' && validatePhone(phone) && rrnValid && agreed

  // 인증번호 카운트다운 — step 2 에서만 동작, 언마운트/단계 이동 시 정리
  useEffect(() => {
    if (step !== 2 || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [step, secondsLeft])

  const expired = secondsLeft <= 0
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  function requestCode() {
    setCode('')
    setCodeError(false)
    setSecondsLeft(AUTH_SECONDS)
    setStep(2)
  }

  function resend() {
    setCode('')
    setCodeError(false)
    setSecondsLeft(AUTH_SECONDS)
  }

  function verifyCode() {
    if (expired) return
    if (code === MOCK_CODE) {
      setStep(3)
      onComplete?.({ name: name.trim(), phone })
      return
    }
    setCodeError(true)
  }

  return (
    <div className={styles.flow}>
      <KrStepIndicator steps={STEPS} current={step - 1} />

      {step === 1 && (
        <>
          <div className={styles.fields}>
            <KrField label="이름" value={name} onChange={setName} placeholder="홍길동" />
            <div className={styles.carrierBlock}>
              <span className={styles.carrierLabel}>통신사</span>
              <KrCarrierSelect value={carrier} onChange={setCarrier} />
            </div>
            <KrPhoneField value={phone} onChange={setPhone} />
            <KrField
              label="주민등록번호 앞 7자리"
              value={formatRrnFront(rrn)}
              onChange={(v) => setRrn(digitsOnly(v).slice(0, 7))}
              placeholder="생년월일 6자리 + 성별 1자리"
              inputMode="numeric"
              maxLength={8}
            />
            <Checkbox
              checked={agreed}
              onChange={setAgreed}
              label="본인인증 서비스 이용 약관에 동의합니다"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            label="인증번호 받기"
            disabled={!canRequest}
            onClick={requestCode}
          />
        </>
      )}

      {step === 2 && (
        <>
          <div className={styles.fields}>
            <KrField
              label="인증번호"
              value={code}
              onChange={(v) => {
                setCode(digitsOnly(v).slice(0, 6))
                setCodeError(false)
              }}
              placeholder="6자리 숫자"
              inputMode="numeric"
              maxLength={6}
              error={codeError || expired}
              helperText={
                expired
                  ? '인증 시간이 만료되었습니다. 재전송해 주세요'
                  : codeError
                    ? '인증번호가 일치하지 않습니다'
                    : `${phone} 로 전송된 인증번호를 입력하세요`
              }
              trailing={
                <span
                  className={[styles.timer, expired ? styles.timerExpired : ''].filter(Boolean).join(' ')}
                >
                  {mm}:{ss}
                </span>
              }
            />
            <div className={styles.resendRow}>
              <span className={styles.hint}>인증번호가 오지 않았나요?</span>
              <button type="button" className={styles.linkBtn} onClick={resend}>
                재전송
              </button>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            label="인증 확인"
            disabled={code.length !== 6 || expired}
            onClick={verifyCode}
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
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>이름</span>
              <span className={styles.summaryVal}>{name.trim()}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>휴대폰</span>
              <span className={styles.summaryVal}>{phone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
