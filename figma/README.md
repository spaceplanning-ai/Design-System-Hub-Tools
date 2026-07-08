# Figma Plugin Contract

This folder holds the **generated input for a future Figma plugin**. Running
`npm run ds:build` (re)creates:

- **`tds.plugin.json`** — the complete bundle: `{ tokens, design }`.

A plugin reads this one file and produces a production-ready Design System in
Figma with **no manual configuration**. Nothing here is hand-authored except this
README.

## Bundle shape

```jsonc
{
  "tokens": {                       // from src/tokens/generated/figma.tokens.json
    "collections": [                // -> figma.variables.createVariableCollection
      {
        "name": "Theme",
        "modes": ["light", "dark"], // -> collection.addMode / renameMode
        "variables": [
          {
            "name": "color/fg/default",
            "figmaType": "COLOR",    // COLOR | FLOAT | STRING | BOOLEAN
            "scopes": ["TEXT_FILL"], // -> variable.scopes
            "valuesByMode": {
              "light": { "type": "VARIABLE_ALIAS", "aliasId": "color.neutral.900" },
              "dark":  { "type": "VARIABLE_ALIAS", "aliasId": "color.neutral.50" }
            }
          }
        ]
      }
    ],
    "effectStyles": [ /* -> figma.createEffectStyle() (DROP_SHADOW, rgba 0..1) */ ],
    "textStyles":   [ /* -> figma.createTextStyle()  (family/size/weight/lineHeight%) */ ]
  },

  "design": {                       // from src/generated/design-system.manifest.json
    "components": [
      {
        "name": "Button",
        "isComponentSet": true,
        "variantAxes": [            // -> the Component Set matrix
          { "name": "variant", "options": ["solid","outline","ghost","soft","link"] },
          { "name": "tone",    "options": ["brand","neutral","success","warning","danger"] },
          { "name": "size",    "options": ["sm","md","lg"] },
          { "name": "shape",   "options": ["rounded","pill","square"] },
          { "name": "state",   "options": ["default","hover","active","focus","disabled","loading"] }
        ],
        "figmaProperties": [        // VARIANT + BOOLEAN | TEXT | INSTANCE_SWAP
          { "propName": "loading",  "figmaPropertyType": "BOOLEAN" },
          { "propName": "iconStart","figmaPropertyType": "INSTANCE_SWAP" }
        ],
        "tokenBindings": [          // property -> token id (bind to the Variable created above).
          // Derived from each component's CSS at build time (scripts/lib/css-bindings.ts),
          // then any hand-authored meta.tokens merged on top. `when` scopes a binding to the
          // axis-combination it varies on. token "transparent" clears the fill/stroke.
          { "property": "background", "token": "color.brand.solid", "when": { "variant": "solid", "tone": "brand" } }
        ],
        "figma": {                  // base frame Auto Layout, bound to token ids
          "layoutMode": "HORIZONTAL", "paddingX": "space.4", "paddingY": "space.2",
          "cornerRadius": "radius.control", "fill": "color.brand.solid", "height": "size.control.md"
        }
      }
    ]
  }
}
```

## Suggested plugin algorithm

1. **Variables** — for each `tokens.collections[]`: create the collection, add its
   `modes`, then create each variable by `figmaType`; set `valuesByMode` (resolve
   `VARIABLE_ALIAS` against variables created in earlier collections) and `scopes`.
2. **Styles** — create Effect Styles from `tokens.effectStyles` and Text Styles from
   `tokens.textStyles`.
3. **Components** — for each `design.components[]`:
   - build the base frame from `figma` (Auto Layout, padding/gap/radius/fill bound to the
     matching Variables via `setBoundVariable`);
   - generate one variant per element of the cartesian product of `variantAxes`;
   - name variants `axis=value, axis=value, …` so Figma groups them into a Component Set;
   - register `figmaProperties` (VARIANT / BOOLEAN / TEXT / INSTANCE_SWAP);
   - apply `tokenBindings` (respecting each binding's `when` variant filter).

Because every component is described by the same schema, the plugin needs **no
per-component code** — it iterates the manifest.

## Figma output — pages & Foundation

The plugin organizes its output into **auto-generated Pages by functional category** rather than
category sections on one page. Pages are named `TDS · <N>. <Title>`, in order:

1. **Foundation** — tokens only. A styled showcase (single-platform "Web", single column) of the
   real token values as cards: **Color System** (primitive palettes + resolved semantic/theme
   roles), **Typography** (the 11 text styles at their real font/size/weight/line-height),
   **Radius & Shape**, **Spacing**, **Shadows** (the 6 effect styles), and **Borders**. The
   library **Cover** sits at the top of this page.
2. **Layout · Navigation · Actions · Input · Data Display · Feedback · Overlay** — each holds the
   component sets classified to it.

Components are routed by a deterministic first-match-wins classifier over their `tags`
(`figma/plugin/src/pages.ts` → `pageForComponent`). The current page is reused as Foundation
(renamed); the other seven are created with `figma.createPage()`.
