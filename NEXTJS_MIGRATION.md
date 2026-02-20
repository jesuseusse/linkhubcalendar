# Next.js Migration Guide — LinkHub

## Context

Convert the current React+Vite frontend and Express+MongoDB backend into a unified **Next.js App Router** application in `./nex`.

**Key decisions:**

- **App Router** (modern Next.js with `/app` directory)
- **Firestore** via `firebase-admin` as database (not MongoDB)
- **Firebase Auth** client-side only + `checkAuth()` for API route token verification
- **Custom domain multi-tenancy** (server-side middleware)
- **Preserve** services + repository architecture pattern

---

## Directory Structure

```
nex/
├── middleware.ts                          # Multi-tenant domain resolution
├── next.config.ts
├── package.json
├── .env.local
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (providers wrapper)
│   │   ├── globals.css                   # Tailwind CSS
│   │   ├── page.tsx                      # / (Landing)
│   │   ├── admin/
│   │   │   ├── login/page.tsx            # u/admin/login
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx            # Auth guard
│   │   │       ├── page.tsx              # u/admin/dashboard
│   │   │       └── dates/page.tsx        # u/admin/dashboard/dates
│   │   ├── [username]/
│   │   │   ├── page.tsx                  # /:username (public profile, SSR)
│   │   │   └── calendar/page.tsx         # /:username/calendar (SSR)
│   │   ├── t/                            # Tenant pages (custom domain rewrites)
│   │   │   ├── page.tsx                  # Custom domain -> public profile
│   │   │   └── calendar/page.tsx         # Custom domain -> calendar
│   │   └── api/                          # All API Route Handlers
│   │       ├── auth/signup/route.ts
│   │       ├── auth/login/route.ts
│   │       ├── profile/route.ts          # GET, PUT
│   │       ├── profile/username/route.ts # PUT
│   │       ├── profile/contact-form/route.ts  # PUT
│   │       ├── profile/theme/route.ts    # PUT
│   │       ├── profile/photo/route.ts    # POST (multipart)
│   │       ├── profile/domain/route.ts   # PUT, DELETE (NEW: custom domain)
│   │       ├── links/route.ts            # POST
│   │       ├── links/[linkId]/route.ts   # PUT, DELETE
│   │       ├── calendar/toggle/route.ts  # PUT
│   │       ├── calendar/slots/route.ts   # POST
│   │       ├── calendar/slots/[slotId]/route.ts         # DELETE
│   │       ├── calendar/slots/[slotId]/release/route.ts # PUT
│   │       ├── appointments/route.ts     # GET (paginated)
│   │       ├── appointments/[id]/route.ts               # DELETE
│   │       ├── appointments/[id]/confirm/route.ts       # PUT
│   │       ├── appointments/[id]/release-slot/route.ts  # PUT
│   │       ├── leads/route.ts            # GET
│   │       └── u/[username]/
│   │           ├── route.ts              # GET public profile
│   │           ├── calendar/route.ts     # GET public calendar
│   │           ├── appointments/route.ts # POST book appointment
│   │           └── contact/route.ts      # POST submit lead
│   │
│   ├── lib/
│   │   ├── firebase/client.ts            # Firebase client SDK init
│   │   ├── firebase/admin.ts             # Firebase Admin SDK singleton
│   │   ├── auth/checkAuth.ts             # Verify Firebase ID tokens
│   │   └── tenant/resolveTenant.ts       # Domain -> username lookup
│   │
│   ├── domain/                           # From backend (copy)
│   │   ├── entities/User.ts              # Remove `password` field
│   │   ├── entities/Appointment.ts
│   │   ├── entities/Lead.ts
│   │   ├── dtos/AuthDtos.ts
│   │   └── interfaces/
│   │       ├── IUserRepository.ts
│   │       ├── IAppointmentRepository.ts
│   │       ├── ILeadRepository.ts
│   │       └── IFileStorageService.ts    # Modified: Buffer instead of Multer.File
│   │
│   ├── application/use-cases/            # From backend (copy, drop SignUp/Login)
│   │   ├── mappers.ts
│   │   ├── GetProfileUseCase.ts
│   │   ├── UpdateProfileUseCase.ts
│   │   ├── UploadPhotoUseCase.ts         # Modified file param type
│   │   ├── UpdateUsernameUseCase.ts
│   │   ├── UpdateThemeUseCase.ts
│   │   ├── ToggleContactFormUseCase.ts
│   │   ├── ToggleCalendarUseCase.ts
│   │   ├── ManageCalendarSlotsUseCase.ts
│   │   ├── GetPublicProfileUseCase.ts
│   │   ├── ManageLinksUseCase.ts
│   │   ├── BookAppointmentUseCase.ts
│   │   ├── GetAppointmentsUseCase.ts
│   │   ├── ManageAppointmentsUseCase.ts
│   │   ├── SubmitLeadUseCase.ts
│   │   └── GetLeadsUseCase.ts
│   │
│   ├── infrastructure/
│   │   ├── repositories/
│   │   │   ├── FirestoreUserRepository.ts      # NEW: implements IUserRepository
│   │   │   ├── FirestoreAppointmentRepository.ts
│   │   │   └── FirestoreLeadRepository.ts
│   │   ├── services/
│   │   │   └── FirebaseStorageService.ts       # NEW: implements IFileStorageService
│   │   └── container.ts                        # DI: instantiate repos + use cases
│   │
│   ├── context/
│   │   ├── AuthContext.tsx               # "use client" - Firebase Auth
│   │   └── I18nContext.tsx               # "use client" - copied, guarded
│   │
│   ├── services/
│   │   ├── apiClient.ts                  # Fetch wrapper with Firebase ID token
│   │   ├── ApiProfileService.ts          # Implements IProfileService via API
│   │   ├── ApiLinkService.ts             # Implements ILinkService via API
│   │   ├── ApiAuthService.ts             # Implements IAuthService via API
│   │   └── serviceFactory.ts             # Exports singleton instances
│   │
│   ├── hooks/                            # From frontend (adapt imports)
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useLinks.ts
│   │   └── useAppointments.ts
│   │
│   ├── components/                       # From frontend (add "use client", adapt routing)
│   │   ├── Appointments/
│   │   │   ├── AppointmentBookingForm.tsx
│   │   │   └── AppointmentList.tsx
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── Calendar/
│   │   │   ├── CalendarManager.tsx
│   │   │   └── CalendarToggle.tsx
│   │   ├── Common/
│   │   │   ├── Header.tsx
│   │   │   ├── RequirePermission.tsx
│   │   │   └── UpgradeModal.tsx
│   │   ├── Contact/
│   │   │   └── ContactForm.tsx
│   │   ├── Leads/
│   │   │   └── LeadList.tsx
│   │   ├── Links/
│   │   │   ├── AddLinkForm.tsx
│   │   │   ├── LinkItem.tsx
│   │   │   └── LinkList.tsx
│   │   ├── Profile/
│   │   │   ├── ContactFormToggle.tsx
│   │   │   ├── EditProfileForm.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── PublicProfileLink.tsx
│   │   │   └── UsernameForm.tsx
│   │   └── Theme/
│   │       └── ThemeCustomizer.tsx
│   │
│   ├── dtos/                             # From frontend (copy verbatim)
│   │   ├── auth.dto.ts
│   │   ├── link.dto.ts
│   │   └── user.dto.ts
│   │
│   ├── permissions/plans.ts              # From frontend (copy verbatim)
│   ├── i18n/translations.ts              # From frontend (copy verbatim)
│   └── utils/                            # From frontend (copy verbatim)
│       ├── planExpiration.ts
│       ├── platformIcons.ts
│       └── profilePhoto.ts
```

