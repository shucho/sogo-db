# specs/vscode-extension.md

---
patterns:
  - core-module
  - npm-package
depends_on:
  - specs/core-library.md
---

## Overview

VS Code extension that renders `.db.json` files as rich interactive views (table, kanban, calendar, gallery, list) using a React webview, with a sidebar TreeView for browsing databases.

**Architecture**: Extension host owns all state and file I/O via core library. Webview is a stateless render layer. All mutations flow: webview command -> host CRUD -> writeDatabaseFile() -> file watcher -> new snapshot -> webview re-render.

## Requirements

### Build & Packaging
- Dual esbuild config: extension host (CJS, Node) + webview (IIFE, browser)
- Tailwind CSS v4 for webview styling
- Node.js builtins stubbed for browser bundle
- `.vscodeignore` excludes source files and maps

### Extension Activation
- `activate()` wires DatabaseManager, TreeView, FileWatcher, EditorProvider, Commands
- `deactivate()` cleans up via context.subscriptions
- Initial scan on activation

### Database Manager
- Wraps core library: scanAll, readDatabaseFile, writeDatabaseFile
- In-memory cache by database ID
- CRUD operations: updateRecord, createRecord, deleteRecord
- View management: createView, updateView, deleteView
- Schema migration via migrateSchema()
- Write suppression: tracks paths being written to prevent watcher feedback loops
- EventEmitter for change notifications

### Tree Provider
- TreeDataProvider with Global/Workspace group nodes
- Database items show name, record count, and open on click
- Refreshes on DatabaseManager changes

### File Watcher
- FileSystemWatcher for *.db.json in workspace and global directories
- 300ms debounce
- Suppresses self-triggered events via DatabaseManager.isWriting()

### Editor Provider
- CustomTextEditorProvider for *.db.json files
- Webview with CSP (nonce for scripts)
- Sends DatabaseSnapshot on ready and on changes
- Handles all WebviewCommand types
- Tracks active view per editor instance

### Protocol
- Host -> Webview: `DatabaseSnapshot` (full database + processed records), `ThemeUpdate`
- Webview -> Host: 11 command types (update-record, create-record, delete-record, move-record, switch-view, create-view, update-view, delete-view, update-schema, open-record, ready)
- Full snapshot on every mutation (databases are small)

### Webview Shell
- React 19 root mount in `#root`
- `useDatabase` hook: listens for snapshot messages, posts ready command
- `useTheme` hook: listens for theme update messages
- VS Code theme integration via CSS custom properties

### View Switcher & Toolbar
- Tab bar for switching between views
- Add view button with dropdown (table, kanban, list, gallery, calendar)
- Toolbar: New record button, Sort/Filter/Fields popovers

### Table View
- TanStack Table for column definitions from schema
- TanStack Virtual for virtualized rows
- Column widths from view.columnWidths
- Cell rendering by field type (badges for status/select, checkboxes, links)

### Inline Cell Editing
- Click to enter edit mode
- Editor component per field type (text input, number input, date picker, select dropdown, checkbox, multiselect checkboxes)
- Save on blur/Enter, cancel on Escape

### Sort & Filter Panel
- Sort: field selector + direction (asc/desc), add/remove rules
- Filter: field + operator + value, add/remove rules
- Click-outside to close

### Fields Picker
- Checkbox list of all fields with show/hide toggle
- Show all / Hide all buttons
- Field type indicator

### Kanban View
- Columns from status/select field options + "No value"
- dnd-kit drag-and-drop between columns
- Cards show record title, click to open record

### Calendar View
- Month grid with prev/next navigation
- Records placed on their date field value
- Max 3 records per day cell, "+N more" overflow

### Gallery View
- CSS grid cards (auto-fill, 220px min)
- Title + up to 3 summary fields
- Click to open record editor

### List View
- Compact rows: title + 2 summary fields
- Click to open record editor

### Record Editor
- Full-screen modal overlay
- All field types rendered as form inputs
- Computed fields (formula, rollup, timestamps) shown read-only
- Delete button with confirmation dialog

