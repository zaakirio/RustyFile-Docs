---
title: Media API
description: Image thumbnails and HLS video streaming endpoints.
---

All media endpoints require authentication.

## Thumbnails

### Get thumbnail

```http
GET /api/thumbs/{path}
```

Returns a JPEG thumbnail (max 300px in either dimension) for supported image files.

**Supported source formats:** JPEG, PNG, WebP

**Response headers:**
```
Content-Type: image/jpeg
Cache-Control: public, max-age=86400, immutable
```

**Cache behavior:**
- Thumbnails are cached to disk at `{data_dir}/cache/thumbs/{key}.jpg`
- Cache key: first 24 hex characters of `blake3(path + file_size + mtime)`
- Regenerated only when the source file changes (size or mtime differs)
- Max 4 concurrent thumbnail generations (semaphore-limited)

**Errors:**
- `404` — File not found or not a supported image format

---

## HLS streaming

### Get playlist

```http
GET /api/hls/playlist/{path}
```

Returns an m3u8 playlist for the requested video file. RustyFile probes the video duration with `ffprobe` and generates 10-second segments.

**Response:**
```
Content-Type: application/vnd.apple.mpegurl
```

```txt
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.000,
/api/hls/segment/a1b2c3d4e5f6.../0.ts
#EXTINF:10.000,
/api/hls/segment/a1b2c3d4e5f6.../1.ts
...
#EXT-X-ENDLIST
```

---

### Get segment

```http
GET /api/hls/segment/{source_key}/{index}
```

Returns a transcoded MPEG-TS segment. Segments are transcoded on-demand and cached.

**Response headers:**
```
Content-Type: video/mp2t
Cache-Control: public, max-age=86400, immutable
```

**Transcoding settings:** H.264 (veryfast preset, CRF 23) + AAC (128k).

**Errors:**
- `404` — Unknown source key (server may have restarted since playlist was generated)
- `500` — FFmpeg not found or transcoding failed

:::caution
The source key mapping is stored in memory. If the server restarts between a playlist request and segment requests, segment requests will return 404. Re-request the playlist to re-register the mapping.
:::
