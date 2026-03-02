Dispatch the following frontend UI/UX task to a `frontend-ux-architect` subagent. Pass the full **Project Context** below in the agent prompt so it can work autonomously.

**User's request:** $ARGUMENTS

---

## Instructions for the subagent prompt

Include everything below this line in the prompt you send to the `frontend-ux-architect` agent. Prefix it with the user's request.

---

## Project Context: sogo-db VS Code Extension Webview

You are polishing the webview UI of a Notion-style database extension for VS Code. The webview is a React 19 SPA rendered inside a VS Code webview panel. It must look native to VS Code — use theme CSS variables, not hardcoded colors (except for status/option pill colors which are intentionally branded).

### Stack
- React 19, TypeScript strict, Tailwind CSS v4 (`@tailwindcss/cli`, NOT PostCSS)
- TanStack Table + `@tanstack/react-virtual` (virtualized table rows)
- `dnd-kit` (kanban drag-and-drop)
- `marked` (markdown rendering in text fields)
- esbuild dual build: host extension (CJS) + webview (IIFE bundle)
- All webview source: `packages/extension/src/webview/`

### Component Map

**Root & Navigation:**
- `App.tsx` — root component, view switching, peek panel state, database loading
- `Toolbar.tsx` — top bar with add-record button, search, view controls
- `ViewSwitcher.tsx` — tab bar for switching between views
- `SortFilterPanel.tsx` — sort/filter UI
- `FieldsPicker.tsx` — column visibility picker

**Views (each receives `database`, `records`, `onOpenRecord` props):**
- `table/TableView.tsx` — virtualized table with inline editing, TanStack Table
- `table/TableCell.tsx` — cell renderer (badges for status/select, SVG checkboxes, dates, relations)
- `table/InlineEditor.tsx` — in-cell editing, uses PickerDropdown for status/select/multiselect
- `kanban/KanbanView.tsx` → `KanbanColumn.tsx` → `KanbanCard.tsx` — board view with drag-and-drop
- `gallery/GalleryView.tsx` — grid of cards
- `list/ListView.tsx` — compact row list
- `calendar/CalendarView.tsx` — month grid grouped by date field

**Record Editing:**
- `record/PeekPanel.tsx` — Notion-style slide-in side panel (right 50vw), markdown preview, inline title, PickerDropdown for options
- `record/RecordEditor.tsx` — legacy modal editor (being phased out by PeekPanel)

**Shared Primitives:**
- `shared/Badge.tsx` — colored pill for status/select/tags. Props: `label`, `color?`, `onClick?`, `active?`. Auto-contrasts text via `getReadableTextColor()`.
- `shared/PickerDropdown.tsx` — portal-rendered (`createPortal` to `document.body`) dropdown for option selection. Fixed positioning anchored to trigger element. Colored Badge pills in vertical list. For multiselect: dismissible pills at top with ×.
- `shared/ConfirmDialog.tsx` — modal confirmation dialog
- `shared/EmptyState.tsx` — empty view placeholder with icon + message
- `shared/Spinner.tsx` — loading indicator

**Hooks:**
- `hooks/useDatabase.ts` — loads database from extension host, provides records/schema/views
- `hooks/useVSCodeApi.ts` — `postCommand()` to send messages to host extension

**Styles:**
- `styles.css` — Tailwind v4 imports + custom utility classes (`.table-row-hover`, `.peek-option`, `.peek-input`, `.peek-markdown`)

### VS Code Theme Variables (ALWAYS use these for theming)
```
--vscode-editor-background         Main background
--vscode-foreground                Primary text
--vscode-descriptionForeground     Secondary/muted text
--vscode-panel-border              Borders, dividers
--vscode-input-background          Input fields, textareas
--vscode-input-foreground          Input text
--vscode-focusBorder               Focus rings, active input borders
--vscode-list-hoverBackground      Row/item hover state
--vscode-list-activeSelectionBackground  Selected row
--vscode-badge-background          Default badge/pill background
--vscode-badge-foreground          Default badge/pill text
--vscode-dropdown-background       Dropdown/popover background
--vscode-dropdown-border           Dropdown border
--vscode-dropdown-foreground       Dropdown text
--vscode-errorForeground           Danger/delete actions
--vscode-button-background         Primary button
--vscode-button-foreground         Button text
--vscode-button-secondaryBackground  Secondary button
--vscode-textLink-foreground       Links
```

### Hardcoded Colors (intentional — NOT from theme)
These are the branded pill colors from `packages/core/src/types.ts`:
- **Status**: Not started `#5e5e5e`, In progress `#2e75d0`, Done `#2d9e6b`
- **Default option palette**: `#6b7280`, `#8b6b4a`, `#f59e0b`, `#10b981`, `#3b82f6`, `#a855f7`, `#ef4444`
- Text contrast is auto-computed by `getReadableTextColor(hexColor)` in core

### Key Design Patterns
- **Portal positioning**: PickerDropdown uses `createPortal(el, document.body)` with `position: fixed` to escape overflow containers. Anchored via callback ref pattern: `const [anchor, setAnchor] = useState<HTMLElement | null>(null)` + `ref={setAnchor}`.
- **Animated transitions**: PeekPanel uses `translateX` + `background-color` transitions (200ms ease-out), synced between backdrop and panel.
- **Inline editing**: Click cell → InlineEditor replaces TableCell content → blur/Enter saves via `postCommand({ type: 'update-record', ... })`.
- **Markdown in text fields**: Display mode renders markdown via `marked.parse()`, click switches to `<textarea>` edit mode.
- **Badge as universal pill**: All status, select, multiselect, and tag displays use the Badge component with optional color.

### Verify After Every Change
```bash
pnpm -r build && pnpm -r typecheck && pnpm -r test
```
All three MUST pass. The webview TypeScript is checked by `tsconfig.webview.json` (has DOM + JSX libs). The host extension uses a separate `tsconfig.json` (no DOM).

### Design Philosophy
- **Native feel**: Should look like it belongs in VS Code, not a web app crammed into a panel
- **Notion-level polish**: Smooth transitions, consistent spacing, clean typography
- **Minimal but refined**: No decoration for decoration's sake. Every pixel serves a purpose.
- **13px base body text**, 12px for table headers and labels, 20px for PeekPanel title
- **Subtle interactions**: Hover reveals (expand icon), soft background transitions, 60ms ease for hover states
