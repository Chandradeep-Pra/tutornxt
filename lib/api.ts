import { MessageRequest, SessionResponse, SessionSnapshot } from "@/lib/types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseResponse(response: Response): Promise<SessionSnapshot> {
  if (!response.ok) {
    const fallback = "Something went wrong while talking to the tutor.";
    let message = fallback;

    try {
      const data = (await response.json()) as { error?: string };
      message = data.error ?? fallback;
    } catch {
      message = fallback;
    }

    throw new ApiError(message, response.status);
  }

  const data = (await response.json()) as SessionResponse;
  return data.session;
}

export async function startSession() {
  const response = await fetch("/api/session/start", {
    method: "POST",
  });

  return parseResponse(response);
}

export async function getSession(sessionId: string) {
  const response = await fetch(`/api/session/state?sessionId=${encodeURIComponent(sessionId)}`);
  return parseResponse(response);
}

export async function sendMessage(payload: MessageRequest) {
  const response = await fetch("/api/session/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function resetSession(sessionId: string) {
  const response = await fetch("/api/session/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId }),
  });

  return parseResponse(response);
}
