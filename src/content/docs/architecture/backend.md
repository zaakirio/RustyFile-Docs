---
title: Backend Architecture
description: Deep dive into the Rust backend — modules, patterns, and design decisions.
---

## Module overview

### API layer (`src/api/`)

The router is assembled in `api/mod.rs` with a layered middleware stack (outermost first):

```
Request
  → Security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy)
  → Body limit (max_upload_bytes)
  → Timeout (30 seconds)
  → CORS
  → Compression (gzip + brotli)
  → Request tracing (trace_layer)
  → Route handler
```

Certain route groups have additional per-route middleware:
- **Search, thumbnails, HLS** — per-IP API rate limiting (configurable, default 60 req/min)
- **TUS uploads** — separate body limit
- **Protected routes** — JWT auth middleware

Each handler module owns its routes and is mounted on the appropriate prefix.

### Services layer (`src/services/`)

Business logic lives here, separate from HTTP concerns:

- **file_ops** — `safe_resolve` for path validation, `list_directory`, `file_info`, `read_text_content`, `atomic_write`, `delete_entry`, `rename_entry`, `detect_subtitles`, `check_blocked_extension` for upload safety
- **cache** — `DirCache` wrapper around moka's async cache with filesystem watcher integration
- **thumbnail** — Decode, resize (Lanczos3 via fast_image_resize), encode to JPEG, disk-cache. Semaphore-limited to 4 concurrent generations
- **transcoder** — FFmpeg subprocess management, segment generation, disk caching. Max 2 concurrent processes
- **search_index** — SQLite FTS5-backed full-text filename search. Full reindex on startup, incremental updates via filesystem watcher notifications. Supports type/size/date filtering and path scoping

### Database layer (`src/db/`)

- Connection pool via deadpool-sqlite (max 4 connections)
- WAL mode with `PRAGMA synchronous=NORMAL` for concurrent reads
- All database access goes through `db::interact()`, which runs a closure on the pool
- Migrations are applied at startup, tracked via a `schema_version` key in the `settings` table

## Key patterns

### Path safety

Every filesystem operation goes through `safe_resolve`:

```rust
pub fn safe_resolve(root: &Path, user_path: &str) -> Result<PathBuf, AppError>
```

1. Strips all non-Normal components (`.`, `..`, prefix, root)
2. Joins onto the canonical root
3. Canonicalizes the result
4. Asserts the result starts with the canonical root
5. Returns `AppError::Forbidden` on violation

### Atomic writes

File saves use a write-then-rename pattern:

1. Write to `{dir}/.rustyfile_tmp_{uuid}`
2. `sync_all()` to flush to disk
3. `rename()` to the target path

This prevents partial writes from being visible if the process crashes mid-write.

### Double-check cache pattern

Thumbnail and HLS segment generation both use:

1. Check if cached file exists → return if yes
2. Acquire semaphore permit (limits concurrency)
3. Check again (another request may have generated it while waiting)
4. Generate and cache

This prevents thundering herd problems when many requests hit the same uncached resource.

### Error handling

`AppError` is a single enum implementing `IntoResponse`. Internal errors (Database, Pool, Io, Json) are logged at `error!` level but return a generic "Internal server error" to clients — no stack traces or paths leak.

## Dependencies (backend)

| Category | Crate | Purpose |
|----------|-------|---------|
| Web | axum, tower, tower-http | Routing, middleware |
| Async | tokio, tokio-util, futures-util | Runtime, streaming |
| Database | rusqlite (bundled), deadpool-sqlite | SQLite with pool |
| Auth | jsonwebtoken, argon2, rand | JWT + password hashing |
| Config | figment, clap | Layered config + CLI |
| Serialization | serde, serde_json | JSON handling |
| Caching | moka, dashmap | In-memory caches |
| Media | image, fast_image_resize, blake3 | Thumbnails, cache keys |
| Filesystem | notify, notify-debouncer-full | Change detection |
| Upload | base64, uuid | TUS protocol support |
| Rate limiting | governor | Login rate limiter |
| Error | thiserror, anyhow | Error types |
| Logging | tracing, tracing-subscriber | Structured logging |
| Embedding | rust-embed | Frontend in binary |
