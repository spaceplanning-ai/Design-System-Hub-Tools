import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Button } from '../../ds/Button/Button'
import { Dialog } from '../../ds/Dialog/Dialog'
import { EmailField } from '../../ds/EmailField/EmailField'
import { Header } from '../../ds/Header/Header'
import { Select } from '../../ds/Select/Select'
import { Snackbar } from '../../ds/Snackbar/Snackbar'
import { TextField } from '../../ds/TextField/TextField'
import { Toggle } from '../../ds/Toggle/Toggle'

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
]

const cardStyle: CSSProperties = {
  background: 'var(--ds-color-bg)',
  border: '1px solid var(--ds-color-border)',
  borderRadius: 'var(--ds-radius-lg)',
  padding: 'var(--ds-spacing-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ds-spacing-4)',
}

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 'var(--ds-font-size-md)',
  fontWeight: 'var(--ds-font-weight-bold)' as CSSProperties['fontWeight'],
  color: 'var(--ds-color-text)',
}

function SectionCard({ title, style, children }: { title: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <section style={{ ...cardStyle, ...style }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  )
}

/** Templates/Settings — 프로필·알림·위험 구역 3개 섹션으로 구성한 설정 페이지 */
export function SettingsPage() {
  const [email, setEmail] = useState('mina.lee@example.com')
  const [language, setLanguage] = useState<string | null>('ko')
  const [emailNoti, setEmailNoti] = useState(true)
  const [pushNoti, setPushNoti] = useState(true)
  const [marketingNoti, setMarketingNoti] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)

  return (
    <div
      style={{
        fontFamily: 'var(--ds-font-family)',
        minHeight: '100vh',
        background: 'var(--ds-color-bgSubtle)',
        padding: 'var(--ds-spacing-6)',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--ds-spacing-5)',
        }}
      >
        <Header title="설정" description="계정 정보와 알림 환경을 관리합니다." />

        <SectionCard title="프로필">
          <TextField label="이름" placeholder="이름을 입력하세요" />
          <EmailField value={email} onChange={setEmail} />
          <Select label="언어" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
        </SectionCard>

        <SectionCard title="알림">
          <Toggle checked={emailNoti} onChange={setEmailNoti} label="이메일 알림" />
          <Toggle checked={pushNoti} onChange={setPushNoti} label="푸시 알림" />
          <Toggle checked={marketingNoti} onChange={setMarketingNoti} label="마케팅 정보 수신" />
        </SectionCard>

        <SectionCard
          title="위험 구역"
          style={{ border: '1px solid color-mix(in srgb, var(--ds-color-error) 30%, var(--ds-color-border))' }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'var(--ds-font-size-sm)',
              color: 'var(--ds-color-secondary)',
            }}
          >
            계정을 삭제하면 모든 데이터가 영구적으로 제거되며 복구할 수 없습니다.
          </p>
          <div>
            <Button variant="error" size="md" label="계정 삭제" onClick={() => setDeleteOpen(true)} />
          </div>
        </SectionCard>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="md" label="변경사항 저장" onClick={() => setSavedOpen(true)} />
        </div>
      </div>

      <Dialog
        open={deleteOpen}
        variant="confirm"
        danger
        title="정말 삭제할까요?"
        description="삭제된 계정과 데이터는 복구할 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={() => {
          setDeleteOpen(false)
          setDeletedOpen(true)
        }}
        onCancel={() => setDeleteOpen(false)}
      />

      <Snackbar
        open={deletedOpen}
        variant="error"
        message="계정 삭제가 요청되었습니다."
        onClose={() => setDeletedOpen(false)}
      />
      <Snackbar
        open={savedOpen}
        variant="success"
        message="저장되었습니다."
        onClose={() => setSavedOpen(false)}
      />
    </div>
  )
}
