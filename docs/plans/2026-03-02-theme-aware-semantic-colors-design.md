# Theme-Aware Semantic Color System

**Date:** 2026-03-02
**Status:** Approved
**Scope:** `packages/core`, `packages/extension`

## Problem

All badges in the extension look the same — flat grey pills with no semantic meaning. Priority "High" and "Medium" are indistinguishable. Relation links (Project, Opportunity) all share the same default badge background. Status fields have basic color but only three hardcoded values.

A production extension needs colors that:
1. Convey meaning (red = danger, green = success)
2. Adapt to the user's VS Code theme (dark, light, high-contrast)
3. Give relation badges stable, per-record colors
4. Allow user overrides via `optionColors` in `.db.json`

## Architecture

### Four-Layer Color Resolution

Colors resolve through a priority stack — most specific wins:

```
1. optionColors    (explicit per-field override in .db.json schema)    ← user wins
2. Semantic preset (name-based: "High" → danger role)                 ← smart defaults
3. Stable hash     (relation badges, unrecognized option names)       ← deterministic
4. Index cycling   (fallback for options with no semantic match)      ← last resort
```

All four layers produce theme-aware output — the palette underneath adapts to dark/light/high-contrast.

### File Layout

```
packages/core/src/
  colors.ts          ← NEW: palette, semantic map, hash, resolveColor()
  types.ts           ← unchanged (ThemeKind type added)
  utils.ts           ← getStatusColor/getFieldOptionColor become thin wrappers

packages/extension/src/webview/
  hooks/useThemeColors.ts    ← NEW: theme detection hook + context
  App.tsx                    ← wrap with ThemeColorProvider
  components/
    shared/Badge.tsx         ← no interface change (still takes color?: string)
    table/TableCell.tsx      ← uses resolveColor() with theme context
    kanban/KanbanColumn.tsx  ← same
    shared/PickerDropdown.tsx ← callers pass theme-resolved getColor
    record/PeekPanel.tsx     ← same
```

## Palette Definition

### Theme Kinds

VS Code webviews set a class on `document.body`:
- `vscode-dark` — dark themes (default, Monokai, etc.)
- `vscode-light` — light themes (Quiet Light, Solarized Light, etc.)
- `vscode-high-contrast` — high contrast dark
- `vscode-high-contrast-light` — high contrast light

We collapse to three variants: `dark`, `light`, `high-contrast` (HC-light uses the light palette with boosted saturation).

### Semantic Roles

Each role has three hex values (dark / light / high-contrast):

| Role | Purpose | Dark | Light | High Contrast |
|------|---------|------|-------|---------------|
| `danger` | High/critical priority, blocked | `#e5484d` | `#cd2b31` | `#ff6369` |
| `warning` | Medium priority, attention needed | `#f0a000` | `#d97706` | `#ffc53d` |
| `success` | Done, completed, low priority | `#30a46c` | `#18794e` | `#3dd68c` |
| `info` | In progress, active | `#3b82f6` | `#2563eb` | `#70b8ff` |
| `neutral` | Not started, unset, default | `#6b7280` | `#4b5563` | `#9ca3af` |

### Semantic Name Map

Case-insensitive lookup from option value to semantic role:

```typescript
const SEMANTIC_MAP: Record<string, SemanticRole> = {
  // Priority
  'critical': 'danger',
  'urgent': 'danger',
  'high': 'danger',
  'medium': 'warning',
  'low': 'success',
  'none': 'neutral',

  // Status (extends existing STATUS_GROUPS)
  'not started': 'neutral',
  'todo': 'neutral',
  'to do': 'neutral',
  'backlog': 'neutral',
  'in progress': 'info',
  'active': 'info',
  'doing': 'info',
  'in review': 'info',
  'done': 'success',
  'complete': 'success',
  'completed': 'success',
  'closed': 'success',
  'shipped': 'success',
  'blocked': 'danger',
  'cancelled': 'neutral',
  'canceled': 'neutral',
  'on hold': 'warning',
};
```

### Relation Hash Palette

12 distinct hues, each with dark/light/HC variants. A deterministic string hash (djb2) maps each record title to one of the 12 positions.

| Position | Hue | Dark | Light | High Contrast |
|----------|-----|------|-------|---------------|
| 0 | Rose | `#f43f5e` | `#e11d48` | `#ff6b81` |
| 1 | Orange | `#f97316` | `#ea580c` | `#ff9f43` |
| 2 | Amber | `#eab308` | `#ca8a04` | `#fcd34d` |
| 3 | Lime | `#84cc16` | `#65a30d` | `#a3e635` |
| 4 | Emerald | `#10b981` | `#059669` | `#34d399` |
| 5 | Teal | `#14b8a6` | `#0d9488` | `#2dd4bf` |
| 6 | Cyan | `#06b6d4` | `#0891b2` | `#22d3ee` |
| 7 | Blue | `#3b82f6` | `#2563eb` | `#60a5fa` |
| 8 | Indigo | `#6366f1` | `#4f46e5` | `#818cf8` |
| 9 | Violet | `#8b5cf6` | `#7c3aed` | `#a78bfa` |
| 10 | Purple | `#a855f7` | `#9333ea` | `#c084fc` |
| 11 | Pink | `#ec4899` | `#db2777` | `#f472b6` |

