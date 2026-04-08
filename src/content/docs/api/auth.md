---
title: Auth & Setup API
description: Authentication and initial setup API endpoints.
---

## Setup endpoints

### Check setup status

```http
GET /api/setup/status
```

Returns whether the first-run setup is still required. **No auth required.**

**Response:**
```json
{ "setup_required": true }
```

---

### Create admin account

```http
POST /api/setup/admin
```

Creates the initial admin user. Only available during the setup window (default 5 minutes from first launch). **No auth required.**

**Request body:**
```json
{
  "username": "admin",
  "password": "your-secure-password",
  "password_confirm": "your-secure-password"
}
```

**Response** `200`:
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

Also sets `rustyfile_token` HttpOnly cookie.

**Errors:**
- `400` — Validation error (password mismatch, too short/long)
- `409` — Admin already exists
- `410` — Setup window expired

---

## Auth endpoints

### Login

```http
POST /api/auth/login
```

Authenticate and receive a JWT token. **No auth required.** Rate-limited: 10 attempts per 15 minutes per IP.

**Request body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response** `200`:
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

**Errors:**
- `401` — Invalid credentials
- `429` — Rate limit exceeded

---

### Logout

```http
POST /api/auth/logout
```

Clears the `rustyfile_token` cookie. **No auth required.**

**Response** `200`:
```json
{ "message": "Logged out" }
```

---

### Refresh token

```http
POST /api/auth/refresh
```

Issue a new JWT token. **Requires auth.** Re-validates the user exists in the database before issuing.

**Response** `200`:
```json
{ "token": "eyJhbGci..." }
```

**Errors:**
- `401` — Token invalid/expired or user no longer exists