---

## Step-by-Step Implementation

### Step 1: Project Scaffolding

```bash
npx create-next-app@latest nex --typescript --tailwind --eslint --app --src-dir
cd nex
npm install firebase firebase-admin date-fns react-day-picker
```

Create `.env.local`:

```env
# Firebase Client (public - accessible in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_DOMAIN=

# Firebase Admin (server-only - never exposed to browser)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Set up `globals.css` with Tailwind imports + body font from current `frontend/src/index.css`.

---

### Step 2: Firebase Configuration

**`src/lib/firebase/client.ts`** — Firebase client SDK init:

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app =
	getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

**`src/lib/firebase/admin.ts`** — Firebase Admin SDK singleton:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const adminApp =
	getApps().length === 0
		? initializeApp({
				credential: cert({
					projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
					clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
					privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
						/\\n/g,
						'\n'
					)
				})
			})
		: getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
export { adminApp };
```

---

### Step 3: Auth Utilities

**`src/lib/auth/checkAuth.ts`** — Verify Firebase ID tokens in API routes:

```typescript
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function checkAuth(req: NextRequest): Promise<{ userId: string }> {
	const header = req.headers.get('authorization');
	if (!header || !header.startsWith('Bearer ')) {
		throw new Error('Authentication required');
	}
	const token = header.split(' ')[1];
	const decoded = await adminAuth.verifyIdToken(token);
	return { userId: decoded.uid };
}
```

