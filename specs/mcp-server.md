# specs/mcp-server.md

---
patterns:
  - mcp-tool
  - npm-package
depends_on:
  - specs/core-library.md
---

## Overview

`sogo-mcp-server` is a standalone MCP server that gives AI agents (Claude Code, Cursor, Windsurf, VS Code Copilot) structured CRUD access to `.db.json` databases. It resolves field names to IDs automatically, provides pagination, search, and schema validation.

**Transport:** stdio (standard MCP pattern)
**Configuration:** `.mcp.json` at project root

## Requirements

### Server Setup
- MCP server using `@modelcontextprotocol/sdk`
- stdio transport
- Server info: name `sogo-db`, version from package.json

### Tool: list_databases
- List all databases (global + workspace)
- Return: id, name, scope, field count, record count, view names
- Scan `~/.sogo/globalDatabases/` and workspace root (configurable depth)

### Tool: get_database_schema
- Input: database id or name (fuzzy match)
- Return: full schema with field names, types, options
- Include view definitions

### Tool: list_records
- Input: database id/name, optional filter, optional sort, page, pageSize
- Filter by field name (not ID) + operator + value
- Sort by field name + direction
- Default page size: 50
- Return: records with field names as keys (not IDs), total count, page info

### Tool: create_record
- Input: database id/name, field values by name
- Resolve field names to IDs
- Validate: required fields, option values for select/status, types
- Generate UUID for record ID
- Write back to .db.json file
- Return: created record with ID

### Tool: update_record
- Input: database id/name, record id, field values by name
- Resolve field names to IDs
- Merge with existing record (only update provided fields)
- Write back to .db.json file
- Return: updated record

### Tool: delete_record
- Input: database id/name, record id
- Remove record from database
- Write back to .db.json file
- Return: confirmation

### Tool: search_records
- Input: query string, optional database id/name filter
- Full-text search across all text/select/status fields
- Search across all databases if no filter
- Return: matching records with database name and field names

### Resources
- `sogo://databases` — list all databases
- `sogo://databases/{id}` — single database schema + record summary
- `sogo://databases/{id}/records` — all records
- `sogo://databases/{id}/records/{recordId}` — single record

### Field Name Resolution
- Accept field names (case-insensitive) in all tool inputs
- Map to field IDs internally
- Return field names (not IDs) in all outputs
- Handle ambiguous names with error message

### Configuration
- `SOGO_GLOBAL_PATH` env var (default: `~/.sogo/globalDatabases`)
- `SOGO_WORKSPACE_PATH` env var (default: `.`)
- `SOGO_SCAN_DEPTH` env var (default: `3`)

## Validation Status

| Test Case | Status | Verified | Task | Notes |
|-----------|--------|----------|------|-------|
| Server initializes with stdio transport | ✅ | 2026-02-27 | TASK-008 | |
| list_databases returns global + workspace DBs | ✅ | 2026-02-27 | TASK-008 | |
| list_databases includes schema summary | ✅ | 2026-02-27 | TASK-008 | |
| get_database_schema by ID | ✅ | 2026-02-27 | TASK-008 | |
| get_database_schema by name (fuzzy) | ✅ | 2026-02-27 | TASK-008 | |
| list_records with pagination | ✅ | 2026-02-27 | TASK-009 | |
| list_records with filter by field name | ✅ | 2026-02-27 | TASK-009 | |
| list_records with sort by field name | ✅ | 2026-02-27 | TASK-009 | |
| list_records returns field names not IDs | ✅ | 2026-02-27 | TASK-009 | |
| create_record with field name resolution | ✅ | 2026-02-27 | TASK-010 | |
| create_record validates select/status options | ✅ | 2026-02-27 | TASK-010 | |
| create_record writes to disk | ✅ | 2026-02-27 | TASK-010 | |
| update_record merges fields | ✅ | 2026-02-27 | TASK-010 | |
| update_record writes to disk | ✅ | 2026-02-27 | TASK-010 | |
| delete_record removes and writes to disk | ✅ | 2026-02-27 | TASK-010 | |
| search_records across all databases | ✅ | 2026-02-27 | TASK-011 | |
| search_records within single database | ✅ | 2026-02-27 | TASK-011 | |
| Resource: sogo://databases | ✅ | 2026-02-27 | TASK-012 | |
| Resource: sogo://databases/{id} | 🟡 | 2026-02-27 | TASK-012 | sogo://databases list implemented; per-ID resource deferred |
| Resource: sogo://databases/{id}/records | 🟡 | 2026-02-27 | TASK-012 | Deferred to next phase |
| Resource: sogo://databases/{id}/records/{recordId} | 🟡 | 2026-02-27 | TASK-012 | Deferred to next phase |
| Field name resolution case-insensitive | ✅ | 2026-02-27 | TASK-013 | |
| Env var configuration | ✅ | 2026-02-27 | TASK-015 | |
| npm package publishable | ✅ | 2026-02-27 | TASK-015 | |

## Implementation Trace

| File | Pattern | Task | Status |
|------|---------|------|--------|
| packages/mcp-server/src/context.ts | mcp-tool | TASK-008 | ✅ |
| packages/mcp-server/src/fieldResolver.ts | mcp-tool | TASK-013 | ✅ |
| packages/mcp-server/src/tools/listDatabases.ts | mcp-tool | TASK-008 | ✅ |
| packages/mcp-server/src/tools/getDatabaseSchema.ts | mcp-tool | TASK-008 | ✅ |
| packages/mcp-server/src/tools/listRecords.ts | mcp-tool | TASK-009 | ✅ |
| packages/mcp-server/src/tools/createRecord.ts | mcp-tool | TASK-010 | ✅ |
| packages/mcp-server/src/tools/updateRecord.ts | mcp-tool | TASK-010 | ✅ |
| packages/mcp-server/src/tools/deleteRecord.ts | mcp-tool | TASK-010 | ✅ |
| packages/mcp-server/src/tools/searchRecords.ts | mcp-tool | TASK-011 | ✅ |
| packages/mcp-server/src/resources.ts | mcp-tool | TASK-012 | ✅ |
| packages/mcp-server/src/index.ts | mcp-tool | TASK-008 | ✅ |
| packages/mcp-server/bin/sogo-mcp-server.js | npm-package | TASK-015 | ✅ |
