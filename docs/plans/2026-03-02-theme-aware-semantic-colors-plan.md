# Theme-Aware Semantic Color System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace flat grey badges with a theme-aware semantic color system that gives status/priority fields meaningful colors, relation badges stable per-record colors, and adapts to VS Code dark/light/high-contrast themes.

**Architecture:** New `colors.ts` in core defines palettes, semantic map, and hash function. Extension detects theme kind via MutationObserver, exposes it through React context, and all color-consuming components resolve colors through the new system. Existing `getStatusColor()`/`getFieldOptionColor()` become thin backwards-compatible wrappers.

**Tech Stack:** TypeScript, React context, vitest, sogo-db-core, VS Code webview theme classes

**Design doc:** `docs/plans/2026-03-02-theme-aware-semantic-colors-design.md`

---

### Task 1: Create `colors.ts` — palette definitions and types

**Files:**
- Create: `packages/core/src/colors.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/colors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
	resolveStatusColor,
	resolveFieldOptionColor,
	resolveRelationColor,
	hashString,
} from '../colors.js';
import type { Field } from '../types.js';

describe('resolveStatusColor', () => {
	it('returns info color for "In progress" in dark theme', () => {
		expect(resolveStatusColor('In progress', 'dark')).toBe('#3b82f6');
	});

	it('returns success color for "Done" in light theme', () => {
		expect(resolveStatusColor('Done', 'light')).toBe('#18794e');
	});

	it('returns neutral color for "Not started" in dark theme', () => {
		expect(resolveStatusColor('Not started', 'dark')).toBe('#6b7280');
	});

	it('is case-insensitive', () => {
		expect(resolveStatusColor('IN PROGRESS', 'dark')).toBe('#3b82f6');
		expect(resolveStatusColor('done', 'dark')).toBe('#30a46c');
	});

	it('returns neutral for unknown status', () => {
		expect(resolveStatusColor('Mystery Status', 'dark')).toBe('#6b7280');
	});

	it('returns high-contrast variant', () => {
		expect(resolveStatusColor('Done', 'high-contrast')).toBe('#3dd68c');
	});
});

describe('resolveFieldOptionColor', () => {
	const priorityField: Field = {
		id: 'f1',
		name: 'Priority',
		type: 'select',
		options: ['Low', 'Medium', 'High'],
	};

	it('returns danger for "High" via semantic match', () => {
		expect(resolveFieldOptionColor(priorityField, 'High', 'dark')).toBe('#e5484d');
	});

	it('returns warning for "Medium" via semantic match', () => {
		expect(resolveFieldOptionColor(priorityField, 'Medium', 'dark')).toBe('#f0a000');
	});

	it('returns success for "Low" via semantic match', () => {
		expect(resolveFieldOptionColor(priorityField, 'Low', 'dark')).toBe('#30a46c');
	});

	it('honors optionColors override over semantic match', () => {
		const field: Field = {
			id: 'f2',
			name: 'Priority',
			type: 'select',
			options: ['High'],
			optionColors: { High: '#ff00ff' },
		};
		expect(resolveFieldOptionColor(field, 'High', 'dark')).toBe('#ff00ff');
	});

	it('falls back to cycling palette for unknown options', () => {
		const field: Field = {
			id: 'f3',
			name: 'Category',
			type: 'select',
			options: ['Alpha', 'Beta', 'Gamma'],
		};
		const a = resolveFieldOptionColor(field, 'Alpha', 'dark');
		const b = resolveFieldOptionColor(field, 'Beta', 'dark');
		expect(a).not.toBe(b);
		// Both should be valid hex colors
		expect(a).toMatch(/^#[0-9a-f]{6}$/);
		expect(b).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('uses light theme palette', () => {
		expect(resolveFieldOptionColor(priorityField, 'High', 'light')).toBe('#cd2b31');
	});
});

describe('resolveRelationColor', () => {
	it('returns a valid hex color', () => {
		const color = resolveRelationColor('OpenClaw Setup', 'dark');
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('is stable — same title always returns same color', () => {
		const a = resolveRelationColor('OpenClaw Setup', 'dark');
		const b = resolveRelationColor('OpenClaw Setup', 'dark');
		expect(a).toBe(b);
	});

	it('different titles produce different colors (usually)', () => {
		const a = resolveRelationColor('OpenClaw Setup', 'dark');
		const b = resolveRelationColor('DP World — Full-Time AI Role', 'dark');
		// Not guaranteed but very likely with 12 buckets
		expect(a).not.toBe(b);
	});

	it('adapts to theme', () => {
		const dark = resolveRelationColor('OpenClaw Setup', 'dark');
		const light = resolveRelationColor('OpenClaw Setup', 'light');
		// Same hue bucket but different hex values
		expect(dark).not.toBe(light);
	});

	it('handles empty string without crashing', () => {
		const color = resolveRelationColor('', 'dark');
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});
});

describe('hashString', () => {
	it('returns a non-negative integer', () => {
		expect(hashString('hello')).toBeGreaterThanOrEqual(0);
		expect(Number.isInteger(hashString('hello'))).toBe(true);
	});

	it('is deterministic', () => {
		expect(hashString('test')).toBe(hashString('test'));
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/colors.test.ts`
Expected: FAIL — cannot resolve `../colors.js`

