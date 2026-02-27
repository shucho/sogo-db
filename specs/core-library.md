# specs/core-library.md

---
patterns:
  - core-module
depends_on: []
---

## Overview

`sogo-db-core` is the shared TypeScript library extracted from the Sogo fork's `database.ts` (~550 lines). It provides types, utilities, and engines that both the VS Code extension and MCP server import.

**Source reference:** `specs/reference/database.ts`

## Requirements

### Type Definitions
- Export all core types: `Database`, `Field`, `DBRecord`, `DBView`, `FieldType`, `ViewType`, `DatabaseScope`
- Export config interfaces: `RelationConfig`, `RollupConfig`, `FormulaConfig`
- Export constants: `STATUS_GROUPS`, `STATUS_OPTIONS`, `DEFAULT_OPTION_COLORS`
- Types must match the `.db.json` file format exactly

### Utility Functions
- `getRecordTitle(record, schema)` — resolve first text field as title
- `getFieldValue(record, field, db, resolver?)` — resolve raw/computed values
- `getFieldDisplayValue(record, fieldId, schema?, db?, resolver?)` — string representation
- `getVisibleFields(schema, view)` — fields visible in a view, ordered
- `getStatusColor(value)` — color for status values
- `getFieldOptionColor(field, option)` — color for select/multiselect options
- `getReadableTextColor(background)` — contrast text color

### Sort & Filter Engine
- `applySorts(records, sorts, schema?, db?, resolver?)` — non-mutating sort
- `applyFilters(records, filters, schema?, db?, resolver?)` — filter with ops: contains, not_contains, equals, not_equals, is_empty, is_not_empty, gt, gte, lt, lte

### Formula Engine
- `computeFormulaValue(record, field)` — evaluate formula expressions
- Support functions: SUM, AVG, MIN, MAX, ABS, ROUND, LEN, UPPER, LOWER, CONCAT, NOW, TODAY, IF
- Support arithmetic expressions with field references `{field-id}`
- Support string interpolation with field references

### Rollup Engine
- `computeRollupValue(record, field, db, resolver?)` — aggregate across relations
- Aggregations: count, count_not_empty, sum, avg, min, max

### Relation Utilities
- `getRelationTargetDatabase(db, relationField, resolver?)` — resolve target DB
- `inferImplicitRelationTargets(db, databases)` — auto-detect relation targets by name matching

### File I/O Utilities
- `readDatabaseFile(path)` — read and parse `.db.json` with defaults
- `writeDatabaseFile(db, path)` — serialize with tab indentation
- `scanDirectory(dirPath, depth)` — find `*.db.json` files recursively
- `getGlobalDatabasePath()` — resolve `~/.sogo/globalDatabases/`

### Schema Migration
- `migrateSchema(db, newSchema)` — coerce record values when schema changes
- `coerceValueForField(field, value)` — type-safe value coercion

### Database Templates
- `createDefaultDatabaseTemplate(name)` — Title + Status + table/kanban views
- `createTaskDatabaseTemplate(name)` — Title, Status, Priority, Due Date, Effort, Blocked, Project + table/kanban/calendar views

### CSV Import/Export
- `exportCsv(db)` — export database to CSV string
- `importCsvRecords(db, csvText, fieldMap)` — parse CSV into records

## Data Model

```typescript
interface Database {
  id: string;
  name: string;
  scope?: 'global' | 'workspace';
  schema: Field[];
  views: DBView[];
  records: DBRecord[];
}

interface Field {
  id: string;
  name: string;
  type: FieldType;
  options?: string[];
  optionColors?: Record<string, string>;
  relation?: RelationConfig;
  rollup?: RollupConfig;
  formula?: FormulaConfig;
}

interface DBRecord {
  id: string;
  _body?: string;
  [fieldId: string]: any;
}

interface DBView {
  id: string;
  name: string;
  type: ViewType;
  groupBy?: string;
  cardCoverField?: string;
  cardFields?: string[];
  sort: Array<{ fieldId: string; direction: 'asc' | 'desc' }>;
  filter: Array<{ fieldId: string; op: string; value: string }>;
  hiddenFields: string[];
  fieldOrder?: string[];
  columnWidths?: Record<string, number>;
}
```

