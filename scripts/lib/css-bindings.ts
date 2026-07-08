/**
 * CSS-derived visual token bindings.
 *
 * The component `.meta.ts` files carry almost no visual data, so the generated
 * manifest had nothing for the Figma plugin to paint — every variant rendered as
 * the same empty box. The real per-variant styling lives in each component's CSS,
 * which is fully systematic:
 *
 *   .tds-<slug>[data-tone='…']     -> sets role custom-props (solid/subtle/border/fg…)
 *   .tds-<slug>[data-variant='…']  -> picks background / color / border from those roles
 *   .tds-<slug>[data-size='…']     -> height / padding / font-size
 *   .tds-<slug>[data-shape='…']    -> border-radius
 *   :hover / :active / :disabled … -> the `state` axis
 *
 * This module parses that CSS (source of truth — nothing invented) and projects it
 * back into `tokenBindings` with minimal `when` clauses, one per axis-combination on
 * which a channel actually varies. The Figma plugin already knows how to apply
 * `when`-conditioned bindings, so no per-component plugin code is needed.
 *
 * Honest limits: values Figma variables cannot express — `color-mix()`, focus-ring
 * box-shadows, gradients, `@media` responsive overrides — are skipped rather than
 * approximated. Colors, borders, radius, sizing and spacing map cleanly.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss, { type Rule, type Declaration } from 'postcss';

export interface TokenBinding {
  property: string;
  token: string;
  when?: Record<string, string>;
}

interface Axis {
  name: string;
  options: string[];
  default: string;
}

/** CSS declaration value resolved to a bindable target. */
type Resolved =
  | { kind: 'token'; id: string } // a --tds-* design token
  | { kind: 'transparent' } // background/border explicitly cleared
  | null; // unresolvable (literal, color-mix, etc.) — skipped

// --- CSS property -> figma binding channel (matches the plugin's resolveChannels) ---
const CHANNELS: Array<{ prop: string; css: string[] }> = [
  { prop: 'background', css: ['background-color', 'background'] },
  { prop: 'color', css: ['color'] },
  { prop: 'border-color', css: ['border-color'] },
  { prop: 'corner-radius', css: ['border-radius'] },
  { prop: 'height', css: ['height'] },
  { prop: 'padding-x', css: ['padding-inline', 'padding-left', 'padding-right', 'padding'] },
  { prop: 'padding-y', css: ['padding-block', 'padding-top', 'padding-bottom'] },
  { prop: 'gap', css: ['gap'] },
  { prop: 'font-size', css: ['font-size'] },
  { prop: 'stroke-width', css: ['border-width'] },
];

const STATE_PSEUDO: Array<[RegExp, string]> = [
  [/:hover/, 'hover'],
  [/:active/, 'active'],
  [/:focus-visible/, 'focus'],
  [/:focus\b/, 'focus'],
  [/:disabled/, 'disabled'],
];

/** `--tds-color-brand-solidHover` -> `color.brand.solidHover` (dashes to dots). */
function tdsVarToTokenId(varName: string): string | null {
  if (!varName.startsWith('--tds-')) return null;
  return varName.slice('--tds-'.length).replace(/-/g, '.');
}

