function safeSerialize(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function logDebug(label: string, details?: unknown) {
  const timestamp = new Date().toISOString();

  if (typeof details === "undefined") {
    console.log(`[tota-debug] ${timestamp} ${label}`);
    return;
  }

  console.log(`[tota-debug] ${timestamp} ${label}\n${safeSerialize(details)}`);
}

export function logError(label: string, error: unknown, details?: unknown) {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);

  if (typeof details === "undefined") {
    console.error(`[tota-debug] ${timestamp} ${label}: ${message}`);
    return;
  }

  console.error(`[tota-debug] ${timestamp} ${label}: ${message}\n${safeSerialize(details)}`);
}
