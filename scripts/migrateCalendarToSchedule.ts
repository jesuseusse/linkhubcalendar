/**
 * One-time migration: infer a weekly schedule from existing slot documents
 * and write weeklySchedule + scheduleExceptions to each user document.
 *
 * Algorithm per user:
 *   1. Fetch all type='slot' documents, sorted by date ascending
 *   2. Take the first 7 distinct calendar days as the pivot window
 *   3. From the pivot days, derive day-of-week → DaySchedule mappings
 *   4. Determine sameForAllDays (all patterns identical)
 *   5. Generate expected slots from earliest slot date for 90 days
 *   6. Slots missing from Firestore become scheduleExceptions
 *   7. Write to Firestore (or log if --dryRun)
 *
 * Run with:
 *   npx tsx scripts/migrateCalendarToSchedule.ts [--tenantId=<id>] [--dryRun]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account JSON.
 */

import * as admin from 'firebase-admin';

// ---------------------------------------------------------------------------
// Flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dryRun');
const tenantIdArg = args.find(a => a.startsWith('--tenantId='))?.split('=')[1];

// ---------------------------------------------------------------------------
// Firebase init
// ---------------------------------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ---------------------------------------------------------------------------
// Types (mirrors domain entities without importing Next.js modules)
// ---------------------------------------------------------------------------
interface DaySchedule {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  excludedStartTimes?: string[];
}

interface WeeklySchedule {
  days: number[];
  sameForAllDays: boolean;
  defaultSchedule?: DaySchedule;
  perDaySchedule?: Partial<Record<number, DaySchedule>>;
}

interface ScheduleException {
  date: string;
  disabledSlotTimes?: string[];
}

