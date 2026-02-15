# Domain Interfaces

## Multi-Tenant Architecture

All repository and service interfaces follow a multi-tenant pattern where `tenantId: string` is the **first parameter** of every method.

### Collection Path Pattern

Firestore collections are scoped under: `/tenants/{tenantId}/{collection}`

### Interfaces

- **IUserRepository** — CRUD and field-level updates for users, links, calendar slots, themes, and plans.
- **IAppointmentRepository** — CRUD for appointments with pagination and status updates.
- **ILeadRepository** — Create and query leads by user.
- **IFileStorageService** — Save/delete files in tenant-scoped storage paths (`tenants/{tenantId}/profilePhotos/...`).

### Convention

Every method signature follows: `method(tenantId: string, ...otherParams): Promise<T>`
