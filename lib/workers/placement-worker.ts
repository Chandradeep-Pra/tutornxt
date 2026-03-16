import { generateTextOrThrow } from "@/lib/gemini";
import { TUTOR_NAME } from "@/lib/brand";
import { logDebug } from "@/lib/debug";
import { AssessmentReport, LearnerProfileSummary, PlacementAnswer, PlacementQuestion } from "@/lib/types";

interface PlacementReviewResult {
  report: AssessmentReport;
  learnerProfile: LearnerProfileSummary;
  reportIntro: string;
}

function isValidPlacementQuestion(question: string) {
  const normalized = question.replace(/\s+/g, " ").trim();
  const wordCount = normalized.split(" ").filter(Boolean).length;
  return wordCount >= 6 && /[?]$/.test(normalized) && !/^(question|so|tell me|okay|sure)\b/i.test(normalized);
}

function getQuestionGoal(questionNumber: number) {
  if (questionNumber === 1) {
    return "Ask about daily life or self-introduction in simple spoken English.";
  }

  if (questionNumber === 2) {
    return "Ask about routine, time, or a recent past activity.";
  }

  return "Ask for an opinion, explanation, or a more detailed answer.";
}

function getQuestionOptions(questionNumber: number) {
  if (questionNumber === 1) {
    return [
      "Can you tell me a little about your daily routine?",
      "What do you usually do in the morning before work or study?",
      "Can you introduce yourself and talk about a normal day for you?",
      "What kind of things do you do on a typical weekday?",
      "Can you describe your day from morning to evening?",
    ];
  }

  if (questionNumber === 2) {
    return [
      "What did you do last weekend, and how was it?",
      "Can you tell me about something you did recently after work or class?",
      "How do you usually spend your evenings on weekdays?",
      "What is one thing you did this week that you enjoyed?",
      "Can you describe a recent day that was different from usual?",
    ];
  }

  return [
    "Why do you want to improve your English right now?",
    "What makes speaking English easy or difficult for you?",
    "How do you think English can help you in your future?",
    "What is something you enjoy learning, and why do you like it?",
    "If you could speak English confidently, what would you like to do first?",
  ];
}

function fallbackPlacementQuestion(questionNumber: number) {
  return getQuestionOptions(questionNumber)[0];
}

export async function generatePlacementQuestion(
  name: string,
  questionNumber: number,
  previousQuestions: PlacementQuestion[],
  previousAnswers: PlacementAnswer[],
): Promise<PlacementQuestion> {
  const previousQuestionText = previousQuestions.map((question) => question.question).join(" | ");
  const previousAnswerText = previousAnswers
    .map((answer, index) => `Q${index + 1}: ${answer.question}\nA${index + 1}: ${answer.answer}`)
    .join("\n\n");
  const options = getQuestionOptions(questionNumber);

  let lastRaw = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await generateTextOrThrow(
        `
Choose the best question ${questionNumber} of 3 for a spoken English placement test for ${name}.
Goal: ${getQuestionGoal(questionNumber)}
Previous questions: ${previousQuestionText || "None"}
Previous answers: ${previousAnswerText || "None yet"}

Return exactly:
OPTION: 1 | 2 | 3 | 4 | 5

Rules:
- Pick one option only
- Do not add explanation

Options:
1. ${options[0]}
2. ${options[1]}
3. ${options[2]}
4. ${options[3]}
5. ${options[4]}
`,
        "placement question",
        {
          maxOutputTokens: 40,
          retries: 2,
          temperature: 0.1,
          debugLabel: `placement-q${questionNumber}-attempt-${attempt}`,
        },
      );

      lastRaw = result;
      const optionIndex = Number(result.match(/OPTION:\s*([1-5])/i)?.[1] ?? "0");
      const question = optionIndex >= 1 && optionIndex <= 5 ? options[optionIndex - 1] : undefined;

      logDebug("placement-worker.question", {
        name,
        questionNumber,
        attempt,
        raw: result,
        optionIndex: optionIndex || null,
        parsedQuestion: question ?? null,
        valid: question ? isValidPlacementQuestion(question) : false,
      });

      if (question && isValidPlacementQuestion(question)) {
        return { id: `q${questionNumber}`, question };
      }
    } catch (error) {
      lastRaw = error instanceof Error ? error.message : String(error);
      logDebug("placement-worker.question.error", {
        name,
        questionNumber,
        attempt,
        error: lastRaw,
      });
    }
  }

  const fallback = fallbackPlacementQuestion(questionNumber);
  logDebug("placement-worker.question.fallback", {
    name,
    questionNumber,
    fallback,
    lastRaw,
  });

  return {
    id: `q${questionNumber}`,
    question: fallback,
  };
}

