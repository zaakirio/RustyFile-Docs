---
title: Filesystem API
description: Browse, read, write, delete, rename, and download files.
---

All filesystem endpoints require authentication.

## Browse

```http
GET /api/fs/
GET /api/fs/{path}
```

Returns directory listing or file info depending on the path type.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `content` | bool | `false` | Include text file content (up to 5 MB) |
| `sort` | string | `name` | Sort by: `name`, `size`, `modified`, `type` |
| `order` | string | `asc` | Sort order: `asc`, `desc` |

**Directory response:**
```json
{
  "path": "documents",
  "entries": [
    {
      "name": "readme.md",
      "path": "documents/readme.md",
      "is_dir": false,
      "size": 1024,
      "modified": "2024-01-15T10:30:00Z",
      "mime": "text/markdown"
    }
  ],
  "total": 1,
  "truncated": false
}
```

**File response:**
```json
{
  "name": "readme.md",
  "path": "documents/readme.md",
  "is_dir": false,
  "size": 1024,
  "modified": "2024-01-15T10:30:00Z",
  "mime": "text/markdown",
  "content": "# Hello World\n...",
  "subtitles": []
}
```

For video files, the `subtitles` array lists detected subtitle files.

---

## Save file

```http
PUT /api/fs/{path}
```

Write content to a file. The write is **atomic** — content is written to a temp file and renamed.

**Request:** Raw bytes in the request body.

**Response** `200`:
```json
{ "message": "File saved", "path": "documents/readme.md" }
```

**Errors:**
- `400` — Path is a directory
- `404` — Parent directory doesn't exist

---

## Create directory

```http
POST /api/fs/{path}
```

**Request body:**
```json
{ "type": "directory" }
```

**Response** `201`:
```json
{ "message": "Directory created", "path": "documents/new-folder" }
```

---

## Delete

```http
DELETE /api/fs/{path}
```

Deletes a file or directory. Directory deletion is **recursive**. The root path (`/`) is protected.

**Response** `200`:
```json
{ "message": "Deleted", "path": "documents/old-file.txt" }
```

---

## Rename / Move

```http
PATCH /api/fs/{path}
```

**Request body:**
```json
{
  "destination": "new/path/filename.txt",
  "overwrite": false
}
```

**Response** `200`:
```json
{ "message": "Renamed", "from": "old-name.txt", "to": "new-name.txt" }
```

**Errors:**
- `409` — Destination exists and `overwrite` is `false`

---

## Download

```http
GET /api/fs/download/{path}
```

Stream a file download. Supports HTTP range requests for partial content.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `inline` | bool | `false` | Use `Content-Disposition: inline` instead of `attachment` |

**Headers returned:**
- `ETag` — blake3 hash of file size + modification time
- `Last-Modified` — file modification timestamp
- `Cache-Control: private` — auth-gated, not cached by CDNs
- `Accept-Ranges: bytes` — signals range request support

**Range request example:**
```bash
curl -H "Range: bytes=0-1023" \
     -H "Authorization: Bearer TOKEN" \
     http://localhost:8080/api/fs/download/video.mp4
```

Returns `206 Partial Content` with `Content-Range` header.

## Path safety

All paths are validated server-side:
- Path traversal (`../`) is stripped
- Only normal path components are allowed
- The resolved path must remain within the configured root directory
- Error messages use relative paths to avoid leaking server filesystem layout