---

### Step 4: Domain Layer (copy from backend)

**Source:** `backend/src/domain/`

| File                                   | Action                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `entities/User.ts`                     | Copy, make `password` optional (`password?: string`)                                         |
| `entities/Appointment.ts`              | Copy verbatim                                                                                |
| `entities/Lead.ts`                     | Copy verbatim                                                                                |
| `dtos/AuthDtos.ts`                     | Copy, remove password-related DTOs                                                           |
| `interfaces/IUserRepository.ts`        | Copy verbatim                                                                                |
| `interfaces/IAppointmentRepository.ts` | Copy verbatim                                                                                |
| `interfaces/ILeadRepository.ts`        | Copy verbatim                                                                                |
| `interfaces/IFileStorageService.ts`    | Modify: `Express.Multer.File` → `{ buffer: Buffer; originalName: string; mimeType: string }` |

**Modified `IFileStorageService.ts`:**

```typescript
export interface FileInput {
	buffer: Buffer;
	originalName: string;
	mimeType: string;
}

export interface IFileStorageService {
	saveFile(file: FileInput): Promise<string>;
	deleteFile(filePath: string): Promise<void>;
}
```

---

### Step 5: Application Layer (copy from backend)

**Source:** `backend/src/application/use-cases/`

| File                            | Action                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `mappers.ts`                    | Copy verbatim                                             |
| `GetProfileUseCase.ts`          | Copy verbatim                                             |
| `UpdateProfileUseCase.ts`       | Copy verbatim                                             |
| `UpdateUsernameUseCase.ts`      | Copy verbatim                                             |
| `UpdateThemeUseCase.ts`         | Copy verbatim                                             |
| `ToggleContactFormUseCase.ts`   | Copy verbatim                                             |
| `ToggleCalendarUseCase.ts`      | Copy verbatim                                             |
| `ManageCalendarSlotsUseCase.ts` | Copy verbatim                                             |
| `GetPublicProfileUseCase.ts`    | Copy verbatim                                             |
| `ManageLinksUseCase.ts`         | Copy verbatim                                             |
| `BookAppointmentUseCase.ts`     | Copy verbatim                                             |
| `GetAppointmentsUseCase.ts`     | Copy verbatim                                             |
| `ManageAppointmentsUseCase.ts`  | Copy verbatim                                             |
| `SubmitLeadUseCase.ts`          | Copy verbatim                                             |
| `GetLeadsUseCase.ts`            | Copy verbatim                                             |
| `UploadPhotoUseCase.ts`         | Modify file param type to match new `IFileStorageService` |
| `SignUpUseCase.ts`              | **DROP** (Firebase Auth handles signup)                   |
| `LoginUseCase.ts`               | **DROP** (Firebase Auth handles login)                    |