export function createPlacementKickoff(name: string, firstQuestion: string) {
  return `Welcome ${name}. I am ${TUTOR_NAME}, your voice-first English coach. We will do a short placement test so I can understand your current English and build the right learning path for you. First question: ${firstQuestion}`;
}

export async function generatePlacementTransition(name: string, questionNumber: number, question: string) {
  const result = await generateTextOrThrow(
    `
You are ${TUTOR_NAME}, a warm English tutor.
Learner: ${name}
Write one short spoken transition after a learner answered a placement question.
Then ask this exact next question: ${question}

Rules:
- 1 or 2 short sentences
- Friendly and natural
- End with the exact next question
`,
    "placement transition",
    { maxOutputTokens: 80, retries: 1, temperature: 0.3, debugLabel: `placement-transition-${questionNumber}` },
  );

  const normalized = result.replace(/\s+/g, " ").trim();

  if (normalized.split(" ").length < 4 || !normalized.includes(question)) {
    return `Thanks, ${name}. Here is the next question: ${question}`;
  }

  return normalized;
}

export async function generatePlacementReview(answers: PlacementAnswer[], name: string): Promise<PlacementReviewResult> {
  const answerBlock = answers
    .map((answer, index) => `Q${index + 1}: ${answer.question}\nA${index + 1}: ${answer.answer}`)
    .join("\n\n");

  const result = await generateTextOrThrow(
    `
You are ${TUTOR_NAME}, reviewing a spoken English placement test for ${name}.

Responses:
${answerBlock}

Return exactly in this format:
LEVEL: Beginner|Intermediate|Advanced
SUMMARY: ...
STRENGTHS: item 1 | item 2 | item 3
FOCUS: item 1 | item 2 | item 3
STYLE: ...
CONVO_SUMMARY: ...
PRIORITIES: item 1 | item 2 | item 3
REPORT_INTRO: ...
`,
    "placement review",
    { maxOutputTokens: 220, retries: 2, temperature: 0.2, debugLabel: "placement-review" },
  );

  const level = (result.match(/LEVEL:\s*(Beginner|Intermediate|Advanced)/i)?.[1] ??
    "Beginner") as AssessmentReport["level"];
  const summary = result.match(/SUMMARY:\s*(.+)/i)?.[1]?.trim() ?? "You can communicate some ideas, and we will build more fluency and clarity from here.";
  const strengths = (result.match(/STRENGTHS:\s*(.+)/i)?.[1] ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  const focusAreas = (result.match(/FOCUS:\s*(.+)/i)?.[1] ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  const speakingStyle = result.match(/STYLE:\s*(.+)/i)?.[1]?.trim() ?? "The learner can respond, but needs more smoothness and control.";
  const conversationSummary =
    result.match(/CONVO_SUMMARY:\s*(.+)/i)?.[1]?.trim() ??
    "The learner can answer simple prompts and is building confidence in spoken English.";
  const lessonPriorities = (result.match(/PRIORITIES:\s*(.+)/i)?.[1] ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
  const reportIntro = result.match(/REPORT_INTRO:\s*(.+)/i)?.[1]?.trim() ?? "Your assessment is ready.";

  return {
    report: {
      level,
      summary,
      strengths: strengths.length ? strengths : ["Comfort with simple replies", "Willingness to speak", "Good starting confidence"],
      focusAreas: focusAreas.length ? focusAreas : ["Longer sentences", "Clearer grammar", "More detail in answers"],
    },
    learnerProfile: {
      conversationSummary,
      speakingStyle,
      strengths: strengths.length ? strengths : ["Comfort with simple replies", "Willingness to speak", "Good starting confidence"],
      growthAreas: focusAreas.length ? focusAreas : ["Longer sentences", "Clearer grammar", "More detail in answers"],
      lessonPriorities: lessonPriorities.length ? lessonPriorities : ["Fluency in daily conversation", "Better sentence building", "Explaining ideas clearly"],
    },
    reportIntro,
  };
}
