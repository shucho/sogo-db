# sogo-db

MCP server and core library for Sogo's built-in Notion-style databases.

Gives AI agents (Claude Code, Cursor, Windsurf, VS Code Copilot) structured CRUD access to `.db.json` database files. Query, create, update, delete, and search records using human-readable field names — no UUIDs required.

## Quick Start

```bash
git clone https://github.com/shucho/sogo-db.git
cd sogo-db
pnpm install
pnpm -r build
```

Then add the MCP server to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "sogo-db": {
      "command": "node",
      "args": ["/path/to/sogo-db/packages/mcp-server/bin/sogo-mcp-server.js"],
      "env": {
        "SOGO_GLOBAL_PATH": "~/.sogo/globalDatabases",
        "SOGO_WORKSPACE_PATH": "."
      }
    }
  }
}
```

Restart your AI tool. The `sogo-db` tools are now available.

## What are `.db.json` files?

Sogo IDE has a built-in database panel — like Notion databases inside your editor. Each database is a single `.db.json` file:

```jsonc
{
  "id": "uuid",
  "name": "My Database",
  "schema": [
    { "id": "field-uuid", "name": "Title", "type": "text" },
    { "id": "field-uuid", "name": "Status", "type": "status", "options": ["Not started", "In progress", "Done"] }
  ],
  "views": [
    { "id": "view-uuid", "name": "All Items", "type": "table" }
  ],
  "records": [
    { "id": "record-uuid", "field-uuid": "Acme Corp", "field-uuid": "In progress" }
  ]
}
```

Databases live in two places:

- **Global** (`~/.sogo/globalDatabases/`) — visible in every workspace (CRM, clients, project tracking)
- **Workspace** — any `.db.json` file in your project directory

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_databases` | List all databases (global + workspace) with schemas |
| `get_database_schema` | Get field definitions and views for a database |
| `list_records` | List records with optional filter, sort, and pagination |
| `create_record` | Create a new record using field names |
| `update_record` | Update specific fields of a record by name |
| `delete_record` | Delete a record from a database |
| `search_records` | Full-text search across databases |

All tools accept **field names** (e.g., "Status", "Priority") instead of internal UUIDs. Database lookup is fuzzy — `"clients"` matches `"Clients"`, `"work"` matches `"Work Items"`.

### Examples

**List records with filtering:**
```
list_records({ database: "Clients", filter: [{ field: "Status", op: "equals", value: "In progress" }] })
```

**Search across all databases:**
```
search_records({ query: "interview" })
```

**Create a record:**
```
create_record({ database: "Work Items", values: { Task: "Review proposal", Status: "Not started", Priority: "High" } })
```

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `SOGO_GLOBAL_PATH` | `~/.sogo/globalDatabases` | Path to global databases directory |
| `SOGO_WORKSPACE_PATH` | `.` (current directory) | Workspace root to scan for `.db.json` files |
| `SOGO_SCAN_DEPTH` | `3` | How many directory levels deep to scan |

## Packages

| Package | Description |
|---------|-------------|
| `sogo-db-core` | Types, utilities, sort/filter, formula engine, rollup engine, file I/O, schema migration, templates, CSV import/export |
| `sogo-mcp-server` | MCP server with 7 tools, field name resolution, stdio transport |

## Field Types

`text`, `number`, `select`, `multiselect`, `date`, `checkbox`, `url`, `email`, `phone`, `status`, `relation`, `rollup`, `formula`, `createdAt`, `lastEditedAt`

## View Types

`table`, `kanban`, `list`, `gallery`, `calendar`

## Development

```bash
pnpm install
pnpm -r build        # Build all packages
pnpm -r typecheck    # TypeScript strict checking
pnpm -r test         # Run all 116 tests
```

## License

MIT
