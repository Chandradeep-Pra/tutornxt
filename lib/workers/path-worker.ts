import { generateTextOrThrow } from "@/lib/gemini";
import { TUTOR_NAME } from "@/lib/brand";
import { AssessmentReport, LearnerProfileSummary, LearningPathTopic } from "@/lib/types";

function fallbackLearningPath(
  report: AssessmentReport,
  learnerProfile: LearnerProfileSummary,
): LearningPathTopic[] {
  const focus = learnerProfile.growthAreas.length
    ? learnerProfile.growthAreas
    : report.focusAreas.length
      ? report.focusAreas
      : ["Fluency", "Grammar", "Speaking confidence"];

  return [
    {
      id: "topic-1",
      title: "Daily Conversation",
      reason: `This helps you speak more naturally about everyday life and routines at your ${report.level.toLowerCase()} level.`,
      outcomes: [
        "Talk about your day more smoothly",
        "Answer common personal questions",
        "Use longer everyday sentences",
      ],
    },
    {
      id: "topic-2",
      title: "Past And Present Speaking",
      reason: `This targets time-based speaking, especially around ${focus[0] ?? "sentence control"}.`,
      outcomes: [
        "Describe recent events clearly",
        "Use time words more naturally",
        "Connect ideas in sequence",
      ],
    },
    {
      id: "topic-3",
      title: "Opinions And Explanations",
      reason: `This builds confidence in explaining ideas, which supports ${focus[1] ?? "clearer grammar"}.`,
      outcomes: [
        "Give reasons for your ideas",
        "Speak with more detail",
        "Respond to follow-up questions",
      ],
    },
    {
      id: "topic-4",
      title: "Confidence And Corrections",
      reason: `This helps improve ${focus[2] ?? "speaking confidence"} through guided speaking and correction.`,
      outcomes: [
        "Notice and fix small mistakes",
        "Speak with better rhythm",
        "Build more confidence in live conversation",
      ],
    },
  ];
}

export async function generateLearningPath(
  report: AssessmentReport,
  learnerProfile: LearnerProfileSummary,
  name: string,
): Promise<LearningPathTopic[]> {
  try {
    const result = await generateTextOrThrow(
      `
You are ${TUTOR_NAME}, creating a spoken English learning path for ${name}.
Level: ${report.level}
Summary: ${report.summary}
Speaking style: ${learnerProfile.speakingStyle}
Growth areas: ${learnerProfile.growthAreas.join(", ")}
Priorities: ${learnerProfile.lessonPriorities.join(", ")}

Return exactly:
TOPIC1: title | reason | outcome 1 | outcome 2 | outcome 3
TOPIC2: title | reason | outcome 1 | outcome 2 | outcome 3
TOPIC3: title | reason | outcome 1 | outcome 2 | outcome 3
TOPIC4: title | reason | outcome 1 | outcome 2 | outcome 3
`,
      "learning path",
      { maxOutputTokens: 260, retries: 2, temperature: 0.2, debugLabel: "path-learning-path" },
    );

    const topics = [1, 2, 3, 4]
      .map((index) => result.match(new RegExp(`TOPIC${index}:\\s*(.+)`, "i"))?.[1]?.trim())
      .filter((line): line is string => Boolean(line))
      .map((line, index) => {
        const [title, reason, ...outcomes] = line.split("|").map((part) => part.trim()).filter(Boolean);
        return {
          id: `topic-${index + 1}`,
          title: title ?? `Topic ${index + 1}`,
          reason: reason ?? "A useful next speaking step.",
          outcomes: outcomes.slice(0, 3),
        };
      });

    if (topics.length !== 4 || topics.some((topic) => topic.outcomes.length < 3)) {
      throw new Error(`Gemini returned an invalid learning path. Raw response: ${result}`);
    }

    return topics;
  } catch {
    return fallbackLearningPath(report, learnerProfile);
  }
}

export async function generatePathIntro(name: string, level: AssessmentReport["level"], topics: LearningPathTopic[]) {
  const result = await generateTextOrThrow(
    `
You are ${TUTOR_NAME}, a friendly English tutor.
Learner: ${name}
Level: ${level}
Topics: ${topics.map((topic) => topic.title).join(", ")}

Write 1 or 2 short sentences inviting the learner to choose a topic.
`,
    "path intro",
    { maxOutputTokens: 60, retries: 1, temperature: 0.3, debugLabel: "path-intro" },
  );

  const normalized = result.replace(/\s+/g, " ").trim();
  if (normalized.split(" ").length < 4) {
    return `${name}, your learning path is ready. Choose a topic and we will start your next voice lesson.`;
  }

  return normalized;
}