**Step 3: Write the implementation**

Create `packages/core/src/colors.ts`:

```typescript
/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#color-system
 * @task: TASK-040
 * @validated: null
 * ---
 *
 * Theme-aware semantic color system.
 * Resolves field option values to hex colors based on semantic meaning,
 * user overrides, and VS Code theme kind.
 */

import type { Field } from './types.js';

export type ThemeKind = 'dark' | 'light' | 'high-contrast';
export type SemanticRole = 'danger' | 'warning' | 'success' | 'info' | 'neutral';

type ThemeColors = Record<ThemeKind, string>;

/* ─── Semantic palette ────────────────────────────────── */

const SEMANTIC_PALETTE: Record<SemanticRole, ThemeColors> = {
	danger:  { dark: '#e5484d', light: '#cd2b31', 'high-contrast': '#ff6369' },
	warning: { dark: '#f0a000', light: '#d97706', 'high-contrast': '#ffc53d' },
	success: { dark: '#30a46c', light: '#18794e', 'high-contrast': '#3dd68c' },
	info:    { dark: '#3b82f6', light: '#2563eb', 'high-contrast': '#70b8ff' },
	neutral: { dark: '#6b7280', light: '#4b5563', 'high-contrast': '#9ca3af' },
};

/* ─── Semantic name map (case-insensitive lookup) ─────── */

const SEMANTIC_MAP: Record<string, SemanticRole> = {
	// Priority
	critical: 'danger',
	urgent: 'danger',
	high: 'danger',
	medium: 'warning',
	low: 'success',
	none: 'neutral',

	// Status
	'not started': 'neutral',
	todo: 'neutral',
	'to do': 'neutral',
	backlog: 'neutral',
	'in progress': 'info',
	active: 'info',
	doing: 'info',
	'in review': 'info',
	done: 'success',
	complete: 'success',
	completed: 'success',
	closed: 'success',
	shipped: 'success',
	blocked: 'danger',
	cancelled: 'neutral',
	canceled: 'neutral',
	'on hold': 'warning',
};

/* ─── 12-hue hash palette for relations ───────────────── */

const HASH_PALETTE: ThemeColors[] = [
	{ dark: '#f43f5e', light: '#e11d48', 'high-contrast': '#ff6b81' }, // Rose
	{ dark: '#f97316', light: '#ea580c', 'high-contrast': '#ff9f43' }, // Orange
	{ dark: '#eab308', light: '#ca8a04', 'high-contrast': '#fcd34d' }, // Amber
	{ dark: '#84cc16', light: '#65a30d', 'high-contrast': '#a3e635' }, // Lime
	{ dark: '#10b981', light: '#059669', 'high-contrast': '#34d399' }, // Emerald
	{ dark: '#14b8a6', light: '#0d9488', 'high-contrast': '#2dd4bf' }, // Teal
	{ dark: '#06b6d4', light: '#0891b2', 'high-contrast': '#22d3ee' }, // Cyan
	{ dark: '#3b82f6', light: '#2563eb', 'high-contrast': '#60a5fa' }, // Blue
	{ dark: '#6366f1', light: '#4f46e5', 'high-contrast': '#818cf8' }, // Indigo
	{ dark: '#8b5cf6', light: '#7c3aed', 'high-contrast': '#a78bfa' }, // Violet
	{ dark: '#a855f7', light: '#9333ea', 'high-contrast': '#c084fc' }, // Purple
	{ dark: '#ec4899', light: '#db2777', 'high-contrast': '#f472b6' }, // Pink
];

/* ─── Cycling palette (8 visually distinct positions) ──── */

const CYCLING_INDICES = [0, 7, 4, 1, 10, 5, 2, 8];
const CYCLING_PALETTE = CYCLING_INDICES.map((i) => HASH_PALETTE[i]);

/* ─── Hash function (djb2) ────────────────────────────── */

export function hashString(str: string): number {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
	}
	return hash;
}

/* ─── Public resolvers ────────────────────────────────── */

export function resolveStatusColor(value: string, theme: ThemeKind): string {
	const role = SEMANTIC_MAP[value.toLowerCase()];
	return SEMANTIC_PALETTE[role ?? 'neutral'][theme];
}

export function resolveFieldOptionColor(field: Field, option: string, theme: ThemeKind): string {
	// Layer 1: explicit user override
	const explicit = field.optionColors?.[option];
	if (explicit) return explicit;

	// Layer 2: semantic match
	const role = SEMANTIC_MAP[option.toLowerCase()];
	if (role) return SEMANTIC_PALETTE[role][theme];

	// Layer 3: index-based cycling
	const options = field.options ?? [];
	const index = options.indexOf(option);
	const cycleIdx = index >= 0 ? index % CYCLING_PALETTE.length : 0;
	return CYCLING_PALETTE[cycleIdx][theme];
}

export function resolveRelationColor(title: string, theme: ThemeKind): string {
	const index = hashString(title) % HASH_PALETTE.length;
	return HASH_PALETTE[index][theme];
}
```

**Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/colors.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/core/src/colors.ts packages/core/src/__tests__/colors.test.ts
git commit -m "$(cat <<'EOF'
feat(TASK-040): add theme-aware semantic color system in core

Implements: specs/core-library.md#color-system
Pattern: core-module
Validates: semantic-color-resolution, relation-hash-colors, theme-variants

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Export from barrel and update backwards-compat wrappers

**Files:**
- Modify: `packages/core/src/index.ts` (add export)
- Modify: `packages/core/src/utils.ts:60-71` (update wrappers)

**Step 1: Write the failing test**

Add to existing `packages/core/src/__tests__/utils.test.ts` — verify wrappers still return the same values they did before (backwards compat):

```typescript
// Add these to the existing describe blocks at the bottom of utils.test.ts

describe('getStatusColor (backwards compat)', () => {
	it('still returns blue-ish for In progress', () => {
		const color = getStatusColor('In progress');
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('still returns a color for unknown status', () => {
		expect(getStatusColor('Whatever')).toMatch(/^#[0-9a-f]{6}$/);
	});
});

describe('getFieldOptionColor (backwards compat)', () => {
	it('still returns a color for known option', () => {
		const color = getFieldOptionColor(selectField, 'High');
		expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('still honors optionColors', () => {
		const field: Field = {
			id: 'f99',
			name: 'X',
			type: 'select',
			options: ['A'],
			optionColors: { A: '#abcdef' },
		};
		expect(getFieldOptionColor(field, 'A')).toBe('#abcdef');
	});
});
```

**Step 2: Run test to verify existing tests still pass first**

Run: `cd packages/core && npx vitest run src/__tests__/utils.test.ts`
Expected: PASS (existing tests unaffected before we change anything)

**Step 3: Update `index.ts` barrel**

Add to `packages/core/src/index.ts` after the existing exports:

```typescript
export * from './colors.js';
```

**Step 4: Update `utils.ts` wrappers**

Replace `getStatusColor` and `getFieldOptionColor` in `packages/core/src/utils.ts`:

```typescript
import { resolveStatusColor, resolveFieldOptionColor as _resolveFieldOptionColor } from './colors.js';

export function getStatusColor(value: string): string {
	return resolveStatusColor(value, 'dark');
}

export function getFieldOptionColor(field: Field, option: string): string {
	return _resolveFieldOptionColor(field, option, 'dark');
}
```

