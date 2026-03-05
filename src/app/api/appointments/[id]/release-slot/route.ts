import { NextResponse } from "next/server";

// Replaced by PUT /api/appointments/[id]/cancel which cancels the appointment and releases the slot.
export async function PUT() {
  return NextResponse.json(
    { error: "Use PUT /api/appointments/[id]/cancel instead" },
    { status: 410 }
  );
}
