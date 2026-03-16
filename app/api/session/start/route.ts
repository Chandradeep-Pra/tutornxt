import { NextResponse } from "next/server";
import { logDebug, logError } from "@/lib/debug";
import { upsertSession } from "@/lib/session-store";
import { createSession, snapshotSession } from "@/lib/tutor-engine";

export async function POST() {
  try {
    logDebug("api.session.start.request");
    const session = await createSession();
    upsertSession(session);
    logDebug("api.session.start.success", {
      sessionId: session.id,
      phase: session.phase,
    });
    return NextResponse.json({ session: snapshotSession(session) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The tutor could not start a new session right now.";

    logError("api.session.start.failure", error);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
