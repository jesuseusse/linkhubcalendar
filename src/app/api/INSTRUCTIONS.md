# API Routes Instructions

Next.js App Router API routes. All routes follow the same pattern for error handling, authentication, and multi-tenant isolation.

## Route Types

There are two types of routes:

### 1. Authenticated Routes (require Firebase JWT)

Used for dashboard/admin operations. Located under `src/app/api/{feature}/`.

```ts
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const result = await container.getProductsUseCase.execute(tenantId, userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get products";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const body = await req.json();
    const result = await container.createProductUseCase.execute(tenantId, userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

With dynamic route params:

```ts
// src/app/api/products/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/checkAuth";
import { container } from "@/infrastructure/container";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { productId } = await params;
    const body = await req.json();
    const result = await container.updateProductUseCase.execute(tenantId, userId, productId, body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { userId, tenantId } = await checkAuth(req);
    const { productId } = await params;
    await container.deleteProductUseCase.execute(tenantId, userId, productId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

### 2. Public Routes (no auth, resolve tenant from hostname)

Used for public-facing pages (profile, calendar, bookings). Located under `src/app/api/u/[username]/`.

```ts
// src/app/api/u/[username]/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { resolveTenantId } from "@/lib/auth/resolveTenantId";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const tenantId = await resolveTenantId(req);
    const result = await container.getPublicProductsUseCase.execute(tenantId, username);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
```

## Rules

1. **Always destructure `tenantId`** — authenticated routes get it from `checkAuth(req)`, public routes from `resolveTenantId(req)`
2. **Always pass `tenantId` as first argument** to every use case `execute()` call
3. `params` is a `Promise` in Next.js App Router — always `await params`
4. Use `try/catch` with the standard error pattern: `err instanceof Error ? err.message : "fallback"`
5. Return `201` for creation, `200` for reads/updates, `400` for errors, `404` for not found
6. Never import repositories directly in routes — always go through `container`
   - Exception: `userRepo` is exported from container for the signup route

## Existing Routes Reference

### Authenticated (`checkAuth`)
| Route | Methods | File |
|-------|---------|------|
| `/api/auth/signup` | POST | `auth/signup/route.ts` |
| `/api/auth/login` | POST | `auth/login/route.ts` |
| `/api/profile` | GET, PUT | `profile/route.ts` |
| `/api/profile/username` | PUT | `profile/username/route.ts` |
| `/api/profile/theme` | PUT | `profile/theme/route.ts` |
| `/api/profile/photo` | POST | `profile/photo/route.ts` |
| `/api/profile/contact-form` | PUT | `profile/contact-form/route.ts` |
| `/api/profile/domain` | PUT, DELETE | `profile/domain/route.ts` |
| `/api/profile/downgrade` | POST | `profile/downgrade/route.ts` |
| `/api/links` | POST | `links/route.ts` |
| `/api/links/[linkId]` | PUT, DELETE | `links/[linkId]/route.ts` |
| `/api/calendar/toggle` | PUT | `calendar/toggle/route.ts` |
| `/api/calendar/slots` | POST | `calendar/slots/route.ts` |
| `/api/calendar/slots/[slotId]` | DELETE | `calendar/slots/[slotId]/route.ts` |
| `/api/calendar/slots/[slotId]/release` | PUT | `calendar/slots/[slotId]/release/route.ts` |
| `/api/appointments` | GET | `appointments/route.ts` |
| `/api/appointments/[id]` | DELETE | `appointments/[id]/route.ts` |
| `/api/appointments/[id]/confirm` | PUT | `appointments/[id]/confirm/route.ts` |
| `/api/appointments/[id]/release-slot` | PUT | `appointments/[id]/release-slot/route.ts` |
| `/api/leads` | GET | `leads/route.ts` |

### Public (`resolveTenantId`)
| Route | Methods | File |
|-------|---------|------|
| `/api/u/[username]` | GET | `u/[username]/route.ts` |
| `/api/u/[username]/calendar` | GET | `u/[username]/calendar/route.ts` |
| `/api/u/[username]/appointments` | POST | `u/[username]/appointments/route.ts` |
| `/api/u/[username]/contact` | POST | `u/[username]/contact/route.ts` |
