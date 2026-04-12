---
title: Uploading Files
description: Upload files with TUS resumable protocol, drag-and-drop, or the file picker.
---

## TUS resumable uploads

RustyFile implements the **TUS 1.0** open protocol for resumable file uploads. If your connection drops mid-upload, it resumes from the last byte received — no re-uploading.

### How it works

1. **Create** — `POST /api/tus/` with file metadata and total size. Returns a unique upload URL.
2. **Upload** — `PATCH /api/tus/{id}` sends chunks (5 MB each by default). Each chunk is fsync'd to disk.
3. **Resume** — `HEAD /api/tus/{id}` returns the current offset. The client resumes from there.
4. **Complete** — When all bytes are received, the temp file is atomically moved to the destination.
5. **Cancel** — `DELETE /api/tus/{id}` removes the temp file and cleans up.

### Key behaviors

| Behavior | Value |
|----------|-------|
| Chunk size | 5 MB |
| Concurrent uploads | 3 (frontend limit) |
| Upload expiry | 24 hours (configurable) |
| Temp file location | `{cache_dir}/uploads/` |
| Cleanup interval | Every 5 minutes |

Expired incomplete uploads are automatically purged. On startup, any orphaned `.rustyfile_tmp_*` files are cleaned up.

### Blocked file extensions

Certain file extensions are blocked from upload by default to prevent uploading potentially dangerous files. The default blocklist includes: `.php`, `.phtml`, `.php5`, `.sh`, `.bash`, `.cgi`, `.pl`, `.py`, `.rb`, `.exe`, `.bat`, `.cmd`, `.ps1`, `.msi`, `.dll`, `.so`, `.com`, `.scr`, `.vbs`, `.vbe`, `.wsf`, `.wsh`, `.jar`.

Customize the blocklist via `--blocked-upload-extensions` or `RUSTYFILE_BLOCKED_UPLOAD_EXTENSIONS` (comma-separated).

## Web UI upload

### Drag and drop

Drag files onto the browser page. A drop zone overlay appears. Files enter the upload queue and upload concurrently (up to 3 at once).

### File picker

Click the upload button (or the floating action button on mobile) to open the native file picker. Selected files are queued the same way.

### Upload progress

The upload manager panel shows:
- Per-file progress bar
- Upload speed
- Cancel button per file

## API upload (non-TUS)

For small files, you can save content directly with `PUT`:

```bash
curl -X PUT http://localhost:8080/api/fs/path/to/file.txt \
  -H "Authorization: Bearer TOKEN" \
  --data-binary @local-file.txt
```

This is limited to `max_upload_bytes` (default 50 MB). For larger files, use the TUS endpoint.

## TUS client integration

Any TUS 1.0 compatible client works. Example with `tus-js-client`:

```javascript
import * as tus from "tus-js-client";

const upload = new tus.Upload(file, {
  endpoint: "http://localhost:8080/api/tus/",
  headers: { Authorization: `Bearer ${token}` },
  metadata: {
    filename: file.name,
    destination: "path/to/directory",
  },
  chunkSize: 5 * 1024 * 1024,
  onProgress: (bytesUploaded, bytesTotal) => {
    console.log(`${(bytesUploaded / bytesTotal * 100).toFixed(1)}%`);
  },
});

upload.start();
```
