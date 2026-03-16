import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";
import { snapshotSession } from "@/lib/tutor-engine";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ session: snapshotSession(session) });
}
