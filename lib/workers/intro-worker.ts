import { generateText, generateTextOrThrow } from "@/lib/gemini";
import { TUTOR_NAME } from "@/lib/brand";
import { logDebug } from "@/lib/debug";

export interface IntroDecision {
  mode: "candidate" | "confirmed" | "retry" | "spell";
  candidate?: string;
  reply: string;
}

function normalizeName(raw: string) {
  return raw
    .trim()
    .replace(/[^a-zA-Z\s'-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function extractSpelledName(transcript: string) {
  const letters = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (letters.length < 3) {
    return undefined;
  }

  if (!letters.every((letter) => /^[a-z]$/.test(letter))) {
    return undefined;
  }

  return normalizeName(letters.join(""));
}

export function extractObviousNameCandidate(transcript: string) {
  const cleaned = transcript
    .replace(/\b(hi|hello|hey|toota|tota)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const spelledName = extractSpelledName(cleaned);
  if (spelledName) {
    return spelledName;
  }

  const patterns = [
    /\bmy name is ([a-zA-Z][a-zA-Z'-]{1,30}(?:\s+[a-zA-Z][a-zA-Z'-]{1,30})?)\b/i,
    /\bi am ([a-zA-Z][a-zA-Z'-]{1,30}(?:\s+[a-zA-Z][a-zA-Z'-]{1,30})?)\b/i,
    /\bit'?s ([a-zA-Z][a-zA-Z'-]{1,30}(?:\s+[a-zA-Z][a-zA-Z'-]{1,30})?)\b/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      return normalizeName(match[1]);
    }
  }

  const singleToken = cleaned.match(/^[a-zA-Z][a-zA-Z'-]{1,30}$/);
  if (singleToken?.[0]) {
    return normalizeName(singleToken[0]);
  }

  const twoWordName = cleaned.match(/^[a-zA-Z][a-zA-Z'-]{1,30}\s+[a-zA-Z][a-zA-Z'-]{1,30}$/);
  if (twoWordName?.[0]) {
    return normalizeName(twoWordName[0]);
  }

  return undefined;
}

export function isClearConfirmation(transcript: string) {
  return /^\s*(yes|yeah|yep|correct|right|that's right|that is right|yes that's right|yes that is right|yeah that's right|yeah that is right|yeah it is right|yes it is right|it is right)\s*[.!]?\s*$/i.test(
    transcript,
  );
}

export function isClearRejection(transcript: string) {
  return /\b(no|nope|wrong|not exactly|that'?s not right|that is not right)\b/i.test(transcript);
}

function normalizeWelcomeMessage(raw: string) {
  let text = raw.replace(/\s+/g, " ").trim();

  if (!text || text.split(" ").length < 4) {
    return `Hi, I'm ${TUTOR_NAME}, your English coach. What's your name?`;
  }

  text = text.replace(/\bPip\b/gi, TUTOR_NAME);
  const hasNameQuestion = /what(?:'s| is) your name\??/i.test(text) || /may i know your name\??/i.test(text);
  const endsAbruptly = /\b(it|i|my|your|and|so|because|hello)$/i.test(text) || !/[.?!]$/.test(text);

  if (endsAbruptly) {
    return `Hi, I'm ${TUTOR_NAME}, your English coach. What's your name?`;
  }

  if (!hasNameQuestion) {
    return `${text.replace(/[.?!]*$/, ".")} What's your name?`;
  }

  return text;
}

function parseIntroDecision(raw: string | null, allowedModes: IntroDecision["mode"][]) {
  if (!raw) {
    return null;
  }

  const modeMatch = raw.match(/MODE:\s*(candidate|confirmed|retry|spell)/i)?.[1]?.toLowerCase();
  if (!modeMatch || !allowedModes.includes(modeMatch as IntroDecision["mode"])) {
    return null;
  }

  const candidateRaw = raw.match(/CANDIDATE:\s*(.+)/i)?.[1]?.trim();
  const reply = raw.match(/REPLY:\s*(.+)/i)?.[1]?.trim();
  const candidate = candidateRaw && candidateRaw.toUpperCase() !== "NONE" ? normalizeName(candidateRaw) : undefined;

  return {
    mode: modeMatch as IntroDecision["mode"],
    candidate,
    reply,
  };
}

function defaultIntroReply(mode: IntroDecision["mode"], candidate?: string) {
  if (mode === "spell") {
    return "I want to get it right. Can you spell your name for me, one letter at a time?";
  }

  if (mode === "candidate" && candidate) {
    return `I heard ${candidate}. Is that right?`;
  }

  if (mode === "confirmed") {
    return `Great! Thanks for confirming.`;
  }

  return "I did not catch that clearly. Could you say your name again?";
}

async function runIntroDecisionPrompt(prompt: string, debugLabel: string) {
  try {
    return await generateText(prompt, {
      maxOutputTokens: 80,
      retries: 2,
      temperature: 0.1,
      debugLabel,
    });
  } catch (error) {
    logDebug("intro-worker.decision.error", { label: debugLabel, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

function buildFallbackCandidate(transcript: string, attempts: number) {
  const candidate = extractObviousNameCandidate(transcript);
  const mode: IntroDecision["mode"] = candidate ? "candidate" : attempts >= 2 ? "spell" : "retry";
  const reply = mode === "candidate" && candidate
    ? `I heard ${candidate}. Is that right?`
    : defaultIntroReply(mode);
  return { mode, candidate, reply };
}

function buildFallbackConfirmation(transcript: string, attempts: number) {
  const candidate = extractObviousNameCandidate(transcript);
  const mode: IntroDecision["mode"] = candidate ? "candidate" : attempts >= 2 ? "spell" : "retry";
  const reply = mode === "candidate" && candidate
    ? `I heard ${candidate}. Is that right?`
    : mode === "spell"
      ? "No problem. Can you spell your name for me, one letter at a time?"
      : "I want to make sure I got it right. Could you confirm your name again?";
  return { mode, candidate, reply };
}

export async function generateWelcomeMessage() {
  const result = await generateTextOrThrow(
    `
You are ${TUTOR_NAME}, a warm voice-first English tutor.
Write one short opening message for a new learner.

Rules:
- 1 or 2 short sentences.
- Say your name is ${TUTOR_NAME}.
- Ask for the learner's name.
`,
    "welcome message",
    { maxOutputTokens: 50, retries: 2, temperature: 0.4, debugLabel: "intro-welcome" },
  );

  return normalizeWelcomeMessage(result);
}

export async function generateNameCandidateDecision(
  transcript: string,
  introStep: "awaiting_name" | "awaiting_spelling" | "confirming_name" | "completed",
  attempts = 0,
): Promise<IntroDecision> {
  const prompt = `
You are ${TUTOR_NAME}. Extract the learner name.
Step: ${introStep}
Attempts: ${attempts}
Transcript: ${transcript}

Return exactly:
MODE: candidate|retry|spell
CANDIDATE: name or NONE
REPLY: short tutor reply

Rules:
- candidate if a name is clearly present
- spell if they need to spell it
- retry otherwise
`;

  const raw = await runIntroDecisionPrompt(prompt, "intro-name-candidate");
  const parsed = parseIntroDecision(raw, ["candidate", "retry", "spell"]);

  if (parsed) {
    const reply = parsed.reply ?? defaultIntroReply(parsed.mode, parsed.candidate);
    return { mode: parsed.mode, candidate: parsed.candidate, reply };
  }

  const fallback = buildFallbackCandidate(transcript, attempts);
  logDebug("intro-worker.candidate.fallback", { transcript, attempts, fallbackMode: fallback.mode, raw: raw ?? null });
  return fallback;
}

export async function generateNameConfirmationDecision(
  transcript: string,
  pendingName: string,
  attempts = 0,
): Promise<IntroDecision> {
  const prompt = `
You are ${TUTOR_NAME}. Confirm the learner name.
Pending name: ${pendingName}
Attempts: ${attempts}
Transcript: ${transcript}

Return exactly:
MODE: confirmed|candidate|retry|spell
CANDIDATE: corrected name or NONE
REPLY: short tutor reply

Rules:
- confirmed if learner confirms
- candidate if learner gives a different name
- spell if learner wants to spell it
- retry otherwise
`;

  const raw = await runIntroDecisionPrompt(prompt, "intro-name-confirmation");
  const parsed = parseIntroDecision(raw, ["confirmed", "candidate", "retry", "spell"]);

  if (parsed) {
    const reply = parsed.reply ?? defaultIntroReply(parsed.mode, parsed.candidate);
    logDebug("intro-worker.confirmation", { transcript, pendingName, mode: parsed.mode, candidate: parsed.candidate ?? null });
    return { mode: parsed.mode, candidate: parsed.candidate, reply };
  }

  const fallback = buildFallbackConfirmation(transcript, attempts);
  logDebug("intro-worker.confirmation.fallback", {
    transcript,
    pendingName,
    attempts,
    fallbackMode: fallback.mode,
  });
  return fallback;
}