### Index Cycling Palette

For select/multiselect options that don't match any semantic name and have no `optionColors`, fall back to cycling through a curated set of 8 theme-aware colors (subset of the hash palette positions, chosen for visual distinctness):

Positions: 0 (rose), 7 (blue), 4 (emerald), 1 (orange), 10 (purple), 5 (teal), 2 (amber), 8 (indigo)

## Core API

### `colors.ts` Exports

```typescript
type ThemeKind = 'dark' | 'light' | 'high-contrast';
type SemanticRole = 'danger' | 'warning' | 'success' | 'info' | 'neutral';

// Main resolver — call this for status/select/multiselect fields
function resolveFieldOptionColor(
  field: Field,
  option: string,
  theme: ThemeKind
): string;

// For relation badges — stable hash from display title
function resolveRelationColor(
  title: string,
  theme: ThemeKind
): string;

// For status fields — semantic-first resolution
function resolveStatusColor(
  value: string,
  theme: ThemeKind
): string;

// Existing function, unchanged
function getReadableTextColor(background: string): string;
```

### Resolution Logic

**`resolveFieldOptionColor(field, option, theme)`:**
1. If `field.optionColors?.[option]` exists → return it (user override, not theme-aware)
2. If `SEMANTIC_MAP[option.toLowerCase()]` exists → return `SEMANTIC_PALETTE[role][theme]`
3. Else → return `CYCLING_PALETTE[indexOf(option) % 8][theme]`

**`resolveStatusColor(value, theme)`:**
1. If `SEMANTIC_MAP[value.toLowerCase()]` exists → return `SEMANTIC_PALETTE[role][theme]`
2. Else → return `SEMANTIC_PALETTE['neutral'][theme]`

**`resolveRelationColor(title, theme)`:**
1. `hash = djb2(title)` → `index = hash % 12`
2. Return `HASH_PALETTE[index][theme]`

### Backwards Compatibility

`getStatusColor()` and `getFieldOptionColor()` in `utils.ts` continue to work, calling the new system with `theme: 'dark'` as the default. MCP server and any external consumers are unaffected.

## Extension Integration

### Theme Detection Hook

```typescript
// hooks/useThemeColors.ts
function useThemeKind(): ThemeKind {
  // Read initial theme from document.body.classList
  // Watch for changes via MutationObserver on class attribute
  // Return 'dark' | 'light' | 'high-contrast'
}
```

Exposed via React context so any component can access the current theme kind without prop drilling.

### Component Updates

**Badge** — No interface change. Still accepts `color?: string`. Callers are responsible for passing theme-resolved hex values.

**TableCell** — Reads theme from context, calls `resolveStatusColor()` / `resolveFieldOptionColor()` / `resolveRelationColor()` instead of the old functions.

**KanbanColumn** — Same pattern for column header color dots.

**PickerDropdown** — The `getColor` callback prop is already a function; callers update their callback to use the new resolvers.

**PeekPanel** — Same pattern for inline option pickers.

## What Does NOT Change

- `.db.json` file format — no schema changes
- `optionColors` field in schema — still honored as highest priority
- Badge component interface — still `{ label, color?, onClick?, active? }`
- MCP server — uses backwards-compatible wrappers
- No new npm dependencies
- No changes to status options ("Not started", "In progress", "Done")

## Testing

- Unit tests in core for `resolveFieldOptionColor`, `resolveStatusColor`, `resolveRelationColor`
  - Semantic matching (case insensitive)
  - optionColors override takes priority
  - Theme variant selection
  - Hash stability (same title → same color across calls)
  - Fallback cycling for unknown options
- Existing tests continue to pass (backwards-compatible wrappers)

## Estimated Scope

| Area | Files | ~Lines |
|------|-------|--------|
| `core/src/colors.ts` (new) | 1 | ~130 |
| `core/src/utils.ts` (wrapper updates) | 1 | ~10 |
| `core/src/index.ts` (re-export) | 1 | ~2 |
| `extension/hooks/useThemeColors.ts` (new) | 1 | ~40 |
| `extension/App.tsx` (provider) | 1 | ~5 |
| `extension/components/*` (6 files) | 6 | ~30 total |
| `core/__tests__/colors.test.ts` (new) | 1 | ~80 |
| **Total** | **12** | **~300** |
