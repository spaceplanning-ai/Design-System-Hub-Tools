/**
 * Pure chart helpers — scales and SVG path builders. No React, no DOM.
 * Charts render into a fixed viewBox and scale via `preserveAspectRatio`.
 */

export interface Point {
  x: number;
  y: number;
}

/** Round a max value up to a "nice" axis bound (1/2/5 × 10ⁿ). */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nice * base;
}

/** Evenly spaced tick values from 0..max (inclusive), `count` steps. */
export function ticks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => (max / count) * i);
}

/** Map a data value in [0,max] to a y pixel within [top, top+height] (inverted). */
export function yScale(value: number, max: number, top: number, height: number): number {
  return top + height - (value / max) * height;
}

/** `M`+`L` polyline through points. */
export function linePath(pts: Point[]): string {
  if (!pts.length) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/** Closed area under a line down to `baselineY`. */
export function areaPath(pts: Point[], baselineY: number): string {
  if (!pts.length) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${linePath(pts)} L${last.x.toFixed(2)},${baselineY} L${first.x.toFixed(2)},${baselineY} Z`;
}

const polar = (cx: number, cy: number, r: number, angleDeg: number): Point => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

/** Donut/pie arc segment between two angles (degrees, 0 = 12 o'clock, clockwise). */
export function donutArc(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
): string {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOuter, endAngle);
  const o2 = polar(cx, cy, rOuter, startAngle);
  const i1 = polar(cx, cy, rInner, startAngle);
  const i2 = polar(cx, cy, rInner, endAngle);
  return [
    `M${o1.x.toFixed(2)},${o1.y.toFixed(2)}`,
    `A${rOuter},${rOuter} 0 ${largeArc} 0 ${o2.x.toFixed(2)},${o2.y.toFixed(2)}`,
    `L${i1.x.toFixed(2)},${i1.y.toFixed(2)}`,
    `A${rInner},${rInner} 0 ${largeArc} 1 ${i2.x.toFixed(2)},${i2.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** The six categorical series CSS variables, in fixed order. */
export const CHART_SERIES_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
] as const;

export const seriesColor = (i: number): string => CHART_SERIES_VARS[i % CHART_SERIES_VARS.length];
