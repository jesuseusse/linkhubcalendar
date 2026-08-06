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

Stripe is integrated per-tenant. Each tenant registry document in Firestore stores its own Stripe config (`IStripeConfig`: `secretKey`, `publishableKey`, `webhookSecret`, `proPriceId`, `proAnnualPriceId?`, `customerPortalLink?`).

**Plans & pricing:**
- Monthly Pro: `proPriceId` — 200 MXN/mes
- Annual Pro: `proAnnualPriceId` — 900 MXN/año (50% off vs 1,800 MXN)
- Both plans include a **90-day free trial** applied programmatically in the checkout session (`subscription_data.trial_period_days: 90`). Do NOT configure trial in Stripe product itself.

**API routes:**
- `POST /api/stripe/checkout` — creates a Stripe Checkout session; accepts `{ interval: 'month' | 'year' }` in body (defaults to `'month'`); returns 400 if `interval=year` but `proAnnualPriceId` is not configured
- `POST /api/stripe/cancel` — cancels subscription at period end (reads `user.stripeSubscriptionId`)
- `POST /api/stripe/webhook` — handles Stripe events (idempotent via `saveStripeEvent`); domain resolved from `?tenant=hostname` URL param (primary) or `event.data.object.metadata.domain` (fallback)

**Webhook events handled:**

| Event | Behavior |
|---|---|
| `checkout.session.completed` | Upgrade user to pro; propagate metadata + interval to subscription |
| `customer.subscription.updated` | cancel_at_period_end → flag; unpaid → downgrade; past_due → flag; active → renew (checks both monthly and annual priceIds) |
| `customer.subscription.deleted` | Downgrade to free, clear subscription flags |
| `invoice.payment_succeeded` | Renew pro plan (checks both monthly and annual priceIds) |

**User entity subscription fields:**
- `stripeSubscriptionId?: string`
- `billingInterval?: 'month' | 'year'` — set when plan is upgraded; tracks monthly vs annual
- `subscriptionCancelAtPeriodEnd?: boolean`
- `subscriptionStatus?: string` (e.g. `'past_due'`)

**UI:**
- `src/components/Billing/BillingClient.tsx` + `dashboard/billing/page.tsx` — shows "Plan Anual · $900/año" or "Plan Mensual · $200/mes" depending on `user.billingInterval`
- `src/components/Common/UpgradeModal.tsx` — monthly/annual toggle; both enabled; "3 MESES GRATIS" badge; benefit list; disclaimer
- `src/components/Billing/ProBanner.tsx` — full-width promotional banner shown to `plan === 'free'` users at the top of the dashboard; dismissable per session via `sessionStorage`; opens `UpgradeModal` on CTA click

### Webhook error handling & alerting

Two independent problems are solved here: (1) picking the *correct* month/year price deterministically, and (2) never letting a processing failure disappear silently behind Stripe's "200 received."

**Month vs. year resolution — single source of truth:**
- `src/lib/stripe/resolveProInterval.ts` exports `resolveProInterval(priceId, stripeConfig): 'month' | 'year' | null`. Every handler in the webhook derives `billingInterval` from the **live Stripe price ID** via this function — never from `subscription.metadata.interval`, which is set once at checkout time and can drift if a tenant's price IDs are reconfigured later. A `null` result (price matches neither `proPriceId` nor `proAnnualPriceId`) is always treated as a config/data error, never a silent no-op — every checkout this app creates uses exactly one of those two IDs (see `/api/stripe/checkout`), so a mismatch can only mean drift.

**Typed failure classification** (`src/app/api/stripe/webhook/webhookErrors.ts`):
- `WebhookProcessingError` carries a `reason` (`MISSING_METADATA` | `PRICE_ID_MISMATCH` | `USER_NOT_FOUND` | `MISSING_SUBSCRIPTION_DATA` | `STRIPE_API_ERROR` | `UNEXPECTED_ERROR`) and a `retryable` flag.
- `callStripeApi(operation, fn)` wraps every `stripe.subscriptions.*` call and reclassifies failures: a `resource_missing` `StripeInvalidRequestError` is non-retryable (the ID will never resolve), everything else (network errors, Stripe 5xx, rate limits) is retryable.
- Any error that isn't a `WebhookProcessingError` (e.g. a Firestore write failing) defaults to retryable — we can't rule out transience, so Stripe gets to retry while a human is alerted in parallel.