Also remove the `DEFAULT_OPTION_COLORS` and `STATUS_GROUPS` imports from `utils.ts` since they're no longer used there (but keep them exported from `types.ts` for any external consumers).

**Step 5: Run all core tests**

Run: `cd packages/core && npx vitest run`
Expected: All tests PASS

**Step 6: Typecheck**

Run: `pnpm -r typecheck`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/core/src/index.ts packages/core/src/utils.ts packages/core/src/__tests__/utils.test.ts
git commit -m "$(cat <<'EOF'
feat(TASK-040): wire color system into barrel and backwards-compat wrappers

Implements: specs/core-library.md#color-system
Pattern: core-module
Validates: backwards-compat-wrappers

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create `useThemeKind` hook and context provider

**Files:**
- Create: `packages/extension/src/webview/hooks/useThemeColors.ts`
- Modify: `packages/extension/src/webview/App.tsx`

**Step 1: Create the theme detection hook and context**

Create `packages/extension/src/webview/hooks/useThemeColors.ts`:

```typescript
/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#theme-colors
 * @task: TASK-040
 * @validated: null
 * ---
 *
 * Detects the VS Code theme kind from webview body classes
 * and exposes it via React context.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeKind } from 'sogo-db-core';

function detectThemeKind(): ThemeKind {
	const cl = document.body.classList;
	if (cl.contains('vscode-high-contrast') || cl.contains('vscode-high-contrast-light')) {
		return 'high-contrast';
	}
	if (cl.contains('vscode-light')) return 'light';
	return 'dark';
}

const ThemeKindContext = createContext<ThemeKind>('dark');

export function ThemeKindProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<ThemeKind>(detectThemeKind);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setTheme(detectThemeKind());
		});
		observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	}, []);

	return <ThemeKindContext.Provider value={theme}>{children}</ThemeKindContext.Provider>;
}

export function useThemeKind(): ThemeKind {
	return useContext(ThemeKindContext);
}
```

**Step 2: Wrap App with the provider**

In `packages/extension/src/webview/App.tsx`, add the import and wrap the root:

Add import:
```typescript
import { ThemeKindProvider } from './hooks/useThemeColors.js';
```

Wrap the return in `App()`:
```typescript
return (
	<ThemeKindProvider>
		<div className="flex flex-col h-screen" style={{ color: 'var(--vscode-foreground)' }}>
			{/* ... existing JSX unchanged ... */}
		</div>
	</ThemeKindProvider>
);
```

**Step 3: Typecheck**

Run: `pnpm -r typecheck`
Expected: PASS

**Step 4: Build extension**

Run: `pnpm -r build`
Expected: PASS (no runtime errors, context is wired)

**Step 5: Commit**

