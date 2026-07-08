# 22 — Security Guide

> **Title:** Security Guide
> **Purpose:** Define the security standard for TDS — the **frontend hygiene** that is real today (supply-chain / dependency discipline, build-time code execution via `tsx`/`esbuild`, no-eval / no-`dangerouslySetInnerHTML` DOM safety, token-only styling as an injection boundary, the Figma plugin's `networkAccess: none`, secret-free repo, generated-is-sacred integrity) and the **PLANNED backend security** standard (Supabase Auth, Postgres Row-Level Security, secrets management, OWASP Top 10 controls, least privilege) that future work must meet.
> **Status:** ACTIVE for the frontend/plugin/supply-chain sections. **PLANNED** for every backend/DB/API/auth/CI section — **no backend, database, Supabase, API, `.env`, secrets, or CI exists in the repo today** (runtime deps are only `react` + `react-dom`).
> **Owner:** AI OS
> **Last-reviewed:** _(placeholder — update on each review)_
> **Precedence:** Subordinate to [00_MASTER_RULES.md](./00_MASTER_RULES.md). Security fixes still obey the **Design Lock Policy** ([03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md)): a security change never hand-edits a generated output — it flows through **source** (`*.meta.ts`, `src/tokens/*`, component CSS/TSX, or the build scripts) and re-runs the pipeline. This guide governs the security posture of the pipeline itself; it does not override token or component truth.

---

## 1. Purpose

TDS is a **client-only** metadata-driven design system today: 60 components (24 atoms, 27 molecules, 9 organisms), a token pipeline, Storybook, and a Figma plugin. There is **no server, no database, no auth, no network origin it talks to, and no secrets**. That gives TDS an unusually small attack surface, and this guide's first job is to **keep it small**:

- **Supply chain is the primary risk.** The build executes third-party code (`tsx`, `esbuild`, Vite, Storybook, PostCSS) and ships a bundle (`figma/tds.plugin.json`) that a Figma plugin loads. A compromised dependency is the realistic threat, not a runtime exploit.
- **The Figma plugin is sandboxed by contract.** Its [`figma/plugin/manifest.json`](../../figma/plugin/manifest.json) declares `networkAccess: { allowedDomains: ["none"] }` — the plugin **cannot** make network requests. This is a hard security property that MUST be preserved.
- **The DOM is styled by tokens, not strings.** Styling is `var(--tds-*)` CSS custom properties only. There is no dynamic CSS injection, no `eval`, and no `dangerouslySetInnerHTML` in component source — so there is no XSS sink in the design system itself.
- **Generated files are integrity-critical.** The bundle and manifests are the artifact a downstream plugin trusts; hand-editing them (prohibited by [00_MASTER_RULES.md](./00_MASTER_RULES.md)) is both a drift bug and a tampering risk.

The document's second job is to write down, **in advance and marked PLANNED**, the backend security standard (Supabase Auth + RLS + secrets + OWASP + least privilege, engineered for >10,000,000 users) so that when a backend is built it is built secure-by-default rather than retrofitted. See [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), and [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).

## 2. Responsibilities

This spec owns, and is the authority for:

1. **Dependency & supply-chain hygiene** — the two-dep runtime surface (`react`, `react-dom`), the devDependency set, `package-lock.json` integrity, install flags, and the audit/update discipline.
2. **Build-time execution safety** — that `tsx` (build scripts) and `esbuild` (plugin bundle) run trusted, pinned tooling and produce deterministic outputs.
3. **DOM / rendering safety** — no `eval`, no `Function()`, no `dangerouslySetInnerHTML`, no unsanitized `innerHTML`, token-only styling as the CSS boundary.
4. **The plugin sandbox** — enforcing `networkAccess: none`, the `figma`-only `editorType`, and that plugin code (`figma/plugin/src/*.ts`) never introduces `fetch`/XHR/WebSocket.
5. **Secret-free repository** — that no `.env`, keys, tokens, or credentials are ever committed, and the ignore/scanning posture that guarantees it.
6. **Generated-output integrity** — treating `figma/`, `src/generated/`, `src/tokens/generated/`, and `figma/plugin/code.js` as tamper-sensitive derived artifacts.
7. **The PLANNED backend security standard** — Supabase Auth, RLS, secrets management, OWASP mapping, least privilege, and 10M-user scaling controls (authority is deferred to docs 14–17; this doc sets the security bar they must clear).

It does **not** own: token definitions ([08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md)), component anatomy ([07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md)), the plugin algorithm ([06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md)), performance ([23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md)), testing gates ([24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md)), or CI/CD ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)) — though it sets security requirements those docs must implement.

