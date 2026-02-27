# Project: sogo-db

## Stack
- TypeScript (strict, ESM-first)
- pnpm workspaces monorepo
- tsup (build), vitest (test)
- @modelcontextprotocol/sdk (MCP server)
- Zod (schema validation)

## Packages
- `packages/core` — sogo-db-core: types, utilities, engines (shared)
- `packages/mcp-server` — sogo-mcp-server: MCP server for AI agent access
- `packages/extension` — sogo-db VS Code extension (future)

## Commands
```bash
pnpm install             # Install all workspace deps
pnpm -r build            # Build all packages
pnpm -r typecheck        # MUST pass before commit
pnpm -r lint             # MUST pass before commit
pnpm -r test             # MUST pass before commit
```

## Framework
@stigwheel.md — full Stigwheel framework reference

## Stigwheel Locations
- Patterns: `.patterns/*.anchor.yaml`
- Specs: `specs/*.md`
- Plan: `claude/PLAN.md`
- Rules: `.claude/rules/`

## Quick Patterns
<!-- One-line reminders only. Details in .patterns/ -->
- core-module: Pure functions, named exports, re-export from index.ts barrel
- mcp-tool: One file per tool, Zod input schema, field name resolution
- npm-package: tsup build, ESM+CJS, vitest tests

## Conventions
- Frontmatter: `@anchor`, `@spec`, `@task`, `@validated` on every source file
- Commits: `feat(TASK-XXX): description` + `Implements:`, `Pattern:`, `Validates:` trailers
- Validation: ✅ done, 🟡 partial, 🔴 not started
- Branches: `feature/TASK-XXX-description` or `fix/TASK-XXX-description`