---

### Step 6: Infrastructure Layer (WRITE NEW)

These are entirely new — Firestore implementations replacing MongoDB.

**`FirestoreUserRepository.ts`** — Implements `IUserRepository` (18 methods):

- Collection: `users`, document ID = Firebase Auth UID
- `findByUsername()`: `.where('username', '==', username)` query
- `addLink/updateLink/deleteLink`: read-modify-write on `links` array
- `addCalendarSlot/deleteCalendarSlot/updateCalendarSlotBooked`: read-modify-write on `calendarSlots` array
- `create()`: creates user doc (no password field needed)
- Reference existing Firestore patterns from `frontend/src/firebase/FirebaseProfileService.ts`

**`FirestoreAppointmentRepository.ts`** — Implements `IAppointmentRepository`:

- Collection: `appointments`
- Pagination via `orderBy('createdAt', 'desc')` + `limit()` + `startAfter()`

**`FirestoreLeadRepository.ts`** — Implements `ILeadRepository`:

- Collection: `leads`
- `findByUserId()` with `orderBy('createdAt', 'desc')`

**`FirebaseStorageService.ts`** — Implements `IFileStorageService`:

- Upload to Firebase Storage bucket at path `profilePhotos/{uid}/{filename}`
- Return public download URL
- Delete by storage path

**`container.ts`** — Dependency injection container:

```typescript
import { FirestoreUserRepository } from './repositories/FirestoreUserRepository';
import { FirestoreAppointmentRepository } from './repositories/FirestoreAppointmentRepository';
import { FirestoreLeadRepository } from './repositories/FirestoreLeadRepository';
import { FirebaseStorageService } from './services/FirebaseStorageService';
// ... import all use cases

const userRepo = new FirestoreUserRepository();
const appointmentRepo = new FirestoreAppointmentRepository();
const leadRepo = new FirestoreLeadRepository();
const storageService = new FirebaseStorageService();

export const container = {
	getProfileUseCase: new GetProfileUseCase(userRepo),
	updateProfileUseCase: new UpdateProfileUseCase(userRepo),
	uploadPhotoUseCase: new UploadPhotoUseCase(userRepo, storageService),
	updateUsernameUseCase: new UpdateUsernameUseCase(userRepo),
	updateThemeUseCase: new UpdateThemeUseCase(userRepo),
	toggleContactFormUseCase: new ToggleContactFormUseCase(userRepo),
	toggleCalendarUseCase: new ToggleCalendarUseCase(userRepo),
	addCalendarSlotUseCase: new AddCalendarSlotUseCase(userRepo),
	deleteCalendarSlotUseCase: new DeleteCalendarSlotUseCase(userRepo),
	releaseCalendarSlotUseCase: new ReleaseCalendarSlotUseCase(userRepo),
	getPublicCalendarUseCase: new GetPublicCalendarUseCase(userRepo),
	getPublicProfileUseCase: new GetPublicProfileUseCase(userRepo),
	addLinkUseCase: new AddLinkUseCase(userRepo),
	updateLinkUseCase: new UpdateLinkUseCase(userRepo),
	deleteLinkUseCase: new DeleteLinkUseCase(userRepo),
	bookAppointmentUseCase: new BookAppointmentUseCase(userRepo, appointmentRepo),
	getAppointmentsUseCase: new GetAppointmentsUseCase(appointmentRepo),
	deleteAppointmentUseCase: new DeleteAppointmentUseCase(
		appointmentRepo,
		userRepo
	),
	confirmAppointmentUseCase: new ConfirmAppointmentUseCase(appointmentRepo),
	releaseAppointmentSlotUseCase: new ReleaseAppointmentSlotUseCase(
		appointmentRepo,
		userRepo
	),
	submitLeadUseCase: new SubmitLeadUseCase(userRepo, leadRepo),
	getLeadsUseCase: new GetLeadsUseCase(leadRepo)
};
```

