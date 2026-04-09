---
title: Design Trade-offs
description: Deliberate design decisions, their rationale, and known limitations.
---

## Architecture decisions

### Single binary with embedded frontend

**Choice:** The React SPA is embedded into the Rust binary via `rust-embed`.

**Why:** Zero-config deployment. Download one file, run it, done. No need to serve static files separately or configure a CDN.

**Trade-off:** Rebuilding the frontend requires rebuilding the entire binary. Frontend and backend releases are coupled. The binary is larger than a bare backend.

---

### SQLite over PostgreSQL

**Choice:** Bundled SQLite with WAL mode, not an external database.

**Why:** No infrastructure dependencies. No database server to install, configure, or maintain. SQLite is embedded in the binary. Perfect for single-instance deployments.

**Trade-off:** Single-writer concurrency (WAL helps but doesn't eliminate it). No horizontal scaling — you can't run multiple RustyFile instances against the same database. Not suitable for high-write-throughput scenarios.

---

### In-memory directory cache with filesystem watcher

**Choice:** moka cache (30s TTL) invalidated by `notify` filesystem events.

**Why:** Repeated directory browsing doesn't hit the filesystem. Most web browsing patterns involve revisiting the same directories. The watcher ensures changes appear within ~500ms.

**Trade-off:** Memory usage scales with number of cached directories (capped at 1000). On network-mounted filesystems (NFS/SMB), `notify` may not receive events, leading to stale cache until TTL expires.

---

### TUS protocol for uploads over multipart

**Choice:** TUS 1.0 instead of traditional multipart form uploads.

**Why:** Resumability. Large file uploads (GB+) can survive network interruptions, browser refreshes, and laptop sleep. The protocol is simple, well-specified, and has client libraries for every language.

**Trade-off:** More complex than multipart for small files. Requires multiple HTTP round-trips (create → patch → patch → ...). The `PUT` endpoint remains available for simple small-file saves.

---

### On-demand HLS transcoding over pre-transcoding

**Choice:** Segments are transcoded the first time they're requested, then cached.

**Why:** No upfront processing cost. Only segments actually watched are transcoded. Storage is proportional to what's been viewed, not the entire library.

**Trade-off:** First-time playback of a segment has latency while FFmpeg runs. Max 2 concurrent FFmpeg processes to avoid overwhelming the server. FFmpeg must be installed separately.

---

### JWT tokens over sessions

**Choice:** Stateless JWT (HS256) over server-side session storage.

**Why:** No session table to manage, no server-side state to clean up. Token validation is a cheap crypto operation. Works well for a single-instance server.

**Trade-off:** Tokens can't be revoked before expiry (no token blacklist). If a token is stolen, it's valid until it expires. Mitigated by short expiry (2 hours default) and HttpOnly cookies.

---

### Full reindex on startup over incremental-only

**Choice:** The search index is fully rebuilt from the filesystem on every startup, with incremental updates while running.

**Why:** Guarantees the index is always consistent with the actual filesystem, even if files were changed while the server was down.

**Trade-off:** Startup time increases with the number of files. For very large filesystems (100k+ files), the initial index build can take several seconds. The 500ms debounce on filesystem events means very rapid changes may be batched.

---

## Known limitations

### Single-user in practice

The database schema supports multiple users with `admin` and `user` roles, but no API exists to create additional users. The `shares` table for file sharing links is also schema-only. These are designed for future implementation.

### No server-side pagination

Directory listings return all items up to `max_listing_items` (10,000). Very large directories may be slow to render in the browser. There is no "load more" or offset-based pagination.

### HLS source mapping is ephemeral

The mapping between HLS source keys and file paths lives in memory (DashMap). A server restart between requesting the playlist and playing a segment will cause 404 errors. Clients need to re-request the playlist.

### TOCTOU in rename

The `overwrite=false` rename check has a time-of-check-time-of-use race: another process could create the destination between the exists check and the rename operation. This is documented in the source code and accepted as a minor limitation given single-instance deployment.

### Hardcoded sidebar links

The frontend sidebar has hardcoded quicklinks (`/home`, `/var/log`, `/etc`) that assume a Linux filesystem. These don't adapt to the configured root directory or the host OS.

### Text editor is basic

The built-in editor is a plain `<textarea>` with line numbers. No syntax highlighting, code completion, or advanced editing features. It's designed for quick config edits, not as an IDE replacement.

### ETags are not content-based

ETags are computed from file size + modification time (via blake3), not file content. If a file is modified to the same length at the same timestamp (unlikely but possible), the ETag won't change. This is a standard performance trade-off — content hashing would require reading the entire file on every request.

### No horizontal scaling

Single SQLite database, in-memory caches, in-memory HLS mappings — all designed for a single instance. Running multiple instances behind a load balancer would require extracting these to shared storage.
