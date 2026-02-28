# PLAN.md

Generated: 2026-02-27T00:00:00Z
Mode: build

## Active Context

Current spec focus: specs/core-library.md ✅, specs/mcp-server.md ✅, specs/vscode-extension.md ✅
Dependency chain: core-library ✅ → mcp-server ✅ → extension ✅

Architecture decision: Monorepo with `packages/core`, `packages/mcp-server`, `packages/extension` (later).
Reference source: `specs/reference/database.ts` (550 lines) + `specs/reference/databaseService.ts` (565 lines)

## Queue

### Now

(No pending tasks — core library, MCP server, and VS Code extension all complete)

### Next

- Additional MCP resources (per-database, per-record endpoints)
- Integration testing with live `.db.json` files
- Publish to VS Code marketplace
- Extension host unit tests (DatabaseManager mock testing)

### Blocked

(None)

## Completed This Session

- [x] **TASK-001**: Scaffold monorepo with packages/core and packages/mcp-server
  - Pattern: npm-package
  - Files: package.json, pnpm-workspace.yaml, tsconfig.json, .gitignore, packages/*/package.json, packages/*/tsconfig.json, packages/*/tsup.config.ts

- [x] **TASK-002**: Extract core types from fork reference
  - Spec: specs/core-library.md#type-definitions
  - Pattern: core-module
  - Validated: export-all-core-types
  - Files: packages/core/src/types.ts, packages/core/src/index.ts

- [x] **TASK-003**: Extract utility functions from fork reference
  - Spec: specs/core-library.md#utility-functions
  - Pattern: core-module
  - Validated: getRecordTitle-*, getFieldDisplayValue-*, getVisibleFields-*
  - Files: packages/core/src/utils.ts

- [x] **TASK-004**: Extract sort, filter, formula, and rollup engines
  - Spec: specs/core-library.md#sort--filter-engine, #formula-engine, #rollup-engine
  - Pattern: core-module
  - Validated: applySorts-*, applyFilters-*, formula-*, rollup-*
  - Files: packages/core/src/sort-filter.ts, packages/core/src/formula.ts, packages/core/src/rollup.ts

- [x] **TASK-005**: Extract file I/O, scanning, and relation utilities
  - Spec: specs/core-library.md#file-io-utilities, #relation-utilities
  - Pattern: core-module
  - Validated: readDatabaseFile-*, writeDatabaseFile-*, scanDirectory-*, getGlobalDatabasePath-*, inferImplicitRelationTargets-*
  - Files: packages/core/src/io.ts, packages/core/src/relations.ts

- [x] **TASK-006**: Extract schema migration, templates, and CSV
  - Spec: specs/core-library.md#schema-migration, #database-templates, #csv-importexport
  - Pattern: core-module
  - Validated: migrateSchema-*, createDefaultDatabaseTemplate-*, createTaskDatabaseTemplate-*, exportCsv-*, importCsvRecords-*
  - Files: packages/core/src/migration.ts, packages/core/src/templates.ts, packages/core/src/csv.ts

- [x] **TASK-007**: Write core library tests (97 tests)
  - Spec: specs/core-library.md (all validation cases)
  - Pattern: core-module
  - Files: packages/core/src/__tests__/*.test.ts

- [x] **TASK-008**: Implement MCP server scaffold + list_databases + get_database_schema
  - Spec: specs/mcp-server.md#server-setup, #tool-list_databases, #tool-get_database_schema
  - Pattern: mcp-tool, npm-package
  - Validated: server-initializes, list_databases-*, get_database_schema-*
  - Files: packages/mcp-server/src/index.ts, packages/mcp-server/src/context.ts, packages/mcp-server/src/tools/listDatabases.ts, packages/mcp-server/src/tools/getDatabaseSchema.ts

- [x] **TASK-009**: Implement list_records with pagination, filter, sort
  - Spec: specs/mcp-server.md#tool-list_records
  - Pattern: mcp-tool
  - Validated: list_records-*
  - Files: packages/mcp-server/src/tools/listRecords.ts

- [x] **TASK-010**: Implement create_record, update_record, delete_record
  - Spec: specs/mcp-server.md#tool-create_record, #tool-update_record, #tool-delete_record
  - Pattern: mcp-tool
  - Validated: create_record-*, update_record-*, delete_record-*
  - Files: packages/mcp-server/src/tools/createRecord.ts, packages/mcp-server/src/tools/updateRecord.ts, packages/mcp-server/src/tools/deleteRecord.ts

- [x] **TASK-011**: Implement search_records
  - Spec: specs/mcp-server.md#tool-search_records
  - Pattern: mcp-tool
  - Validated: search_records-*
  - Files: packages/mcp-server/src/tools/searchRecords.ts

- [x] **TASK-012**: Implement MCP resources
  - Spec: specs/mcp-server.md#resources
  - Pattern: mcp-tool
  - Validated: resource-sogo://databases
  - Files: packages/mcp-server/src/resources.ts
  - Note: sogo://databases list implemented; per-ID/per-record resources deferred

- [x] **TASK-013**: Implement field name resolution layer
  - Spec: specs/mcp-server.md#field-name-resolution
  - Pattern: mcp-tool
  - Validated: field-name-resolution-*
  - Files: packages/mcp-server/src/fieldResolver.ts

- [x] **TASK-014**: MCP server tests (19 tests)
  - Spec: specs/mcp-server.md (all validation cases)
  - Pattern: mcp-tool
  - Files: packages/mcp-server/src/__tests__/fieldResolver.test.ts, packages/mcp-server/src/__tests__/tools.test.ts

- [x] **TASK-015**: Add .mcp.json template and wire up for local testing
  - Spec: specs/mcp-server.md#configuration
  - Pattern: npm-package
  - Validated: env-var-configuration, npm-package-publishable
  - Files: .mcp.json, packages/mcp-server/bin/sogo-mcp-server.js

- [x] **TASK-016**: Scaffold extension package + esbuild dual build
  - Spec: specs/vscode-extension.md#build--packaging
  - Pattern: npm-package
  - Validated: dual-esbuild-build-passes, node-stubs-for-browser
  - Files: packages/extension/package.json, esbuild.mjs, tsconfig.json, tsconfig.webview.json, .vscodeignore

- [x] **TASK-017**: Extension entry point + DatabaseManager
  - Spec: specs/vscode-extension.md#extension-activation, #database-manager
  - Pattern: core-module
  - Validated: host-typecheck-passes, databasemanager-wraps-core
  - Files: packages/extension/src/extension.ts, src/host/DatabaseManager.ts, constants.ts, protocol.ts

- [x] **TASK-018**: DatabaseTreeProvider sidebar
  - Spec: specs/vscode-extension.md#tree-provider
  - Pattern: core-module
  - Validated: treeprovider-renders-groups
  - Files: packages/extension/src/host/DatabaseTreeProvider.ts

- [x] **TASK-019**: DatabaseFileWatcher
  - Spec: specs/vscode-extension.md#file-watcher
  - Pattern: core-module
  - Validated: filewatcher-debounces
  - Files: packages/extension/src/host/DatabaseFileWatcher.ts

- [x] **TASK-020**: DatabaseEditorProvider
  - Spec: specs/vscode-extension.md#editor-provider
  - Pattern: core-module
  - Validated: editorprovider-creates-webview
  - Files: packages/extension/src/host/DatabaseEditorProvider.ts

- [x] **TASK-021**: React webview shell
  - Spec: specs/vscode-extension.md#webview-shell
  - Pattern: core-module
  - Validated: react-webview-shell-renders, webview-typecheck-passes
  - Files: packages/extension/src/webview/index.tsx, App.tsx, protocol.ts, hooks/*.ts

- [x] **TASK-022**: ViewSwitcher + Toolbar
  - Spec: specs/vscode-extension.md#view-switcher--toolbar
  - Pattern: core-module
  - Validated: viewswitcher-tabs-work, toolbar-buttons-work
  - Files: packages/extension/src/webview/components/ViewSwitcher.tsx, Toolbar.tsx

- [x] **TASK-023**: Tailwind CSS + VS Code theme mapping
  - Spec: specs/vscode-extension.md#vs-code-theme-integration
  - Pattern: core-module
  - Validated: tailwind-css-builds
  - Files: packages/extension/src/webview/styles.css

- [x] **TASK-024**: TableView with TanStack Table + Virtual
  - Spec: specs/vscode-extension.md#table-view
  - Pattern: core-module
  - Validated: tableview-with-virtual-rows
  - Files: packages/extension/src/webview/components/table/TableView.tsx, TableCell.tsx

- [x] **TASK-025**: Inline cell editing
  - Spec: specs/vscode-extension.md#inline-cell-editing
  - Pattern: core-module
  - Validated: inline-cell-editing
  - Files: packages/extension/src/webview/components/table/InlineEditor.tsx

- [x] **TASK-026**: SortFilterPanel + FieldsPicker
  - Spec: specs/vscode-extension.md#sort--filter-panel, #fields-picker
  - Pattern: core-module
  - Validated: sortfilterpanel-popover, fieldspicker-popover
  - Files: packages/extension/src/webview/components/SortFilterPanel.tsx, FieldsPicker.tsx

- [x] **TASK-027**: KanbanView with dnd-kit
  - Spec: specs/vscode-extension.md#kanban-view
  - Pattern: core-module
  - Validated: kanbanview-with-drag-drop
  - Files: packages/extension/src/webview/components/kanban/KanbanView.tsx, KanbanColumn.tsx, KanbanCard.tsx

- [x] **TASK-028**: CalendarView
  - Spec: specs/vscode-extension.md#calendar-view
  - Pattern: core-module
  - Validated: calendarview-month-grid
  - Files: packages/extension/src/webview/components/calendar/CalendarView.tsx

- [x] **TASK-029**: GalleryView
  - Spec: specs/vscode-extension.md#gallery-view
  - Pattern: core-module
  - Validated: galleryview-card-grid
  - Files: packages/extension/src/webview/components/gallery/GalleryView.tsx

- [x] **TASK-030**: ListView
  - Spec: specs/vscode-extension.md#list-view
  - Pattern: core-module
  - Validated: listview-compact-rows
  - Files: packages/extension/src/webview/components/list/ListView.tsx

- [x] **TASK-031**: RecordEditor + field type editors
  - Spec: specs/vscode-extension.md#record-editor
  - Pattern: core-module
  - Validated: recordeditor-modal
  - Files: packages/extension/src/webview/components/record/RecordEditor.tsx

- [x] **TASK-032**: SchemaEditor
  - Spec: specs/vscode-extension.md#schema-editor
  - Pattern: core-module
  - Validated: schemaeditor-modal
  - Files: packages/extension/src/webview/components/schema/SchemaEditor.tsx

- [x] **TASK-033**: Shared components
  - Spec: specs/vscode-extension.md#shared-components
  - Pattern: core-module
  - Validated: shared-components
  - Files: packages/extension/src/webview/components/shared/Badge.tsx, EmptyState.tsx, ConfirmDialog.tsx, Spinner.tsx

- [x] **TASK-034**: Command palette handlers
  - Spec: specs/vscode-extension.md#command-palette
  - Pattern: core-module
  - Validated: command-handlers
  - Files: packages/extension/src/host/commands.ts

- [x] **TASK-035**: McpServerManager
  - Spec: specs/vscode-extension.md#mcp-server-manager
  - Pattern: core-module
  - Validated: mcpservermanager
  - Files: packages/extension/src/host/McpServerManager.ts

- [x] **TASK-036**: Write extension spec + Stigwheel traces
  - Files: specs/vscode-extension.md, .patterns/core-module.anchor.yaml, claude/PLAN.md

- [x] **TASK-037**: Unit tests for extension host
  - Spec: specs/vscode-extension.md#protocol
  - Pattern: npm-package
  - Validated: protocol-types-valid, constants-export-correctly, all-monorepo-tests-pass
  - Files: packages/extension/src/__tests__/protocol.test.ts

- [x] **TASK-038**: Package as .vsix
  - Spec: specs/vscode-extension.md#build--packaging
  - Pattern: npm-package
  - Validated: vscodeignore-configured
  - Files: packages/extension/.vscodeignore

## Learnings

- The fork's `database.ts` is clean, well-structured, and can be extracted nearly verbatim — just drop VS Code internal imports
- The fork's `databaseService.ts` uses VS Code services (IFileService, IPathService) that map 1:1 to Node.js equivalents (fs/promises, os.homedir)
- Global databases are at `~/.sogo/globalDatabases/` (not `~/.sogo-dev/`) — shared across dev and production
- Formula engine uses `Function()` for arithmetic eval — keep for now but consider sandboxing later
- Relation inference works by fuzzy name matching — simple but effective for small database sets
- pnpm 10 requires explicit `onlyBuiltDependencies` for native packages like esbuild
- tsup's DTS generation does NOT work well with composite TypeScript project references — use standalone tsconfigs per package
- Package.json exports must order "types" before "import"/"require" for correct resolution
- `Number(null)` is 0 in JavaScript — affects filter operators for null values (matches fork behavior)
- Formula string interpolation with `{fieldId}` passes through arithmetic evaluator first, so non-numeric values become 0 — use `CONCAT()` for string context
- VS Code extension webview bundling requires Node.js built-in stubs for browser platform — use esbuild plugin to provide empty stubs for fs, path, os
- Webview bundle size: ~1.4MB dev (React 19 + TanStack Table + dnd-kit) — acceptable, minifies significantly for production
- CustomTextEditorProvider is the right choice for `.db.json` — gives full control over rendering and edit lifecycle
- Two separate tsconfigs needed: host (no DOM) and webview (DOM + React JSX)
- `retainContextWhenHidden: true` on webview prevents state loss when switching tabs
- Write feedback loop: track paths being written, delay removal by 500ms so watcher can check `isWriting()`
- Tailwind v4 works well with `@tailwindcss/cli` — simpler than PostCSS plugin for this use case
- @parcel/watcher (used by Tailwind internally) needs explicit build approval in pnpm 10
