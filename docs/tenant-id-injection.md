# Dynamic TenantId Injection by Domain

## Overview

Firebase Identity Platform multi-tenancy is enabled by setting `auth.tenantId` on the client-side Firebase Auth instance **before** any authentication call. The tenantId is resolved automatically by normalizing `window.location.hostname` and matching it against tenant `displayName` values in the Firebase project — no hardcoded mappings.

## Architecture

```
[Browser loads page]
        │
        ▼
  ┌──────────────────────┐
  │  client.ts (module)  │
  │                      │
  │  tenantReady = fetch ─────► GET /api/auth/tenant-discovery
  │       (promise)      │              │
  └──────────────────────┘              ▼
                                ┌──────────────────────────┐
                                │  tenant-discovery         │
                                │  (API route)              │
                                │                           │
                                │  normalizeHost(host)      │
                                │    "localhost:3000" → "localhost"
                                │    "app.com.mx" → "app-com-mx"
                                │                           │
                                │  tenantManager            │
                                │    .listTenants()         │──► Firebase Admin SDK
                                │                           │
                                │  Match: displayName       │
                                │    === normalized host    │
                                └───────────┬──────────────┘
                                            │
                                   { tenantId: "..." }
                                            │
        ┌───────────────────────────────────┘
        ▼
  auth.tenantId = tenantId     ← tenantReady resolves
        │
        ├──► AuthContext subscribes to onAuthStateChanged (tenant-scoped)
        ├──► ApiAuthService.login() calls signInWithEmailAndPassword (tenant-scoped)
        └──► ApiAuthService.signUp() calls createUserWithEmailAndPassword (tenant-scoped)
        │
        ▼
  ID token includes `firebase.tenant` claim
        │
        ▼
  ┌──────────────────┐
  │  checkAuth()     │──► verifyIdToken → extracts tenantId from decoded.firebase.tenant
  └──────────────────┘
```

## Critical Constraints

1. **No Hardcoding** — No domain-to-tenantId maps in the frontend. Resolution is fully dynamic via the discovery API.
2. **Naming Convention** — Tenant `displayName` must match the **normalized** domain (see table below). Firebase only allows letters, digits, and hyphens (4-20 chars, must start with a letter).
3. **Race Conditions** — The `tenantReady` promise guarantees `auth.tenantId` is set before any auth operation fires.
4. **Per-Tenant Providers** — Each tenant must have its own sign-in providers enabled (e.g., Email/Password). This is configured per-tenant in Identity Platform, not at the project level.

## Host Normalization

The `normalizeHost()` function strips the port and replaces dots with hyphens:

```typescript
function normalizeHost(host: string): string {
  return host.split(":")[0].replace(/\./g, "-");
}
```

| Domain | Normalized (= tenant displayName) |
|---|---|
| `localhost:3000` | `localhost` |
| `tuterapeuta.com.mx` | `tuterapeuta-com-mx` |
| `cliente-a.com` | `cliente-a-com` |
| `www.example.org` | `www-example-org` |

When creating tenants in Firebase Console (Identity Platform > Instancias), set the **Display Name** to the normalized form.

## Files Involved

| File | Role |
|------|------|
| `src/lib/firebase/client.ts` | Initializes auth, fetches tenantId via discovery, exports `tenantReady` promise |
| `src/app/api/auth/tenant-discovery/route.ts` | Public API — normalizes host, uses `tenantManager().listTenants()` to match `displayName` |
| `src/context/AuthContext.tsx` | `tenantReady.then(...)` before `onAuthStateChanged` subscribes |
| `src/services/ApiAuthService.ts` | `await tenantReady` before `signIn` / `signUp` |
| `src/lib/auth/checkAuth.ts` | Server-side — extracts `tenantId` from decoded token's `firebase.tenant` claim |

## How tenantReady Works

```typescript
// src/lib/firebase/client.ts

export const tenantReady: Promise<void> = (typeof window !== 'undefined' && _auth)
  ? fetch('/api/auth/tenant-discovery')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const id = data?.tenantId || process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID;
        if (id) {
          _auth.tenantId = id;
        }
      })
      .catch(() => { /* discovery failed — continues without tenant scope */ })
  : Promise.resolve();
```

- Runs once at module load time (client-side only)
- The promise is shared — multiple `await tenantReady` calls all wait for the same fetch
- **Fallback**: if discovery returns 404 (no tenant matches), falls back to `NEXT_PUBLIC_FIREBASE_TENANT_ID` env variable
- If both fail, auth continues without a tenant scope (project-level auth)
- On the server (`typeof window === 'undefined'`), resolves immediately

### Resolution Order

1. **Discovery API** — `displayName === normalizeHost(host)`
2. **Env variable** — `NEXT_PUBLIC_FIREBASE_TENANT_ID` (fallback for localhost/dev)
3. **None** — auth operates at project level (no tenant scope)

## Consumer Usage

### AuthContext

```typescript
useEffect(() => {
  tenantReady.then(() => {
    // auth.tenantId is now set — safe to subscribe
    unsubscribe = onAuthStateChanged(auth, ...);
  });
  return () => unsubscribe?.();
}, []);
```

### ApiAuthService

```typescript
async login(dto: LoginDto) {
  await tenantReady;  // blocks until tenantId is resolved
  const cred = await signInWithEmailAndPassword(auth, ...);
  ...
}
```

## Discovery API

### `GET /api/auth/tenant-discovery`

**Public endpoint** — no authentication required.

Normalizes the `Host` header and uses `adminAuth.tenantManager().listTenants()` to find a matching tenant.

| Status | Response |
|--------|----------|
| 200 | `{ "tenantId": "tenant-xyz-abc" }` |
| 404 | `{ "error": "Tenant not found for this domain", "host": "...", "availableTenants": [...] }` |
| 500 | `{ "error": "Discovery failed" }` |

The 404 response includes debug info (`host`, `availableTenants`) to help diagnose mismatches.

## Server-Side Verification

`checkAuth()` returns `{ userId, tenantId }`. The `tenantId` is extracted from `decoded.firebase.tenant` in the verified ID token. Route handlers can use this to enforce tenant-level access control.

## Setup Checklist

1. **Enable Identity Platform** in Google Cloud Console for the project
2. **Create a tenant** (Identity Platform > Instancias) with `displayName` = normalized domain
3. **Enable sign-in providers** (Email/Password) on each tenant individually
4. **Set env fallback** (optional): `NEXT_PUBLIC_FIREBASE_TENANT_ID=<tenant-id>` in `.env.local` for local dev
