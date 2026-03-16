import { NextRequest, NextResponse } from "next/server";
import { logDebug, logError } from "@/lib/debug";
import { getSession, upsertSession } from "@/lib/session-store";
import { advanceSession, snapshotSession } from "@/lib/tutor-engine";
import { MessageRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MessageRequest;
    logDebug("api.session.message.request", {
      sessionId: body.sessionId,
      action: body.action ?? null,
      topicId: body.topicId ?? null,
      transcript: body.transcript ?? null,
    });

    if (!body.sessionId) {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    const session = getSession(body.sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    await advanceSession(session, body.transcript, body.action, body.topicId);
    upsertSession(session);
    logDebug("api.session.message.success", {
      sessionId: session.id,
      phase: session.phase,
      introStep: session.introStep,
      placementIndex: session.placementIndex,
      messageCount: session.messages.length,
    });

    return NextResponse.json({ session: snapshotSession(session) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The tutor could not process that turn right now.";

    logError("api.session.message.failure", error);

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
