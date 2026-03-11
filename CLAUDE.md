# LinkHub

Multi-tenant link-in-bio platform built with Next.js App Router and Firebase.

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 with `@theme` directive (CSS custom properties)
- **Auth & DB:** Firebase 12.9 + Firebase Admin 13.6 (Firestore, Auth, Storage)
- **Payments:** Stripe 20.3.1
- **Email:** Resend 6.9.2 / AWS SES 3.x (tenant-configurable)
- **Package Manager:** Yarn
- **Testing:** Vitest 4

## Project Structure

```
src/
├── app/                            # Next.js App Router pages
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Root landing page
│   ├── globals.css
│   ├── api/                        # API routes
│   │   ├── auth/                   # login, signup, verify-email, tenant-discovery
│   │   ├── profile/                # profile, username, theme, photo, contact-form, domain, downgrade
│   │   ├── links/                  # CRUD for links
│   │   ├── calendar/               # toggle, slots CRUD
│   │   ├── appointments/           # booking, confirm, cancel, reschedule, release-slot
│   │   ├── leads/                  # leads CRUD
│   │   ├── stripe/                 # checkout, cancel, webhook
│   │   └── u/[username]/           # public endpoints (profile, calendar, appointments, contact)
│   └── tenants/
│       └── [tenantRegistryId]/     # Dynamic tenant segment
│           ├── layout.tsx          # Resolves full tenant registry in one Firestore read
│           ├── page.tsx            # Tenant landing page
│           ├── [username]/         # Public profile pages
│           │   ├── page.tsx
│           │   ├── PublicProfileClient.tsx
│           │   └── calendar/page.tsx
│           └── u/admin/            # Admin dashboard (requires auth)
│               ├── login/page.tsx
│               └── dashboard/      # page, dates, leads, billing
├── application/use-cases/          # Application layer use cases
├── components/                     # React components by domain
│   ├── Appointments/               # Appointment booking
│   ├── Auth/                       # Login / SignUp forms
│   ├── Billing/                    # Subscription management (BillingClient)
│   ├── Calendar/                   # Calendar management
│   ├── Common/                     # Header, UpgradeModal, RequirePermission, StripeResultModal, ReferralCapture
│   ├── Contact/                    # Contact form
│   ├── LandingPage/                # Multi-tenant landing page variants
│   ├── Leads/                      # Lead list
│   ├── Links/                      # Link CRUD
│   ├── Profile/                    # Profile editing
│   ├── QR/                         # QR code download
│   └── Theme/                      # Theme customizer
├── constants/                      # Shared constants (reserveUsernames)
├── context/                        # React contexts (AuthContext, Providers)
├── domain/                         # Domain layer (entities, interfaces, dtos)
├── dtos/                           # Shared DTOs (user, link, auth)
├── hooks/                          # Custom hooks
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useLinks.ts
│   ├── useLeads.ts
│   ├── useAppointments.ts
│   └── useStripeCheckout.ts
├── infrastructure/                 # Repositories & service implementations
│   ├── container.ts                # Dependency injection wiring
│   ├── repositories/               # Firestore repository implementations
│   └── services/                   # Email (Resend, AWS SES, Firebase), Storage
├── interfaces/                     # Service-level interfaces
│   ├── IStripeConfig.ts
│   ├── ISesConfig.ts
│   ├── ISeoConfig.ts
│   ├── ITenantRegistryData.ts
│   └── ...
├── lib/
│   ├── auth/                       # Tenant resolution & auth check (resolveTenantId.ts, checkAuth.ts)
│   ├── cache/                      # Next.js revalidation tag helpers
│   ├── firebase/                   # Firebase client & admin initialization
│   └── tenant/                     # tenantTheme.ts, resolveTenant.ts, resolveTenantLandingPage.ts
├── permissions/                    # Plan-based permissions (free, pro, team)
├── services/                       # Client-side service layer (apiClient, ApiAuthService, etc.)
└── utils/                          # Helpers (platformIcons, profilePhoto, planExpiration, firebaseErrors)
```

## Multi-Tenant Architecture

Each tenant is identified by their domain. Firestore `tenant_registry/{hostname}` documents map domains to tenant IDs and carry all tenant config (theme, Stripe keys, email config, SEO).

**Resolution flow:**

1. `middleware.ts` resolves `tenantId` from the request `host` header and sets it as a header
2. `tenants/[tenantRegistryId]/layout.tsx` receives the registry ID as a URL param and calls `resolveTenantRegistryByHost()` to fetch the full registry document (theme, Stripe config, email config, SEO) in a single Firestore read
3. Firebase Auth uses Identity Platform with tenant-scoped authentication

