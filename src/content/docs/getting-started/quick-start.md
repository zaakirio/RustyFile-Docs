---
title: Quick Start
description: Get RustyFile running in under a minute.
---

## Launch

```bash
rustyfile --root /path/to/files --port 8080
```

That's it. Open `http://localhost:8080` in your browser.

## Common examples

```bash
# Serve your home directory
rustyfile --root ~

# Custom port with debug logging
rustyfile --root /srv/media --port 3000 --log-level debug

# JSON logs for production
rustyfile --root /data --log-format json

# Custom data directory for database and cache
rustyfile --root /files --data-dir /var/lib/rustyfile
```

## What happens on first launch

1. RustyFile starts and opens a **5-minute setup window**
2. Visit the web UI — you'll see the setup screen
3. Create your admin account (username + password, min 10 characters)
4. The setup window closes and normal auth takes over

:::caution
The setup window has a hard timeout. If you miss it, delete the database file in your data directory and restart.
:::

## Next steps

- [First Run](/getting-started/first-run/) — detailed setup walkthrough
- [Configuration](/guides/configuration/) — all available options
- [Docker deployment](/deployment/docker/) — containerized setup
