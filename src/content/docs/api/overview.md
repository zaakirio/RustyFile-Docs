---
title: API Overview
description: REST API overview — base URL, authentication, request/response format.
---

## Base URL

All endpoints are prefixed with `/api/`.

```
http://localhost:8080/api/
```

## Authentication

Most endpoints require authentication. Two methods are accepted:

```bash
# Bearer token in Authorization header
Authorization: Bearer <token>

# HttpOnly cookie (set by login endpoint)
Cookie: rustyfile_token=<token>
```

Public endpoints (no auth required): health check, setup status, login, logout.

## Request format

- **Content-Type:** `application/json` for JSON bodies
- **Content-Type:** `application/offset+octet-stream` for TUS chunk uploads
- Path parameters use URL-encoded segments

## Response format

All responses return JSON with consistent structure:

```json
// Success
{ "entries": [...], "total": 42, "truncated": false }

// Error
{ "error": "Human-readable error message" }
```

## Endpoint groups

| Group | Prefix | Auth Required | Description |
|-------|--------|---------------|-------------|
| [Auth](/api/auth/) | `/api/auth/` | Varies | Login, logout, token refresh |
| [Setup](/api/auth/) | `/api/setup/` | No | First-run admin creation |
| [Filesystem](/api/filesystem/) | `/api/fs/` | Yes | Browse, create, edit, delete, download, search |
| [Uploads](/api/uploads/) | `/api/tus/` | Yes | TUS resumable upload protocol |
| [Media](/api/media/) | `/api/thumbs/`, `/api/hls/` | Yes | Thumbnails, HLS streaming |
| Health | `/api/health/` | No | Service health check |