**Key files:**

- `src/lib/auth/resolveTenantId.ts` — tenant resolution functions (`resolveEffectiveHostname`, `resolveTenantIdByHost`, `resolveTenantRegistryByHost`)
- `src/lib/tenant/tenantTheme.ts` — theme-to-CSS-var converter
- `src/lib/tenant/resolveTenant.ts` — tenant resolution helpers
- `middleware.ts` — request-level tenant resolution

## Theme System

Three-layer cascade (lowest to highest priority):

1. **`@theme` defaults** — `src/app/globals.css` defines base CSS custom properties via Tailwind v4's `@theme` directive
2. **Tenant theme** — `tenant_registry/{host}.theme` object in Firestore, injected as inline CSS vars on `<html>` in tenant layout
3. **User theme** — per-user `ThemeDto` applied as inline `style` on individual elements in `PublicProfileClient.tsx`

### Semantic Design Tokens

Always use semantic Tailwind classes instead of hardcoded colors:

| Use this                  | Not this                             |
| ------------------------- | ------------------------------------ |
| `bg-background`           | `bg-white`                           |
| `bg-surface`              | `bg-zinc-50`                         |
| `text-foreground`         | `text-zinc-900`                      |
| `text-muted-foreground`   | `text-zinc-500`, `text-zinc-600`     |
| `border-border`           | `border-zinc-200`, `border-zinc-300` |
| `bg-primary`              | `bg-zinc-900`                        |
| `text-primary-foreground` | `text-white` (on primary bg)         |
| `text-error`              | `text-red-600`                       |
| `bg-error-light`          | `bg-red-50`                          |
| `bg-muted`                | `bg-zinc-100`                        |

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

| Permission      | free | pro | team |
| --------------- | ---- | --- | ---- |
| LINKS_EDIT      | yes  | yes | yes  |
| THEME_CUSTOMIZE | -    | yes | yes  |
| CONTACT_FORM    | -    | yes | yes  |
| CALENDAR        | -    | yes | yes  |
| LEADS_VIEW      | -    | yes | yes  |
| ANALYTICS_VIEW  | -    | -   | yes  |

Gated in UI via `<RequirePermission>` wrapper component. Public pages check permissions inline with `hasPermission()`.

## Stripe & Billing

Stripe is integrated per-tenant. Each tenant registry document in Firestore stores its own Stripe config (`IStripeConfig`: `secretKey`, `publishableKey`, `webhookSecret`, `proPriceId`).

**API routes:**
- `POST /api/stripe/checkout` — creates a Stripe Checkout session
- `POST /api/stripe/cancel` — cancels subscription at period end (reads `user.stripeSubscriptionId`)
- `POST /api/stripe/webhook` — handles Stripe events (idempotent via `saveStripeEvent`)

**Webhook events handled:**

| Event | Behavior |
|---|---|
| `checkout.session.completed` | Upgrade user to pro; propagate metadata to subscription |
| `customer.subscription.updated` | cancel_at_period_end → flag; unpaid → downgrade; past_due → flag; active → renew |
| `customer.subscription.deleted` | Downgrade to free, clear subscription flags |
| `invoice.payment_succeeded` | Renew pro plan |

**User entity subscription fields:**
- `stripeSubscriptionId?: string`
- `subscriptionCancelAtPeriodEnd?: boolean`
- `subscriptionStatus?: string` (e.g. `'past_due'`)

**UI:** `src/components/Billing/BillingClient.tsx` + `dashboard/billing/page.tsx`

## Referral System

A lightweight URL-based referral capture:

1. User visits any page with `?r=CODE` — `ReferralCapture.tsx` stores `CODE` in `localStorage`
2. On signup, `SignUpForm` reads from `localStorage` and passes `referredBy` to the API
3. Signup route stores `referredBy` on the user document
4. `localStorage` entry is cleared after successful signup

## Email Infrastructure

Multiple email backends selectable per tenant:

- **Firebase** — built-in email verification (`FirebaseEmailVerificationService`)
- **Resend** — transactional email via `ResendEmailSenderService`
- **AWS SES** — transactional email via `AwsSesEmailSenderService`

`emailSenderFactory.ts` selects the implementation based on tenant config (`resendApiKey` / `sesConfig` in `ITenantRegistryData`). Templates live in `emailTemplates.ts`.

## Language

UI strings are in **Spanish**. There is no i18n library — all text is hardcoded.

## Commands

```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn start        # Start production server
yarn lint         # Run ESLint
yarn test         # Run all tests (Vitest)
yarn test:watch   # Run tests in watch mode
```
