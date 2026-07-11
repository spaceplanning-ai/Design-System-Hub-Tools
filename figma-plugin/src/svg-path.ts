// SVG path data → Figma vectorPaths-safe path.
//
// Figma의 vectorPaths 파서는 SVG path 전체 문법을 지원하지 않는다. 다음을 거부한다:
//   - 원호(arc) 명령 A/a
//   - 축약 명령 H/V/S/T
//   - 공백 없이 붙은 숫자 팩킹(예: ".386.198" = 두 수, "0 001" = 세 플래그)
//   - (안전을 위해) 상대 좌표 소문자 명령
// 이 모듈은 임의의 SVG path를 절대 좌표 M/L/C/Z(직선·3차 베지어·닫기)로만 정규화한다.
// 원호는 3차 베지어로 근사(표준 endpoint→center 매개화), 2차 Q는 무손실로 3차 변환.
// bootstrap-icons(icons-data.ts) 같은 원본 path를 Figma에 안전하게 넣기 위한 것.

type Seg = { cmd: string; args: number[] }

const ARG_COUNT: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
const isCmdChar = (c: string) => 'MmLlHhVvCcSsQqTtAaZz'.indexOf(c) >= 0
const isSep = (c: string) => c === ' ' || c === ',' || c === '\t' || c === '\n' || c === '\r'
const isDigit = (c: string) => c >= '0' && c <= '9'

/** SVG path 문자열을 명령 인스턴스 배열로 토큰화(암시적 반복·팩킹된 arc 플래그 처리). */
function tokenize(d: string): Seg[] {
  const out: Seg[] = []
  let i = 0
  const n = d.length

  const skipSep = () => {
    while (i < n && isSep(d[i])) i++
  }
  const readNumber = (): number | null => {
    skipSep()
    const start = i
    if (i < n && (d[i] === '+' || d[i] === '-')) i++
    let hasDigits = false
    while (i < n && isDigit(d[i])) {
      i++
      hasDigits = true
    }
    if (i < n && d[i] === '.') {
      i++
      while (i < n && isDigit(d[i])) {
        i++
        hasDigits = true
      }
    }
    if (hasDigits && i < n && (d[i] === 'e' || d[i] === 'E')) {
      i++
      if (i < n && (d[i] === '+' || d[i] === '-')) i++
      while (i < n && isDigit(d[i])) i++
    }
    if (!hasDigits) {
      i = start
      return null
    }
    return parseFloat(d.slice(start, i))
  }
  // arc의 large-arc-flag / sweep-flag는 단일 문자 0|1 (공백 없이 붙을 수 있음)
  const readFlag = (): number | null => {
    skipSep()
    if (i < n && (d[i] === '0' || d[i] === '1')) {
      const f = d[i] === '1' ? 1 : 0
      i++
      return f
    }
    return null
  }
  const readArgs = (cmd: string): number[] => {
    const lower = cmd.toLowerCase()
    if (lower === 'a') {
      const rx = readNumber()
      const ry = readNumber()
      const rot = readNumber()
      const laf = readFlag()
      const sf = readFlag()
      const x = readNumber()
      const y = readNumber()
      if ([rx, ry, rot, laf, sf, x, y].some((v) => v === null)) {
        throw new Error(`잘못된 arc 인자: "${d.slice(0, 40)}"`)
      }
      return [rx!, ry!, rot!, laf!, sf!, x!, y!]
    }
    const count = ARG_COUNT[lower]
    const args: number[] = []
    for (let k = 0; k < count; k++) {
      const v = readNumber()
      if (v === null) throw new Error(`명령 '${cmd}' 인자 부족: "${d.slice(0, 40)}"`)
      args.push(v)
    }
    return args
  }

  let lastCmd = ''
  for (;;) {
    skipSep()
    if (i >= n) break
    let cmd: string
    if (isCmdChar(d[i])) {
      cmd = d[i]
      i++
    } else {
      // 암시적 반복: 이전 명령 재사용. 단 M/m 뒤 좌표쌍은 L/l로 해석(SVG 규약).
      if (lastCmd === 'M') cmd = 'L'
      else if (lastCmd === 'm') cmd = 'l'
      else if (lastCmd) cmd = lastCmd
      else throw new Error(`path가 명령으로 시작하지 않음: "${d.slice(0, 40)}"`)
    }
    if (cmd === 'Z' || cmd === 'z') {
      out.push({ cmd: 'Z', args: [] })
      lastCmd = cmd
      continue
    }
    out.push({ cmd, args: readArgs(cmd) })
    lastCmd = cmd
  }
  return out
}

