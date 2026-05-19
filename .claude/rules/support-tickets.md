# Support Tickets Feature Rules

## UI Strings
All user-facing strings (labels, placeholders, help text, status labels, messages) for the Support
feature MUST live in `src/components/Support/support.const.ts`.
Do NOT hardcode strings inside component files.

## One Open Ticket Per Type Constraint
- A user may only have ONE open ticket of type `error` and ONE of type `suggestion` simultaneously.
- This constraint is enforced **server-side** in `CreateSupportTicketUseCase` via `findOpenByType`.
- The client (`useSupportTickets.hasOpenTicketOfType`) also enforces it to disable the UI option,
  but the server check is the authoritative gate.

## Comments Only on Open Tickets
- Comments may only be added when `ticket.status === 'open'`.
- Enforced server-side in `AddCommentUseCase` — throws if ticket is not open.
- Enforced client-side in `CommentSection` — input is hidden/disabled for any other status.
- Both checks must remain in sync.

## Ticket Status Values
Valid values: `'open'`, `'closed'`, `'solved'`, `'cancelled'`.
These are defined in `src/domain/entities/SupportTicket.ts`.
Do not add new statuses without updating `ALLOWED_TRANSITIONS` in `TicketDetail.tsx`,
`TICKET_STATUS_LABELS` and `TICKET_STATUS_COLORS` in `support.const.ts`.

## Screenshot Upload
- Screenshots are uploaded to Firebase Storage at path:
  `{tenantId}/support-screenshots/{userId}/{timestamp}.webp`
- Upload is handled in the `POST /api/support` route using `FirebaseStorageService`.
- The URL is then stored on the ticket document as `screenshotUrl`.

## Admin Email Notifications
- New ticket notifications are sent to `process.env.NEXT_SUPER_ADMINS_EMAILS` (comma-separated list).
- Notifications use the tenant's email service (Resend or SES) via `createEmailSenderService`.
- If no email service is configured for the tenant, the notification is silently skipped
  (fire-and-forget pattern with `.catch(() => {})`).
- Do NOT throw errors or block ticket creation when email fails.

## Firestore Paths
- Tickets:  `tenants/{tenantId}/users/{userId}/support_tickets/{ticketId}`
- Comments: `tenants/{tenantId}/users/{userId}/support_tickets/{ticketId}/comments/{commentId}`

## Tests
- All new use cases must have a corresponding smoke test file in
  `src/application/use-cases/ManageSupportTicketsUseCase.test.ts`.
- Component logic tests live in `src/components/Support/SupportPage.test.tsx`.
- Do not use full React component mounting for smoke tests; test the core logic directly.

## Language
- All code, comments, and documentation: English.
- All user-facing UI strings: Spanish (Latin American, friendly tone).
