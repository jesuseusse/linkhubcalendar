# Firestore Repositories

## Multi-Tenant Architecture

All repositories use tenant-scoped Firestore collections.

### Collection Path

```
tenants/{tenantId}/users
tenants/{tenantId}/appointments
tenants/{tenantId}/leads
```

### Implementation Pattern

Each repository replaces the old static collection getter with a tenant-aware method:

```ts
private col(tenantId: string) {
  return adminDb.collection(`tenants/${tenantId}/${COLLECTION}`);
}
```

### Repositories

- **FirestoreUserRepository** — Implements `IUserRepository`. Manages user documents, embedded links, calendar slots, themes, and plans.
- **FirestoreAppointmentRepository** — Implements `IAppointmentRepository`. Manages appointment documents with pagination and status updates.
- **FirestoreLeadRepository** — Implements `ILeadRepository`. Manages lead documents scoped per user.
