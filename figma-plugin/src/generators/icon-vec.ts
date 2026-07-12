// Lucide 24그리드 stroke 아이콘 → Figma 벡터(선). 오너 규칙: 라인아트.
// Figma는 아웃라인 path를 fill하면 와인딩이 어긋나 뭉개진다 → 반드시 stroke로 렌더한다.
import { ICON_PATHS } from '../icons-data'
import { svgToFigmaPath } from '../svg-path'

/**
 * key(_Icon/*)를 size×size 프레임에 담긴 stroke 벡터로 반환. paint = SolidPaint 또는
 * setBoundVariableForPaint 결과(프리셋 재색). 없는 아이콘/변환 실패 시 null.
 */
/** M/L/C/Z 경로의 모든 좌표 수를 s배 — 24 viewBox를 size로 직접 스케일(resize/rescale 없이 결정적). */
function scalePath(d: string, s: number): string {
  return d.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, (n) => String(Math.round(parseFloat(n) * s * 1000) / 1000))
}

export function strokeIcon(key: string, size: number, paint: Paint): FrameNode | null {
  const paths = ICON_PATHS[key]
  if (!paths) return null
  const s = size / 24
  const data = paths
    .map((d) => {
      try {
        return scalePath(svgToFigmaPath(d), s)
      } catch {
        return ''
      }
    })
    .filter(Boolean)
  if (!data.length) return null

  const v = figma.createVector()
  v.vectorPaths = data.map((d) => ({ windingRule: 'NONE', data: d }))
  v.fills = []
  v.strokes = [paint]
  v.strokeWeight = Math.max(1, Math.round((2 * s) * 100) / 100) // 24그리드 stroke 2px 비율
  v.strokeCap = 'ROUND'
  v.strokeJoin = 'ROUND'

  const box = figma.createFrame()
  box.name = key.replace('_Icon/', '')
  box.resize(size, size)
  box.fills = []
  box.clipsContent = false
  box.appendChild(v)
  // 좌표는 이미 size 스케일 → box 안에서 콘텐츠 bbox 중앙 정렬
  v.x = (size - v.width) / 2
  v.y = (size - v.height) / 2
  return box
}

// ── 아이콘 컴포넌트 공유 맵 ─────────────────────────────────────────────
// Icon System 페이지가 _Icon/* 컴포넌트를 만들면서 여기에 등록 → 카테고리가 findAll 없이 직접 참조.
export const ICON_COMPONENTS = new Map<string, ComponentNode>()

/** 아이콘 인스턴스(instance-swap 소스). 컴포넌트 없으면 인라인 stroke 폴백. */
export function iconInstance(key: string, name: string, size: number): SceneNode {
  const comp = ICON_COMPONENTS.get(key)
  if (comp) {
    const inst = comp.createInstance()
    inst.name = name
    if (size !== 24) inst.rescale(size / 24)
    return inst
  }
  const f = strokeIcon(key, size, { type: 'SOLID', color: { r: 0.545, g: 0.584, b: 0.631 } })
  if (f) {
    f.name = name
    return f
  }
  const e = figma.createFrame()
  e.name = name
  e.resize(size, size)
  e.fills = []
  return e
}
