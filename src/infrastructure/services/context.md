# Infrastructure Services

## Multi-Tenant Architecture

Services use tenant-scoped paths for file storage.

### Storage Path

```
tenants/{tenantId}/profilePhotos/{timestamp}-{filename}
```

### Services

- **FirebaseStorageService** — Implements `IFileStorageService`. Saves files to Firebase Storage under tenant-scoped paths. The `deleteFile` method extracts the full path from the URL (which already contains the tenant prefix).
