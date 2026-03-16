import { SessionData } from "@/lib/types";

const sessions = new Map<string, SessionData>();

export function upsertSession(session: SessionData) {
  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}
