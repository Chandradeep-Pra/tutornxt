import { logDebug } from "@/lib/debug";
import { TUTOR_NAME } from "@/lib/brand";
import { ChatMessage, SessionData, SessionSnapshot } from "@/lib/types";
import {
  extractObviousNameCandidate,
  generateNameCandidateDecision,
  generateNameConfirmationDecision,
  generateWelcomeMessage,
  isClearConfirmation,
  isClearRejection,
} from "@/lib/workers/intro-worker";
import {
  createPlacementKickoff,
  generatePlacementQuestion,
  generatePlacementReview,
  generatePlacementTransition,
} from "@/lib/workers/placement-worker";
import { generateLearningPath, generatePathIntro } from "@/lib/workers/path-worker";
import {
  buildLessonQuestionQueue,
  generateLessonBundle,
  generateLessonReply,
  shouldRepeatTranscript,
} from "@/lib/workers/lesson-worker";

interface PushOptions {
  isQuestion?: boolean;
}

function pushMessage(
  session: SessionData,
  role: ChatMessage["role"],
  text: string,
  phase: SessionData["phase"] = session.phase,
  options?: PushOptions,
) {
  session.messages.push({
    id: crypto.randomUUID(),
    role,
    phase,
    text,
    createdAt: new Date().toISOString(),
  });

  if (phase === "LESSON" && role === "tutor" && options?.isQuestion) {
    session.currentLessonQuestion = text;
  }
}

async function startPlacement(session: SessionData, confirmedName: string) {
  session.profile.name = confirmedName;
  session.pendingName = undefined;
  session.introAttempts = 0;
  session.introStep = "completed";
  session.phase = "PLACEMENT";
  session.currentLessonQuestion = undefined;
  pushMessage(
    session,
    "tutor",
    `Welcome ${confirmedName}! ${TUTOR_NAME} will guide you through a short spoken placement test so we can tailor the path we build together. Take a breath, we will begin with a friendly question about your day.`,
    "PLACEMENT",
  );
  session.placementQuestions = [await generatePlacementQuestion(confirmedName, 1, [], [])];
  const kickoff = createPlacementKickoff(confirmedName, session.placementQuestions[0].question);
  pushMessage(session, "tutor", kickoff, "PLACEMENT");
}

async function completePlacement(session: SessionData) {
  const learnerName = session.profile.name ?? "there";
  const review = await generatePlacementReview(session.placementAnswers, learnerName);
  const learningPath = await generateLearningPath(review.report, review.learnerProfile, learnerName);

  session.profile.level = review.report.level;
  session.profile.learnerProfile = review.learnerProfile;
  session.report = review.report;
  session.learningPath = learningPath;
  session.phase = "REPORT";
  pushMessage(session, "tutor", review.reportIntro, "REPORT");
}

export async function createSession(): Promise<SessionData> {
  const session: SessionData = {
    id: crypto.randomUUID(),
    phase: "INTRO",
    profile: {},
    messages: [],
    introStep: "awaiting_name",
    introAttempts: 0,
    placementQuestions: [],
    placementIndex: 0,
    placementAnswers: [],
  };

  pushMessage(session, "tutor", await generateWelcomeMessage(), "INTRO");
  logDebug("tutor.createSession", { sessionId: session.id, phase: session.phase });
  return session;
}

export function snapshotSession(session: SessionData): SessionSnapshot {
  return {
    sessionId: session.id,
    phase: session.phase,
    profile: session.profile,
    messages: session.messages,
    report: session.report,
    learningPath: session.learningPath,
    currentTopicId: session.currentTopicId,
    lessonBundle: session.lessonBundle,
    currentLessonQuestion: session.currentLessonQuestion,
    lessonQueue: session.lessonQueue,
    currentQueueIndex: session.currentQueueIndex,
    placementProgress: {
      current: Math.min(session.placementIndex + (session.phase === "PLACEMENT" ? 1 : 0), session.placementQuestions.length || 3),
      total: session.phase === "PLACEMENT" ? 3 : session.placementQuestions.length || 3,
    },
  };
}

