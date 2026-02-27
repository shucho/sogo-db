# PLAN.md

Generated: 2026-02-27T00:00:00Z
Mode: build

## Active Context

Current spec focus: specs/core-library.md ✅, specs/mcp-server.md ✅
Dependency chain: core-library ✅ → mcp-server ✅ → extension 🔴 → views 🔴 → polish 🔴

Architecture decision: Monorepo with `packages/core`, `packages/mcp-server`, `packages/extension` (later).
Reference source: `specs/reference/database.ts` (550 lines) + `specs/reference/databaseService.ts` (565 lines)

## Queue

### Now

(No pending tasks — core library and MCP server implementation complete)

### Next

- Extension package (packages/extension) — VS Code extension for Sogo DB
- Additional MCP resources (per-database, per-record endpoints)
- Integration testing with live `.db.json` files

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
