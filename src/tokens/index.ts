import type { DesignToken, TokenCollection, TokenValue } from './types';
import { isAlias } from './types';
import { primitiveCollection, rawScales } from './primitives';
import {
  semanticColorCollection,
  semanticScalarCollection,
  effectCollection,
  textStyleCollection,
} from './semantic';

export * from './types';
export { rawScales };

/**
 * All token collections, in dependency order (primitives first so aliases resolve).
 * This array is the single source of truth consumed by:
 *   - the CSS generator (build-tokens.ts) -> src/tokens/generated/tokens.css
 *   - the Figma generator (build-tokens.ts) -> src/tokens/generated/figma.tokens.json
 *   - the component manifest (build-manifest.ts)
 */
export const allCollections: TokenCollection[] = [
  primitiveCollection,
  semanticScalarCollection,
  semanticColorCollection,
  effectCollection,
  textStyleCollection,
];

export interface RegistryEntry {
  token: DesignToken;
  collection: TokenCollection;
}

export const tokenRegistry: Map<string, RegistryEntry> = new Map();
for (const collection of allCollections) {
  for (const token of collection.tokens) {
    tokenRegistry.set(token.id, { token, collection });
  }
}

export function getToken(id: string): RegistryEntry | undefined {
  return tokenRegistry.get(id);
}

/**
 * Resolve a token id to its concrete (non-alias) scalar value for a given mode,
 * following alias chains across collections.
 */
export function resolveValue(id: string, mode = 'default'): TokenValue | undefined {
  const entry = tokenRegistry.get(id);
  if (!entry) return undefined;
  const { token, collection } = entry;
  const useMode = collection.modes.includes(mode) ? mode : collection.defaultMode;
  const value = token.values[useMode] ?? token.values[collection.defaultMode];
  if (isAlias(value)) {
    return resolveValue(value.alias, mode);
  }
  return value;
}

/** All modes referenced across collections (e.g. ['default','light','dark']). */
export const allModes: string[] = Array.from(new Set(allCollections.flatMap((c) => c.modes)));

/** Theme modes only (excludes the implicit `default`). */
export const themeModes: string[] = semanticColorCollection.modes;
