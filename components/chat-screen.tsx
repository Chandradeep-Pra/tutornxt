"use client";

import { FormEvent, useEffect, useRef } from "react";
import { ChatMessage, SessionSnapshot } from "@/lib/types";
import { ChatBubble } from "@/components/chat-bubble";
import { LiveTranscriptBubble } from "@/components/live-transcript-bubble";

interface ChatScreenProps {
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

const phaseTitles = {
  INTRO: "Welcome conversation",
  PLACEMENT: "Spoken placement",
  PATH: "Learning path",
  LESSON: "Live lesson",
  REPORT: "Assessment report",
} satisfies Record<SessionSnapshot["phase"], string>;

function getHeaderCopy(session: SessionSnapshot) {
  if (session.phase === "INTRO") {
    return "The tutor will capture and confirm the learner's name through natural conversation.";
  }

  if (session.phase === "PLACEMENT") {
    return `Question progress: ${session.placementProgress.current} of ${session.placementProgress.total}. Final transcripts are only sent after speech stops.`;
  }

  return "Voice-first tutoring continues here with spoken prompts, quick corrections, and follow-up questions.";
}

export function ChatScreen({
  session,
  interimTranscript,
  inputValue,
  onInputChange,
  onSubmit,
  onReset,
  canSend,
  isBusy,
  voiceError,
}: ChatScreenProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const messages = session.messages.filter((message: ChatMessage) => message.phase === session.phase);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [interimTranscript, messages.length]);

  return (
    <section className="glass-card h-full overflow-hidden rounded-[32px]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="border-b border-emerald-900/10 px-5 pb-5 pt-6 sm:px-7">
          <div>
            <span className="inline-flex rounded-full bg-white/75 px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-moss">
              {phaseTitles[session.phase]}
            </span>
            <h2 className="mt-3 font-display text-3xl tracking-[-0.04em] text-ink">
              {session.profile.name ? `Hi, ${session.profile.name}` : "Voice-first English tutor"}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-emerald-900/65">{getHeaderCopy(session)}</p>
          </div>
        </header>

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-7">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
          <LiveTranscriptBubble transcript={interimTranscript} />
          <div ref={bottomRef} />
        </div>

        <div className="grid gap-4 border-t border-emerald-900/10 bg-[#faffec]/85 px-5 py-5 sm:px-7">
          {voiceError ? <div className="text-sm text-amber-700">{voiceError}</div> : null}

          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
            <input
              className="min-h-14 rounded-[20px] border border-leaf/15 bg-white/90 px-4 text-ink outline-none transition placeholder:text-emerald-900/40 focus:border-leaf focus:ring-4 focus:ring-leaf/10"
              type="text"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Type only if the microphone misses something..."
              disabled={isBusy}
            />

            <button
              className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-gradient-to-b from-leaf to-moss px-5 font-bold text-white shadow-[0_18px_30px_rgba(88,204,2,0.24)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={!canSend || isBusy}
            >
              Send
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