---

### Step 7: Client-Side Services (WRITE NEW)

**`apiClient.ts`** — Fetch wrapper that attaches Firebase ID token:

```typescript
import { auth } from '@/lib/firebase/client';

export async function apiClient(path: string, options: RequestInit = {}) {
	const token = await auth.currentUser?.getIdToken();
	const headers: Record<string, string> = {
		...(options.headers as Record<string, string>)
	};
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}
	if (!(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}
	const res = await fetch(path, { ...options, headers });
	if (!res.ok) {
		const error = await res.json().catch(() => ({ error: 'Request failed' }));
		throw new Error(error.error || 'Request failed');
	}
	return res.json();
}
```

**`ApiProfileService.ts`** — Implements `IProfileService` by calling `/api/*` endpoints via `apiClient`.

**`ApiLinkService.ts`** — Implements `ILinkService` via API calls.

**`ApiAuthService.ts`** — Implements `IAuthService`:

- `login()`: calls Firebase client `signInWithEmailAndPassword`, then fetches profile via API
- `signUp()`: calls Firebase client `createUserWithEmailAndPassword`, then `POST /api/auth/signup` to create Firestore user doc

**`serviceFactory.ts`** — Exports singleton instances of all API services.

---

### Step 8: Context & Hooks (adapt from frontend)

**`AuthContext.tsx`** — Adapt from `frontend/src/context/AuthContextFirebase.tsx`:

- Add `"use client"` at top
- Import from `@/lib/firebase/client` instead of `../firebase/config`
- On auth state change: get token, fetch user via `GET /api/profile` (instead of direct Firestore read from client)

**`I18nContext.tsx`** — Copy from frontend:

- Add `"use client"` at top
- Guard `localStorage` with `typeof window !== 'undefined'`

**Hooks** — Copy all 4 hooks (`useAuth`, `useProfile`, `useLinks`, `useAppointments`):

- Update import paths only
- They already use service interfaces so they work with the new API services unchanged

---

### Step 9: Components (adapt from frontend)

Copy all components from `frontend/src/components/`. For **each component**:

1. Add `"use client"` directive at the top
2. Replace `react-router-dom` imports:
   - `Link` from `react-router-dom` → `Link` from `next/link` (change `to` prop to `href`)
   - `useParams` → `useParams` from `next/navigation`
   - `useNavigate` → `useRouter` from `next/navigation` (`navigate(path)` becomes `router.push(path)`)
3. Replace `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
4. Replace direct Firebase service imports with API service imports from `@/services/serviceFactory`

---

### Step 10: Pages

| Route                     | Type          | Source                          | Notes                                                            |
| ------------------------- | ------------- | ------------------------------- | ---------------------------------------------------------------- |
| `/`                       | Client        | `LandingPage.tsx`               | Replace `useNavigate` with `useRouter`                           |
| `u/admin/login`           | Client        | `AuthPage.tsx`                  | Redirect to dashboard if authenticated                           |
| `u/admin/dashboard`       | Client        | `DashboardPage.tsx`             | Protected via layout auth guard                                  |
| `u/admin/dashboard/dates` | Client        | `AppointmentsDashboardPage.tsx` | Protected                                                        |
| `/[username]`             | Server+Client | `PublicProfilePage.tsx`         | SSR: fetch profile server-side for SEO, pass to client component |
| `/[username]/calendar`    | Server+Client | `PublicCalendarPage.tsx`        | SSR: fetch data, client handles booking                          |
| `/t` & `/t/calendar`      | Server+Client | Reuse `[username]` components   | Username from `searchParams` (set by middleware)                 |

**Root layout** (`layout.tsx`):

```tsx
// Wrap children with a client <Providers> component
import { Providers } from '@/context/Providers';

