---
title: First Run
description: Walk through the initial setup wizard and admin account creation.
---

## Setup mode

On first launch, RustyFile enters **setup mode** — a time-limited window (default 5 minutes) where you create the initial admin account. No authentication is required during this window.

## Creating the admin account

### Via the web UI

1. Navigate to `http://localhost:8080`
2. You'll see the setup form automatically
3. Enter a username and password (minimum 10 characters, maximum 128)
4. Click **Create Account**
5. You're logged in and redirected to the file browser

### Via the API

```bash
curl -X POST http://localhost:8080/api/setup/admin \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-secure-password", "password_confirm": "your-secure-password"}'
```

## Checking setup status

```bash
curl http://localhost:8080/api/setup/status
# {"setup_required": true}   — setup window is open
# {"setup_required": false}  — admin exists, normal auth active
```

## Setup timeout

The setup window defaults to 5 minutes (configurable via `--setup-timeout-minutes` or `RUSTYFILE_SETUP_TIMEOUT_MINUTES`). After timeout or admin creation, the endpoint returns `410 Gone`.

:::danger
If you miss the setup window, stop RustyFile, delete `rustyfile.db` from your data directory, and restart. The setup window will reopen.
:::

## Password requirements

| Rule | Default |
|------|---------|
| Minimum length | 10 characters |
| Maximum length | 128 characters |

The max length prevents Argon2 denial-of-service attacks with extremely long passwords. Both limits are configurable.