```bash
git add packages/extension/src/webview/hooks/useThemeColors.ts packages/extension/src/webview/App.tsx
git commit -m "$(cat <<'EOF'
feat(TASK-040): add ThemeKindProvider and useThemeKind hook

Implements: specs/vscode-extension.md#theme-colors
Pattern: core-module
Validates: theme-detection-hook

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Update TableCell to use theme-aware colors

**Files:**
- Modify: `packages/extension/src/webview/components/table/TableCell.tsx`

**Step 1: Update imports**

Replace:
```typescript
import { getFieldDisplayValue, getStatusColor, getFieldOptionColor } from 'sogo-db-core';
```

With:
```typescript
import { getFieldDisplayValue, resolveStatusColor, resolveFieldOptionColor, resolveRelationColor } from 'sogo-db-core';
import { useThemeKind } from '../../hooks/useThemeColors.js';
```

**Step 2: Use theme in the component**

At the top of the `TableCell` function body, add:
```typescript
const theme = useThemeKind();
```

**Step 3: Update the status case**

Replace:
```typescript
<Badge label={displayValue} color={getStatusColor(displayValue)} onClick={handleClick} />
```
With:
```typescript
<Badge label={displayValue} color={resolveStatusColor(displayValue, theme)} onClick={handleClick} />
```

**Step 4: Update the select case**

Replace:
```typescript
<Badge label={displayValue} color={getFieldOptionColor(field, displayValue)} onClick={handleClick} />
```
With:
```typescript
<Badge label={displayValue} color={resolveFieldOptionColor(field, displayValue, theme)} onClick={handleClick} />
```

**Step 5: Update the multiselect case**

Replace:
```typescript
<Badge key={v} label={v} color={getFieldOptionColor(field, v)} />
```
With:
```typescript
<Badge key={v} label={v} color={resolveFieldOptionColor(field, v, theme)} />
```

**Step 6: Update the relation case**

Replace:
```typescript
<Badge key={id} label={relationTitles?.[id] ?? id.slice(0, 8)} />
```
With:
```typescript
<Badge key={id} label={relationTitles?.[id] ?? id.slice(0, 8)} color={resolveRelationColor(relationTitles?.[id] ?? id, theme)} />
```

**Step 7: Typecheck and build**

Run: `pnpm -r typecheck && pnpm -r build`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/extension/src/webview/components/table/TableCell.tsx
git commit -m "$(cat <<'EOF'
feat(TASK-040): update TableCell to use theme-aware color resolvers

Implements: specs/vscode-extension.md#table-view
Pattern: core-module
Validates: table-semantic-colors, table-relation-colors

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Update InlineEditor to use theme-aware colors

**Files:**
- Modify: `packages/extension/src/webview/components/table/InlineEditor.tsx`

**Step 1: Update imports**

Replace:
```typescript
import { STATUS_OPTIONS, getStatusColor, getFieldOptionColor } from 'sogo-db-core';
```
With:
```typescript
import { STATUS_OPTIONS, resolveStatusColor, resolveFieldOptionColor } from 'sogo-db-core';
import { useThemeKind } from '../../hooks/useThemeColors.js';
```

**Step 2: Pass theme through to sub-components**

The `InlineEditor` function doesn't directly call color functions — it passes `getColor` callbacks to `InlinePillPicker` and `InlineMultiPillPicker`. Add `useThemeKind()` at the top of `InlineEditor`:

```typescript
const theme = useThemeKind();
```

**Step 3: Update the status case**

Replace:
```typescript
getColor={getStatusColor}
```
With:
```typescript
getColor={(opt) => resolveStatusColor(opt, theme)}
```

**Step 4: Update the select case**

Replace:
```typescript
getColor={(opt) => getFieldOptionColor(field, opt)}
```
With:
```typescript
getColor={(opt) => resolveFieldOptionColor(field, opt, theme)}
```

**Step 5: Update the multiselect case**

Same change — replace `getFieldOptionColor(field, opt)` with `resolveFieldOptionColor(field, opt, theme)`.

**Step 6: Typecheck and build**

Run: `pnpm -r typecheck && pnpm -r build`
Expected: PASS

**Step 7: Commit**

```bash
git add packages/extension/src/webview/components/table/InlineEditor.tsx
git commit -m "$(cat <<'EOF'
feat(TASK-040): update InlineEditor to use theme-aware color resolvers

Implements: specs/vscode-extension.md#inline-editing
Pattern: core-module
Validates: inline-editor-semantic-colors

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Update KanbanColumn to use theme-aware colors

**Files:**
- Modify: `packages/extension/src/webview/components/kanban/KanbanColumn.tsx`

**Step 1: Update imports**

Replace:
```typescript
import { getStatusColor, getFieldOptionColor } from 'sogo-db-core';
```
With:
```typescript
import { resolveStatusColor, resolveFieldOptionColor } from 'sogo-db-core';
import { useThemeKind } from '../../hooks/useThemeColors.js';
```

**Step 2: Add theme hook**

At the top of the `KanbanColumn` function body:
```typescript
const theme = useThemeKind();
```

**Step 3: Update headerColor**

Replace:
```typescript
const headerColor =
	groupField.type === 'status'
		? getStatusColor(label)
		: getFieldOptionColor(groupField, label);
```
With:
```typescript
const headerColor =
	groupField.type === 'status'
		? resolveStatusColor(label, theme)
		: resolveFieldOptionColor(groupField, label, theme);
```

**Step 4: Typecheck and build**