export default function RootLayout({ children }) {
	return (
		<html lang='en'>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
```

**Dashboard layout** (`/admin/dashboard/layout.tsx`):

- Client component that checks auth context
- Redirects to `u/admin/login` if unauthenticated
- Shows loading indicator while checking auth state

---

### Step 11: API Route Handlers

**Pattern for protected routes:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth/checkAuth';
import { container } from '@/infrastructure/container';

export async function GET(req: NextRequest) {
	try {
		const { userId } = await checkAuth(req);
		const result = await container.getProfileUseCase.execute(userId);
		return NextResponse.json(result);
	} catch (error: any) {
		const status = error.message === 'Authentication required' ? 401 : 400;
		return NextResponse.json({ error: error.message }, { status });
	}
}
```

**Protected routes** (call `checkAuth` first):
| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/api/profile` | GET | `getProfileUseCase` |
| `/api/profile` | PUT | `updateProfileUseCase` |
| `/api/profile/username` | PUT | `updateUsernameUseCase` |
| `/api/profile/contact-form` | PUT | `toggleContactFormUseCase` |
| `/api/profile/theme` | PUT | `updateThemeUseCase` |
| `/api/profile/photo` | POST | `uploadPhotoUseCase` (parse `req.formData()`) |
| `/api/profile/domain` | PUT/DELETE | Manage custom domain (NEW) |
| `/api/links` | POST | `addLinkUseCase` |
| `/api/links/[linkId]` | PUT | `updateLinkUseCase` |
| `/api/links/[linkId]` | DELETE | `deleteLinkUseCase` |
| `/api/calendar/toggle` | PUT | `toggleCalendarUseCase` |
| `/api/calendar/slots` | POST | `addCalendarSlotUseCase` |
| `/api/calendar/slots/[slotId]` | DELETE | `deleteCalendarSlotUseCase` |
| `/api/calendar/slots/[slotId]/release` | PUT | `releaseCalendarSlotUseCase` |
| `/api/appointments` | GET | `getAppointmentsUseCase` |
| `/api/appointments/[id]/confirm` | PUT | `confirmAppointmentUseCase` |
| `/api/appointments/[id]/release-slot` | PUT | `releaseAppointmentSlotUseCase` |
| `/api/appointments/[id]` | DELETE | `deleteAppointmentUseCase` |
| `/api/leads` | GET | `getLeadsUseCase` |

**Public routes** (no auth):
| Endpoint | Method | Use Case |
|----------|--------|----------|
| `/api/u/[username]` | GET | `getPublicProfileUseCase` |
| `/api/u/[username]/calendar` | GET | `getPublicCalendarUseCase` |
| `/api/u/[username]/appointments` | POST | `bookAppointmentUseCase` |
| `/api/u/[username]/contact` | POST | `submitLeadUseCase` |

**Auth routes** (special):
| Endpoint | Method | Logic |
|----------|--------|-------|
| `/api/auth/signup` | POST | Verify token via `checkAuth`, create Firestore user doc via `userRepository.create()` |
| `/api/auth/login` | POST | Optional — verify token, return user profile |

**File upload handling** — Use Web API `req.formData()` (not Multer):

```typescript
export async function POST(req: NextRequest) {
	const { userId } = await checkAuth(req);
	const formData = await req.formData();
	const file = formData.get('photo') as File;
	const buffer = Buffer.from(await file.arrayBuffer());
	const result = await container.uploadPhotoUseCase.execute(userId, {
		buffer,
		originalName: file.name,
		mimeType: file.type
	});
	return NextResponse.json(result);
}
```

---

### Step 12: Multi-Tenant Domain Resolution

**Firestore `domains` collection:**

```
domains/{domainName}  ->  {
  username: string,
  userId: string,
  verified: boolean,
  createdAt: Timestamp
}
```

**`middleware.ts`** (root of `nex/`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export const config = {
	matcher: ['/((?!api|_next|favicon.ico).*)']
};

export async function middleware(req: NextRequest) {
	const hostname = req.headers.get('host') || '';
	const mainDomain = process.env.NEXT_PUBLIC_DOMAIN || '';

	// Skip if main domain
	if (hostname === mainDomain || hostname === `www.${mainDomain}`) {
		return NextResponse.next();
	}

	// Custom domain — resolve tenant
	const domainDoc = await adminDb.collection('domains').doc(hostname).get();

	if (!domainDoc.exists || !domainDoc.data()?.verified) {
		return NextResponse.rewrite(new URL('/404', req.url));
	}

	const { username } = domainDoc.data()!;
	const path = req.nextUrl.pathname;

	// Rewrite to /t route with username param
	const url = req.nextUrl.clone();
	url.pathname = path === '/' ? '/t' : `/t${path}`;
	url.searchParams.set('username', username);
	return NextResponse.rewrite(url);
}
```

**`src/lib/tenant/resolveTenant.ts`** — Utility with in-memory caching (5-min TTL):

```typescript
import { adminDb } from '@/lib/firebase/admin';

const cache = new Map<string, { username: string; expiresAt: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export async function resolveTenant(domain: string): Promise<string | null> {
	const cached = cache.get(domain);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.username;
	}

	const doc = await adminDb.collection('domains').doc(domain).get();
	if (!doc.exists || !doc.data()?.verified) {
		return null;
	}

	const username = doc.data()!.username;
	cache.set(domain, { username, expiresAt: Date.now() + TTL });
	return username;
}
```

---

### Step 13: Domain Management Endpoint (NEW)

**`PUT /api/profile/domain`** — Authenticated user sets custom domain:

- Validates domain format
- Creates/updates entry in `domains` collection
- Sets `verified: false` initially
- Returns DNS instructions (CNAME record to point to the app)

**`DELETE /api/profile/domain`** — Removes custom domain mapping

---

## Key Modifications Summary

| What                                  | Change                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `User` entity                         | Make `password` optional (Firebase Auth manages it)                                  |
| `IFileStorageService`                 | `Express.Multer.File` → `{ buffer: Buffer; originalName: string; mimeType: string }` |
| `UploadPhotoUseCase`                  | Adapt file param type                                                                |
| Drop `SignUpUseCase`, `LoginUseCase`  | Firebase Auth replaces JWT-based auth                                                |
| Drop `IAuthService` (backend JWT one) | Replaced by `checkAuth` utility                                                      |
| All components                        | Add `"use client"`, replace react-router-dom with next/navigation                    |
| `import.meta.env.VITE_*`              | → `process.env.NEXT_PUBLIC_*`                                                        |
| File uploads                          | `req.formData()` (Web API) instead of Multer                                         |
| Reserved usernames                    | Block `t`, `admin`, `api` as usernames                                               |

---

## Gotchas & Notes

1. **No JWT or bcrypt needed** — Firebase Auth handles token issuance and verification
2. **Route priority** — `/admin/*` and `/t` are static and take priority over `[username]`, so those can't be used as usernames
3. **Firestore security rules** — Lock down client writes since all mutations go through API routes (firebase-admin bypasses rules)
4. **`react-day-picker` CSS** — Verify `import 'react-day-picker/style.css'` works in Next.js (should work with App Router)
5. **Edge runtime** — Middleware uses `runtime = 'nodejs'` to allow `firebase-admin` usage
6. **Auth in public pages** — Public profile/calendar pages don't need auth; they fetch by username server-side

---

## Verification Checklist

- [ ] Firebase Admin connection works (read a test doc)
- [ ] Sign up flow: creates Firebase Auth user + Firestore doc + redirects to dashboard
- [ ] Login flow: authenticates + loads dashboard with user data
- [ ] Dashboard CRUD: links, profile, calendar slots, appointments, leads, theme
- [ ] Public profile: `/:username` renders SSR with correct data and theme
- [ ] Public calendar: booking flow works end-to-end
- [ ] Contact form: submits lead linked to correct user
- [ ] File upload: photo stored in Firebase Storage, URL saved in Firestore
- [ ] Custom domain: middleware resolves domain → renders tenant profile
- [ ] All API routes return correct status codes and error messages
