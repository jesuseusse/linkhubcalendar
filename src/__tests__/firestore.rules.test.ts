import { describe, beforeAll, afterAll, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'linkhubcalendar';
const RULES_PATH = resolve(__dirname, '../../firestore.rules');

const TENANT_ID = 'tenant-abc';
const USER_ID = 'user-123';
const HOSTNAME = 'example.com';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(RULES_PATH, 'utf8'),
    },
  });
}, 20_000);

afterAll(async () => {
  await testEnv.cleanup();
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function unauthDb() {
  return testEnv.unauthenticatedContext().firestore();
}

function authDb(uid = USER_ID) {
  return testEnv.authenticatedContext(uid).firestore();
}

// ─── tenant_registry ──────────────────────────────────────────────────────────

describe('tenant_registry/{hostname}', () => {
  const docPath = () => doc(unauthDb(), `tenant_registry/${HOSTNAME}`);
  const docPathAuth = () => doc(authDb(), `tenant_registry/${HOSTNAME}`);

  it('denies unauthenticated read', async () => {
    await assertFails(getDoc(docPath()));
  });

  it('denies authenticated read', async () => {
    await assertFails(getDoc(docPathAuth()));
  });

  it('denies unauthenticated write', async () => {
    await assertFails(setDoc(docPath(), { tenantId: TENANT_ID }));
  });

  it('denies authenticated write', async () => {
    await assertFails(setDoc(docPathAuth(), { tenantId: TENANT_ID }));
  });

  it('denies unauthenticated delete', async () => {
    await assertFails(deleteDoc(docPath()));
  });
});

// ─── tenant_registry/stripe_events ────────────────────────────────────────────

describe('tenant_registry/{hostname}/stripe_events/{eventId}', () => {
  const stripeDocPath = () =>
    doc(unauthDb(), `tenant_registry/${HOSTNAME}/stripe_events/evt_001`);
  const stripeDocPathAuth = () =>
    doc(authDb(), `tenant_registry/${HOSTNAME}/stripe_events/evt_001`);

  it('denies unauthenticated read', async () => {
    await assertFails(getDoc(stripeDocPath()));
  });

  it('denies authenticated read', async () => {
    await assertFails(getDoc(stripeDocPathAuth()));
  });

  it('denies unauthenticated write', async () => {
    await assertFails(setDoc(stripeDocPath(), { type: 'checkout.session.completed' }));
  });

  it('denies authenticated write', async () => {
    await assertFails(setDoc(stripeDocPathAuth(), { type: 'checkout.session.completed' }));
  });
});

// ─── tenants/{tenantId}/users/{userId} ────────────────────────────────────────

describe('tenants/{tenantId}/users/{userId}', () => {
  const userDocPath = () =>
    doc(unauthDb(), `tenants/${TENANT_ID}/users/${USER_ID}`);
  const userDocPathAuth = (uid = USER_ID) =>
    doc(authDb(uid), `tenants/${TENANT_ID}/users/${USER_ID}`);

  it('denies unauthenticated read', async () => {
    await assertFails(getDoc(userDocPath()));
  });

  it('denies authenticated read by owner', async () => {
    await assertFails(getDoc(userDocPathAuth()));
  });

  it('denies authenticated read by non-owner', async () => {
    await assertFails(getDoc(userDocPathAuth('other-user')));
  });

  it('denies unauthenticated write', async () => {
    await assertFails(setDoc(userDocPath(), { name: 'Test' }));
  });

  it('denies authenticated write by owner', async () => {
    await assertFails(setDoc(userDocPathAuth(), { name: 'Test' }));
  });

  it('denies authenticated write by non-owner', async () => {
    await assertFails(setDoc(userDocPathAuth('other-user'), { name: 'Test' }));
  });
});

// ─── tenants/{tenantId}/users/{userId}/appointments ───────────────────────────

describe('tenants/{tenantId}/users/{userId}/appointments/{docId}', () => {
  const slotDocPath = () =>
    doc(unauthDb(), `tenants/${TENANT_ID}/users/${USER_ID}/appointments/slot-1`);
  const apptDocPath = () =>
    doc(unauthDb(), `tenants/${TENANT_ID}/users/${USER_ID}/appointments/appt-1`);
  const slotDocPathAuth = (uid = USER_ID) =>
    doc(authDb(uid), `tenants/${TENANT_ID}/users/${USER_ID}/appointments/slot-1`);

  it('denies unauthenticated read of slot', async () => {
    await assertFails(getDoc(slotDocPath()));
  });

  it('denies unauthenticated read of appointment', async () => {
    await assertFails(getDoc(apptDocPath()));
  });

  it('denies authenticated read by owner', async () => {
    await assertFails(getDoc(slotDocPathAuth()));
  });

  it('denies authenticated read by visitor', async () => {
    await assertFails(getDoc(slotDocPathAuth('visitor-uid')));
  });

  it('denies unauthenticated write of slot', async () => {
    await assertFails(
      setDoc(slotDocPath(), { type: 'slot', date: '2026-05-01', booked: false }),
    );
  });

  it('denies unauthenticated write of appointment (booking)', async () => {
    await assertFails(
      addDoc(
        collection(unauthDb(), `tenants/${TENANT_ID}/users/${USER_ID}/appointments`),
        { type: 'appointment', name: 'Test', email: 'test@example.com' },
      ),
    );
  });

  it('denies authenticated write of appointment (booking)', async () => {
    await assertFails(
      addDoc(
        collection(
          authDb('visitor-uid'),
          `tenants/${TENANT_ID}/users/${USER_ID}/appointments`,
        ),
        { type: 'appointment', name: 'Test', email: 'test@example.com' },
      ),
    );
  });
});

// ─── tenants/{tenantId}/users/{userId}/leads ──────────────────────────────────

describe('tenants/{tenantId}/users/{userId}/leads/{docId}', () => {
  const leadDocPath = () =>
    doc(unauthDb(), `tenants/${TENANT_ID}/users/${USER_ID}/leads/lead-1`);
  const leadDocPathAuth = (uid = USER_ID) =>
    doc(authDb(uid), `tenants/${TENANT_ID}/users/${USER_ID}/leads/lead-1`);

  it('denies unauthenticated read', async () => {
    await assertFails(getDoc(leadDocPath()));
  });

  it('denies authenticated read by owner', async () => {
    await assertFails(getDoc(leadDocPathAuth()));
  });

  it('denies authenticated read by non-owner', async () => {
    await assertFails(getDoc(leadDocPathAuth('other-user')));
  });

  it('denies unauthenticated write (contact form)', async () => {
    await assertFails(
      setDoc(leadDocPath(), { name: 'Test', email: 'test@example.com', message: 'hi' }),
    );
  });

  it('denies authenticated write', async () => {
    await assertFails(
      setDoc(leadDocPathAuth('visitor-uid'), {
        name: 'Test',
        email: 'test@example.com',
        message: 'hi',
      }),
    );
  });
});

// ─── catch-all — arbitrary unknown collection ─────────────────────────────────

describe('catch-all: unknown collection', () => {
  it('denies unauthenticated read of unknown path', async () => {
    await assertFails(getDoc(doc(unauthDb(), 'unknown_collection/some-doc')));
  });

  it('denies authenticated write to unknown path', async () => {
    await assertFails(
      setDoc(doc(authDb(), 'unknown_collection/some-doc'), { data: true }),
    );
  });
});
