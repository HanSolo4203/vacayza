# Supabase MCP (database write access)

Cursor can apply SQL migrations to this project via the Supabase MCP server.

## Setup (one time)

1. Open **Cursor Settings → Tools & MCP**.
2. Ensure **supabase** is connected (OAuth login when prompted).
3. Project MCP config: [`.cursor/mcp.json`](../.cursor/mcp.json) — write-enabled URL (no `read_only=true`).

If you use a Personal Access Token instead of OAuth, add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=oiwttbiwxgpughghtusk",
        "--features=database,development,debugging,docs"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-pat-with-all-scopes>"
      }
    }
  }
}
```

Create the token at [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) and grant **all** scopes.

## Apply pending migrations via MCP

Ask the agent to run `apply_migration` with the contents of:

- `supabase/migrations/002_admin_rls_policies.sql` (if not yet applied)

Or run that file in the [Supabase SQL Editor](https://supabase.com/dashboard/project/oiwttbiwxgpughghtusk/sql/new).

## Tools available

| Tool | Use for |
|------|---------|
| `apply_migration` | Schema changes (tracked) |
| `execute_sql` | Queries, policy fixes |
| `list_tables` | Inspect schema |
| `list_migrations` | See applied migrations |
