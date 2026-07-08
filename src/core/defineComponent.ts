import type { ComponentMeta, VariantProp } from './types';

/** Dev-mode detection that works in both Vite (import.meta.env) and Node (tsx) contexts. */
function isDev(): boolean {
  try {
    const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    return Boolean(env?.DEV);
  } catch {
    return false;
  }
}

const titleCase = (s: string) =>
  s
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/**
 * Normalise + validate a ComponentMeta. Fills labels, derives `isComponentSet`,
 * and (in dev) checks that each variant default is a valid option.
 */
export function defineComponentMeta(meta: ComponentMeta): ComponentMeta {
  const variantProps = meta.variantProps.map((v) => ({
    ...v,
    label: v.label ?? titleCase(v.name),
  }));

  if (isDev()) {
    for (const v of variantProps) {
      if (!v.options.includes(v.default)) {
        console.warn(
          `[TDS] ${meta.name}: variant "${v.name}" default "${v.default}" is not in options [${v.options.join(', ')}]`,
        );
      }
    }
  }

  const totalCombos = variantProps.reduce((acc, v) => acc * v.options.length, 1) * meta.states.length;

  return {
    ...meta,
    variantProps,
    isComponentSet: totalCombos > 1,
  };
}

/** Default variant selections as a plain object, e.g. `{ variant: 'solid', size: 'md' }`. */
export function defaultsFromMeta(meta: ComponentMeta): Record<string, string> {
  return Object.fromEntries(meta.variantProps.map((v) => [v.name, v.default]));
}

/**
 * Build the `data-*` attributes for a set of variant selections. Missing values
 * fall back to the variant default so the DOM always reflects a full variant combo
 * (which is exactly what a Figma plugin reads to place a variant).
 */
export function toDataAttrs(
  meta: ComponentMeta,
  values: Record<string, string | undefined>,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const v of meta.variantProps) {
    attrs[`data-${v.name}`] = values[v.name] ?? v.default;
  }
  return attrs;
}

export function variantProp(meta: ComponentMeta, name: string): VariantProp | undefined {
  return meta.variantProps.find((v) => v.name === name);
}

/** Total number of Figma variants this component will generate (incl. State axis). */
export function variantCount(meta: ComponentMeta): number {
  return meta.variantProps.reduce((acc, v) => acc * v.options.length, 1) * meta.states.length;
}
