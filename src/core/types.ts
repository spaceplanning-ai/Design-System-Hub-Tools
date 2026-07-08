/**
 * Component metadata model.
 *
 * Each component ships a `ComponentMeta` that is the single source of truth for:
 *   - React rendering (variant -> data-attribute mapping, defaults)
 *   - Storybook controls + autodocs (argTypes derived from this)
 *   - the Figma manifest (Component Sets, Variant Properties, Component Properties)
 *
 * Figma mapping:
 *   VariantProp    -> Figma Variant Property   (property type VARIANT)
 *   ComponentProp  -> Figma Component Property  (BOOLEAN | TEXT | INSTANCE_SWAP)
 *   ComponentState -> a `State` Variant Property axis in the generated Component Set
 *   FigmaNodeSpec  -> base frame Auto Layout / fill / radius / padding bindings
 */

export type Category = 'atom' | 'molecule' | 'organism';

/** Canonical interaction states every component may declare support for. */
export type ComponentState =
  | 'default'
  | 'hover'
  | 'active'
  | 'focus'
  | 'disabled'
  | 'error'
  | 'success'
  | 'loading'
  | 'readonly';

export const ALL_STATES: ComponentState[] = [
  'default',
  'hover',
  'active',
  'focus',
  'disabled',
  'error',
  'success',
  'loading',
  'readonly',
];

/** A variant axis. Maps to a Figma Variant Property (property type VARIANT). */
export interface VariantProp {
  /** React prop / data-attribute name, e.g. `variant`, `size`, `tone`. */
  name: string;
  /** Human/Figma-facing label, e.g. `Type`, `Size`. Defaults to a title-cased `name`. */
  label?: string;
  /** Allowed option values (also the Figma variant values). */
  options: string[];
  /** Default option. */
  default: string;
  description?: string;
}

export type ComponentPropType = 'boolean' | 'text' | 'number' | 'select' | 'instanceSwap';

/** Non-variant property. Maps to a Figma Component Property. */
export interface ComponentProp {
  name: string;
  type: ComponentPropType;
  default?: string | number | boolean;
  description?: string;
  /** For `select` props rendered as controls (not variant axes). */
  options?: string[];
  /** Figma component property type. */
  figmaType: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP';
}

/** How a component consumes a design token — drives docs + Figma variable binding. */
export interface TokenBinding {
  /** CSS-ish property or slot, e.g. `background`, `padding-x`, `corner-radius`. */
  property: string;
  /** Token id from the token registry, e.g. `color.brand.solid`. */
  token: string;
  /** Optional: only applies for these variant selections, e.g. `{ variant: 'solid' }`. */
  when?: Record<string, string>;
}

export type FigmaLayoutMode = 'HORIZONTAL' | 'VERTICAL' | 'NONE';
export type FigmaAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

/**
 * Base-frame hints so a Figma plugin can build the component's root node with
 * Auto Layout, fills, radius and padding bound to token variables — no per-component logic.
 */
export interface FigmaNodeSpec {
  layoutMode: FigmaLayoutMode;
  /** token id */
  itemSpacing?: string;
  paddingX?: string;
  paddingY?: string;
  cornerRadius?: string;
  /** token id for the default fill (semantic). */
  fill?: string;
  strokeColor?: string;
  strokeWidth?: string;
  primaryAxisAlign?: FigmaAlign;
  counterAxisAlign?: FigmaAlign;
  /** Fixed width/height token ids for controls (e.g. `size.control.md`). */
  height?: string;
}

export interface A11ySpec {
  role?: string;
  notes?: string[];
  /** Keyboard interactions, e.g. `Enter/Space: activate`. */
  keyboard?: string[];
}

export interface ComponentMeta {
  name: string;
  slug: string;
  category: Category;
  description: string;
  tags?: string[];
  /** Variant axes -> Figma Variant Properties. */
  variantProps: VariantProp[];
  /** Extra properties -> Figma Component Properties. */
  componentProps?: ComponentProp[];
  /** Supported interaction states -> `State` variant axis in Figma. */
  states: ComponentState[];
  /** Token consumption map (docs + Figma binding hints). */
  tokens?: TokenBinding[];
  a11y?: A11ySpec;
  /** One-line note on responsive behaviour. */
  responsive?: string;
  /** Figma base-frame hints. */
  figma?: FigmaNodeSpec;
  /** Whether this component becomes a Figma Component Set (has >1 variant combo). Auto-derived. */
  isComponentSet?: boolean;
}