/** 원호 → 3차 베지어 세그먼트들. 반환: [[c1x,c1y,c2x,c2y,ex,ey], ...] (절대 좌표). */
function arcToCubics(
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  phiDeg: number,
  fa: number,
  fs: number,
  x2: number,
  y2: number,
): number[][] {
  if (x1 === x2 && y1 === y2) return []
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]] // 반경 0 → 직선(3차로 표현)

  const phi = (phiDeg * Math.PI) / 180
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cosPhi * dx + sinPhi * dy
  const y1p = -sinPhi * dx + cosPhi * dy

  // 반경이 너무 작으면 보정(SVG 구현 노트 F.6.6)
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    const s = Math.sqrt(lambda)
    rx *= s
    ry *= s
  }

  const rxsq = rx * rx
  const rysq = ry * ry
  const x1psq = x1p * x1p
  const y1psq = y1p * y1p
  let radicand = (rxsq * rysq - rxsq * y1psq - rysq * x1psq) / (rxsq * y1psq + rysq * x1psq)
  if (radicand < 0) radicand = 0
  let coef = Math.sqrt(radicand)
  if (fa === fs) coef = -coef
  const cxp = (coef * (rx * y1p)) / ry
  const cyp = (coef * -(ry * x1p)) / rx
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2

  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy))
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)))
    if (ux * vy - uy * vx < 0) a = -a
    return a
  }
  const ux = (x1p - cxp) / rx
  const uy = (y1p - cyp) / ry
  const vx = (-x1p - cxp) / rx
  const vy = (-y1p - cyp) / ry
  const theta1 = angle(1, 0, ux, uy)
  let dtheta = angle(ux, uy, vx, vy)
  if (fs === 0 && dtheta > 0) dtheta -= 2 * Math.PI
  if (fs === 1 && dtheta < 0) dtheta += 2 * Math.PI

  const segCount = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)))
  const delta = dtheta / segCount
  const t = (4 / 3) * Math.tan(delta / 4)
  const segs: number[][] = []
  let th1 = theta1
  for (let s = 0; s < segCount; s++) {
    const cosTh1 = Math.cos(th1)
    const sinTh1 = Math.sin(th1)
    const th2 = th1 + delta
    const cosTh2 = Math.cos(th2)
    const sinTh2 = Math.sin(th2)

    const startX = cx + rx * cosPhi * cosTh1 - ry * sinPhi * sinTh1
    const startY = cy + rx * sinPhi * cosTh1 + ry * cosPhi * sinTh1
    const endX = cx + rx * cosPhi * cosTh2 - ry * sinPhi * sinTh2
    const endY = cy + rx * sinPhi * cosTh2 + ry * cosPhi * sinTh2

    const d1x = -rx * cosPhi * sinTh1 - ry * sinPhi * cosTh1
    const d1y = -rx * sinPhi * sinTh1 + ry * cosPhi * cosTh1
    const d2x = -rx * cosPhi * sinTh2 - ry * sinPhi * cosTh2
    const d2y = -rx * sinPhi * sinTh2 + ry * cosPhi * cosTh2

    segs.push([startX + t * d1x, startY + t * d1y, endX - t * d2x, endY - t * d2y, endX, endY])
    th1 = th2
  }
  return segs
}

function round3(n: number): number {
  const r = Math.round(n * 1000) / 1000
  return Object.is(r, -0) ? 0 : r
}

/**
 * 임의의 SVG path → Figma vectorPaths-safe 절대 M/L/C/Z 문자열.
 * 출력은 M/L/C/Z 명령과 공백 구분 숫자만 포함한다(A/H/V/S/T/Q·상대명령·팩킹 없음).
 */
