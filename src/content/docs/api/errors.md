---
title: Error Codes
description: HTTP error codes and error response format.
---

## Response format

All errors return a JSON body:

```json
{ "error": "Human-readable error message" }
```

Internal errors (500) return a generic message to prevent information leakage. The actual error is logged server-side.

## Error codes

| HTTP Status | Meaning | When |
|-------------|---------|------|
| `400` | Bad Request | Invalid input, malformed JSON, validation failure |
| `401` | Unauthorized | Missing, invalid, or expired token |
| `403` | Forbidden | Authenticated but not allowed (e.g., insufficient role) |
| `404` | Not Found | File, directory, or upload not found |
| `409` | Conflict | File already exists (rename without `overwrite`), TUS offset mismatch |
| `410` | Gone | Setup window has expired |
| `428` | Precondition Required | Setup must be completed before this operation |
| `429` | Too Many Requests | Login rate limit exceeded (10 per 15 min per IP) |
| `500` | Internal Server Error | Database, I/O, or unexpected error (details logged, not returned) |

## Common scenarios

### 401 on previously-working requests

Your token has expired. Call `POST /api/auth/refresh` to get a new one, or re-login. The web UI handles this automatically — a 401 on any non-auth endpoint triggers a logout.

### 409 on TUS PATCH

The `Upload-Offset` header doesn't match the server's current offset. Query the offset with `HEAD /api/tus/{id}` and resume from the returned value.

### 410 on setup

The setup window has expired. Delete `rustyfile.db` from your data directory and restart to re-open it.

### 429 on login

Rate limit hit. Wait up to 15 minutes or try from a different IP. The rate limiter uses a leaky bucket algorithm — the window refills gradually, not all at once.