## 3. Scope

**In scope (ACTIVE today)**

- Runtime dependencies (`react@^18.3.1`, `react-dom@^18.3.1`) and all devDependencies in [`package.json`](../../package.json), plus [`package-lock.json`](../../package-lock.json).
- Build-time tooling that executes code: `tsx` (runs `scripts/build-tokens.ts`, `scripts/build-manifest.ts`, `scripts/build-catalog.ts`, and `figma/plugin/test/harness.ts`), `esbuild` (plugin bundle), Vite, Storybook 8, PostCSS ([`scripts/lib/css-bindings.ts`](../../scripts/lib/css-bindings.ts)).
- The Figma plugin sandbox: [`figma/plugin/manifest.json`](../../figma/plugin/manifest.json) (`networkAccess`, `editorType`), plugin source under `figma/plugin/src/` (`code.ts`, `components.ts`, `recipes.ts`, `variables.ts`, `styles.ts`, `pages.ts`, `foundation.ts`, `doc.ts`, `log.ts`, `types.ts`), and `figma/plugin/ui.html`.
- Component/render safety across `src/components/{atoms,molecules,organisms}` and `src/utils` (`cx`, `mergeRefs`, `chart.ts`).
- Repository secret hygiene and generated-output integrity.

**Out of scope — PLANNED (no implementation exists today)**

