import type { ReactNode } from 'react'
import type { StylePreset } from '../tokens/generated/types'
// 전역 import 허용 — [data-theme=...] 스코프라 프레임워크 CSS와 충돌하지 않음 (스펙 §6)
import '../tokens/generated/vars-bootstrap.css'
import '../tokens/generated/vars-tailwind.css'
import '../tokens/generated/vars-toss.css'
// 모션 토큰 레이어 (프리셋 무관) + prefers-reduced-motion 대응
import '../tokens/motion.css'

type Props = {
  preset: StylePreset
  children: ReactNode
}

export function ThemeScope({ preset, children }: Props) {
  return <div data-theme={preset}>{children}</div>
}