**HTTP status returned to Stripe — retryable vs. not:**
- **Retryable failures → 5xx.** Stripe retries with exponential backoff for up to 3 days; worth it only when re-delivery might actually succeed (a transient Stripe/Firestore blip).
- **Non-retryable failures → 200.** Re-processing the *same* event can never fix a price-ID mismatch or a user that doesn't exist — returning 2xx stops Stripe from wasting 3 days of retries on something only a human can resolve. This is why "Stripe shows the webhook was delivered" no longer implies "the user's plan was actually updated."
- Pre-signature-verification failures (`INVALID_JSON`, `TENANT_NOT_FOUND`, `STRIPE_NOT_CONFIGURED`, `SIGNATURE_MISMATCH`) are unchanged — a malformed/unsigned request is never trusted enough to alert on.
- `handleSubscriptionDeleted` and missing-metadata on `customer.subscription.updated` deliberately do **not** throw — the desired end state (no active pro access) is already true or harmless to skip, so there's nothing actionable for a human. `invoice.upcoming` reminder-email failures are caught and logged only — a failed reminder isn't billing-critical and must never trigger Stripe retries.

**Observability — every event's outcome is persisted, not just logged:**
- `container.tenantRegistryRepo.recordStripeEventOutcome(hostname, eventId, outcome)` merges `{ status: 'processed' | 'failed', reason?, retryable?, message? }` onto the same `tenant_registry/{hostname}/stripe_events/{eventId}` doc that `saveStripeEvent` writes. Check this doc first when a customer reports a plan mismatch — no more grepping server logs.

**Alert emails on processing failure:**
- `NEXT_STRIPE_ALERT_EMAILS` (comma-separated, same convention as `NEXT_SUPER_ADMINS_EMAILS`) — recipients notified whenever a webhook event fails to process, retryable or not.
- Sent via the *affected tenant's own* configured email service (Resend/SES), same pattern as `sendSupportTicketNotification` — there is no platform-level email account to fall back to. If the tenant has no email service configured, the alert is silently skipped (nothing more we can do).
- Fire-and-forget (`.catch(() => {})`) — alert delivery can never block or fail the Stripe response.
- Template: `getStripeWebhookErrorTemplate()` in `emailTemplates.ts`; interface: `IEmailSenderService.sendStripeWebhookErrorNotification`.

## Auth — Password Reset

Tenant-branded password reset flow that avoids exposing Firebase URLs in emails.

**Flow:**
1. User clicks "¿Olvidaste tu contraseña?" on the login page → `ForgotPasswordForm` renders
2. User submits email → `POST /api/auth/password-reset` (always returns `{ sent: true }` regardless of outcome — prevents user enumeration)
3. Server: `adminAuth.tenantManager().authForTenant(tenantId).generatePasswordResetLink(email)` — extracts `oobCode` from the returned Firebase URL
4. Branded email is sent via tenant's Resend/SES service with a link to `https://{tenant-domain}/u/admin/login?oobCode=xxx`
5. User clicks link → login page detects `oobCode` in URL → `ResetPasswordForm` renders
6. User submits new password → `confirmPasswordReset(auth, oobCode, newPassword)` (Firebase client SDK)
7. Success → redirects to login with "Contraseña restablecida." banner

**Security guarantees:**
- API always returns 200 — email existence never revealed
- `oobCode` is one-time-use, expires per Firebase settings (default 1 hour)
- Tenant isolation: all Admin SDK calls are scoped via `authForTenant(tenantId)`

