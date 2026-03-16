import { GoogleGenerativeAI } from "@google/generative-ai";
import { logDebug, logError } from "@/lib/debug";

const apiKey = process.env.GEMINI_API_KEY;

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const geminiModel = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash",
});

function formatGeminiError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown Gemini API error.";
}

interface JsonRequestOptions {
  maxOutputTokens?: number;
  temperature?: number;
  retries?: number;
  debugLabel?: string;
}

interface TextRequestOptions {
  maxOutputTokens?: number;
  temperature?: number;
  retries?: number;
  debugLabel?: string;
}

function extractJson(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1];
  }

  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    return objectMatch[0];
  }

  return raw;
}

function tryParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(extractJson(raw).trim()) as T;
  } catch {
    return null;
  }
}

async function requestJson<T>(prompt: string, options?: JsonRequestOptions): Promise<T | null> {
  if (!geminiModel) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  logDebug("gemini.requestJson.start", {
    label: options?.debugLabel ?? "unknown",
    maxOutputTokens: options?.maxOutputTokens ?? 512,
    temperature: options?.temperature ?? 0.2,
    promptPreview: prompt.slice(0, 240),
  });

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxOutputTokens ?? 512,
    },
  });

  const raw = result.response.text();
  const parsed = tryParseJson<T>(raw);

  logDebug("gemini.requestJson.result", {
    label: options?.debugLabel ?? "unknown",
    raw,
    parsed: parsed ?? null,
  });

  return parsed;
}

async function requestText(prompt: string, options?: TextRequestOptions): Promise<string | null> {
  if (!geminiModel) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  logDebug("gemini.requestText.start", {
    label: options?.debugLabel ?? "unknown",
    maxOutputTokens: options?.maxOutputTokens ?? 120,
    temperature: options?.temperature ?? 0.4,
    promptPreview: prompt.slice(0, 240),
  });

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? 0.4,
      maxOutputTokens: options?.maxOutputTokens ?? 120,
    },
  });

  const text = result.response.text().trim();
  logDebug("gemini.requestText.result", {
    label: options?.debugLabel ?? "unknown",
    raw: text,
  });
  return text || null;
}

export async function generateJson<T>(prompt: string, options?: JsonRequestOptions): Promise<T | null> {
  const retries = options?.retries ?? 2;
  let lastError: unknown = null;

  try {
    const firstTry = await requestJson<T>(prompt, options);
    if (firstTry) {
      return firstTry;
    }
  } catch (error) {
    logError("gemini.generateJson.firstTry", error, { label: options?.debugLabel ?? "unknown" });
    lastError = error;
  }

  if (retries < 2) {
    if (lastError) {
      throw new Error(formatGeminiError(lastError));
    }
    return null;
  }

  try {
    const secondTry = await requestJson<T>(`
${prompt}

IMPORTANT:
- Return valid JSON only.
- Do not wrap the JSON in markdown unless necessary.
- Every required field must be present.
`, options);

    if (secondTry) {
      return secondTry;
    }
  } catch (error) {
    logError("gemini.generateJson.secondTry", error, { label: options?.debugLabel ?? "unknown" });
    lastError = error;
  }

  if (retries < 3) {
    if (lastError) {
      throw new Error(formatGeminiError(lastError));
    }
    return null;
  }

  try {
    return await requestJson<T>(`
You previously failed to return valid JSON.
Return only a valid JSON object that matches the requested schema exactly.

${prompt}
`, options);
  } catch (error) {
    logError("gemini.generateJson.thirdTry", error, { label: options?.debugLabel ?? "unknown" });
    lastError = error;
  }

  if (lastError) {
    throw new Error(formatGeminiError(lastError));
  }

  return null;
}

export async function generateJsonOrThrow<T>(
  prompt: string,
  label: string,
  options?: JsonRequestOptions,
): Promise<T> {
  let result: T | null = null;

  try {
    result = await generateJson<T>(prompt, options);
  } catch (error) {
    throw new Error(`Gemini could not generate ${label}. ${formatGeminiError(error)}`);
  }

  if (!result) {
    throw new Error(`Gemini could not generate ${label}.`);
  }

  return result;
}

export async function generateText(prompt: string, options?: TextRequestOptions): Promise<string | null> {
  const retries = options?.retries ?? 2;
  let lastError: unknown = null;

  try {
    const firstTry = await requestText(prompt, options);
    if (firstTry) {
      return firstTry;
    }
  } catch (error) {
    logError("gemini.generateText.firstTry", error, { label: options?.debugLabel ?? "unknown" });
    lastError = error;
  }

  if (retries < 2) {
    if (lastError) {
      throw new Error(formatGeminiError(lastError));
    }
    return null;
  }

  try {
    return await requestText(
      `${prompt}

IMPORTANT:
- Return plain text only.
- Keep it concise and natural.
`,
      options,
    );
  } catch (error) {
    logError("gemini.generateText.secondTry", error, { label: options?.debugLabel ?? "unknown" });
    lastError = error;
  }

  if (lastError) {
    throw new Error(formatGeminiError(lastError));
  }

  return null;
}

export async function generateTextOrThrow(
  prompt: string,
  label: string,
  options?: TextRequestOptions,
): Promise<string> {
  let result: string | null = null;

  try {
    result = await generateText(prompt, options);
  } catch (error) {
    throw new Error(`Gemini could not generate ${label}. ${formatGeminiError(error)}`);
  }

  if (!result) {
    throw new Error(`Gemini could not generate ${label}.`);
  }

  return result;
}
