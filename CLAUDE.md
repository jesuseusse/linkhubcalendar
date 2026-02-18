# LinkHub

Multi-tenant link-in-bio platform built with Next.js App Router and Firebase.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 with `@theme` directive (CSS custom properties)
- **Auth & DB:** Firebase 12.9 + Firebase Admin 13.6 (Firestore, Auth, Storage)
- **Package Manager:** Yarn

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (landing)/          # Landing page
│   ├── admin/              # Admin dashboard (login, dashboard, dates)
│   ├── api/                # API routes
│   └── [username]/         # Public profile pages
├── application/use-cases/  # Application layer use cases
├── components/             # React components by domain
│   ├── Appointments/       # Appointment booking
│   ├── Auth/               # Login / SignUp forms
│   ├── Calendar/           # Calendar management
│   ├── Common/             # Header, UpgradeModal, RequirePermission
│   ├── Contact/            # Contact form
│   ├── Leads/              # Lead list
│   ├── Links/              # Link CRUD
│   ├── Profile/            # Profile editing
│   └── Theme/              # Theme customizer
├── context/                # React contexts (AuthContext, Providers)
├── domain/                 # Domain layer (entities, interfaces, dtos)
├── dtos/                   # Shared DTOs
├── hooks/                  # Custom hooks (useAuth, useProfile, useAppointments)
├── infrastructure/         # Repositories & services implementations
├── lib/
│   ├── auth/               # Tenant resolution (resolveTenantId.ts)
│   ├── firebase/           # Firebase client & admin initialization
│   └── tenant/             # Tenant theme utilities (tenantTheme.ts)
├── permissions/            # Plan-based permissions (free, pro, team)
├── services/               # Service factory & interfaces
└── utils/                  # Helpers (platformIcons, profilePhoto, planExpiration)
```

## Multi-Tenant Architecture

Each tenant is identified by their domain. Firestore `tenant_registry/{hostname}` documents map domains to tenant IDs and optional theme overrides.

**Resolution flow:**
1. `middleware.ts` resolves `tenantId` from the request `host` header
2. Root layout (`src/app/layout.tsx`) calls `resolveTenantRegistryFromHeaders()` to get both `tenantId` and `theme` in a single Firestore read
3. Firebase Auth uses Identity Platform with tenant-scoped authentication

**Key files:**
- `src/lib/auth/resolveTenantId.ts` — tenant resolution functions
- `src/lib/tenant/tenantTheme.ts` — theme-to-CSS-var converter
- `middleware.ts` — request-level tenant resolution

## Theme System

Three-layer cascade (lowest to highest priority):

1. **`@theme` defaults** — `src/app/globals.css` defines base CSS custom properties via Tailwind v4's `@theme` directive
2. **Tenant theme** — `tenant_registry/{host}.theme` object in Firestore, injected as inline CSS vars on `<html>` in root layout
3. **User theme** — per-user `ThemeDto` applied as inline `style` on individual elements in `PublicProfileClient.tsx`

### Semantic Design Tokens

Always use semantic Tailwind classes instead of hardcoded colors:

| Use this | Not this |
|---|---|
| `bg-background` | `bg-white` |
| `bg-surface` | `bg-zinc-50` |
| `text-foreground` | `text-zinc-900` |
| `text-muted-foreground` | `text-zinc-500`, `text-zinc-600` |
| `border-border` | `border-zinc-200`, `border-zinc-300` |
| `bg-primary` | `bg-zinc-900` |
| `text-primary-foreground` | `text-white` (on primary bg) |
| `text-error` | `text-red-600` |
| `bg-error-light` | `bg-red-50` |
| `bg-muted` | `bg-zinc-100` |

### Adding a Tenant Theme in Firestore

```json
// tenant_registry/{hostname}
{
  "tenantId": "abc123",
  "theme": {
    "primary": "#4f46e5",
    "primaryForeground": "#ffffff",
    "background": "#fafafa",
    "foreground": "#1e1e2e",
    "accent": "#4f46e5",
    "border": "#d1d1d6"
  }
}
```

Only set the keys you want to override — omitted keys keep `@theme` defaults.

## Permissions

Defined in `src/permissions/plans.ts`. Three plans: `free`, `pro`, `team`.

| Permission | free | pro | team |
|---|---|---|---|
| LINKS_EDIT | yes | yes | yes |
| THEME_CUSTOMIZE | - | yes | yes |
| CONTACT_FORM | - | yes | yes |
| CALENDAR | - | yes | yes |
| LEADS_VIEW | - | yes | yes |
| ANALYTICS_VIEW | - | - | yes |

Gated in UI via `<RequirePermission>` wrapper component. Public pages check permissions inline with `hasPermission()`.

## Language

UI strings are in **Spanish**. There is no i18n library — all text is hardcoded.

## Commands

```bash
yarn dev      # Start dev server
yarn build    # Production build
yarn start    # Start production server
yarn lint     # Run ESLint
```
