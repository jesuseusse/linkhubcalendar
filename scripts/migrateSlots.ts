/**
 * One-time migration: move calendarSlots arrays from User documents
 * into the appointments subcollection as type="slot" documents.
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json ts-node scripts/migrateSlots.ts
 *
 * After verifying data in Firestore, optionally clear calendarSlots arrays:
 *   DRY_RUN=false CLEAR_ARRAY=true ts-node scripts/migrateSlots.ts
 */

import * as admin from 'firebase-admin';

const DRY_RUN = process.env.DRY_RUN !== 'false';
const CLEAR_ARRAY = process.env.CLEAR_ARRAY === 'true';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function migrate() {
  console.log(`Starting slot migration (DRY_RUN=${DRY_RUN}, CLEAR_ARRAY=${CLEAR_ARRAY})`);

  const tenantsSnap = await db.collection('tenants').get();
  let totalMigrated = 0;

  for (const tenantDoc of tenantsSnap.docs) {
    const tenantId = tenantDoc.id;
    const usersSnap = await db.collection(`tenants/${tenantId}/users`).get();

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const data = userDoc.data();
      const slots: Array<{
        id: string;
        date: string;
        startTime: string;
        endTime: string;
        booked: boolean;
      }> = data.calendarSlots ?? [];

      if (slots.length === 0) continue;

      console.log(`  Migrating ${slots.length} slots for user ${userId} in tenant ${tenantId}`);

      const appointmentsCol = db.collection(`tenants/${tenantId}/users/${userId}/appointments`);
      const batch = db.batch();

      for (const slot of slots) {
        const slotRef = appointmentsCol.doc(slot.id);
        batch.set(slotRef, { type: 'slot', ...slot }, { merge: true });
      }

      if (CLEAR_ARRAY) {
        batch.update(userDoc.ref, { calendarSlots: admin.firestore.FieldValue.delete() });
      }

      if (!DRY_RUN) {
        await batch.commit();
      }

      totalMigrated += slots.length;
    }
  }

  console.log(`Migration complete. Total slots migrated: ${totalMigrated}${DRY_RUN ? ' (DRY RUN — no writes performed)' : ''}`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
