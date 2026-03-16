"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatScreen } from "@/components/chat-screen";
import { FlowLoadingScreen } from "@/components/flow-loading-screen";
import { HeroPanel } from "@/components/hero-panel";
import { LessonScreen } from "@/components/lesson-screen";
import { LearningPathScreen } from "@/components/learning-path-screen";
import { ReportScreen } from "@/components/report-screen";
import { ApiError, getSession, resetSession, sendMessage, startSession } from "@/lib/api";
import { TUTOR_NAME } from "@/lib/brand";
import { SessionSnapshot, TutorPhase } from "@/lib/types";
import { useVoiceTutor } from "@/hooks/use-voice-tutor";

const SESSION_KEY = "tutornxt-session-id";
const TRANSITION_DELAY_MS = 1600;

interface TransitionState {
  eyebrow: string;
  title: string;
  description: string;
}

function formatConversation(session: SessionSnapshot) {
  return session.messages
    .map((message) => {
      const speaker = message.role === "tutor" ? TUTOR_NAME : session.profile.name ?? "Learner";
      return `[${message.phase}] ${speaker}: ${message.text}`;
    })
    .join("\n\n");
}

export function TutorApp() {
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSpokenMessageId = useRef<string | null>(null);
  const autoListenTimeoutRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  const applySessionWithTransition = async (
    previousPhase: TutorPhase | undefined,
    nextSession: SessionSnapshot,
  ) => {
    const needsPlacementLoading = previousPhase === "INTRO" && nextSession.phase === "PLACEMENT";
    const needsPathLoading = previousPhase === "REPORT" && nextSession.phase === "PATH";

    if (!needsPlacementLoading && !needsPathLoading) {
      setSession(nextSession);
      return;
    }

    setTransition(
      needsPlacementLoading
        ? {
            eyebrow: "Placement transition",
            title: "Starting your placement test",
            description:
              `${TUTOR_NAME} is setting up a dedicated speaking screen so the placement test feels separate from the intro conversation.`,
          }
        : {
            eyebrow: "Learning path transition",
            title: "Creating a structured learning path for you",
            description:
              `${TUTOR_NAME} is turning your placement result into a focused set of topics, with voice lessons and practice sets for each one.`,
          },
    );

    await new Promise<void>((resolve) => {
      transitionTimeoutRef.current = window.setTimeout(() => {
        setSession(nextSession);
        setTransition(null);
        resolve();
      }, TRANSITION_DELAY_MS);
    });
  };

  const handleTranscript = async (transcript: string) => {
    if (!session?.sessionId) {
      return;
    }

    setIsBusy(true);
    setError(null);
    const previousPhase = session.phase;

    try {
      const nextSession = await sendMessage({
        sessionId: session.sessionId,
        transcript,
      });
      await applySessionWithTransition(previousPhase, nextSession);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 404) {
        const restartedSession = await startSession();
        setSession(restartedSession);
        window.localStorage.setItem(SESSION_KEY, restartedSession.sessionId);
        setError("Your previous session expired after a server restart, so a new one has started.");
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Unable to send the message.");
    } finally {
      setIsBusy(false);
    }
  };

  const {
    error: voiceError,
    interimTranscript,
    isSupported,
    isTutorSpeaking,
    speak,
    startListening,
    stopListening,
    voiceState,
  } = useVoiceTutor({
    onFinalTranscript: handleTranscript,
  });

  useEffect(() => {
    let isMounted = true;

    async function bootSession() {
      setIsBusy(true);
      setError(null);

      try {
        const storedSessionId = window.localStorage.getItem(SESSION_KEY);
        const nextSession = storedSessionId
          ? await getSession(storedSessionId).catch(() => startSession())
          : await startSession();

        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        window.localStorage.setItem(SESSION_KEY, nextSession.sessionId);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : "Unable to start the session.");
      } finally {
        if (isMounted) {
          setIsBusy(false);
        }
      }
    }

    bootSession();

    return () => {
      isMounted = false;
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    const latestTutorMessage = [...session.messages].reverse().find((message) => message.role === "tutor");
    if (!latestTutorMessage || lastSpokenMessageId.current === latestTutorMessage.id) {
      return;
    }

    lastSpokenMessageId.current = latestTutorMessage.id;
    speak(latestTutorMessage.text);
  }, [session, speak]);

  useEffect(() => {
    if (autoListenTimeoutRef.current) {
      window.clearTimeout(autoListenTimeoutRef.current);
    }

    if (
      !session ||
      transition !== null ||
      !isSupported ||
      session.phase === "REPORT" ||
      session.phase === "PATH" ||
      isBusy ||
      isTutorSpeaking ||
      voiceState !== "idle"
    ) {
      return;
    }

    autoListenTimeoutRef.current = window.setTimeout(() => {
      startListening();
    }, 500);

    return () => {
      if (autoListenTimeoutRef.current) {
        window.clearTimeout(autoListenTimeoutRef.current);
      }
    };
  }, [isBusy, isSupported, isTutorSpeaking, session, startListening, transition, voiceState]);

  useEffect(() => {
    if ((session?.phase === "REPORT" || session?.phase === "PATH") && voiceState === "listening") {
      stopListening();
    }
  }, [session?.phase, stopListening, voiceState]);

  const canSend = useMemo(() => inputValue.trim().length > 0 && !isBusy, [inputValue, isBusy]);
  const conversationTranscript = useMemo(
    () => (session ? formatConversation(session) : ""),
    [session],
  );

  const submitTypedMessage = async () => {
    if (!session?.sessionId || !inputValue.trim()) {
      return;
    }

    const transcript = inputValue.trim();
    setInputValue("");
    await handleTranscript(transcript);
  };

  const handleReset = async () => {
    if (!session?.sessionId) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const nextSession = await resetSession(session.sessionId);
      setSession(nextSession);
      window.localStorage.setItem(SESSION_KEY, nextSession.sessionId);
      lastSpokenMessageId.current = null;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset the session.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleReportContinue = async () => {
    if (!session?.sessionId) {
      return;
    }

    setIsBusy(true);
    setError(null);
    const previousPhase = session.phase;

    try {
      const nextSession = await sendMessage({
        sessionId: session.sessionId,
        action: "continue",
      });
      await applySessionWithTransition(previousPhase, nextSession);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 404) {
        const restartedSession = await startSession();
        setSession(restartedSession);
        window.localStorage.setItem(SESSION_KEY, restartedSession.sessionId);
        setError("Your previous session expired after a server restart, so a new one has started.");
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Unable to start the lesson.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleTopicSelect = async (topicId: string) => {
    if (!session?.sessionId) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const nextSession = await sendMessage({
        sessionId: session.sessionId,
        action: "select-topic",
        topicId,
      });
      setSession(nextSession);
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 404) {
        const restartedSession = await startSession();
        setSession(restartedSession);
        window.localStorage.setItem(SESSION_KEY, restartedSession.sessionId);
        setError("Your previous session expired after a server restart, so a new one has started.");
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Unable to generate the lesson for that topic.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (!conversationTranscript) {
      return;
    }

    try {
      await navigator.clipboard.writeText(conversationTranscript);
      console.log(conversationTranscript);
      setError("Conversation copied to clipboard. You can paste it here.");
    } catch {
      console.log(conversationTranscript);
      setError("Clipboard copy was blocked, so the conversation was printed in the browser console.");
    }
  };

  if (!session) {
    return (
      <main className="grid h-screen place-items-center overflow-hidden px-4 py-6">
        <section className="glass-card w-full max-w-xl rounded-[32px] p-8">
          <span className="inline-flex rounded-full bg-white/75 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
            Starting session
          </span>
          <h1 className="mt-4 font-display text-[2.4rem] leading-[0.95] tracking-[-0.05em] text-ink">
            Preparing your tutor conversation.
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-emerald-900/65">
            {error ?? "Setting up the voice-ready learning flow..."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid h-full max-w-7xl gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <HeroPanel
          session={session}
          isListening={voiceState === "listening"}
          isSpeaking={isTutorSpeaking}
          transcript={conversationTranscript}
          onCopyTranscript={handleCopyTranscript}
        />

        {transition ? (
          <FlowLoadingScreen
            eyebrow={transition.eyebrow}
            title={transition.title}
            description={transition.description}
          />
        ) : session.phase === "REPORT" && session.report ? (
          <ReportScreen
            session={session}
            report={session.report}
            onContinue={handleReportContinue}
            isBusy={isBusy}
          />
        ) : session.phase === "PATH" && session.learningPath ? (
          <LearningPathScreen
            session={session}
            topics={session.learningPath}
            onSelectTopic={handleTopicSelect}
            isBusy={isBusy}
          />
        ) : session.phase === "LESSON" && session.lessonBundle ? (
          <LessonScreen
            session={session}
            interimTranscript={interimTranscript}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={submitTypedMessage}
            onReset={handleReset}
            canSend={canSend}
            isBusy={isBusy}
            voiceError={error ?? voiceError}
          />
        ) : (
          <ChatScreen
            session={session}
            interimTranscript={interimTranscript}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={submitTypedMessage}
            onReset={handleReset}
            canSend={canSend}
            isBusy={isBusy}
            voiceError={error ?? voiceError}
          />
        )}
      </div>
    </main>
  );
}
