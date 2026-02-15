# Auth Helpers Instructions

This folder contains authentication and tenant resolution utilities.

## Files

### `checkAuth.ts` — Authenticated request handler

Verifies Firebase JWT from the `Authorization: Bearer <token>` header. Returns both `userId` and `tenantId`. Throws if the token is invalid or `tenantId` is missing.

```ts
import { checkAuth } from "@/lib/auth/checkAuth";

// In an authenticated API route:
const { userId, tenantId } = await checkAuth(req);
```

- Returns: `{ userId: string; tenantId: string }`
- Throws: `"Authentication required"` if no Bearer token
- Throws: `"Tenant ID is required"` if the JWT has no tenant claim
- The `tenantId` comes from `decoded.firebase.tenant` in the Firebase JWT

### `resolveTenantId.ts` — Public request tenant resolution

Resolves `tenantId` from the request hostname. Used for public routes and SSR pages that have no auth token.

Two variants:

```ts
import { resolveTenantId, resolveTenantIdFromHeaders } from "@/lib/auth/resolveTenantId";

// In API routes (has NextRequest):
const tenantId = await resolveTenantId(req);

// In SSR page components (no request object):
const tenantId = await resolveTenantIdFromHeaders();
```

Resolution logic:
1. `localhost` / `127.0.0.1` → uses `process.env.NEXT_PUBLIC_FIREBASE_TENANT_ID`
2. Production hostname → queries Firestore `tenant_registry/{hostname}` document for `tenantId`

## When to Use Which

| Context | Function | Source of tenantId |
|---------|----------|-------------------|
| Authenticated API route | `checkAuth(req)` | Firebase JWT `decoded.firebase.tenant` |
| Public API route (no auth) | `resolveTenantId(req)` | Request hostname |
| SSR page component | `resolveTenantIdFromHeaders()` | `headers().get('host')` |

## Adding a New Auth Helper

If you need additional auth logic (e.g., role-based access), add it to this folder and follow the same pattern:
- Accept `NextRequest` as input
- Return a typed object
- Throw descriptive `Error` messages on failure