/** Extract the first `var(--x[, fallback])` reference's custom-property name. */
function firstVar(value: string): string | null {
  const m = value.match(/var\(\s*(--[a-zA-Z0-9-]+)/);
  return m ? m[1] : null;
}

/** Pull the color term out of a `border:` / `border-color:` shorthand. */
function borderColorTerm(value: string): string {
  // Split on top-level spaces, keeping var(...) groups intact.
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of value.trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ' ' && depth === 0) {
      if (cur) parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  // width style color  ->  the color is the last term that is a var() or color keyword.
  const colorish = parts.filter((p) =>
    /^var\(|^#|transparent|currentColor|^rgb|^hsl|inherit/.test(p),
  );
  return colorish.length ? colorish[colorish.length - 1] : value.trim();
}

function borderWidthTerm(value: string): string {
  const first = value.trim().split(/\s+/)[0];
  return first ?? value.trim();
}

interface CondRule {
  attrs: Record<string, string>; // data-<axis> -> value
  state?: string; // from pseudo-class
  specificity: number; // attrs + (state?1:0)
  order: number; // source order
  decls: Map<string, string>; // css prop -> value (last wins within rule)
  vars: Map<string, string>; // --custom-prop -> value
}

/** Parse one component's CSS into ordered, root-element condition rules. */
function parseComponentCss(css: string, slug: string): CondRule[] {
  const base = `.tds-${slug}`;
  const root = postcss.parse(css);
  const out: CondRule[] = [];
  let order = 0;

  // Only top-level rules (skip @media / @keyframes — responsive/animation overrides).
  root.each((node) => {
    if (node.type !== 'rule') return;
    const rule = node as Rule;
    for (const rawSel of rule.selector.split(',')) {
      const sel = rawSel.trim();
      if (!sel.startsWith(base)) continue;
      const rest = sel.slice(base.length);
      // Reject descendant / child / sibling / nested-element selectors — root only.
      const noNot = rest.replace(/:not\([^)]*\)/g, '');
      if (/[\s>+~]/.test(noNot.trim()) || noNot.includes('__') || /\.[a-z]/i.test(noNot)) continue;

      const attrs: Record<string, string> = {};
      const attrRe = /\[data-([a-z]+)=['"]?([^'"\]]+)['"]?\]/g;
      let m: RegExpExecArray | null;
      while ((m = attrRe.exec(rest))) attrs[m[1]] = m[2];

      let state: string | undefined;
      const pseudoSrc = rest.replace(/:not\([^)]*\)/g, '');
      for (const [re, st] of STATE_PSEUDO)
        if (re.test(pseudoSrc)) {
          state = st;
          break;
        }

      const decls = new Map<string, string>();
      const vars = new Map<string, string>();
      rule.each((d) => {
        if (d.type !== 'decl') return;
        const decl = d as Declaration;
        if (decl.prop.startsWith('--')) vars.set(decl.prop, decl.value);
        else decls.set(decl.prop, decl.value);
      });

      out.push({
        attrs,
        state,
        specificity: Object.keys(attrs).length + (state ? 1 : 0),
        order: order++,
        decls,
        vars,
      });
    }
  });
  return out;
}

/** Does a rule apply to this combo? (all its data-attrs match; its pseudo-state matches.) */
function ruleMatches(rule: CondRule, combo: Record<string, string>): boolean {
  for (const [k, v] of Object.entries(rule.attrs)) if (combo[k] !== v) return false;
  if (rule.state) {
    // The `state` axis (if present) drives pseudo-class rules; otherwise only the base
    // (stateless) rules apply.
    if (combo.state !== rule.state) return false;
  }
  return true;
}

/** Rules that apply to a combo, ordered so the winning declaration is last. */
function applicable(rules: CondRule[], combo: Record<string, string>): CondRule[] {
  return rules
    .filter((r) => ruleMatches(r, combo))
    .sort((a, b) => a.specificity - b.specificity || a.order - b.order);
}

/** Effective custom-property value (raw string) for a combo, or undefined. */
function effectiveVar(
  rules: CondRule[],
  combo: Record<string, string>,
  name: string,
): string | undefined {
  let val: string | undefined;
  for (const r of applicable(rules, combo)) if (r.vars.has(name)) val = r.vars.get(name);
  return val;
}

/** Effective raw CSS value of a property for a combo (last matching declaration wins). */
function effectiveDecl(
  rules: CondRule[],
  combo: Record<string, string>,
  cssProps: string[],
): string | undefined {
  let val: string | undefined;
  for (const r of applicable(rules, combo)) {
    for (const p of cssProps) if (r.decls.has(p)) val = r.decls.get(p);
  }
  return val;
}

/** Resolve a raw CSS value (following one/two levels of component custom-prop indirection) to a token. */
function resolveValue(
  rules: CondRule[],
  combo: Record<string, string>,
  raw: string | undefined,
  channelProp: string,
  depth = 0,
): Resolved {
  if (raw === undefined || depth > 4) return null;
  let value = raw.trim();
  if (channelProp === 'border-color') value = borderColorTerm(value);
  if (channelProp === 'stroke-width') value = borderWidthTerm(value);

  if (/^transparent$/i.test(value) || /^none$/i.test(value)) return { kind: 'transparent' };

  const v = firstVar(value);
  if (!v) return null; // literal length / color-mix / keyword — not bindable
  const tokenId = tdsVarToTokenId(v);
  if (tokenId) return { kind: 'token', id: tokenId };
  // Component-local custom property — follow it.
  const next = effectiveVar(rules, combo, v);
  return resolveValue(rules, combo, next, channelProp, depth + 1);
}

