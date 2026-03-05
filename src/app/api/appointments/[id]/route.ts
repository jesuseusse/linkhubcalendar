import { NextResponse } from "next/server";

// Permanent deletion of appointments is not supported.
// Use PUT /api/appointments/[id]/cancel to cancel an appointment and release its slot.
export async function DELETE() {
  return NextResponse.json(
    { error: "Use PUT /api/appointments/[id]/cancel to cancel an appointment" },
    { status: 405 }
  );
}
