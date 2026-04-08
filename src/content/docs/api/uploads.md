---
title: TUS Upload API
description: Resumable file uploads via the TUS 1.0 protocol.
---

All TUS endpoints require authentication.

## Protocol info

```http
OPTIONS /api/tus/
```

Returns TUS protocol capabilities in response headers:

```
Tus-Resumable: 1.0.0
Tus-Version: 1.0.0
Tus-Extension: creation,termination
Tus-Max-Size: 0 (unlimited)
```

---

## Create upload

```http
POST /api/tus/
```

Initialize a new resumable upload.

**Request headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Upload-Length` | Yes | Total file size in bytes |
| `Upload-Metadata` | Yes | Base64-encoded key-value pairs |

**Metadata keys:**

| Key | Required | Description |
|-----|----------|-------------|
| `filename` | Yes | Original filename |
| `destination` | No | Target directory path (defaults to root) |

**Response** `201`:
```
Location: /api/tus/550e8400-e29b-41d4-a716-446655440000
Tus-Resumable: 1.0.0
Upload-Offset: 0
```

---

## Query offset

```http
HEAD /api/tus/{id}
```

Check how many bytes have been received. Use this to resume an interrupted upload.

**Response** `200`:
```
Upload-Offset: 5242880
Upload-Length: 104857600
Tus-Resumable: 1.0.0
```

---

## Upload chunk

```http
PATCH /api/tus/{id}
```

Append a chunk of data to the upload.

**Request headers:**

| Header | Value |
|--------|-------|
| `Content-Type` | `application/offset+octet-stream` |
| `Upload-Offset` | Current byte offset (must match server's offset) |

**Request body:** Raw bytes of the chunk.

**Response** `204`:
```
Upload-Offset: 10485760
Tus-Resumable: 1.0.0
```

When the upload is complete (`Upload-Offset` equals `Upload-Length`), the file is atomically moved to the destination directory and the directory listing cache is invalidated.

**Errors:**
- `404` — Upload ID not found or expired
- `409` — Offset mismatch (client and server out of sync)

---

## Cancel upload

```http
DELETE /api/tus/{id}
```

Cancel an in-progress upload and delete the temp file.

**Response** `204`: No content.

---

## Lifecycle

| Event | Behavior |
|-------|----------|
| Upload created | DB row + empty temp file in `{cache_dir}/uploads/{uuid}` |
| Chunk received | Appended with `fsync`, DB offset updated |
| Upload complete | Temp file renamed to `{destination}/{filename}`, cache invalidated |
| Upload expired | Purged after `tus_expiry_hours` (default 24h) by background task |
| Server restart | Orphaned `.rustyfile_tmp_*` files cleaned up on startup |
