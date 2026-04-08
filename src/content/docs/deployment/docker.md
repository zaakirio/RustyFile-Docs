---
title: Docker
description: Run RustyFile with Docker or Docker Compose.
---

## Quick start

```bash
docker run -d \
  --name rustyfile \
  -p 8080:8080 \
  -v /your/files:/data \
  -v rustyfile-config:/config \
  rustyfile/rustyfile
```

## Volumes

| Mount Point | Purpose | Recommendation |
|-------------|---------|----------------|
| `/data` | Filesystem root to browse | Bind mount to your files |
| `/config` | Database, cache (thumbs, HLS, uploads) | Named volume for persistence |

## Environment variables

Override any configuration via environment:

```bash
docker run -d \
  -p 3000:3000 \
  -e RUSTYFILE_PORT=3000 \
  -e RUSTYFILE_LOG_FORMAT=json \
  -e RUSTYFILE_JWT_EXPIRY_HOURS=8 \
  -v /your/files:/data \
  -v rustyfile-config:/config \
  rustyfile/rustyfile
```

## Docker Compose

```yaml title="docker-compose.yml"
services:
  rustyfile:
    image: rustyfile/rustyfile
    container_name: rustyfile
    ports:
      - "8080:8080"
    volumes:
      - /your/files:/data
      - rustyfile-config:/config
    environment:
      - RUSTYFILE_LOG_FORMAT=json
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  rustyfile-config:
```

## Health check

The image includes a built-in health check:

```
GET /api/health  →  {"status": "ok", "db": "connected"}
```

Checked every 30 seconds with a 5-second timeout.

## Image details

- **Base:** Alpine 3.21
- **Size:** ~15-20 MB
- **User:** Runs as non-root
- **FFmpeg:** Not included by default. Mount or install if you need HLS transcoding.

## Building locally

```bash
docker build -t rustyfile .
```

Or with the Makefile:

```bash
make docker
```
