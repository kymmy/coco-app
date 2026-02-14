import { sendEventReminders } from "@/lib/actions";
import { NextResponse } from "next/server";

// GET /api/reminders — triggers reminder check
// Can be called by a cron job (e.g. every hour)
export async function GET() {
  const result = await sendEventReminders();
  return NextResponse.json(result);
}
