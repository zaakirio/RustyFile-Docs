---
title: Production Checklist
description: Essential checks before deploying RustyFile to production.
---

## Checklist

### Security

- [ ] **Strong admin password** — minimum 10 characters, use a password manager
- [ ] **TLS enabled** — always run behind a reverse proxy with HTTPS
- [ ] **Trusted proxies configured** — set `RUSTYFILE_TRUSTED_PROXIES` to your proxy IPs so rate limiting uses real client IPs
- [ ] **CORS restricted** — set `RUSTYFILE_CORS_ORIGINS` to your domain instead of `*`

### Storage

- [ ] **Root directory correct** — `--root` points to the files you want to serve, not `/` or a system directory
- [ ] **Data directory persistent** — database and caches survive restarts (named Docker volume or persistent path)
- [ ] **Disk space** — enough room for database, thumbnail cache, HLS cache, and TUS temp files

### Operations

- [ ] **JSON logs** — use `--log-format json` for structured log ingestion
- [ ] **Log level** — set to `info` or `warn` (not `debug` in production)
- [ ] **Reverse proxy body limit** — nginx `client_max_body_size` matches your upload needs
- [ ] **Health check** — monitor `GET /api/health` for `{"status": "ok"}`
- [ ] **Restart policy** — Docker `restart: unless-stopped` or systemd `Restart=on-failure`

### Optional

- [ ] **FFmpeg installed** — required only if you need HLS video transcoding
- [ ] **JWT expiry tuned** — default 2 hours, adjust for your security needs
- [ ] **Setup timeout** — consider reducing `setup_timeout_minutes` in sensitive environments

## Systemd unit (non-Docker)

```ini title="/etc/systemd/system/rustyfile.service"
[Unit]
Description=RustyFile File Browser
After=network.target

[Service]
Type=simple
User=rustyfile
ExecStart=/usr/local/bin/rustyfile --root /srv/files --data-dir /var/lib/rustyfile --log-format json
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now rustyfile
```

## Monitoring

The health endpoint reports both service and database status:

```bash
curl http://localhost:8080/api/health
# {"status": "ok", "db": "connected"}
# {"status": "degraded", "db": "unreachable"}
```

Use this with your monitoring tool (Uptime Kuma, Grafana, etc.) to alert on degraded status.