export async function advanceSession(
  session: SessionData,
  transcript?: string,
  action?: "continue" | "select-topic",
  topicId?: string,
) {
  logDebug("tutor.advanceSession.start", {
    sessionId: session.id,
    phase: session.phase,
    introStep: session.introStep,
    action: action ?? null,
    topicId: topicId ?? null,
    transcript: transcript ?? null,
  });

  if (action === "continue" && session.phase === "REPORT") {
    session.phase = "PATH";
    pushMessage(
      session,
      "tutor",
      await generatePathIntro(
        session.profile.name ?? "there",
        session.profile.level ?? "Beginner",
        session.learningPath ?? [],
      ),
      "PATH",
    );
    return session;
  }

  if (action === "select-topic" && session.phase === "PATH" && topicId) {
    const topic = session.learningPath?.find((item) => item.id === topicId);
    if (!topic) {
      throw new Error("Lesson topic could not be selected.");
    }

    const lesson = await generateLessonBundle(
      topic,
      session.profile.level ?? "Beginner",
      session.profile.name ?? "there",
      session.profile.learnerProfile,
    );

    session.phase = "LESSON";
    session.currentTopicId = topic.id;
    session.lessonBundle = lesson.bundle;
    session.lessonQueue = buildLessonQuestionQueue(lesson.bundle);
    session.currentQueueIndex = 0;
    pushMessage(session, "tutor", lesson.kickoff, "LESSON");
    if (session.lessonQueue?.length) {
      const firstQuestion = session.lessonQueue[0];
      pushMessage(session, "tutor", firstQuestion.text, "LESSON", { isQuestion: true });
    }
    return session;
  }

  const trimmed = transcript?.trim();
  if (!trimmed) {
    return session;
  }

  pushMessage(session, "user", trimmed);

  if (session.phase === "INTRO") {
    if (session.introStep === "awaiting_name" || session.introStep === "awaiting_spelling") {
      const obviousCandidate = extractObviousNameCandidate(trimmed);
      logDebug("tutor.intro.capture", {
        transcript: trimmed,
        introStep: session.introStep,
        obviousCandidate: obviousCandidate ?? null,
      });

      if (obviousCandidate) {
        session.pendingName = obviousCandidate;
        session.introAttempts = 0;
        session.introStep = "confirming_name";
        pushMessage(session, "tutor", `I heard ${obviousCandidate}. Is that right?`, "INTRO");
        return session;
      }

      const decision = await generateNameCandidateDecision(trimmed, session.introStep, session.introAttempts);
      if (decision.mode === "candidate" && decision.candidate) {
        session.pendingName = decision.candidate;
        session.introAttempts = 0;
        session.introStep = "confirming_name";
        pushMessage(session, "tutor", decision.reply, "INTRO");
        return session;
      }

      session.introAttempts += 1;
      session.introStep = decision.mode === "spell" || session.introAttempts >= 2 ? "awaiting_spelling" : "awaiting_name";
      pushMessage(session, "tutor", decision.reply, "INTRO");
      return session;
    }

    if (session.introStep === "confirming_name") {
      const pendingName = session.pendingName;
      if (!pendingName) {
        session.introStep = "awaiting_name";
        pushMessage(session, "tutor", "Let's try that again. What's your name?", "INTRO");
        return session;
      }

      if (isClearConfirmation(trimmed)) {
        await startPlacement(session, pendingName);
        return session;
      }

      if (isClearRejection(trimmed)) {
        const correctedCandidate = extractObviousNameCandidate(trimmed);
        if (correctedCandidate) {
          session.pendingName = correctedCandidate;
          session.introAttempts = 0;
          pushMessage(session, "tutor", `I heard ${correctedCandidate}. Is that right?`, "INTRO");
          return session;
        }

        session.pendingName = undefined;
        session.introAttempts += 1;
        session.introStep = session.introAttempts >= 2 ? "awaiting_spelling" : "awaiting_name";
        pushMessage(
          session,
          "tutor",
          session.introStep === "awaiting_spelling"
            ? "I want to get it right. Can you spell your name for me, one letter at a time?"
            : "Thanks for correcting me. Could you say your name again?",
          "INTRO",
        );
        return session;
      }

      const decision = await generateNameConfirmationDecision(trimmed, pendingName, session.introAttempts);
      if (decision.mode === "confirmed") {
        await startPlacement(session, pendingName);
        return session;
      }

      if (decision.mode === "candidate" && decision.candidate) {
        session.pendingName = decision.candidate;
        session.introAttempts = 0;
        pushMessage(session, "tutor", decision.reply, "INTRO");
        return session;
      }

      session.pendingName = undefined;
      session.introAttempts += 1;
      session.introStep = decision.mode === "spell" || session.introAttempts >= 2 ? "awaiting_spelling" : "awaiting_name";
      pushMessage(session, "tutor", decision.reply, "INTRO");
      return session;
    }
  }

  if (session.phase === "PLACEMENT") {
    const currentQuestion = session.placementQuestions[session.placementIndex];
    session.placementAnswers.push({
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: trimmed,
      score: 0,
    });

    session.placementIndex += 1;

    if (session.placementIndex < 3) {
      if (!session.placementQuestions[session.placementIndex]) {
        session.placementQuestions.push(
          await generatePlacementQuestion(
            session.profile.name ?? "there",
            session.placementIndex + 1,
            session.placementQuestions,
            session.placementAnswers,
          ),
        );
      }

      const nextQuestion = session.placementQuestions[session.placementIndex];
      pushMessage(
        session,
        "tutor",
        await generatePlacementTransition(session.profile.name ?? "there", session.placementIndex + 1, nextQuestion.question),
        "PLACEMENT",
      );
      return session;
    }

    await completePlacement(session);
    return session;
  }

  if (session.phase === "LESSON") {
    const queue = session.lessonQueue ?? [];
    const currentIndex = session.currentQueueIndex ?? 0;
    const currentQuestion = queue[currentIndex];

    if (shouldRepeatTranscript(trimmed) && currentQuestion) {
      pushMessage(session, "tutor", currentQuestion.text, "LESSON", { isQuestion: true });
      return session;
    }

    const reply = await generateLessonReply(
      session.profile.level ?? "Beginner",
      session.profile.name ?? "there",
      trimmed,
      session.messages,
      session.lessonBundle,
      session.profile.learnerProfile,
      currentQuestion?.text,
    );

    pushMessage(session, "tutor", reply, "LESSON");

    const nextIndex = currentIndex + 1;
    if (queue.length && nextIndex < queue.length) {
      session.currentQueueIndex = nextIndex;
      const nextQuestion = queue[nextIndex];
      pushMessage(session, "tutor", nextQuestion.text, "LESSON", { isQuestion: true });
    } else if (queue.length) {
      session.currentQueueIndex = queue.length;
      pushMessage(session, "tutor", "Great job. You have completed today's lesson prompts.", "LESSON");
    }

    return session;
  }

  return session;
}