## Validation Status

| Test Case | Status | Verified | Task | Notes |
|-----------|--------|----------|------|-------|
| Export all core types | ✅ | 2026-02-27 | TASK-002 | |
| getRecordTitle resolves first text field | ✅ | 2026-02-27 | TASK-003 | |
| getRecordTitle returns 'Untitled' when no text field | ✅ | 2026-02-27 | TASK-003 | |
| getFieldValue computes rollups | ✅ | 2026-02-27 | TASK-004 | |
| getFieldValue computes formulas | ✅ | 2026-02-27 | TASK-004 | |
| getFieldDisplayValue formats arrays, booleans, nulls | ✅ | 2026-02-27 | TASK-003 | |
| getVisibleFields respects fieldOrder and hiddenFields | ✅ | 2026-02-27 | TASK-003 | |
| applySorts handles multi-field, asc/desc, nulls | ✅ | 2026-02-27 | TASK-004 | |
| applyFilters supports all 10 operators | ✅ | 2026-02-27 | TASK-004 | |
| Formula SUM/AVG/MIN/MAX with field refs | ✅ | 2026-02-27 | TASK-004 | |
| Formula IF with conditions | ✅ | 2026-02-27 | TASK-004 | |
| Formula string functions (UPPER, LOWER, CONCAT, LEN) | ✅ | 2026-02-27 | TASK-004 | |
| Formula NOW/TODAY | ✅ | 2026-02-27 | TASK-004 | |
| Formula arithmetic expressions | ✅ | 2026-02-27 | TASK-004 | |
| Rollup count/count_not_empty | ✅ | 2026-02-27 | TASK-004 | |
| Rollup sum/avg/min/max | ✅ | 2026-02-27 | TASK-004 | |
| inferImplicitRelationTargets by name matching | ✅ | 2026-02-27 | TASK-005 | |
| readDatabaseFile parses and applies defaults | ✅ | 2026-02-27 | TASK-005 | |
| writeDatabaseFile serializes with tabs | ✅ | 2026-02-27 | TASK-005 | |
| scanDirectory finds .db.json at depth | ✅ | 2026-02-27 | TASK-005 | |
| getGlobalDatabasePath resolves ~/.sogo/globalDatabases | ✅ | 2026-02-27 | TASK-005 | |
| migrateSchema coerces values on type change | ✅ | 2026-02-27 | TASK-006 | |
| migrateSchema cleans up views (sort, filter, groupBy) | ✅ | 2026-02-27 | TASK-006 | |
| createDefaultDatabaseTemplate structure | ✅ | 2026-02-27 | TASK-006 | |
| createTaskDatabaseTemplate structure | ✅ | 2026-02-27 | TASK-006 | |
| exportCsv produces valid CSV with escaping | ✅ | 2026-02-27 | TASK-006 | |
| importCsvRecords parses CSV with field mapping | ✅ | 2026-02-27 | TASK-006 | |

## Implementation Trace

| File | Pattern | Task | Status |
|------|---------|------|--------|
| packages/core/src/types.ts | core-module | TASK-002 | ✅ |
| packages/core/src/utils.ts | core-module | TASK-003 | ✅ |
| packages/core/src/sort-filter.ts | core-module | TASK-004 | ✅ |
| packages/core/src/formula.ts | core-module | TASK-004 | ✅ |
| packages/core/src/rollup.ts | core-module | TASK-004 | ✅ |
| packages/core/src/io.ts | core-module | TASK-005 | ✅ |
| packages/core/src/relations.ts | core-module | TASK-005 | ✅ |
| packages/core/src/migration.ts | core-module | TASK-006 | ✅ |
| packages/core/src/templates.ts | core-module | TASK-006 | ✅ |
| packages/core/src/csv.ts | core-module | TASK-006 | ✅ |
| packages/core/src/index.ts | core-module | TASK-002 | ✅ |
