import { generateTextOrThrow } from "@/lib/gemini";
import { TUTOR_NAME } from "@/lib/brand";
import {
  AssessmentReport,
  ChatMessage,
  LearnerProfileSummary,
  LearningPathTopic,
  LessonBundle,
  LessonCorrectionRound,
  LessonMcq,
  LessonQuizItem,
  LessonQuestion,
} from "@/lib/types";

function getRecentLessonTurns(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.phase === "LESSON")
    .slice(-8)
    .map((message) => `${message.role.toUpperCase()}: ${message.text}`)
    .join("\n");
}

export function shouldRepeatTranscript(transcript: string) {
  return /\b(repeat|say again|again|once more|pardon|say that again)\b/i.test(transcript);
}

function buildCorrectionRounds(topic: LearningPathTopic): LessonCorrectionRound[] {
  return [
    {
      id: "correction-1",
      title: "Fix the daily sentence",
      incorrectSentence: "Yesterday I go to market and buy vegetables.",
      hint: "Use the correct past tense for both verbs.",
    },
    {
      id: "correction-2",
      title: "Fix the time sentence",
      incorrectSentence: "I am usually wake up at 7 and drinking tea.",
      hint: "Make the routine sentence natural and grammatically correct.",
    },
    {
      id: "correction-3",
      title: "Fix the detail sentence",
      incorrectSentence: "My friend tell me that English are very important for job.",
      hint: "Correct the verb forms and the noun agreement.",
    },
    {
      id: "correction-4",
      title: `Fix the ${topic.title.toLowerCase()} sentence`,
      incorrectSentence: "I want improve my speaking because I not feel confidence.",
      hint: "Make the sentence smoother and more natural.",
    },
  ];
}

function buildMcqs(): LessonMcq[] {
  return [
    {
      id: "mcq-1",
      question: "Which sentence is correct?",
      options: [
        "He go to work every day.",
        "He goes to work every day.",
        "He going to work every day.",
        "He gone to work every day.",
      ],
      correctIndex: 1,
      explanation: "For he/she/it in the present simple, we usually add -s to the verb.",
    },
    {
      id: "mcq-2",
      question: "Which sentence talks correctly about the past?",
      options: [
        "I visit my aunt yesterday.",
        "I am visiting my aunt yesterday.",
        "I visited my aunt yesterday.",
        "I visits my aunt yesterday.",
      ],
      correctIndex: 2,
      explanation: "Yesterday usually takes the past tense form.",
    },
    {
      id: "mcq-3",
      question: "Which response gives a clear opinion?",
      options: [
        "Because yes.",
        "I think it is useful because it helps me at work.",
        "Useful because.",
        "I useful work English.",
      ],
      correctIndex: 1,
      explanation: "A clear opinion usually includes both an idea and a reason.",
    },
    {
      id: "mcq-4",
      question: "Which sentence sounds most natural?",
      options: [
        "I am liking to learn English.",
        "I like learning English.",
        "I like learn English.",
        "I liking English learn.",
      ],
      correctIndex: 1,
      explanation: "Like + gerund is a common and natural pattern here.",
    },
  ];
}

function buildFinalQuiz(topic: LearningPathTopic): LessonQuizItem[] {
  return [
    {
      id: "quiz-1",
      prompt: "Talk about what you usually do in the morning.",
      target: "Use a clear routine sentence with time words.",
    },
    {
      id: "quiz-2",
      prompt: "Describe one thing you did yesterday.",
      target: "Use the past tense correctly.",
    },
    {
      id: "quiz-3",
      prompt: "Give your opinion about learning English.",
      target: "Share one opinion and one reason.",
    },
    {
      id: "quiz-4",
      prompt: `Say one longer sentence connected to ${topic.title.toLowerCase()}.`,
      target: "Use a connector like because, and, but, or so.",
    },
    {
      id: "quiz-5",
      prompt: "Introduce yourself in 3 or 4 natural sentences.",
      target: "Speak smoothly with confidence and detail.",
    },
  ];
}

function fallbackLessonFrame(topic: LearningPathTopic, level: AssessmentReport["level"]) {
  return {
    coachGoal: `Build stronger ${topic.title.toLowerCase()} skills with clearer sentences and more confidence.`,
    overview: `This lesson helps you speak more naturally about ${topic.title.toLowerCase()} through correction, choice practice, and a final voice quiz.`,
    endGoal: `By the end of this lesson, you should be able to answer with more detail, better grammar, and more confidence at a ${level.toLowerCase()} level.`,
    kickoff: `Welcome to your ${topic.title} lesson. First, we will warm up with sentence correction, then you will try quick multiple-choice practice, and after that you will finish with a short voice quiz.`,
  };
}

