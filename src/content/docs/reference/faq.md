---
title: FAQ
description: Frequently asked questions about RustyFile.
---

## General

### What is RustyFile?

A self-hosted, web-based file browser and manager built in Rust. It exposes a local filesystem through a password-protected web interface with file browsing, text editing, video streaming, and resumable uploads.

### Who is it for?

Anyone who wants to browse and manage files on a remote server without SSH, SFTP, or a heavyweight NAS OS. Think: home server, VPS, media library, shared project files.

### Is it production-ready?

RustyFile is functional and secure for personal/small-team use. It has path traversal prevention, rate-limited auth, atomic writes, and proper error handling. However, it currently lacks multi-user management and automated tests.

---

## Setup

### I missed the setup window. How do I create an admin?

Delete `rustyfile.db` from your data directory and restart. The 5-minute setup window will reopen.

### Can I create multiple users?

The database schema supports multiple users with roles (`admin`, `user`), but there is currently no API endpoint to create additional users. Only the initial admin can be created.

### Does RustyFile support LDAP / OAuth / SSO?

Not currently. Authentication is username/password with JWT tokens. External auth providers would need to be added.

---

## Files & Storage

### Is there a file size limit?

- **TUS uploads:** No hard limit. Files are uploaded in 5 MB chunks and reassembled.
- **Direct PUT uploads:** Limited by `max_upload_bytes` (default 50 MB).
- **Text editor:** Files up to 5 MB can be viewed and edited in-browser.

### What happens if an upload is interrupted?

TUS uploads resume from the last byte received. The client queries the server for the current offset and continues from there. Incomplete uploads expire after 24 hours.

### Are file writes safe during crashes?

Yes. File saves use atomic writes (write to temp file, fsync, rename). A crash mid-write won't corrupt the target file — at worst, the temp file is orphaned and cleaned up on next startup.

### Can I use RustyFile with network-mounted filesystems (NFS, SMB)?

It will work, but the filesystem watcher (`notify`) may not receive events over network mounts. Directory listing cache may serve stale data until TTL expires (30 seconds).

---

## Video & Media

### What video formats can I play?

Any format your browser supports natively (typically MP4/H.264, WebM/VP8/VP9). For other formats, use HLS transcoding (requires FFmpeg).

### Do I need FFmpeg?

Only if you want HLS transcoding. Direct file playback via range requests works without it. Image thumbnails also work without FFmpeg.

### Where are thumbnails stored?

At `{data_dir}/cache/thumbs/`. They're JPEG files keyed by blake3 hash. You can safely delete this directory to reclaim space — thumbnails will be regenerated on demand.

### Can I delete the HLS cache?

Yes. The HLS segment cache at `{data_dir}/cache/hls/` can be deleted safely. Segments are regenerated on demand. Note that in-progress playback may be interrupted.

---

## Security

### Does RustyFile support HTTPS?

Not directly. Run it behind a reverse proxy (nginx, Caddy, Traefik) for TLS termination. See [Reverse Proxy](/deployment/reverse-proxy/).

### How are passwords stored?

Argon2id with random salt. The hash is stored in PHC format in SQLite. Argon2id is resistant to GPU and ASIC attacks.

### What prevents path traversal attacks?

The `safe_resolve` function strips all non-normal path components (`..`, `.`), canonicalizes the path, and verifies the result is still under the configured root directory. Violation returns 403 Forbidden.

### Is the JWT secret secure?

It's generated randomly (128-bit) at first run and stored in the SQLite database. Each installation has a unique secret. If the database is deleted, a new secret is generated.

---

## Performance

### How much memory does it use?

~15 MB at idle. Memory grows with cached directory listings (up to 1000 entries in the moka cache) and concurrent operations.

### How fast is startup?

Sub-50ms. The binary is self-contained — no framework initialization, no dependency injection, no JVM startup.

### Can it handle large directories?

Directory listings are capped at `max_listing_items` (default 10,000). The `truncated` field in the response indicates if more items exist. There is no server-side pagination for loading beyond this limit.
