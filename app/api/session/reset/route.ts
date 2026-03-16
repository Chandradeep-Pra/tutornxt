import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSession, upsertSession } from "@/lib/session-store";
import { createSession, snapshotSession } from "@/lib/tutor-engine";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { sessionId?: string };

    if (body.sessionId && getSession(body.sessionId)) {
      deleteSession(body.sessionId);
    }

    const session = await createSession();
    upsertSession(session);

    return NextResponse.json({ session: snapshotSession(session) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The tutor could not reset the session right now.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
