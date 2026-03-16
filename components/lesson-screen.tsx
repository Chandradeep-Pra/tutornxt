"use client";

import { FormEvent, useEffect, useMemo, useRef } from "react";
import { ChatMessage, SessionSnapshot } from "@/lib/types";
import { ChatBubble } from "@/components/chat-bubble";
import { LiveTranscriptBubble } from "@/components/live-transcript-bubble";

interface LessonScreenProps {
  session: SessionSnapshot;
  interimTranscript: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  canSend: boolean;
  isBusy: boolean;
  voiceError: string | null;
}

export function LessonScreen({
  session,
  interimTranscript,
  inputValue,
  onInputChange,
  onSubmit,
  onReset,
  canSend,
  isBusy,
  voiceError,
}: LessonScreenProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messages = useMemo(
    () => session.messages.filter((message: ChatMessage) => message.phase === "LESSON"),
    [session.messages],
  );
  const latestTutorMessage = [...messages].reverse().find((message) => message.role === "tutor");
  const currentQuestion = session.currentLessonQuestion ?? latestTutorMessage?.text ?? "Tota is setting up your next question.";
  const currentConversation = useMemo(() => {
    if (!latestTutorMessage) {
      return [];
    }
    const tutorIndex = messages.findIndex((message) => message.id === latestTutorMessage.id);
    const start = Math.max(0, tutorIndex - 1);
    return messages.slice(start, tutorIndex + 1);
  }, [latestTutorMessage, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [interimTranscript, messages.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <section className="glass-card h-full overflow-hidden rounded-[32px]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="border-b border-emerald-900/10 bg-[radial-gradient(circle_at_top,#f8ffd8,transparent_55%)] px-5 pb-4 pt-6 sm:px-7">
          <span className="inline-flex rounded-full bg-white/80 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
            Current question
          </span>
          <h2 className="mt-3 font-display text-3xl tracking-[-0.04em] text-ink sm:text-4xl">{currentQuestion}</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900/70">
            Speak naturally when you are ready. Say “repeat” if you want me to replay the last question.
          </p>
        </header>

        <div className="min-h-0 overflow-hidden px-5 py-6 sm:px-7">
          <section className="flex h-full min-h-[280px] flex-col gap-4 rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_24px_40px_rgba(88,204,2,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-moss">Live lesson chat</p>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
              {currentConversation.length ? (
                currentConversation.map((message) => <ChatBubble key={message.id} message={message} />)
              ) : (
                <p className="text-sm text-emerald-900/70">Waiting for Tota to ask the next question…</p>
              )}
              <LiveTranscriptBubble transcript={interimTranscript} />
              <div ref={bottomRef} />
            </div>
          </section>
        </div>

        <div className="grid gap-4 border-t border-emerald-900/10 bg-[#faffec]/85 px-5 py-5 sm:px-7">
          {voiceError ? <div className="text-sm text-amber-700">{voiceError}</div> : null}

          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
            <input
              className="min-h-14 rounded-[20px] border border-leaf/15 bg-white/90 px-4 text-ink outline-none transition placeholder:text-emerald-900/40 focus:border-leaf focus:ring-4 focus:ring-leaf/10"
              type="text"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Speak your correction or answer, or type if the mic misses it..."
              disabled={isBusy}
            />

            <button
              className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-gradient-to-b from-leaf to-moss px-5 font-bold text-white shadow-[0_18px_30px_rgba(88,204,2,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={!canSend || isBusy}
            >
              Send answer
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-[16px] border border-leaf/15 bg-white/80 px-3 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={onReset}
              disabled={isBusy}
            >
              Reset session
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
