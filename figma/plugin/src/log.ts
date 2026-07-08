// Thin bridge to the plugin UI for progress + log lines.

export function progress(pct: number, label: string): void {
  figma.ui.postMessage({ type: 'progress', pct, label });
}

export function log(text: string, level?: 'warn' | 'err'): void {
  figma.ui.postMessage({ type: 'log', text, level });
}

export function done(label: string): void {
  figma.ui.postMessage({ type: 'done', label });
}

/** Collected non-fatal gaps (missing fonts, unresolved aliases, …) surfaced at the end. */
export const warnings: string[] = [];

export function warn(text: string): void {
  warnings.push(text);
  log(text, 'warn');
}
