---
title: Database Schema
description: SQLite database schema — tables, migrations, and access patterns.
---

## Overview

RustyFile uses **SQLite** in WAL mode with the database file at `{data_dir}/rustyfile.db`. The connection pool (deadpool-sqlite) maintains up to 4 connections.

**Pragmas applied at startup:**
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

WAL mode allows concurrent readers without blocking writers — important for a web server handling multiple requests.

## Schema

### `settings` table

Key-value store for system configuration.

```sql
CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

| Key | Value |
|-----|-------|
| `jwt_secret` | Randomly generated HS256 signing key |
| `schema_version` | Current migration version (integer) |

### `users` table

```sql
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- `password_hash` stores Argon2id PHC-format strings
- `updated_at` is maintained by a trigger on UPDATE
- Currently only the `admin` role is used (single admin created during setup)

### `uploads` table

Tracks TUS resumable uploads.

```sql
CREATE TABLE uploads (
    id             TEXT PRIMARY KEY,          -- UUID v4
    filename       TEXT NOT NULL,
    destination    TEXT NOT NULL,             -- relative path within root
    total_bytes    INTEGER NOT NULL,
    received_bytes INTEGER DEFAULT 0,
    completed      INTEGER NOT NULL DEFAULT 0,
    expires_at     TEXT,
    created_by     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_uploads_expires
    ON uploads(expires_at) WHERE completed = 0;
```

The partial index on `expires_at WHERE completed = 0` efficiently powers the cleanup query that finds expired incomplete uploads.

### `shares` table

```sql
CREATE TABLE shares (
    hash           TEXT PRIMARY KEY,
    path           TEXT NOT NULL,
    created_by     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    password_hash  TEXT,
    expires_at     TEXT,
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
```

:::note
The `shares` table exists in the schema but has no API implementation yet. It's designed for a future file sharing feature with optional password protection, expiry, and download limits.
:::

## Migrations

Migrations are SQL files in the `migrations/` directory, applied in order at startup:

| Migration | Description |
|-----------|-------------|
| V1 | Initial schema: settings, users, shares, uploads |
| V2 | Adds `expires_at` and `completed` columns to uploads, partial index |

The current schema version is tracked in `settings.schema_version` and compared against available migrations on startup.

## Access patterns

All database access uses the `db::interact()` helper, which runs a blocking closure on the deadpool thread:

```rust
let user = db::interact(&pool, move |conn| {
    user_repo::find_by_username(conn, &username)
}).await?;
```

This keeps async code clean while running synchronous rusqlite operations on the pool's blocking threads.
