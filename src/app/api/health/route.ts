import { NextResponse } from 'next/server';
import { adminDb, adminApp } from '@/lib/firebase/admin';

// All API routes with their supported HTTP methods.
// Dynamic segments use :param notation for readability.
const ROUTES = [
  { path: '/api/health',                                      methods: ['GET'] },
  { path: '/api/auth/login',                                  methods: ['POST'] },
  { path: '/api/auth/signup',                                 methods: ['POST'] },
  { path: '/api/auth/verify-email',                           methods: ['POST'] },
  { path: '/api/auth/tenant-discovery',                       methods: ['GET'] },
  { path: '/api/profile',                                     methods: ['GET', 'PUT'] },
  { path: '/api/profile/photo',                               methods: ['POST'] },
  { path: '/api/profile/username',                            methods: ['PUT'] },
  { path: '/api/profile/theme',                               methods: ['PUT'] },
  { path: '/api/profile/contact-form',                        methods: ['PUT'] },
  { path: '/api/profile/domain',                              methods: ['PUT'] },
  { path: '/api/profile/downgrade',                           methods: ['POST'] },
  { path: '/api/profile/seo',                                 methods: ['GET', 'PUT'] },
  { path: '/api/links',                                       methods: ['POST'] },
  { path: '/api/links/:linkId',                               methods: ['PUT', 'DELETE'] },
  { path: '/api/calendar/toggle',                             methods: ['PUT'] },
  { path: '/api/calendar/slots',                              methods: ['GET', 'POST'] },
  { path: '/api/calendar/slots/:slotId',                      methods: ['DELETE'] },
  { path: '/api/calendar/slots/:slotId/release',              methods: ['PUT'] },
  { path: '/api/appointments',                                methods: ['GET'] },
  { path: '/api/appointments/:id',                            methods: ['GET'] },
  { path: '/api/appointments/:id/cancel',                     methods: ['PUT'] },
  { path: '/api/appointments/:id/confirm',                    methods: ['PUT'] },
  { path: '/api/appointments/:id/reschedule',                 methods: ['PUT'] },
  { path: '/api/appointments/:id/release-slot',               methods: ['PUT'] },
  { path: '/api/leads',                                       methods: ['GET'] },
  { path: '/api/leads/:leadId',                               methods: ['PATCH'] },
  { path: '/api/stripe/checkout',                             methods: ['POST'] },
  { path: '/api/stripe/cancel',                               methods: ['POST'] },
  { path: '/api/stripe/webhook',                              methods: ['POST'] },
  { path: '/api/u/:username',                                 methods: ['GET'] },
  { path: '/api/u/:username/calendar',                        methods: ['GET'] },
  { path: '/api/u/:username/appointments',                    methods: ['POST'] },
  { path: '/api/u/:username/contact',                         methods: ['POST'] },
];

async function checkFirestore(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    // Lightweight read — list up to 1 document from a known collection
    await adminDb.collection('tenant_registry').limit(1).get();
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Firestore error'
    };
  }
}

export async function GET() {
  const startedAt = new Date().toISOString();

  const firebaseAdminOk = adminApp !== null;

  const [firestoreResult] = await Promise.all([
    checkFirestore(),
  ]);

  const allOk = firebaseAdminOk && firestoreResult.ok;

  const body = {
    status: allOk ? 'ok' : 'degraded',
    timestamp: startedAt,
    dependencies: {
      firebaseAdmin: {
        ok: firebaseAdminOk,
        ...(firebaseAdminOk ? {} : { error: 'Firebase Admin not initialized — check env vars' })
      },
      firestore: firestoreResult
    },
    routes: ROUTES
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