interface SlotDoc {
  date: string;
  startTime: string;
  endTime: string;
  booked?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function generateSlotsForDay(schedule: DaySchedule): string[] {
  const startMin = timeToMinutes(schedule.startTime);
  const endMin = timeToMinutes(schedule.endTime);
  const slots: string[] = [];
  for (let t = startMin; t + schedule.durationMinutes <= endMin; t += schedule.durationMinutes) {
    const startTime = minutesToTime(t);
    if (!schedule.excludedStartTimes?.includes(startTime)) {
      slots.push(startTime);
    }
  }
  return slots;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function inferDaySchedule(slots: SlotDoc[]): DaySchedule | null {
  if (slots.length === 0) return null;
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const startTime = sorted[0].startTime;
  const lastSlot = sorted[sorted.length - 1];
  const endTime = lastSlot.endTime;
  // Infer duration from first slot
  const durationMinutes = timeToMinutes(lastSlot.endTime) - timeToMinutes(lastSlot.startTime);
  if (durationMinutes <= 0) return null;
  return { startTime, endTime, durationMinutes };
}

function schedulesEqual(a: DaySchedule, b: DaySchedule): boolean {
  return a.startTime === b.startTime && a.endTime === b.endTime && a.durationMinutes === b.durationMinutes;
}

// ---------------------------------------------------------------------------
// Core migration per user
// ---------------------------------------------------------------------------
async function migrateUser(
  tenantId: string,
  userId: string,
  userSnap: admin.firestore.DocumentSnapshot
): Promise<'skipped' | 'migrated' | 'no_slots'> {
  const userData = userSnap.data() ?? {};

  // Already migrated
  if (userData.weeklySchedule) {
    console.log(`  [skip] user ${userId} already has weeklySchedule`);
    return 'skipped';
  }

  // Fetch all slot documents
  const slotsSnap = await db
    .collection(`tenants/${tenantId}/users/${userId}/appointments`)
    .where('type', '==', 'slot')
    .orderBy('date', 'asc')
    .orderBy('startTime', 'asc')
    .get();

  if (slotsSnap.empty) {
    console.log(`  [skip] user ${userId} has no slot documents`);
    return 'no_slots';
  }

  const allSlots: SlotDoc[] = slotsSnap.docs.map(d => d.data() as SlotDoc);

  // Collect the first 7 distinct dates
  const distinctDates: string[] = [];
  for (const slot of allSlots) {
    if (!distinctDates.includes(slot.date)) {
      distinctDates.push(slot.date);
      if (distinctDates.length === 7) break;
    }
  }

  // Group slots by date, then by day-of-week
  const slotsByDate: Record<string, SlotDoc[]> = {};
  for (const slot of allSlots) {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
    slotsByDate[slot.date].push(slot);
  }

  // Build day-of-week → DaySchedule from pivot dates
  const perDowSchedule: Partial<Record<number, DaySchedule>> = {};
  const activeDays: number[] = [];

  for (const date of distinctDates) {
    const dow = new Date(date + 'T00:00:00').getDay();
    if (!activeDays.includes(dow)) activeDays.push(dow);
    const sched = inferDaySchedule(slotsByDate[date] ?? []);
    if (sched && !perDowSchedule[dow]) {
      perDowSchedule[dow] = sched;
    }
  }

  if (activeDays.length === 0) return 'no_slots';

  // Check if all day schedules are identical
  const schedules = activeDays.map(d => perDowSchedule[d]).filter(Boolean) as DaySchedule[];
  const allSame = schedules.length > 1 && schedules.every(s => schedulesEqual(s, schedules[0]));

  const weeklySchedule: WeeklySchedule = {
    days: activeDays.sort(),
    sameForAllDays: allSame || schedules.length === 1,
    ...(allSame || schedules.length === 1
      ? { defaultSchedule: schedules[0] }
      : { perDaySchedule: perDowSchedule }),
  };

  // Generate expected slots for 90 days from the earliest slot date
  const earliestDate = distinctDates[0];
  const expectedByDate: Record<string, Set<string>> = {};

  for (let i = 0; i < 90; i++) {
    const date = addDays(earliestDate, i);
    const dow = new Date(date + 'T00:00:00').getDay();
    if (!weeklySchedule.days.includes(dow)) continue;

    const daySchedule = weeklySchedule.sameForAllDays
      ? weeklySchedule.defaultSchedule
      : weeklySchedule.perDaySchedule?.[dow];
    if (!daySchedule) continue;

    const slots = generateSlotsForDay(daySchedule);
    if (slots.length > 0) {
      expectedByDate[date] = new Set(slots);
    }
  }

  // Build booked slot times from actual Firestore slot docs
  const actualByDate: Record<string, Set<string>> = {};
  for (const slot of allSlots) {
    if (!actualByDate[slot.date]) actualByDate[slot.date] = new Set();
    actualByDate[slot.date].add(slot.startTime);
  }

  // Find exceptions: dates that should have slots but some/all are missing
  const scheduleExceptions: ScheduleException[] = [];
  for (const [date, expected] of Object.entries(expectedByDate)) {
    const actual = actualByDate[date];
    if (!actual) {
      // All slots missing → full-day exception
      scheduleExceptions.push({ date });
      continue;
    }
    const missing = [...expected].filter(t => !actual.has(t));
    if (missing.length === expected.size) {
      // All missing → full-day exception
      scheduleExceptions.push({ date });
    } else if (missing.length > 0) {
      // Some missing → partial exception
      scheduleExceptions.push({ date, disabledSlotTimes: missing });
    }
  }

  console.log(`  [migrate] user ${userId}: days=${weeklySchedule.days}, sameForAll=${weeklySchedule.sameForAllDays}, exceptions=${scheduleExceptions.length}`);

  if (!DRY_RUN) {
    const userRef = db.doc(`tenants/${tenantId}/users/${userId}`);
    await userRef.update({
      weeklySchedule,
      scheduleExceptions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    console.log('    weeklySchedule:', JSON.stringify(weeklySchedule, null, 2));
    console.log(`    scheduleExceptions (${scheduleExceptions.length}):`, JSON.stringify(scheduleExceptions.slice(0, 3)));
  }

  return 'migrated';
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function migrate() {
  console.log(`\nCalendar migration (DRY_RUN=${DRY_RUN}${tenantIdArg ? `, tenant=${tenantIdArg}` : ''})\n`);

  let tenantIds: string[];

  if (tenantIdArg) {
    tenantIds = [tenantIdArg];
  } else {
    const tenantsSnap = await db.collection('tenants').get();
    tenantIds = tenantsSnap.docs.map(d => d.id);
  }

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalNoSlots = 0;

  for (const tenantId of tenantIds) {
    console.log(`Tenant: ${tenantId}`);
    const usersSnap = await db.collection(`tenants/${tenantId}/users`).get();

    for (const userDoc of usersSnap.docs) {
      const outcome = await migrateUser(tenantId, userDoc.id, userDoc);
      if (outcome === 'migrated') totalMigrated++;
      else if (outcome === 'skipped') totalSkipped++;
      else totalNoSlots++;
    }
  }

  console.log(`\nDone. migrated=${totalMigrated}, skipped=${totalSkipped}, no_slots=${totalNoSlots}`);
  if (DRY_RUN) console.log('(Dry run — no Firestore writes were made)');
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