**Key files:**
- API route: `src/app/api/auth/password-reset/route.ts`
- UI components: `src/components/Auth/ForgotPasswordForm.tsx`, `src/components/Auth/ResetPasswordForm.tsx`
- Login page (4 modes: login/signup/forgot-password/reset-password): `src/app/tenants/[tenantRegistryId]/u/admin/login/page.tsx`
- Email template: `getPasswordResetTemplate()` in `src/infrastructure/services/emailTemplates.ts`
- Hook: `completePasswordReset` in `src/hooks/useAuth.ts`
- Client SDK method: `confirmPasswordReset` in `src/services/ApiAuthService.ts`

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
| Stripe webhook processing failed | `NEXT_STRIPE_ALERT_EMAILS` | `defaultStripeWebhookErrorTemplate` | `POST /api/stripe/webhook` (see [Webhook error handling & alerting](#webhook-error-handling--alerting)) |

**Pattern** (appointments and contact form): The API route calls `resolveTenantRegistry` to get the full registry, builds `emailSenderService` + `emailConfig` inside a `try/catch` (silently skips email if not configured), then constructs the use case ad-hoc (not from container) with those deps. The use case fires `sendXxxNotification(...).catch(() => {})` after saving to Firestore, so email failures never break the user flow.

**Interface:** `IEmailSenderService` (`src/domain/interfaces/IEmailSenderService.ts`) — all implementations must implement:
- `sendVerificationEmail`
- `sendAppointmentNotification`
- `sendUpcomingRenewalEmail`
- `sendContactNotification`
- `sendSupportTicketNotification`
- `sendStripeWebhookErrorNotification`
- `sendCampaignEmail`
- `sendPasswordResetEmail`

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

## Calendar Schedule System

The calendar uses an **inverted exception model**: instead of creating individual slot documents for every available time, users define a weekly recurring template once, then only mark exceptions (disabled dates or specific disabled slots).

### Data model (on User document)

- `weeklySchedule?: WeeklySchedule | null` — the weekly template
- `scheduleExceptions?: ScheduleException[]` — dates with overrides

```typescript
interface DaySchedule {
  startTime: string;          // "09:00"
  endTime: string;            // "18:00"
  durationMinutes: number;    // 30 | 60 | 90 | 120 | custom
  excludedStartTimes?: string[]; // template-level removed slots
}
interface WeeklySchedule {
  days: number[];             // day-of-week indices (0=Sun…6=Sat)
  sameForAllDays: boolean;
  defaultSchedule?: DaySchedule;
  perDaySchedule?: Partial<Record<number, DaySchedule>>;
}
interface ScheduleException {
  date: string;               // "YYYY-MM-DD"
  disabledSlotTimes?: string[]; // absent = full day disabled
}
```

### Slot generation

`src/lib/utils/scheduleGenerator.ts` — pure utility shared between API routes and client-side preview:
- `generateSlotsForDay(schedule: DaySchedule): string[]` — returns start times
- `generateSlotsForMonth(weeklySchedule, year, month, exceptions, bookedStartTimes): CalendarSlotDto[]`

### Admin flow

1. "Gestionar horarios" link in the dashboard Calendar section → `/dashboard/schedule`
2. No `weeklySchedule` → 5-step stepper: select days → same schedule? → configure → preview → save
3. Has `weeklySchedule` → monthly calendar view; click any active day → ExceptionModal to disable whole day or specific slots
4. Buttons: "Eliminar todos los horarios" (set schedule to null), "Reconfigurar horarios" (reopens the stepper prefilled with the current schedule via `weeklyScheduleToDraft()` — editing an already-valid schedule never requires re-entering every day from scratch)
5. Draft persisted in `localStorage` under `linkhub_schedule_draft` key; an in-progress draft there always wins over prefilling from the saved schedule, so a page refresh mid-wizard never discards unsaved edits

**Step components:** `src/components/Calendar/Schedule/` — `StepDaySelector`, `StepSameSchedule`, `StepDefaultSchedule`, `StepPerDaySchedule`, `StepPreview`, `DayScheduleForm`, `SlotPreview`, `ScheduleStepper`

**Per-day validation ("Siguiente" gating):** `StepDefaultSchedule` and `StepPerDaySchedule` validate the *effective* schedule per day — `effectiveDaySchedule()` in `scheduleTypes.ts`, which falls back to `DEFAULT_DAY_SCHEDULE` exactly like the form's own display does. A day the user never interacted with is not an error; only `startTime >= endTime` or a non-positive duration blocks continuing, and always with a visible reason (`validateDaySchedule()` — inline message under the offending day via `DayScheduleForm`'s `error` prop, plus a "Corrige el horario de: …" summary and a `title` tooltip on the disabled button). Previously the per-day step required an explicit `perDaySchedules[day]` entry to exist, which blocked "Siguiente" on any untouched day even when its (displayed) default values were perfectly valid.

**Per-day backfill on save:** `draftToWeeklySchedule()` writes an explicit `DaySchedule` for every selected day, even ones the user never touched — `getDaySchedule()` in `scheduleGenerator.ts` has no fallback for a missing `perDaySchedule` entry (it returns `null`, i.e. zero bookable slots), so an untouched day must never be persisted as a gap.

**Calendar components:** `src/components/Calendar/ScheduleCalendar.tsx`, `ExceptionModal.tsx`

**Admin page:** `src/app/tenants/[tenantRegistryId]/u/admin/dashboard/schedule/page.tsx`

### Public calendar

`PublicCalendarClient.tsx` fetches one month at a time via `GET /api/u/{username}/calendar?month=YYYY-MM`. Month navigation buttons ("‹ Anterior" / "Siguiente ›") trigger a new fetch. Loading spinner shown during fetch. Booking sends `{ date, startTime, endTime }` for schedule-based users (detected via `hasWeeklySchedule` on `PublicCalendarDto`), or `{ slotId }` for old slot-doc users (backward compat).

**Slot visibility:** Both available and booked slots are returned. Booked slots carry `booked: true` on `CalendarSlotDto`. The client renders them as greyed-out rows labeled "No disponible" (not clickable, no booking form). Day highlights on the mini-calendar only appear for days with at least one available slot. The "No hay horarios disponibles este mes" message appears only when all slots are booked or none exist.

**SSR + API route dual path:** The server component (`calendar/page.tsx`) calls `GetPublicCalendarUseCase.execute(tenantId, username)` for the initial HTML load, which now also handles `weeklySchedule` users (generates the current month's slots server-side, includes booked ones). Month navigation after initial load uses the API route `GET /api/u/[username]/calendar?month=YYYY-MM` directly from the client.

### API routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET/PUT` | `/api/calendar/schedule` | Get or save `weeklySchedule` |
| `PUT` | `/api/calendar/exceptions` | Replace full `scheduleExceptions` array |
| `DELETE` | `/api/calendar/exceptions/[date]` | Remove one date's exception |
| `GET` | `/api/u/[username]/calendar?month=YYYY-MM` | Generate slots for the month (or fallback to old slot-doc query) |
| `POST` | `/api/u/[username]/appointments` | Dual-path: `slotId` → old flow; `{date,startTime,endTime}` → new atomic booking |

### Atomic booking (new model)

`bookScheduleSlotAtomically` in `FirestoreAppointmentRepository` uses a deterministic document ID `${yyyymmdd}_${hhmm}` (e.g. `20260720_0900`) in a Firestore transaction. If the doc already exists → throws "Slot no disponible" (prevents double booking without pre-created slot documents).

### Backward compatibility

Users without `weeklySchedule` continue using the old slot-doc system. All routes check `user.weeklySchedule` and fall back gracefully. `ModalCalendarManager` and `CalendarManager` components are kept but no longer wired from the dashboard.

### Migration script

`scripts/migrateCalendarToSchedule.ts` — infers `weeklySchedule` from the first 7 days of existing slot documents, then records missing slots as `scheduleExceptions`. Idempotent (skips users who already have `weeklySchedule`).

```bash
npx tsx scripts/migrateCalendarToSchedule.ts [--tenantId=<id>] [--dryRun]
```

## Gallery

Pro users can upload up to **10 photos** displayed as a horizontal scroll carousel on their public profile page (after the links section).

**Permissions:** `GALLERY_MANAGE` — enabled for `pro` and `team` plans.

**Data model** (stored on User Firestore document):
- `galleryEnabled: boolean` — whether the gallery is visible on the public profile
- `galleryPhotos: GalleryPhoto[]` — array of `{ id, url, order }`, max 10 items

**Firebase Storage path:** `{tenantId}/gallery/{userId}/{timestamp}.webp`

**Admin flow:** Dashboard → Galería section (toggle + "Gestionar galería" link) → `/dashboard/gallery` page → upload, drag-to-reorder, delete photos.

**Public profile:** Carousel with CSS scroll-snap. Clicking a photo opens a fullscreen lightbox with prev/next navigation and keyboard support (Escape, ArrowLeft, ArrowRight).

**Component tree:**
```
GalleryManager (admin)
├── Toggle switch (galleryEnabled)
├── @dnd-kit/sortable grid of SortablePhoto items
│   └── Delete button per item
└── ImageCropUpload (add new photo)

GalleryCarousel (public profile)
├── Scroll-snap row of photo tiles
├── Dot indicators
└── Lightbox (fullscreen + prev/next + counter)
```

**Key files:**
- Entity field: `src/domain/entities/User.ts` — `GalleryPhoto`, `galleryEnabled`, `galleryPhotos`
- Use cases: `src/application/use-cases/ManageGalleryUseCase.ts`
- API routes: `src/app/api/gallery/` (POST upload, DELETE `[photoId]`, PUT `reorder/`, PUT `toggle/`)
- Hook: `src/hooks/useProfile.ts` — `uploadGalleryPhoto`, `deleteGalleryPhoto`, `reorderGalleryPhotos`, `toggleGallery`
- Components: `src/components/Gallery/`
- Dashboard page: `src/app/tenants/[tenantRegistryId]/u/admin/dashboard/gallery/page.tsx`
- UI strings: `src/components/Gallery/gallery.const.ts`

**Firestore undefined guard:** Same pattern as support tickets — `Object.fromEntries` filter in repo methods; conditional spread in use cases.

## Super Admin Panel

Accessible only to emails listed in `NEXT_SUPER_ADMINS_EMAILS` (comma-separated env var). The panel is intentionally at a non-obvious route to reduce discoverability.

**Routes:**
- `/dashboard/console/hub/` — stats dashboard (total users, paid users)
- `/dashboard/console/hub/users/` — registered user list with plan, links, dates, sorting, pagination (5 at a time), and email export
- `/dashboard/console/hub/tickets/` — all tenant tickets with filters and detail modal

**Access control:** All API routes call `checkSuperAdmin(req)` which wraps `checkAuth` and additionally validates the caller's email against the allow-list. Non-admins get 403; client pages redirect to `/dashboard/` on 403.

**Users list features:** `createdAt` and `updatedAt` columns; clickable column headers for client-side sort (asc/desc); server-side cursor pagination (100 users per batch via `/api/super-admin/users/paginated`, "Cargar más" button appends next batch); server-side plan filter dropdown (free/pro/team/all — `plan` query param, requires Firestore composite index `plan ASC + createdAt DESC` on `users` collection group, defined in `firestore.indexes.json`); 32px profile photo thumbnail per row with initial-letter fallback; "Exportar correos" modal with comma-separated email list paginated 1000 at a time with a clipboard copy button.

**Ticket filters (client-side):** type (error | suggestion | all), email substring search, sort order (newest/oldest).

**Ticket detail modal:** Reuses `CommentSection` component. Supports status transitions and adding comments (admin is the commenter). `ALLOWED_TRANSITIONS` in `TicketDetailModal.tsx` is intentionally wider than the user-facing version (admin can also transition `closed → solved`).

**Header badge:** Super admin pages pass `badge="SUPER ADMIN"` to `<Header>`. The `badge` prop is optional; regular dashboard pages are unaffected.

**Key files:**
- Auth guard: `src/lib/auth/checkSuperAdmin.ts`
- Use cases: `src/application/use-cases/SuperAdminUseCases.ts`
- API routes: `src/app/api/super-admin/`
- Client service: `src/services/ApiSuperAdminService.ts`
- Hook: `src/hooks/useSuperAdmin.ts`
- Components: `src/components/SuperAdmin/`
- Pages: `src/app/tenants/[tenantRegistryId]/u/admin/dashboard/console/hub/`

## Email Campaigns

Super admins can send bulk marketing emails to tenant users from the campaign hub at `/dashboard/console/hub/campaigns/`.

**Firestore paths:**
- Campaigns: `tenants/{tenantId}/campaigns/{campaignId}`
- Clicks: `tenants/{tenantId}/campaigns/{campaignId}/clicks/{clickId}`

**Link tracking:**
- Before sending, all `href` attributes in the HTML body are replaced server-side with tracking URLs
- Tracking token: `base64url(JSON.stringify({ c: campaignId, t: tenantId, e: email, u: originalUrl }))`
- Public redirect (no auth required): `GET /api/track?r=<token>` — records click in Firestore then 302 redirects to original URL. Only `http:` / `https:` URLs are allowed; others redirect to `/`
- Tracking utility: `src/lib/campaign/trackingUrl.ts` — `injectTrackingLinks`, `encodeTrackingToken`, `decodeTrackingToken`, `buildTrackingUrl`

**Send architecture:**
- MVP: synchronous per-recipient loop in the API route. Practical up to ~100 recipients (Vercel function timeout)
- `SendCampaignUseCase` is constructed ad-hoc per request with tenant email config (same pattern as `BookAppointmentUseCase`)
- Email send failures per recipient are collected; `failedCount` is returned to caller. Campaign is always marked `sent` for audit purposes
- Limit: 200 recipients per campaign (enforced server-side in use case)

**Recipient selection:**
- Tab A: cursor-paginated tenant user list with checkboxes (10/page via `GET /api/super-admin/users/paginated`)
- Tab B: raw textarea for comma/newline-separated custom emails

**Key files:**
- Entity: `src/domain/entities/Campaign.ts`
- Repository interface: `src/domain/interfaces/ICampaignRepository.ts`
- Firestore repo: `src/infrastructure/repositories/FirestoreCampaignRepository.ts`
- Use cases: `src/application/use-cases/CampaignUseCases.ts` (`SendCampaignUseCase`, `GetCampaignsPaginatedUseCase`, `GetCampaignDetailUseCase`)
- SuperAdmin use cases: `GetUsersPaginatedUseCase` added to `src/application/use-cases/SuperAdminUseCases.ts`
- Tracking utility: `src/lib/campaign/trackingUrl.ts`
- API routes: `src/app/api/super-admin/campaigns/` (GET list, POST send), `src/app/api/super-admin/campaigns/[campaignId]/` (GET detail), `src/app/api/super-admin/users/paginated/` (GET), `src/app/api/track/` (GET, public)
- Hook additions: `src/hooks/useSuperAdmin.ts` — campaign list, compose, recipient user picker state
- Components: `src/components/SuperAdmin/CampaignList.tsx`, `src/components/SuperAdmin/CampaignComposer.tsx`
- UI strings: `src/components/SuperAdmin/superAdmin.const.ts` (`CAMPAIGNS_LABELS`, `COMPOSER_LABELS`)
- Dashboard page: `src/app/tenants/[tenantRegistryId]/u/admin/dashboard/console/hub/campaigns/page.tsx`

## Commands

```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn start        # Start production server
yarn lint         # Run ESLint
yarn test         # Run all tests (Vitest)
yarn test:watch   # Run tests in watch mode
```