### Schema Editor
- Full-screen modal overlay
- Add/remove/rename/reorder fields
- Type selector dropdown
- Options input for select/multiselect (comma-separated)
- Save triggers migrateSchema()

### Shared Components
- Badge: colored label with readable text contrast
- EmptyState: title, description, optional action button
- ConfirmDialog: native `<dialog>` with confirm/cancel
- Spinner: animated loading indicator

### Command Palette
- Create database: name input + location picker (global/workspace)
- Delete database: confirmation dialog
- Duplicate database: deep copy with new IDs
- Export CSV: save dialog, uses core exportCsv()
- Import CSV: file picker, auto-maps headers to field names
- Open as JSON: opens in default text editor
- Refresh: re-scans all databases

### MCP Server Manager
- Auto-start sogo-mcp-server as child process when configured
- Output channel for server logs
- Start/stop lifecycle management

### VS Code Contributes
- Custom editor: `sogo-db.databaseEditor` for `*.db.json` (priority: default)
- Activity bar: Database icon with TreeView
- 7 commands
- 3 configuration properties

## Validation Status

| Test Case | Status | Verified | Task | Notes |
|-----------|--------|----------|------|-------|
| Dual esbuild build passes | ✅ | 2026-02-27 | TASK-016 | Host CJS + Webview IIFE |
| Host typecheck passes | ✅ | 2026-02-27 | TASK-017 | |
| Webview typecheck passes | ✅ | 2026-02-27 | TASK-021 | |
| All monorepo tests pass | ✅ | 2026-02-27 | TASK-037 | 129 tests (97+19+13) |
| Protocol types valid | ✅ | 2026-02-27 | TASK-037 | 13 tests |
| Constants export correctly | ✅ | 2026-02-27 | TASK-037 | |
| DatabaseManager wraps core | ✅ | 2026-02-27 | TASK-017 | scan, CRUD, views, schema |
| TreeProvider renders groups | ✅ | 2026-02-27 | TASK-018 | Global/Workspace |
| FileWatcher debounces | ✅ | 2026-02-27 | TASK-019 | 300ms, self-suppression |
| EditorProvider creates webview | ✅ | 2026-02-27 | TASK-020 | CSP, nonce, postMessage |
| React webview shell renders | ✅ | 2026-02-27 | TASK-021 | useDatabase, useTheme hooks |
| ViewSwitcher tabs work | ✅ | 2026-02-27 | TASK-022 | Add view dropdown |
| Toolbar buttons work | ✅ | 2026-02-27 | TASK-022 | Sort/Filter/Fields |
| Tailwind CSS builds | ✅ | 2026-02-27 | TASK-023 | v4 with VS Code vars |
| TableView with virtual rows | ✅ | 2026-02-27 | TASK-024 | TanStack Table + Virtual |
| Inline cell editing | ✅ | 2026-02-27 | TASK-025 | All field types |
| SortFilterPanel popover | ✅ | 2026-02-27 | TASK-026 | Sort + Filter modes |
| FieldsPicker popover | ✅ | 2026-02-27 | TASK-026 | Show/hide toggle |
| KanbanView with drag-drop | ✅ | 2026-02-27 | TASK-027 | dnd-kit |
| CalendarView month grid | ✅ | 2026-02-27 | TASK-028 | Prev/next nav |
| GalleryView card grid | ✅ | 2026-02-27 | TASK-029 | Card fields |
| ListView compact rows | ✅ | 2026-02-27 | TASK-030 | |
| RecordEditor modal | ✅ | 2026-02-27 | TASK-031 | All field types |
| SchemaEditor modal | ✅ | 2026-02-27 | TASK-032 | Add/remove/rename/reorder |
| Shared components | ✅ | 2026-02-27 | TASK-033 | Badge, EmptyState, etc. |
| Command handlers | ✅ | 2026-02-27 | TASK-034 | All 7 commands |
| McpServerManager | ✅ | 2026-02-27 | TASK-035 | Auto-start lifecycle |
| Node stubs for browser | ✅ | 2026-02-27 | TASK-016 | esbuild plugin |