Run: `pnpm -r typecheck && pnpm -r build`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/extension/src/webview/components/kanban/KanbanColumn.tsx
git commit -m "$(cat <<'EOF'
feat(TASK-040): update KanbanColumn to use theme-aware color resolvers

Implements: specs/vscode-extension.md#kanban-view
Pattern: core-module
Validates: kanban-semantic-colors

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Update PeekPanel to use theme-aware colors

**Files:**
- Modify: `packages/extension/src/webview/components/record/PeekPanel.tsx`

**Step 1: Update imports**

Replace:
```typescript
import { STATUS_OPTIONS, getStatusColor, getFieldOptionColor } from 'sogo-db-core';
```
With:
```typescript
import { STATUS_OPTIONS, resolveStatusColor, resolveFieldOptionColor, resolveRelationColor } from 'sogo-db-core';
```

**Step 2: Add theme to PeekFieldInput**

The color functions are called inside `PeekFieldInput` (a child component in the same file). The cleanest approach: import and call `useThemeKind()` inside `PeekFieldInput`:

Add import at the top of the file:
```typescript
import { useThemeKind } from '../../hooks/useThemeColors.js';
```

Inside `PeekFieldInput`, add at the top of the function body:
```typescript
const theme = useThemeKind();
```

**Step 3: Update the status case (line ~330)**

Replace:
```typescript
getColor={getStatusColor}
```
With:
```typescript
getColor={(opt) => resolveStatusColor(opt, theme)}
```

**Step 4: Update the select case (line ~339)**

Replace:
```typescript
getColor={(opt) => getFieldOptionColor(field, opt)}
```
With:
```typescript
getColor={(opt) => resolveFieldOptionColor(field, opt, theme)}
```

**Step 5: Update the multiselect case (line ~349)**

Replace:
```typescript
getColor={(opt) => getFieldOptionColor(field, opt)}
```
With:
```typescript
getColor={(opt) => resolveFieldOptionColor(field, opt, theme)}
```

**Step 6: Update the relation case (line ~362)**

Replace:
```typescript
<Badge key={id} label={relationTitles?.[id] ?? id.slice(0, 8)} />
```
With:
```typescript
<Badge key={id} label={relationTitles?.[id] ?? id.slice(0, 8)} color={resolveRelationColor(relationTitles?.[id] ?? id, theme)} />
```

**Step 7: Typecheck and build**

Run: `pnpm -r typecheck && pnpm -r build`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/extension/src/webview/components/record/PeekPanel.tsx
git commit -m "$(cat <<'EOF'
feat(TASK-040): update PeekPanel to use theme-aware color resolvers

Implements: specs/vscode-extension.md#peek-panel
Pattern: core-module
Validates: peek-panel-semantic-colors, peek-panel-relation-colors

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Final validation — full build, typecheck, and test suite

**Files:** None (verification only)

**Step 1: Run full test suite**

Run: `pnpm -r test`
Expected: All tests PASS (core + extension)

**Step 2: Run typecheck**

Run: `pnpm -r typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm -r lint`
Expected: PASS

**Step 4: Build all packages**

Run: `pnpm -r build`
Expected: PASS

**Step 5: Verify no unused imports of old functions in extension**

Run: `grep -r "getStatusColor\|getFieldOptionColor" packages/extension/src/`
Expected: Zero matches (all replaced with resolve* functions)

The old functions should only remain in:
- `packages/core/src/utils.ts` (backwards-compat wrappers)
- `packages/core/src/__tests__/utils.test.ts` (testing the wrappers)

**Step 6: Final commit if any cleanup needed, otherwise done**

---

## Summary

| Task | What | Files | Depends On |
|------|------|-------|------------|
| 1 | Core colors.ts + tests | 2 new | — |
| 2 | Barrel export + wrapper updates | 3 modified | 1 |
| 3 | useThemeKind hook + App provider | 2 files | 2 |
| 4 | TableCell theme colors | 1 modified | 3 |
| 5 | InlineEditor theme colors | 1 modified | 3 |
| 6 | KanbanColumn theme colors | 1 modified | 3 |
| 7 | PeekPanel theme colors | 1 modified | 3 |
| 8 | Full validation | 0 | 4-7 |

Tasks 4-7 are independent of each other and can be parallelized.