export function buildLessonQuestionQueue(bundle: LessonBundle): LessonQuestion[] {
  const corrections: LessonQuestion[] = bundle.correctionRounds.map((round, index) => ({
    id: round.id,
    type: "correction",
    label: `Correction ${index + 1}`,
    text: `Fix this sentence: ${round.incorrectSentence}. Hint: ${round.hint}`,
  }));

  const mcqs: LessonQuestion[] = bundle.mcqs.map((mcq, index) => ({
    id: mcq.id,
    type: "mcq",
    label: `MCQ ${index + 1}`,
    text: `${mcq.question} Options: ${mcq.options
      .map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}) ${option}`)
      .join(", ")}`,
  }));

  const quizzes: LessonQuestion[] = bundle.finalQuiz.map((quiz, index) => ({
    id: quiz.id,
    type: "quiz",
    label: `Quiz ${index + 1}`,
    text: `Quiz prompt: ${quiz.prompt}`,
  }));

  return [...corrections, ...mcqs, ...quizzes];
}

export async function generateLessonBundle(
  topic: LearningPathTopic,
  level: AssessmentReport["level"],
  name: string,
  learnerProfile?: LearnerProfileSummary,
): Promise<{ bundle: LessonBundle; kickoff: string }> {
  const correctionRounds = buildCorrectionRounds(topic);
  const mcqs = buildMcqs();
  const finalQuiz = buildFinalQuiz(topic);
  const lessonSteps = [
    "Listen to a wrong sentence and say a better version.",
    "Choose the strongest answer in quick multiple-choice rounds.",
    "Finish with short voice answers in the final quiz.",
  ];
  const practicePrompts = correctionRounds.map((round) => round.incorrectSentence).slice(0, 3);

  try {
    const result = await generateTextOrThrow(
      `
You are ${TUTOR_NAME}, building a voice-only English lesson for ${name}.
Level: ${level}
Topic: ${topic.title}
Reason: ${topic.reason}
Outcomes: ${topic.outcomes.join(", ")}
Speaking style: ${learnerProfile?.speakingStyle ?? "Unknown"}
Growth areas: ${learnerProfile?.growthAreas.join(", ") ?? "Unknown"}

Return exactly:
GOAL: ...
OVERVIEW: ...
END_GOAL: ...
KICKOFF: ...
`,
      "lesson bundle",
      { maxOutputTokens: 140, retries: 2, temperature: 0.2, debugLabel: "lesson-bundle" },
    );

    const coachGoal =
      result.match(/GOAL:\s*(.+)/i)?.[1]?.trim() ??
      fallbackLessonFrame(topic, level).coachGoal;
    const overview =
      result.match(/OVERVIEW:\s*(.+)/i)?.[1]?.trim() ??
      fallbackLessonFrame(topic, level).overview;
    const endGoal =
      result.match(/END_GOAL:\s*(.+)/i)?.[1]?.trim() ??
      fallbackLessonFrame(topic, level).endGoal;
    const kickoff =
      result.match(/KICKOFF:\s*(.+)/i)?.[1]?.trim() ??
      fallbackLessonFrame(topic, level).kickoff;

    return {
      bundle: {
        topicId: topic.id,
        topicTitle: topic.title,
        coachGoal,
        overview,
        endGoal,
        outcomes: topic.outcomes,
        lessonSteps,
        practicePrompts,
        correctionRounds,
        mcqs,
        finalQuiz,
      },
      kickoff,
    };
  } catch {
    const fallback = fallbackLessonFrame(topic, level);
    return {
      bundle: {
        topicId: topic.id,
        topicTitle: topic.title,
        coachGoal: fallback.coachGoal,
        overview: fallback.overview,
        endGoal: fallback.endGoal,
        outcomes: topic.outcomes,
        lessonSteps,
        practicePrompts,
        correctionRounds,
        mcqs,
        finalQuiz,
      },
      kickoff: fallback.kickoff,
    };
  }
}

export async function generateLessonReply(
  level: AssessmentReport["level"],
  name: string,
  transcript: string,
  messages: ChatMessage[],
  lessonBundle?: LessonBundle,
  learnerProfile?: LearnerProfileSummary,
  previousQuestion?: string,
) {
  const result = await generateTextOrThrow(
    `
You are ${TUTOR_NAME}, a live spoken English tutor.
Learner: ${name}
Level: ${level}
Topic: ${lessonBundle?.topicTitle ?? "General speaking"}
Goal: ${lessonBundle?.coachGoal ?? "Build fluency and confidence"}
Prompts: ${lessonBundle?.practicePrompts.join(" | ") ?? "None"}
Speaking style: ${learnerProfile?.speakingStyle ?? "Unknown"}
Growth areas: ${learnerProfile?.growthAreas.join(", ") ?? "Unknown"}
Previous question: ${previousQuestion ?? "No question yet."}

Recent lesson turns:
${getRecentLessonTurns(messages)}

Latest learner message:
${transcript}

Write 2 to 4 short sentences. Speak naturally and keep the focus on the current topic.
Rules:
- Remind the learner gently. Keep corrections light.
- Offer a follow-up spoken prompt or question.
- Keep it on the current topic.
`,
    "lesson reply",
    { maxOutputTokens: 140, retries: 1, temperature: 0.3, debugLabel: "lesson-live-reply" },
  );

  const normalized = result.replace(/\s+/g, " ").trim();
  if (normalized.split(" ").length < 5) {
    return `Good try. Let's keep going. Can you answer that again with a little more detail?`;
  }

  return normalized;
}
