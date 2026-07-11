import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { FIGMA_FILE } from '../shared/figma'
import { Button } from '../ds/Button/Button'
import styles from './Motion.module.css'

const DEMOS = [
  { name: 'Fade In', className: styles.fadeIn, token: 'duration-base · ease-enter' },
  { name: 'Slide Up', className: styles.slideUp, token: 'duration-base · ease-standard' },
  { name: 'Scale In (spring)', className: styles.scaleIn, token: 'duration-slow · ease-spring' },
  { name: 'Fade Out', className: styles.fadeOut, token: 'duration-fast · ease-exit' },
  { name: 'Spin (무한)', className: styles.spin, token: '1.2s · linear' },
]

const TOKENS = [
  ['--ds-duration-fast', '100ms', '즉각 피드백 (fade out, 눌림)'],
  ['--ds-duration-base', '200ms', '기본 전환 (등장, 이동, 색 변화)'],
  ['--ds-duration-slow', '320ms', '큰 면적 전환 (시트, 스프링 등장)'],
  ['--ds-ease-standard', 'cubic-bezier(0.2, 0, 0, 1)', '기본 이동'],
  ['--ds-ease-enter', 'cubic-bezier(0, 0, 0.2, 1)', '등장'],
  ['--ds-ease-exit', 'cubic-bezier(0.4, 0, 1, 1)', '퇴장'],
  ['--ds-ease-spring', 'cubic-bezier(0.34, 1.56, 0.64, 1)', '탄성 강조'],
]

/** 모션 토큰 데모 — 다시 재생은 key 리마운트로 구현 */
function MotionDemo() {
  const [runId, setRunId] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Button variant="secondary" size="sm" label="전체 다시 재생" onClick={() => setRunId((n) => n + 1)} />
      <div className={styles.grid}>
        {DEMOS.map((demo) => (
          <div key={demo.name} className={styles.tile}>
            <div className={styles.stage}>
              <div key={runId} className={[styles.box, demo.className].join(' ')} />
            </div>
            <span className={styles.name}>{demo.name}</span>
            <span className={styles.meta}>{demo.token}</span>
          </div>
        ))}
      </div>
      <table className={styles.tokenTable}>
        <thead>
          <tr>
            <th>토큰</th>
            <th>값</th>
            <th>용도</th>
          </tr>
        </thead>
        <tbody>
          {TOKENS.map(([token, value, usage]) => (
            <tr key={token}>
              <td>
                <code className={styles.code}>{token}</code>
              </td>
              <td>{value}</td>
              <td>{usage}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.meta} style={{ textAlign: 'left' }}>
        OS의 &lsquo;모션 감소&rsquo; 설정(prefers-reduced-motion)이 켜져 있으면 모든
        애니메이션·트랜지션이 자동으로 비활성화됩니다 (src/tokens/motion.css).
      </p>
    </div>
  )
}

const meta = {
  title: 'Animations/Motion',
  component: MotionDemo,
  tags: ['autodocs'],
  parameters: {
    design: { type: 'figma', url: `${FIGMA_FILE}?node-id=0-1` },
  },
} satisfies Meta<typeof MotionDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