function cartesian(axes: Axis[]): Record<string, string>[] {
  let combos: Record<string, string>[] = [{}];
  for (const ax of axes) {
    const next: Record<string, string>[] = [];
    for (const c of combos) for (const opt of ax.options) next.push({ ...c, [ax.name]: opt });
    combos = next;
  }
  return combos;
}

function resolvedKey(r: Resolved): string {
  return r === null ? '∅' : r.kind === 'transparent' ? 'transparent' : r.id;
}

// Locate a component's CSS: src/components/<tier>/<Name>/<Name>.css
const TIERS = ['atoms', 'molecules', 'organisms'];
function findCss(root: string, name: string): string | null {
  for (const tier of TIERS) {
    const p = resolve(root, 'src/components', tier, name, `${name}.css`);
    if (existsSync(p)) return p;
  }
  // Fallback: scan for <name>/<name>.css anywhere under src/components.
  const cdir = resolve(root, 'src/components');
  for (const tier of readdirSync(cdir, { withFileTypes: true })) {
    if (!tier.isDirectory()) continue;
    const p = resolve(cdir, tier.name, name, `${name}.css`);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Generate per-variant visual token bindings for a component from its CSS.
 * `axes` are the component's variant axes (incl. the synthesized `state` axis).
 * `hasToken` validates an id against the real token registry.
 */
export function cssBindingsFor(
  root: string,
  name: string,
  slug: string,
  axes: Axis[],
  hasToken: (id: string) => boolean,
): { bindings: TokenBinding[]; note?: string } {
  const cssPath = findCss(root, name);
  if (!cssPath) return { bindings: [], note: `no CSS found for ${name}` };

  const rules = parseComponentCss(readFileSync(cssPath, 'utf8'), slug);
  if (!rules.length) return { bindings: [] };

  const defaultCombo: Record<string, string> = {};
  for (const ax of axes) defaultCombo[ax.name] = ax.default;

  const bindings: TokenBinding[] = [];

  for (const channel of CHANNELS) {
    const resolveAt = (combo: Record<string, string>): Resolved => {
      const full = { ...defaultCombo, ...combo };
      const raw = effectiveDecl(rules, full, channel.css);
      return resolveValue(rules, full, raw, channel.prop);
    };

    const baseVal = resolveAt(defaultCombo);

    // Which axes actually change this channel's resolved value?
    // (a) sample one-at-a-time from the default combo, and
    // (b) union any axis that gates a rule setting this channel's CSS property.
    const depNames = new Set<string>();
    for (const ax of axes) {
      for (const opt of ax.options) {
        if (opt === ax.default) continue;
        if (resolvedKey(resolveAt({ [ax.name]: opt })) !== resolvedKey(baseVal)) {
          depNames.add(ax.name);
          break;
        }
      }
    }
    for (const r of rules) {
      const setsChannel = channel.css.some((p) => r.decls.has(p));
      if (!setsChannel) continue;
      for (const k of Object.keys(r.attrs)) if (axes.some((a) => a.name === k)) depNames.add(k);
      if (r.state && axes.some((a) => a.name === 'state')) depNames.add('state');
    }

    const depAxes = axes.filter((a) => depNames.has(a.name));
    const whenCombos = depAxes.length ? cartesian(depAxes) : [{}];

    for (const wc of whenCombos) {
      const res = resolveAt(wc);
      if (!res) continue;
      const token = res.kind === 'transparent' ? 'transparent' : res.id;
      if (res.kind === 'token' && !hasToken(res.id)) continue; // drop stale/unknown ids
      // Skip a redundant "transparent" that equals the (also transparent) base with no gating.
      bindings.push({ property: channel.prop, token, ...(depAxes.length ? { when: wc } : {}) });
    }
  }

  return { bindings };
}
