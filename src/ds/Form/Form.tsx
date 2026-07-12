import { useState } from 'react'
import { TextField } from '../TextField/TextField'
import { Textarea } from '../Textarea/Textarea'
import { Checkbox } from '../Checkbox/Checkbox'
import { Button } from '../Button/Button'
import styles from './Form.module.css'

export type FormProps = {
  title?: string
  submitLabel?: string
  onSubmit?: () => void
}

export function Form({ title = '문의하기', submitLabel = '보내기', onSubmit }: FormProps) {
  const [message, setMessage] = useState('')
  const [agree, setAgree] = useState(false)
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <h3 className={styles.title}>{title}</h3>
      <TextField label="이름" placeholder="홍길동" />
      <TextField label="이메일" placeholder="name@example.com" />
      <Textarea label="메시지" value={message} onChange={setMessage} placeholder="내용을 입력하세요" />
      <Checkbox checked={agree} onChange={setAgree} label="개인정보 수집에 동의합니다" />
      <Button variant="primary" size="md" label={submitLabel} />
    </form>
  )
}