- **Supabase** (Auth, Postgres, RLS, Storage, Edge Functions, Realtime) — authority in [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Database** schema, migrations, RLS policies — [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md).
- **API layer** (REST/RPC), auth tokens, rate limiting — [15_API_GUIDE.md](./15_API_GUIDE.md).
- **Node/TS backend service** hardening — [16_NODE_GUIDE.md](./16_NODE_GUIDE.md).
- **CI security gates** (`npm audit`, secret scanning, SCA in GitHub Actions) — no `.github/` exists; [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md).
- **Auth UI wiring** — `SocialLogin` / `SocialLoginButton` are **presentational only**; they hold no credentials and call no provider.

## 4. Rules

Rules are enforceable and phrased MUST / SHOULD / NEVER. Rules 1–14 are ACTIVE; rules 15–24 are **PLANNED** and apply the moment any backend code lands.

**Supply chain & dependencies (ACTIVE)**

1. **MUST keep the runtime dependency surface minimal.** `dependencies` in [`package.json`](../../package.json) MUST remain `react` + `react-dom` only. Adding a runtime dependency requires explicit human approval and a supply-chain justification; prefer the existing `src/hooks` / `src/utils` primitives over pulling a library.
2. **MUST install from the lockfile in any reproducible context.** Use `npm ci` (honors [`package-lock.json`](../../package-lock.json) exactly) for clean/CI-like installs; use `npm install` only when intentionally changing deps, and commit the resulting lockfile in the same change.
3. **MUST NOT run install lifecycle scripts blindly on new/updated deps.** When adding or bumping a dependency, review it first; prefer `npm install --ignore-scripts` for the initial add, then vet before allowing postinstall scripts. Never add a dependency you have not inspected on the registry.
4. **SHOULD run `npm audit` before adding/upgrading deps and before a release** and record the result. There is no CI gate today, so this is a manual discipline (see §7). High/critical advisories in **runtime** deps MUST be resolved or explicitly risk-accepted by a human.
5. **MUST pin tooling via the lockfile and caret-range the manifest as-is.** Do not loosen existing ranges to `*` or `latest`. Version drift in build-time tooling (`tsx`, `esbuild`, `vite`, `storybook`) is a supply-chain vector.

**Build & rendering safety (ACTIVE)**

6. **NEVER introduce `eval`, `new Function`, or dynamic `import()` of untrusted strings** anywhere in `src/`, `scripts/`, or `figma/plugin/src/`.
7. **NEVER use `dangerouslySetInnerHTML` or assign untrusted strings to `innerHTML`/`outerHTML`.** Component content flows through React children/props; icons are inline SVG components, charts are constructed in [`src/utils/chart.ts`](../../src/utils/chart.ts) as SVG element trees, never as HTML strings.
8. **MUST style only through `var(--tds-*)` tokens.** No hardcoded colors/spacing/radius and — critically for security — **no user-controlled value may be interpolated into a `style`/CSS string**. Variant state reaches the DOM only via `toDataAttrs(meta, {...})` (`data-*` attributes), never via string-built CSS. This keeps CSS a closed, non-injectable surface.
9. **MUST keep `meta.ts` files inert.** Per [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), `*.meta.ts` are pure data with relative imports only — no React, no CSS, no side effects, no network, no filesystem. A meta that executes code is a red flag.
10. **MUST treat build scripts as trusted, reviewed code.** `scripts/*.ts` run under `tsx` with full Node privileges (fs read/write). They MUST only read repo sources and write their declared generated targets — never fetch remote content, never write outside `src/tokens/generated/`, `src/generated/`, `docs/COMPONENTS.md`, or `figma/`.

**Plugin sandbox (ACTIVE)**

11. **MUST preserve `networkAccess: { allowedDomains: ["none"] }`** in [`figma/plugin/manifest.json`](../../figma/plugin/manifest.json). The plugin reproduces a design system entirely from the bundled `figma/tds.plugin.json`; it has **no legitimate reason to touch the network**. Loosening this is a security regression and MUST be rejected in review.
12. **NEVER add `fetch`, `XMLHttpRequest`, `WebSocket`, or remote-asset loading to plugin source** (`figma/plugin/src/*.ts`) or to `figma/plugin/ui.html`. All inputs come from the embedded bundle (`--loader:.json=json` inlines it at `esbuild` time).
13. **MUST keep `editorType` restricted** (`["figma"]`) and MUST NOT request additional Figma capabilities the reproduction algorithm does not need.

**Repository hygiene (ACTIVE)**

14. **NEVER commit secrets.** No API keys, tokens, passwords, connection strings, JWT secrets, or `.env*` files enter git. There are none today and the repo MUST stay that way; any string that looks like a credential blocks the commit until removed and rotated. **MUST NEVER hand-edit generated outputs** (`figma/`, `src/generated/`, `src/tokens/generated/`, `figma/plugin/code.js`) — beyond drift, it is a tampering vector on the artifact a downstream plugin trusts.

**PLANNED — backend (apply when any backend code lands)**

15. **PLANNED — MUST enable Row-Level Security on every table.** No Supabase/Postgres table ships without `ENABLE ROW LEVEL SECURITY` and explicit policies; default-deny. Authority: [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
16. **PLANNED — NEVER expose the Supabase `service_role` key to any client or bundle.** The `anon` key is the only key shipped to browsers, and it is safe **only** because RLS is enforced. `service_role` lives server-side (Edge Functions / Node API) in secrets, never in `src/`.
17. **PLANNED — MUST manage all secrets via environment/secret stores, never source.** `.env` files are git-ignored; production secrets live in the platform secret manager. Provide a committed `.env.example` with **placeholder** values only.
18. **PLANNED — MUST authenticate and authorize every request server-side.** Supabase Auth (JWT) verified on the server; authorization enforced by RLS + explicit checks, never by the client. Least privilege per role.
19. **PLANNED — MUST validate and parameterize all input.** Schema-validate request bodies; use parameterized queries / the Supabase client (no string-built SQL) to preclude SQL injection. Authority: [15_API_GUIDE.md](./15_API_GUIDE.md).
20. **PLANNED — MUST apply the OWASP Top 10 controls** (access control, crypto, injection, insecure design, misconfig, vulnerable components, auth failures, integrity, logging, SSRF) as the backend baseline; see §6 mapping.
21. **PLANNED — MUST rate-limit and quota public endpoints** to survive abuse at >10M-user scale; deny-by-default, fail-closed.
22. **PLANNED — MUST scope Storage buckets with policies** and never mark a bucket public unless the asset is genuinely public.
23. **PLANNED — MUST use HTTPS/TLS everywhere and set security headers** (HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`) on any served surface.
24. **PLANNED — MUST log security-relevant events without logging secrets/PII in cleartext**, and support key rotation. Authority: [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [22_SECURITY_GUIDE.md] mapping in §6.

## 5. Workflow

### 5.1 Adding or upgrading a dependency (ACTIVE)

```bash
# 1. Inspect the package on the registry BEFORE installing (maintainer, downloads, repo, recent CVEs).
npm view <pkg> versions dist-tags maintainers

# 2. Add without running lifecycle scripts first; vet, then allow scripts if needed.
npm install --save-dev --ignore-scripts <pkg>

# 3. Audit the resulting tree.
npm audit

# 4. Confirm the build + gates still pass and outputs are unchanged in shape.
npm run ds:build        # tokens + manifest + catalog
npm run figma:build     # ds:build -> plugin typecheck -> plugin bundle -> headless harness

# 5. Commit package.json AND package-lock.json together.
```
A **runtime** dependency (touching the `dependencies` block) additionally requires human approval per Rule 1.

### 5.2 Verifying the plugin sandbox before shipping the bundle (ACTIVE)

```bash
# The plugin must remain network-isolated and produce a verifiable bundle.
npm run figma:build
# Internally: ds:build (regenerates figma/tds.plugin.json)
#   -> plugin:typecheck (tsc -p figma/plugin/tsconfig.json)
#   -> plugin:build (esbuild figma/plugin/src/code.ts, inlines JSON)
#   -> plugin:test (tsx figma/plugin/test/harness.ts — headless Figma mock; process.exit(1) on mismatch)
```
Then confirm the manifest still declares isolation:

```jsonc
// figma/plugin/manifest.json — MUST stay:
"networkAccess": { "allowedDomains": ["none"] },
"editorType": ["figma"]
```

### 5.3 Secret-scan discipline (ACTIVE)

Before every commit, scan the working tree for accidental credentials (there should be zero hits):

```bash
git diff --cached | grep -nEi \
  'api[_-]?key|secret|password|token|BEGIN [A-Z ]*PRIVATE KEY|service_role|supabase\.co' \
  && echo "POTENTIAL SECRET — DO NOT COMMIT" || echo "clean"
```
If a secret was ever committed: remove it, **rotate the credential immediately**, and treat the value as compromised.

### 5.4 PLANNED — landing backend code securely

When backend work begins (Supabase/Node): (1) create `.env.example` with placeholders and git-ignore real `.env*`; (2) enable RLS + default-deny policies with the schema ([14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md)); (3) keep `service_role` server-side only; (4) add input validation + parameterized access ([15_API_GUIDE.md](./15_API_GUIDE.md)); (5) wire `npm audit` + secret scanning into CI ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); (6) map controls to OWASP (§6) before merge.

## 6. Examples

### 6.1 The real sandbox declaration (ACTIVE, verbatim from repo)

```json
{
  "name": "TDS Design System Reproducer",
  "id": "tds-design-system-reproducer",
  "api": "1.0.0",
  "editorType": ["figma"],
  "main": "code.js",
  "ui": "ui.html",
  "networkAccess": { "allowedDomains": ["none"] }
}
```
This single block is the strongest security property TDS has today: the reproducer **cannot exfiltrate or fetch anything**.

### 6.2 Safe vs unsafe styling (ACTIVE)

```tsx
// SAFE — token attributes, no string-built CSS, no user value in style.
import { cx } from '@/utils';
<button className={cx('tds-button')} {...toDataAttrs(meta, { variant, tone, size })} />;

// NEVER — interpolating a value into a CSS/style string is a CSS-injection sink.
// <div style={{ background: `url(${userValue})` }} />   ❌
// el.innerHTML = `<span style="color:${userColor}">…</span>` ❌
```

### 6.3 Build script boundary (ACTIVE)

`scripts/build-manifest.ts` (run by `tsx`) reads `*.meta.ts` + tokens and writes exactly `src/generated/design-system.manifest.json` and `figma/tds.plugin.json`. It performs **no network I/O** and writes **only** its declared targets — the auditable contract that keeps the generated bundle trustworthy.

### 6.4 PLANNED — RLS default-deny (illustrative, not in repo)

```sql
-- PLANNED: authority is docs 14 & 17. Shown to fix the security bar backend code must clear.
alter table public.projects enable row level security;

create policy "owner can read"   on public.projects
  for select using (auth.uid() = owner_id);
create policy "owner can write"  on public.projects
  for insert with check (auth.uid() = owner_id);
-- No permissive policy => default deny. service_role bypasses RLS and MUST stay server-side.
```

### 6.5 PLANNED — key placement (illustrative)

```
Browser bundle   -> SUPABASE_ANON_KEY        (public; safe ONLY because RLS is on)
Server / Edge Fn -> SUPABASE_SERVICE_ROLE_KEY (secret; NEVER in src/ or any client bundle)
```

## 7. Validation Rules

How compliance is checked. Frontend checks are ACTIVE; backend checks are PLANNED.

| # | Control | Mechanism | Status |
|---|---------|-----------|--------|
| 1 | No new runtime deps without approval | Review `dependencies` diff in [`package.json`](../../package.json); MUST be `react`+`react-dom` | ACTIVE (manual) |
| 2 | Lockfile integrity | `npm ci` succeeds; `package-lock.json` committed with every dep change | ACTIVE |
| 3 | Known vulnerabilities | `npm audit` before add/upgrade & release; high/critical in runtime deps resolved/accepted | ACTIVE (manual) |
| 4 | No `eval`/`Function`/`dangerouslySetInnerHTML` | `grep -rn` over `src/`, `scripts/`, `figma/plugin/src/` returns nothing | ACTIVE |
| 5 | Token-only styling (no injected CSS) | `npm run lint`; review for string-built `style`/`innerHTML` | ACTIVE |
| 6 | Plugin network isolation | `figma/plugin/manifest.json` shows `allowedDomains: ["none"]`; no `fetch`/XHR/WS in plugin src | ACTIVE |
| 7 | Bundle/plugin integrity | `npm run figma:build` (typecheck + `esbuild` + headless harness `process.exit(1)` on mismatch) | ACTIVE |
| 8 | No secrets committed | §5.3 scan clean; no `.env*` tracked by git | ACTIVE |
| 9 | Generated outputs untampered | `npm run ds:build` reproduces `figma/`, `src/generated/`, `src/tokens/generated/` with no manual diff | ACTIVE |
| 10 | RLS on every table | Migration review; `enable row level security` present | **PLANNED** |
| 11 | Secrets in env only | `.env*` git-ignored; secret scanner in CI | **PLANNED** |
| 12 | OWASP Top 10 mapping | Backend PR checklist maps each control | **PLANNED** |
| 13 | `service_role` never client-side | Bundle inspection / SCA in CI | **PLANNED** |

**OWASP Top 10 (2021) mapping — PLANNED backend baseline:** A01 Broken Access Control → RLS default-deny + server authz; A02 Cryptographic Failures → TLS everywhere, hashed secrets, no PII in logs; A03 Injection → parameterized queries / Supabase client + input validation; A04 Insecure Design → this guide + threat modeling in [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md); A05 Misconfiguration → security headers, no public buckets by default; A06 Vulnerable Components → `npm audit` + SCA ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)); A07 Auth Failures → Supabase Auth, session expiry, rate limits; A08 Integrity Failures → lockfile + signed releases ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)); A09 Logging Failures → structured security logging ([16_NODE_GUIDE.md](./16_NODE_GUIDE.md)); A10 SSRF → allowlist egress (mirrors the plugin's `networkAccess: none` philosophy).

## 8. Checklist

Pre-change / pre-commit (ACTIVE):

- [ ] No new entry in `dependencies` (only `react`, `react-dom`), or human approval attached.
- [ ] `package.json` **and** `package-lock.json` committed together for any dep change.
- [ ] `npm audit` run for added/upgraded deps; high/critical in runtime deps handled.
- [ ] No `eval` / `new Function` / dynamic-string `import()` introduced.
- [ ] No `dangerouslySetInnerHTML` / `innerHTML =` with untrusted content.
- [ ] Styling uses `var(--tds-*)` tokens; no user value interpolated into CSS/`style`.
- [ ] Variant state reaches DOM via `toDataAttrs(meta, …)`, not string-built CSS.
- [ ] `figma/plugin/manifest.json` still `networkAccess: { allowedDomains: ["none"] }`, `editorType: ["figma"]`.
- [ ] No `fetch`/XHR/WebSocket added to `figma/plugin/src/*` or `ui.html`.
- [ ] Secret scan (§5.3) clean; no `.env*` staged.
- [ ] Generated outputs regenerated via `npm run ds:build` / `npm run figma:build`, not hand-edited.

Pre-release (ACTIVE): `npm audit` clean-or-accepted · `npm run figma:build` green · no secrets in history.

Backend readiness (**PLANNED**):

- [ ] RLS enabled + default-deny on every table.
- [ ] `service_role` key server-side only; `anon` key + RLS for clients.
- [ ] `.env*` git-ignored; `.env.example` placeholders committed.
- [ ] Input validation + parameterized access on every endpoint.
- [ ] OWASP Top 10 mapping completed for the change.
- [ ] `npm audit` + secret scanning wired into CI.

## 9. Failure Recovery

| Symptom | Diagnosis | Fix | Resume |
|---|---|---|---|
| `npm audit` flags a **runtime** dep | Vulnerable `react`/`react-dom` transitive | `npm update` within range or bump with approval; re-lock | `npm ci && npm run figma:build` |
| `npm audit` flags a **dev/tooling** dep | Build-time only (`tsx`, `esbuild`, `vite`, `storybook`) | Upgrade the tool; if no fix, assess build-time-only exposure and risk-accept in writing | Re-run `npm run figma:build` |
| Secret was committed | Credential in git history | **Rotate the credential now**; remove from tree; purge history if published | Re-scan (§5.3); confirm clean |
| Plugin gained a `fetch`/network call | Sandbox regression | Remove the call; restore data-from-bundle flow; keep `allowedDomains: ["none"]` | `npm run plugin:test` |
| `manifest.json` `networkAccess` loosened | Sandbox weakened | Revert to `["none"]`; block the PR | Re-review plugin src for network APIs |
| `dangerouslySetInnerHTML` / `innerHTML=` appears | XSS sink introduced | Replace with React children / SVG element construction ([`src/utils/chart.ts`](../../src/utils/chart.ts)) | `npm run lint` |
| Generated file edited by hand | Tampered/drifted artifact | `git checkout` the file; change **source**; `npm run ds:build` | Diff regenerated output = source |
| `plugin:test` exits 1 after a dep bump | Tooling change altered the bundle | Investigate `esbuild`/build diff; pin the working version | `npm run figma:build` green |
| **PLANNED** RLS disabled / permissive policy | Broken access control | Enable RLS; default-deny; add scoped policies ([14](./14_DATABASE_GUIDE.md)) | Re-test authz per role |
| **PLANNED** `service_role` in a client bundle | Full-DB key leaked | Rotate key; move to server secrets; audit bundle | SCA passes; key absent |

## 10. Dependencies

- **Constitution & precedence:** [00_MASTER_RULES.md](./00_MASTER_RULES.md) (generated-is-sacred, precedence), [01_AI_SPECIFICATION.md](./01_AI_SPECIFICATION.md), [02_AI_HARNESS.md](./02_AI_HARNESS.md) (guardrails/validation gates).
- **Design Lock (security fixes flow through source):** [03_DESIGN_SYSTEM.md](./03_DESIGN_SYSTEM.md).
- **Surfaces this guide secures:** [06_PLUGIN_SPECIFICATION.md](./06_PLUGIN_SPECIFICATION.md), [07_COMPONENT_SPECIFICATION.md](./07_COMPONENT_SPECIFICATION.md), [08_TOKEN_SPECIFICATION.md](./08_TOKEN_SPECIFICATION.md), [18_FOLDER_STRUCTURE.md](./18_FOLDER_STRUCTURE.md), [19_CODE_CONVENTION.md](./19_CODE_CONVENTION.md).
- **PLANNED backend (authority for the standard this guide requires):** [14_DATABASE_GUIDE.md](./14_DATABASE_GUIDE.md), [15_API_GUIDE.md](./15_API_GUIDE.md), [16_NODE_GUIDE.md](./16_NODE_GUIDE.md), [17_SUPABASE_GUIDE.md](./17_SUPABASE_GUIDE.md).
- **Adjacent guides:** [21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md), [23_PERFORMANCE_GUIDE.md](./23_PERFORMANCE_GUIDE.md), [24_TESTING_GUIDE.md](./24_TESTING_GUIDE.md), [25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md), [32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md).
- **Manifests:** [.ai/DEPENDENCY_GRAPH.json](../../.ai/DEPENDENCY_GRAPH.json) (supply-chain surface), [.ai/PLUGIN_INDEX.json](../../.ai/PLUGIN_INDEX.json) (sandbox facts), [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) (security findings), [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).
- **Real files/scripts:** [`package.json`](../../package.json), [`package-lock.json`](../../package-lock.json), [`figma/plugin/manifest.json`](../../figma/plugin/manifest.json), `scripts/*.ts`, `npm run ds:build`, `npm run figma:build`, `npm run lint`.

## 11. Template

Copy-paste **Security Review** block for any PR that touches deps, build scripts, or the plugin (and, when it exists, backend):

```md
## Security Review — <change title>
Surface touched: [ ] deps  [ ] build scripts  [ ] plugin  [ ] components/render  [ ] PLANNED backend

### Frontend / supply chain (ACTIVE)
- [ ] `dependencies` unchanged (react+react-dom) OR runtime-dep approval linked: ______
- [ ] `package.json` + `package-lock.json` committed together
- [ ] `npm audit` run — result: ______ (high/critical handled: yes/n/a)
- [ ] No eval / new Function / dynamic-string import
- [ ] No dangerouslySetInnerHTML / innerHTML= with untrusted content
- [ ] Styling via var(--tds-*); no user value interpolated into CSS/style
- [ ] Plugin still networkAccess:["none"], editorType:["figma"]; no fetch/XHR/WS added
- [ ] Secret scan clean; no .env* staged
- [ ] Generated outputs regenerated (ds:build / figma:build), not hand-edited

### PLANNED backend (fill only if backend code is touched)
- [ ] RLS enabled + default-deny on new/changed tables
- [ ] service_role server-side only; anon key + RLS for clients
- [ ] Secrets in env/secret store; .env.example placeholders only
- [ ] Input validated + parameterized; OWASP Top 10 mapped
- [ ] npm audit + secret scan gated in CI

Verification: `npm run figma:build` -> <pass/fail>   `npm audit` -> <summary>
```

## 12. Future Extension

As TDS grows toward the enterprise AI OS and >10,000,000 users, this guide scales in layers, each retaining the current secure-by-default posture:

1. **Automate the manual gates.** Move §7's manual checks into CI ([25_DEVOPS_GUIDE.md](./25_DEVOPS_GUIDE.md)): `npm audit --audit-level=high`, secret scanning (e.g. gitleaks-style), SCA/SBOM generation, and a check that `figma/plugin/manifest.json` still declares `networkAccess: ["none"]` — all blocking merge.
2. **Sign and verify releases.** Add provenance/SBOM to the bundle and package ([32_RELEASE_GUIDE.md](./32_RELEASE_GUIDE.md)) so consumers can verify `figma/tds.plugin.json` integrity (OWASP A08).
3. **Stand up the PLANNED backend secure-by-default.** When Supabase/Node lands, RLS-default-deny, `service_role` isolation, secret stores, input validation, and rate limiting ship **with** the first table/endpoint, not after — per docs 14–17.
4. **Scale access control for 10M users.** Enforce authorization at the data layer (RLS) so it holds regardless of client count; add per-tenant isolation, quotas, and abuse rate-limiting; keep egress allowlisted (the same philosophy as the plugin's `networkAccess: none`).
5. **Formalize threat modeling & rotation.** Add periodic threat-model reviews ([21_ARCHITECTURE_GUIDE.md](./21_ARCHITECTURE_GUIDE.md)), key-rotation runbooks, and an incident/rotation playbook; feed findings into [.ai/REVIEW_REPORT.md](../../.ai/REVIEW_REPORT.md) and [.ai/CHANGELOG.md](../../.ai/CHANGELOG.md).
6. **Keep the surface small.** The strongest long-term control is the current discipline: two runtime deps, a network-isolated plugin, token-only styling, and generated-is-sacred integrity. Every extension MUST preserve these invariants.
