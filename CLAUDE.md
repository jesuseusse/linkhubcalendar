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

### Transactional notifications

| Event | Recipient | Template | Route that wires it |
|---|---|---|---|
| Appointment booked | Calendar owner (`user.email`) | `defaultAppointmentTemplate` | `POST /api/u/[username]/appointments` |
| Contact form submitted | Profile owner (`user.email`) | `defaultContactTemplate` | `POST /api/u/[username]/contact` |
| Subscription renewal upcoming | Subscriber | `defaultRenewalTemplate` | Stripe `invoice.upcoming` webhook |

**Pattern** (appointments and contact form): The API route calls `resolveTenantRegistry` to get the full registry, builds `emailSenderService` + `emailConfig` inside a `try/catch` (silently skips email if not configured), then constructs the use case ad-hoc (not from container) with those deps. The use case fires `sendXxxNotification(...).catch(() => {})` after saving to Firestore, so email failures never break the user flow.

**Interface:** `IEmailSenderService` (`src/domain/interfaces/IEmailSenderService.ts`) — all implementations must implement:
- `sendVerificationEmail`
- `sendAppointmentNotification`
- `sendUpcomingRenewalEmail`
- `sendContactNotification`

## SEO Configuration

Per-tenant SEO is managed through `tenant_registry/{hostname}.seoConfig` (`ISeoConfig`).

**Fields in `SeoConfig`:**
- `siteName`, `title`, `description`, `keywords` — standard meta tags
- `ogImage`, `favicon` — auto-populated from `tenant_registry.logoUrl` on save
- `canonicalUrl` — auto-populated from `tenant_registry.domain` on save
- `locale` — hardcoded to `'es_ES'` server-side
- `twitterHandle` — Twitter/X card handle
- `organizationType` — hardcoded to `'Organization'` server-side (used in JSON-LD)

**Admin UI:** `src/components/SEO/SeoConfigClient.tsx` + `dashboard/seo/page.tsx`
- Clients only edit content fields: `siteName`, `title`, `description`, `keywords`, `twitterHandle`
- Technical fields (`canonicalUrl`, `favicon`, `ogImage`, `locale`, `organizationType`) are injected server-side on every PUT

**API route:** `GET/PUT /api/profile/seo/route.ts`
- GET: returns current `seoConfig` from the tenant registry
- PUT: merges client body with server-derived defaults before calling `updateByHostname`

**Public page metadata:** `generateMetadata` is exported from both:
- `src/app/tenants/[tenantRegistryId]/[username]/page.tsx` — profile page
- `src/app/tenants/[tenantRegistryId]/[username]/calendar/page.tsx` — calendar page

**JSON-LD injection:** `src/app/tenants/[tenantRegistryId]/layout.tsx` generates a `<script type="application/ld+json">` block server-side from `seoConfig` and injects it into every public tenant page.

**Header navigation:** Gear dropdown in `Header.tsx` has an "SEO" link above "Cuenta" that navigates to `.../dashboard/seo`.

## Links

### Limit

All plans are capped at **5 links** per user. Enforced server-side in `AddLinkUseCase` (`src/application/use-cases/ManageLinksUseCase.ts`) and in the UI via `AddLinkForm` (`src/components/Links/AddLinkForm.tsx`), which hides the form and shows a message when the limit is reached.

### Social quick-add buttons

The dashboard (`dashboard/page.tsx`) shows per-network "Agregar X" buttons above `<LinkList>` when no link for that network is detected (via regex). Each button opens a dedicated modal:

| Network | Modal | Regex detection |
|---|---|---|
| WhatsApp | `AddWhatsappModal` | `/wa\.me\|api\.whatsapp\.com\|whatsapp\.com/i` |
| Instagram | `AddInstagramModal` | `/instagram\.com/i` |
| TikTok | `AddTiktokModal` | `/tiktok\.com/i` |

Modals call `addLink` from `useLinks` with a pre-formatted `{ title, url }`. The button disappears once the link exists.

### Social SVG icons

`src/components/Common/SocialIcons.tsx` exports:
- `WhatsappIcon`, `InstagramIcon`, `TiktokIcon` — branded SVG components
- `getSocialIcon(url)` — returns `{ Icon, color, label }` for a URL or `null` if no match

Used in `LinkItem.tsx` (dashboard list) and `PublicProfileClient.tsx` (public profile). Falls back to material-icons for non-matched URLs.

### Image crop upload

`src/components/Common/ImageCropUpload.tsx` — three-state component (drop zone → fullscreen crop modal → square preview). Used in `ProfileCard` for profile photo. Canvas util at `src/utils/getCroppedImg.ts`. Compresses output to WebP via `browser-image-compression`.

## Language

UI strings are in **Spanish**. There is no i18n library — all text is hardcoded.

## Support Tickets

Users can report bugs and submit suggestions from the Header settings dropdown under "Soporte y sugerencias", which navigates to `/dashboard/support`.

**Ticket types:** `error` | `suggestion`

**Ticket statuses:** `open` | `closed` | `solved` | `cancelled`

**Constraints (both server and client-enforced):**
- Only one open ticket per type per user
- Comments are only allowed on `open` tickets

**Firestore paths:**
- Tickets: `tenants/{tenantId}/users/{userId}/support_tickets/{ticketId}`
- Comments: `tenants/{tenantId}/users/{userId}/support_tickets/{ticketId}/comments/{commentId}`

**Admin notification:** New tickets send an email to `NEXT_SUPER_ADMINS_EMAILS` (comma-separated env var) using the tenant's email service (silently skipped if not configured).

**Error form fields:** title, description, device type (dropdown), free-text if "other", screenshot (ImageCropUpload), WhatsApp phone (InputPhone).

**Suggestion form fields:** title, description, screenshot (ImageCropUpload), WhatsApp phone (InputPhone).

**UI strings** are centralised in `src/components/Support/support.const.ts` for easy maintenance.

**Component tree:**
```
SupportPage
├── TicketWizard (multi-step: TicketTypeSelector → ErrorReportForm | SuggestionForm → success)
├── TicketList
└── TicketDetail
    └── CommentSection
```

**Key files:**
- Entity: `src/domain/entities/SupportTicket.ts`
- Repository interface: `src/domain/interfaces/ISupportTicketRepository.ts`
- Firestore repo: `src/infrastructure/repositories/FirestoreSupportTicketRepository.ts`
- Use cases: `src/application/use-cases/ManageSupportTicketsUseCase.ts`
- API routes: `src/app/api/support/`
- Hook: `src/hooks/useSupportTickets.ts`
- UI constants: `src/components/Support/support.const.ts`
- Dashboard page: `src/app/tenants/[tenantRegistryId]/u/admin/dashboard/support/page.tsx`

## Commands

```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn start        # Start production server
yarn lint         # Run ESLint
yarn test         # Run all tests (Vitest)
yarn test:watch   # Run tests in watch mode
```
