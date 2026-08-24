# Media Module

## Overview

The Media module handles image upload, processing, and storage. It supports multi-format image processing (original, WebP, thumbnail, responsive sizes) via Sharp, with pluggable storage backends (local, S3). The module also provides a GraphQL resolver for media queries and mutations.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-MED-001 | Upload Image | Merchant/Admin | Upload and process a single image with automatic format conversion (WebP, thumbnail, responsive) |
| UC-MED-002 | Upload Multiple Images | Merchant/Admin | Upload and process multiple images in batch (up to 10) |
| UC-MED-003 | Upload Media | System/GraphQL | Create a media record with file metadata (used by GraphQL resolver) |
| UC-MED-004 | List Media | Merchant/Admin | List media items with filtering by folder, type, tags, search, and pagination |
| UC-MED-005 | Delete Media | Merchant/Admin | Delete a media asset, with usage check and optional force delete |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-MED-001 | POST | `/business/media/upload` |
| UC-MED-002 | POST | `/business/media/upload/batch` |

### GraphQL Endpoints

| ID | Type | Field | Description |
|---|---|---|---|
| UC-MED-003 | Mutation | `uploadMedia` | Upload media via GraphQL |
| UC-MED-004 | Query | `media` | List media items via GraphQL |
| UC-MED-005 | Mutation | `deleteMedia` | Delete media via GraphQL |

---

## Domain Errors

| Error Class | Code | Status | Description |
|---|---|---|---|
| `MediaAssetNotFoundError` | `media.asset_not_found` | 404 | Media asset not found |
| `MediaFolderNotFoundError` | `media.folder_not_found` | 404 | Media folder not found |
| `MediaUploadFailedError` | `media.upload_failed` | 500 | Media upload failed |
| `InvalidMediaTypeError` | `media.invalid_type` | 400 | Invalid media type |
| `MediaFileTooLargeError` | `media.file_too_large` | 400 | File exceeds maximum size |
| `DuplicateMediaNameError` | `media.duplicate_name` | 409 | Duplicate media name in folder |
| `MediaValidationError` | `media.validation_error` | 400 | General validation error |
| `MediaFileNotFoundError` | `media.file_not_found` | 404 | File not found |

---

## Events Emitted

The media module does not currently emit domain events.

---

## Domain Entities

- **`Media`** — Aggregate root representing processed media files with multiple formats (`MediaFile[]`), thumbnail, alt text, tags, and metadata. Domain methods include `addProcessedFile`, `setThumbnail`, and `toJSON`.

## Domain Services

- **`ImageProcessingService`** — Interface for image processing (implemented by `SharpImageProcessingService`)
- **`StorageService`** — Interface for file storage (implemented by `StorageServiceFactory`)

## Repository Ports

- **`MediaRepository`** — `save`, `findById`, `findByIds`, `findAll`, `delete`, `count`

## Provider Contract

`index.ts` exports:
- Use cases: `UploadMediaUseCase`, `ListMediaUseCase`, `DeleteMediaUseCase`, `ProcessImageUseCase`
- Repository port: `MediaRepository`
- Domain errors: all error classes listed above

---

## Owned Tables

| Table | Purpose |
|---|---|
| `media` | Media asset records with processed files, thumbnails, and metadata |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-MED-001 | — | ❌ |
| UC-MED-002 | — | ❌ |
| UC-MED-003 | — | ❌ |
| UC-MED-004 | — | ❌ |
| UC-MED-005 | — | ❌ |

> **Note**: No integration tests exist yet for this module.

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/media/upload` | `MediaController.uploadImage` | Upload and process a single image |
| POST | `/business/media/upload/batch` | `MediaController.uploadImages` | Upload and process multiple images (up to 10) |

<!-- GENERATED:ENDPOINTS:END -->