## Implementation Trace

| File | Pattern | Task | Status |
|------|---------|------|--------|
| packages/extension/package.json | npm-package | TASK-016 | ✅ |
| packages/extension/esbuild.mjs | npm-package | TASK-016 | ✅ |
| packages/extension/tsconfig.json | npm-package | TASK-016 | ✅ |
| packages/extension/tsconfig.webview.json | npm-package | TASK-016 | ✅ |
| packages/extension/src/extension.ts | npm-package | TASK-017 | ✅ |
| packages/extension/src/host/constants.ts | core-module | TASK-017 | ✅ |
| packages/extension/src/host/protocol.ts | core-module | TASK-017 | ✅ |
| packages/extension/src/host/DatabaseManager.ts | core-module | TASK-017 | ✅ |
| packages/extension/src/host/DatabaseTreeProvider.ts | core-module | TASK-018 | ✅ |
| packages/extension/src/host/DatabaseFileWatcher.ts | core-module | TASK-019 | ✅ |
| packages/extension/src/host/DatabaseEditorProvider.ts | core-module | TASK-020 | ✅ |
| packages/extension/src/host/commands.ts | core-module | TASK-034 | ✅ |
| packages/extension/src/host/McpServerManager.ts | core-module | TASK-035 | ✅ |
| packages/extension/src/webview/index.tsx | core-module | TASK-021 | ✅ |
| packages/extension/src/webview/App.tsx | core-module | TASK-021 | ✅ |
| packages/extension/src/webview/protocol.ts | core-module | TASK-021 | ✅ |
| packages/extension/src/webview/styles.css | core-module | TASK-023 | ✅ |
| packages/extension/src/webview/hooks/useVSCodeApi.ts | core-module | TASK-021 | ✅ |
| packages/extension/src/webview/hooks/useDatabase.ts | core-module | TASK-021 | ✅ |
| packages/extension/src/webview/components/ViewSwitcher.tsx | core-module | TASK-022 | ✅ |
| packages/extension/src/webview/components/Toolbar.tsx | core-module | TASK-022 | ✅ |
| packages/extension/src/webview/components/SortFilterPanel.tsx | core-module | TASK-026 | ✅ |
| packages/extension/src/webview/components/FieldsPicker.tsx | core-module | TASK-026 | ✅ |
| packages/extension/src/webview/components/table/TableView.tsx | core-module | TASK-024 | ✅ |
| packages/extension/src/webview/components/table/TableCell.tsx | core-module | TASK-024 | ✅ |
| packages/extension/src/webview/components/table/InlineEditor.tsx | core-module | TASK-025 | ✅ |
| packages/extension/src/webview/components/kanban/KanbanView.tsx | core-module | TASK-027 | ✅ |
| packages/extension/src/webview/components/kanban/KanbanColumn.tsx | core-module | TASK-027 | ✅ |
| packages/extension/src/webview/components/kanban/KanbanCard.tsx | core-module | TASK-027 | ✅ |
| packages/extension/src/webview/components/calendar/CalendarView.tsx | core-module | TASK-028 | ✅ |
| packages/extension/src/webview/components/gallery/GalleryView.tsx | core-module | TASK-029 | ✅ |
| packages/extension/src/webview/components/list/ListView.tsx | core-module | TASK-030 | ✅ |
| packages/extension/src/webview/components/record/RecordEditor.tsx | core-module | TASK-031 | ✅ |
| packages/extension/src/webview/components/schema/SchemaEditor.tsx | core-module | TASK-032 | ✅ |
| packages/extension/src/webview/components/shared/Badge.tsx | core-module | TASK-033 | ✅ |
| packages/extension/src/webview/components/shared/EmptyState.tsx | core-module | TASK-033 | ✅ |
| packages/extension/src/webview/components/shared/ConfirmDialog.tsx | core-module | TASK-033 | ✅ |
| packages/extension/src/webview/components/shared/Spinner.tsx | core-module | TASK-033 | ✅ |
| packages/extension/src/__tests__/protocol.test.ts | npm-package | TASK-037 | ✅ |
