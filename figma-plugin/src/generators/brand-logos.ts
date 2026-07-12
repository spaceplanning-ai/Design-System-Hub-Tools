// 브랜드/소셜 로고 → Figma 프레임(다색 FILL 벡터). 오너 규칙: Storybook 로고 SVG를 그대로.
// 아이콘(icon-vec.ts)은 stroke 라인아트지만, 브랜드 로고는 원본 fill·색·레이어 순서를 보존한다.
import { LOGOS_DATA } from '../logos-data'
import { hexToRgb } from '../presets'
import { svgToFigmaPath } from '../svg-path'

const NUM = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi

// M/L/C/Z 절대 경로의 좌표쌍을 아핀 변환: (x,y) → ((x-minX)*s, (y-minY)*s).
// svgToFigmaPath 출력은 A/H/V/S/T 없이 좌표쌍만 있으므로 x,y 교대 파싱이 안전하다.
function transformPath(d: string, minX: number, minY: number, s: number): string {
  let isX = true
  return d.replace(NUM, (n) => {
    const v = parseFloat(n)
    const r = isX ? (v - minX) * s : (v - minY) * s
    isX = !isX
    return String(Math.round(r * 1000) / 1000)
  })
}

// 변환된 경로의 bbox 좌상단(Figma는 벡터 지오메트리를 bbox-min→로컬원점으로 정규화 → 노드 x/y로 복원).
function bboxMin(d: string): [number, number] {
  let isX = true
  let mnX = Infinity
  let mnY = Infinity
  let m: RegExpExecArray | null
  NUM.lastIndex = 0
  while ((m = NUM.exec(d))) {
    const v = parseFloat(m[0])
    if (isX) mnX = Math.min(mnX, v)
    else mnY = Math.min(mnY, v)
    isX = !isX
  }
  return [mnX === Infinity ? 0 : mnX, mnY === Infinity ? 0 : mnY]
}

export const BRAND_KEYS = ['google', 'kakao', 'naver', 'facebook']

/** 브랜드 로고를 size×size 프레임(다색 fill 벡터들)으로 반환. 없거나 변환 실패 시 null. */
export function brandLogo(key: string, size: number): FrameNode | null {
  const data = LOGOS_DATA[key]
  if (!data) return null
  const [minX, minY, vbW, vbH] = data.viewBox
  const s = size / Math.max(vbW, vbH) // 로고 viewBox는 정사각 → 균일 스케일
  const box = figma.createFrame()
  box.name = key
  box.resize(size, size)
  box.fills = []
  box.clipsContent = false
  let added = 0
  for (const p of data.paths) {
    let fd: string
    try {
      fd = svgToFigmaPath(p.d)
    } catch {
      continue
    }
    const td = transformPath(fd, minX, minY, s)
    const [mnX, mnY] = bboxMin(td)
    const v = figma.createVector()
    v.vectorPaths = [{ windingRule: 'NONZERO', data: td }]
    v.strokes = []
    v.fills = [{ type: 'SOLID', color: hexToRgb(p.fill) }]
    box.appendChild(v)
    v.x = mnX
    v.y = mnY
    added++
  }
  if (!added) {
    box.remove()
    return null
  }
  return box
}