export function svgToFigmaPath(d: string): string {
  const segs = tokenize(d)
  const out: string[] = []
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let prevCtrlX = 0
  let prevCtrlY = 0
  let prevCmd = ''

  const emitM = (x: number, y: number) => out.push(`M ${round3(x)} ${round3(y)}`)
  const emitL = (x: number, y: number) => out.push(`L ${round3(x)} ${round3(y)}`)
  const emitC = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) =>
    out.push(`C ${round3(x1)} ${round3(y1)} ${round3(x2)} ${round3(y2)} ${round3(x)} ${round3(y)}`)
  // 2차 베지어(P0,Pc,P1) → 3차(무손실)
  const emitQuadAsC = (pcx: number, pcy: number, x: number, y: number) => {
    const c1x = cx + (2 / 3) * (pcx - cx)
    const c1y = cy + (2 / 3) * (pcy - cy)
    const c2x = x + (2 / 3) * (pcx - x)
    const c2y = y + (2 / 3) * (pcy - y)
    emitC(c1x, c1y, c2x, c2y, x, y)
  }

  for (const seg of segs) {
    const cmd = seg.cmd
    const rel = cmd >= 'a' && cmd <= 'z'
    const a = seg.args
    const up = cmd.toUpperCase()

    if (up === 'M') {
      const x = rel ? cx + a[0] : a[0]
      const y = rel ? cy + a[1] : a[1]
      emitM(x, y)
      cx = sx = x
      cy = sy = y
    } else if (up === 'L') {
      const x = rel ? cx + a[0] : a[0]
      const y = rel ? cy + a[1] : a[1]
      emitL(x, y)
      cx = x
      cy = y
    } else if (up === 'H') {
      const x = rel ? cx + a[0] : a[0]
      emitL(x, cy)
      cx = x
    } else if (up === 'V') {
      const y = rel ? cy + a[0] : a[0]
      emitL(cx, y)
      cy = y
    } else if (up === 'C') {
      const x1 = rel ? cx + a[0] : a[0]
      const y1 = rel ? cy + a[1] : a[1]
      const x2 = rel ? cx + a[2] : a[2]
      const y2 = rel ? cy + a[3] : a[3]
      const x = rel ? cx + a[4] : a[4]
      const y = rel ? cy + a[5] : a[5]
      emitC(x1, y1, x2, y2, x, y)
      prevCtrlX = x2
      prevCtrlY = y2
      cx = x
      cy = y
    } else if (up === 'S') {
      const reflect = prevCmd === 'C' || prevCmd === 'S'
      const x1 = reflect ? 2 * cx - prevCtrlX : cx
      const y1 = reflect ? 2 * cy - prevCtrlY : cy
      const x2 = rel ? cx + a[0] : a[0]
      const y2 = rel ? cy + a[1] : a[1]
      const x = rel ? cx + a[2] : a[2]
      const y = rel ? cy + a[3] : a[3]
      emitC(x1, y1, x2, y2, x, y)
      prevCtrlX = x2
      prevCtrlY = y2
      cx = x
      cy = y
    } else if (up === 'Q') {
      const px = rel ? cx + a[0] : a[0]
      const py = rel ? cy + a[1] : a[1]
      const x = rel ? cx + a[2] : a[2]
      const y = rel ? cy + a[3] : a[3]
      emitQuadAsC(px, py, x, y)
      prevCtrlX = px
      prevCtrlY = py
      cx = x
      cy = y
    } else if (up === 'T') {
      const reflect = prevCmd === 'Q' || prevCmd === 'T'
      const px = reflect ? 2 * cx - prevCtrlX : cx
      const py = reflect ? 2 * cy - prevCtrlY : cy
      const x = rel ? cx + a[0] : a[0]
      const y = rel ? cy + a[1] : a[1]
      emitQuadAsC(px, py, x, y)
      prevCtrlX = px
      prevCtrlY = py
      cx = x
      cy = y
    } else if (up === 'A') {
      const x = rel ? cx + a[5] : a[5]
      const y = rel ? cy + a[6] : a[6]
      const cubics = arcToCubics(cx, cy, a[0], a[1], a[2], a[3], a[4], x, y)
      for (const c of cubics) emitC(c[0], c[1], c[2], c[3], c[4], c[5])
      cx = x
      cy = y
    } else if (up === 'Z') {
      emitZ()
      cx = sx
      cy = sy
    }

    // 반사 기준 갱신: C/S/Q/T가 아니면 제어점 무효화
    if (up !== 'C' && up !== 'S' && up !== 'Q' && up !== 'T') {
      prevCtrlX = cx
      prevCtrlY = cy
    }
    prevCmd = up
  }

  return out.join(' ')

  function emitZ() {
    out.push('Z')
  }
}
